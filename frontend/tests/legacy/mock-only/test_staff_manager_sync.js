/**
 * File: tests/test_staff_manager_sync.js
 * Mục đích: Kiểm thử đồng bộ hai chiều giữa Staff (US08, US13, US19) và Manager (US09, US11, US18, US27)
 * Đảm bảo: Dữ liệu đi qua MỘT nguồn duy nhất (Single Source of Truth) trong db.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  getMyAvailability,
  saveMyAvailability,
  getWeeklyStaffAvailability,
} from "../../src/services/availabilityService.js";
import { getMySchedule, getSavedSchedules } from "../../src/services/scheduleService.js";
import {
  getOpenShifts,
  claimOpenShift,
} from "../../src/services/openShiftService.js";
import { getPayrollSummary } from "../../src/services/payrollService.js";
import { loadDb, initDb, setDemoNow, clearDemoNow } from "../../src/mocks/db.js";

test.beforeEach(() => {
  clearDemoNow();
  initDb();
});

test.after(() => {
  clearDemoNow();
  initDb();
});

test("Staff US08 -> Manager US09: Staff nộp đăng ký rảnh tuần kế tiếp, Manager thấy ngay lập tức", async () => {
  const employeeId = "NV004"; // NV004 chưa đăng ký ở tuần kế tiếp
  const targetWeek = "2026-11-02"; // Tuần kế tiếp

  // 1. Trước khi đăng ký: Manager kiểm tra thấy NV004 chưa đăng ký
  const managerBefore = getWeeklyStaffAvailability(targetWeek);
  const nv004Before = managerBefore.employees.find((e) => e.id === employeeId);
  assert.equal(nv004Before.registered, false, "NV004 ban đầu phải có registered = false");
  const unregCountBefore = managerBefore.summary.unregisteredCount;

  // 2. Staff NV004 thực hiện đăng ký lịch rảnh
  const mySlots = {
    "0_Sáng": "available",
    "0_Chiều": "available",
    "0_Tối": "busy",
    "1_Sáng": "available",
    "1_Chiều": "busy",
    "1_Tối": "busy",
    "2_Sáng": "available",
    "2_Chiều": "available",
    "2_Tối": "available",
    "3_Sáng": "busy",
    "3_Chiều": "available",
    "3_Tối": "available",
    "4_Sáng": "available",
    "4_Chiều": "available",
    "4_Tối": "busy",
    "5_Sáng": "busy",
    "5_Chiều": "available",
    "5_Tối": "busy",
    "6_Sáng": "available",
    "6_Chiều": "available",
    "6_Tối": "available",
  };

  await saveMyAvailability({
    employeeId,
    weekMonday: targetWeek,
    slots: mySlots,
  });

  // 3. Staff đọc lại: thấy đã nộp
  const staffAvail = await getMyAvailability({
    weekMonday: targetWeek,
    employeeId,
  });
  assert.ok(staffAvail.submittedAt, "Staff đọc lại phải có submittedAt");
  assert.equal(staffAvail.slots["0_Sáng"], "available");
  assert.equal(staffAvail.slots["0_Tối"], "busy");

  // 4. Manager đọc lại ngay lập tức qua Single Source of Truth
  const managerAfter = getWeeklyStaffAvailability(targetWeek);
  const nv004After = managerAfter.employees.find((e) => e.id === employeeId);
  assert.equal(nv004After.registered, true, "Manager phải thấy NV004 registered = true");
  assert.ok(nv004After.submittedAt, "Manager phải thấy thời gian nộp submittedAt");
  assert.equal(nv004After.slots["0_Sáng"], "available");
  assert.equal(nv004After.slots["0_Tối"], "busy");
  assert.equal(
    managerAfter.summary.unregisteredCount,
    unregCountBefore - 1,
    "Số người chưa đăng ký phải giảm đi 1"
  );
});

test("Staff US08: Chặn nộp đăng ký rảnh khi đã quá hạn chót (Thứ Sáu trước tuần làm việc 23:59:59)", async () => {
  const targetWeek = "2026-10-26"; // Tuần hiện tại
  // Hạn chót của tuần này là Thứ Sáu trước đó: 2026-10-23 23:59:59
  // Ta giả lập đồng hồ đang ở Thứ Bảy 2026-10-24 (đã quá hạn)
  setDemoNow(new Date("2026-10-24T10:00:00"));

  await assert.rejects(
    async () => {
      await saveMyAvailability({
        employeeId: "NV001",
        weekMonday: targetWeek,
        slots: { "0_Sáng": "available" },
      });
    },
    /Đã hết hạn đăng ký/i,
    "Phải chặn nộp và ném lỗi tiếng Việt khi đã quá hạn chót"
  );
});

test("Staff US13: Lịch của tôi đọc từ db.schedules lọc theo nhân viên và tôn trọng cờ công bố", async () => {
  // Đồng hồ ở tuần 2026-10-26
  setDemoNow(new Date("2026-10-28T10:00:00"));

  // 1. Staff NV001 xem lịch tuần hiện tại (đã công bố)
  const mySched = await getMySchedule({
    week_start: "2026-10-26",
    employeeId: "NV001",
  });

  assert.equal(mySched.published, true, "Tuần hiện tại phải được công bố");
  assert.ok(mySched.shifts.length > 0, "NV001 phải có ca trong tuần hiện tại");

  // Kiểm tra ca morning_T2 của NV001
  const monMorning = mySched.shifts.find((s) => s.id === "morning_T2");
  assert.ok(monMorning, "NV001 phải có ca sáng Thứ 2");
  assert.equal(monMorning.shiftName, "Sáng");
  assert.equal(monMorning.roleTag, "Shift_Leader");
  assert.equal(mySched.shifts.every(s => !s.coworkers || s.coworkers.length === 0), true, "Staff chỉ xem ca của chính mình, không lộ đồng nghiệp");
});

test("Staff US19 -> Manager US18 & US27: Staff nhận ca mở -> ca vào lịch, vào chấm công, thưởng vào bảng lương", async () => {
  // Đồng hồ ở Thứ Hai 26/10 lúc 09:00:00
  setDemoNow(new Date("2026-10-26T09:00:00"));

  // Lấy danh sách ca mở
  const openShifts = await getOpenShifts();
  // Chọn ca OS003 (Tối Thứ Sáu 30/10, Role: Barista, Thưởng: 40.000 đ)
  const os003 = openShifts.find((s) => s.id === "OS003");
  assert.ok(os003, "Phải có ca OS003");
  assert.equal(os003.claims.length, 0, "OS003 ban đầu chưa có người nhận");

  // NV001 (vai trò Shift_Leader) nhận ca OS003
  const staffMember = {
    employeeId: "NV001",
    name: "Nguyễn Văn An",
    phone: "0905123456",
    roleTags: ["Shift_Leader"],
    status: "Đang làm việc",
  };

  const claimRes = await claimOpenShift("OS003", staffMember, os003.version);
  assert.equal(claimRes.filled, true, "Ca cần 1 người, sau khi nhận phải filled = true");
  assert.equal(claimRes.bonus, 40000, "Thưởng phải là 40.000 đ");

  // 1. Kiểm tra Manager thấy ca đã có người nhận
  const openShiftsAfter = await getOpenShifts();
  const os003After = openShiftsAfter.find((s) => s.id === "OS003");
  assert.equal(os003After.claims.length, 1);
  assert.equal(os003After.claims[0].employeeId, "NV001");

  // 2. Kiểm tra ca đã vào db.schedules của Manager
  const schedules = getSavedSchedules();
  // OS003 là ca tối Thứ 6 (evening_T6)
  const eveningT6 = schedules["evening_T6"];
  assert.ok(eveningT6, "Phải có slot evening_T6");
  const assignedNv001 = eveningT6.assigned.find(
    (e) => (typeof e === "string" ? e : e.id) === "NV001"
  );
  assert.ok(assignedNv001, "NV001 phải xuất hiện trong ca tối T6 sau khi nhận ca mở");

  // 3. Kiểm tra Staff NV001 mở Lịch của tôi thấy ca tối Thứ 6
  const staffSched = await getMySchedule({
    week_start: "2026-10-26",
    employeeId: "NV001",
  });
  const myEveningT6 = staffSched.shifts.find((s) => s.id === "evening_T6");
  assert.ok(myEveningT6, "Lịch của NV001 phải có ca tối Thứ 6 vừa nhận");

  // 4. Kiểm tra chấm công có ghi nhận tiền thưởng
  const db = loadDb();
  const att = (db.attendance || []).find(
    (a) => a.employeeId === "NV001" && a.iso === "2026-10-30" && a.shiftName === "Tối"
  );
  assert.ok(att, "Chấm công phải có bản ghi cho ca tối T6 của NV001");
  assert.equal(att.openShiftBonus, 40000, "Chấm công phải ghi nhận bonus 40.000 đ");

  // Giả lập thời gian đến cuối tuần (sau khi ca 30/10 đã kết thúc) để tính bảng lương
  setDemoNow(new Date("2026-11-01T23:00:00"));

  // Bảng lương của kỳ có chứa ngày 30/10 phải có bonus khi ca đã kết thúc
  const payrollRes = await getPayrollSummary({
    period: "range",
    from: "2026-10-26",
    to: "2026-11-01",
  });
  const payrollRows = payrollRes.rows || payrollRes;
  const nv001Payroll = payrollRows.find((p) => p.employeeId === "NV001");
  assert.ok(nv001Payroll, "NV001 phải có trong bảng lương");
  assert.equal(
    nv001Payroll.openShiftBonus,
    40000,
    "Bảng lương Manager phải cộng thêm 40.000 đ tiền thưởng ca trực mở khi ca hoàn thành"
  );
});

test("Staff US19: Optimistic Locking - Hai người nhận cùng lúc thì người sau bị chặn", async () => {
  const openShifts = await getOpenShifts();
  const os001 = openShifts.find((s) => s.id === "OS001");
  assert.ok(os001);

  const emp1 = {
    employeeId: "NV001",
    name: "Nguyễn Văn An",
    roleTags: ["Barista"],
    status: "Đang làm việc",
  };
  const emp2 = {
    employeeId: "NV007",
    name: "Vũ Minh Thảo",
    roleTags: ["Barista"],
    status: "Đang làm việc",
  };

  // Cả 2 cùng đọc version = 1
  const initialVersion = os001.version;

  // Người 1 nhận thành công
  await claimOpenShift("OS001", emp1, initialVersion);

  // Người 2 cố gửi với version cũ -> Phải bị từ chối
  await assert.rejects(
    async () => {
      await claimOpenShift("OS001", emp2, initialVersion);
    },
    /vừa được cập nhật|đã có người nhận/i,
    "Optimistic lock phải từ chối người thứ hai gửi với version cũ"
  );
});
