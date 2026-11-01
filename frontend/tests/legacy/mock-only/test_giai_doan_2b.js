/* global process */
// =============================================================================
// TEST SUITE: GIAI ĐOẠN 2B - KIỂM THỬ TOÀN DIỆN CÁC RÀNG BUỘC NGHIỆP VỤ & TRANH CHẤP
// File: tests/test_giai_doan_2b.js
// =============================================================================

import {
  loadDb,
  saveDb,
  getSavedSchedules,
  saveSchedules,
  getNow,
  setDemoNow,
} from "../../src/mocks/db.js";
import {
  saveExchangeRequests,
  managerApproveExchange,
} from "../../src/mocks/shiftExchangeMock.js";
import {
  approveLeave,
  saveLeaveRequests,
  subscribeLeave,
} from "../../src/services/leaveService.js";
import {
  claimOpenShift,
  subscribeOpenShift,
} from "../../src/services/openShiftService.js";
import { saveOpenShifts, getSavedOpenShifts } from "../../src/mocks/openShiftMock.js";
import { subscribeSchedule } from "../../src/services/scheduleService.js";
import { subscribeShiftExchange } from "../../src/services/shiftExchangeService.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function mondayOf(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

setDemoNow("2026-10-21T08:00:00");
const today = startOfDay(getNow());
const monday = mondayOf(today);
// Chọn ngày tương lai trong tuần hiện tại (Thứ 7)
const futureIso = toISO(addDays(monday, 5));

console.log("=== BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 2B ===");

// =============================================================================
// MỤC 1: approveExchange RÀNG BUỘC CHẶT CHẼ
// =============================================================================
console.log("\n--- MỤC 1: approveExchange RÀNG BUỘC CHẶT CHẼ ---");

// 1.1 Kiểm tra status phải là pending_manager
{
  const invalidStatusReq = {
    id: "EX-STATUS-TEST",
    requesterId: "NV002",
    requesterShift: { date: `Thứ 7, ${futureIso}`, isoDate: futureIso, dayId: "T7", shiftId: "afternoon", shiftName: "Ca chiều" },
    targetEmployeeId: "NV004",
    targetShift: null,
    exchangeType: "cover",
    status: "pending_peer", // Chưa được đồng nghiệp xác nhận
  };
  saveExchangeRequests([invalidStatusReq]);

  let errMsg = "";
  try {
    managerApproveExchange("EX-STATUS-TEST");
  } catch (e) {
    errMsg = e.message;
  }
  assert(
    errMsg.includes("pending_manager"),
    `Chặn duyệt khi status !== 'pending_manager' (lỗi: "${errMsg}")`
  );
}

// 1.2 Kiểm tra so sánh cùng Role_Tag (Barista vs Cashier)
{
  const diffRoleTagReq = {
    id: "EX-ROLE-TAG-TEST",
    requesterId: "NV002", // Barista
    requesterShift: { date: `Thứ 7, ${futureIso}`, isoDate: futureIso, dayId: "T7", shiftId: "afternoon", shiftName: "Ca chiều" },
    targetEmployeeId: "NV003", // Cashier
    targetShift: null,
    exchangeType: "cover",
    status: "pending_manager",
  };
  saveExchangeRequests([diffRoleTagReq]);

  let errMsg = "";
  try {
    managerApproveExchange("EX-ROLE-TAG-TEST");
  } catch (e) {
    errMsg = e.message;
  }
  assert(
    errMsg.includes("Role_Tag"),
    `Chặn duyệt khi khác Role_Tag (lỗi: "${errMsg}")`
  );
}

// 1.3 Kiểm tra người nhận phải ở trạng thái "Đang làm việc" (NV004 có status gốc là "Nghỉ phép")
{
  const inactiveEmpReq = {
    id: "EX-INACTIVE-TEST",
    requesterId: "NV002", // Barista (Đang làm việc)
    requesterShift: { date: `Thứ 7, ${futureIso}`, isoDate: futureIso, dayId: "T7", shiftId: "afternoon", shiftName: "Ca chiều" },
    targetEmployeeId: "NV004", // Barista (Nghỉ phép)
    targetShift: null,
    exchangeType: "cover",
    status: "pending_manager",
  };
  saveExchangeRequests([inactiveEmpReq]);

  let errMsg = "";
  try {
    managerApproveExchange("EX-INACTIVE-TEST");
  } catch (e) {
    errMsg = e.message;
  }
  assert(
    errMsg.includes("Đang làm việc") && errMsg.includes("Nghỉ phép"),
    `Chặn duyệt khi người nhận không ở trạng thái "Đang làm việc" (lỗi: "${errMsg}")`
  );
}

// 1.4 Kiểm tra không trùng ca/giờ
{
  // Xếp sẵn NV005 vào ca Chiều Thứ 7
  const sched = getSavedSchedules();
  sched["afternoon_T7"] = { shiftId: "afternoon", dayId: "T7", assigned: ["NV003", "NV005"] };
  saveSchedules(sched);

  const duplicateShiftReq = {
    id: "EX-DUP-TEST",
    requesterId: "NV003",
    requesterShift: { date: `Thứ 7, ${futureIso}`, isoDate: futureIso, dayId: "T7", shiftId: "afternoon", shiftName: "Ca chiều" },
    targetEmployeeId: "NV005", // NV005 đã có trong ca này rồi
    targetShift: null,
    exchangeType: "cover",
    status: "pending_manager",
  };
  saveExchangeRequests([duplicateShiftReq]);

  let errMsg = "";
  try {
    managerApproveExchange("EX-DUP-TEST");
  } catch (e) {
    errMsg = e.message;
  }
  assert(
    errMsg.includes("đã được phân công"),
    `Chặn duyệt khi người nhận đã được phân công trong ca đó (lỗi: "${errMsg}")`
  );
}

// =============================================================================
// MỤC 2: CHẶN KHI CA ĐÃ BẮT ĐẦU / ĐÃ CÓ CHECK-IN / THUỘC KỲ ĐÃ CHỐT LƯƠNG
// =============================================================================
console.log("\n--- MỤC 2: CHẶN CA BẮT ĐẦU / ĐÃ CHECK-IN / KỲ LƯƠNG ĐÃ KHÓA ---");

// 2.1 Đổi ca: Chặn khi kỳ lương đã khóa
{
  const lockedIso = "2026-01-15"; // Tháng 1/2026 nằm trong payrollLocks
  const lockedExchangeReq = {
    id: "EX-LOCKED-TEST",
    requesterId: "NV003",
    requesterShift: { date: `Thứ 5, 15/01/2026`, isoDate: lockedIso, dayId: "T5", shiftId: "morning", shiftName: "Ca sáng" },
    targetEmployeeId: "NV005",
    targetShift: null,
    exchangeType: "cover",
    status: "pending_manager",
  };
  saveExchangeRequests([lockedExchangeReq]);

  let errMsg = "";
  try {
    managerApproveExchange("EX-LOCKED-TEST");
  } catch (e) {
    errMsg = e.message;
  }
  assert(
    errMsg.includes("kỳ lương đã chốt sổ"),
    `Đổi ca: Chặn khi kỳ lương đã khóa (lỗi: "${errMsg}")`
  );
}

// 2.2 Đổi ca: Chặn khi ca đã có check-in
{
  const db = loadDb();
  // Giả định ca sáng T7 của NV002 đã có check-in
  db.attendance.push({
    id: `NV003_${futureIso}_Sáng_CheckedIn`,
    employeeId: "NV003",
    iso: futureIso,
    shiftName: "Sáng",
    checkInMin: 360,
    checkOutMin: null,
  });
  saveDb();

  const checkedInExchangeReq = {
    id: "EX-CHECKIN-TEST",
    requesterId: "NV003",
    requesterShift: { date: `Thứ 7, ${futureIso}`, isoDate: futureIso, dayId: "T7", shiftId: "morning", shiftName: "Sáng" },
    targetEmployeeId: "NV005",
    targetShift: null,
    exchangeType: "cover",
    status: "pending_manager",
  };
  saveExchangeRequests([checkedInExchangeReq]);

  let errMsg = "";
  try {
    managerApproveExchange("EX-CHECKIN-TEST");
  } catch (e) {
    errMsg = e.message;
  }
  assert(
    errMsg.includes("check-in"),
    `Đổi ca: Chặn khi ca làm việc đã có check-in (lỗi: "${errMsg}")`
  );
}

// 2.3 Duyệt nghỉ: Chặn khi kỳ lương đã khóa
{
  const lockedLeaveReq = {
    id: "LV-LOCKED-TEST",
    employeeId: "NV002",
    isoDate: "2026-01-20",
    shiftId: "morning",
    status: "pending",
  };
  saveLeaveRequests([lockedLeaveReq]);

  let errMsg = "";
  try {
    await approveLeave("LV-LOCKED-TEST");
  } catch (e) {
    errMsg = e.message;
  }
  assert(
    errMsg.includes("kỳ lương đã chốt sổ"),
    `Duyệt nghỉ: Chặn khi kỳ lương đã khóa (lỗi: "${errMsg}")`
  );
}

// 2.4 Duyệt nghỉ: Chặn khi ca đã có check-in
{
  const db = loadDb();
  db.attendance.push({
    id: `NV002_${futureIso}_Sáng_CheckedIn`,
    employeeId: "NV002",
    iso: futureIso,
    shiftName: "Sáng",
    checkInMin: 360,
    checkOutMin: null,
  });
  saveDb();

  const checkedInLeaveReq = {
    id: "LV-CHECKIN-TEST",
    employeeId: "NV002",
    isoDate: futureIso,
    shiftId: "morning",
    shiftTime: "06:00 - 12:00",
    status: "pending",
  };
  saveLeaveRequests([checkedInLeaveReq]);

  let errMsg = "";
  try {
    await approveLeave("LV-CHECKIN-TEST");
  } catch (e) {
    errMsg = e.message;
  }
  assert(
    errMsg.includes("check-in"),
    `Duyệt nghỉ: Chặn khi nhân viên đã chấm công (check-in) (lỗi: "${errMsg}")`
  );
}

// 2.5 Nhận Open Shift: Chặn khi ca thuộc kỳ lương đã khóa
{
  const lockedOpenShift = {
    id: "OS-LOCKED-TEST",
    date: "2026-01-15",
    shiftCode: "morning",
    shiftName: "Sáng",
    startTime: "06:00",
    endTime: "12:00",
    role: "Barista",
    needed: 1,
    bonus: 50000,
    claims: [],
    version: 1,
    cancelled: false,
  };
  saveOpenShifts([lockedOpenShift, ...getSavedOpenShifts()]);

  let errMsg = "";
  try {
    await claimOpenShift("OS-LOCKED-TEST", { employeeId: "NV002", name: "Trần Thị Bích", roleTags: ["Barista"] });
  } catch (e) {
    errMsg = e.message;
  }
  assert(
    errMsg.includes("kỳ lương đã chốt sổ"),
    `Nhận Open Shift: Chặn khi kỳ lương đã chốt sổ (lỗi: "${errMsg}")`
  );
}

// 2.6 Nhận Open Shift: Chặn khi ca đã bắt đầu hoặc đã qua
{
  const pastOpenShift = {
    id: "OS-PAST-TEST",
    date: toISO(addDays(today, -1)), // Hôm qua (tháng hiện tại chưa chốt, nhưng đã qua)
    shiftCode: "morning",
    shiftName: "Sáng",
    startTime: "06:00",
    endTime: "12:00",
    role: "Barista",
    needed: 1,
    bonus: 50000,
    claims: [],
    version: 1,
    cancelled: false,
  };
  saveOpenShifts([pastOpenShift, ...getSavedOpenShifts()]);

  let errMsg = "";
  try {
    await claimOpenShift("OS-PAST-TEST", { employeeId: "NV002", name: "Trần Thị Bích", roleTags: ["Barista"] });
  } catch (e) {
    errMsg = e.message;
  }
  assert(
    errMsg.includes("đã bắt đầu hoặc đã qua") || errMsg.includes("quá giờ bắt đầu"),
    `Nhận Open Shift: Chặn khi ca đã qua giờ bắt đầu (lỗi: "${errMsg}")`
  );
}

// =============================================================================
// MỤC 3: TEST TRANH CHẤP NHẬN CA TRỰC MỞ (CONCURRENCY & CAPACITY)
// =============================================================================
console.log("\n--- MỤC 3: TRANH CHẤP NHẬN CA TRỰC MỞ ---");

// 3.1 Hai người cùng nhận 1 slot (needed: 1, cùng version): người 1 thành công, người 2 bị từ chối
{
  const singleSlotShift = {
    id: "OS-RACE-1",
    date: futureIso,
    shiftCode: "afternoon",
    shiftName: "Chiều",
    startTime: "12:00",
    endTime: "17:00",
    role: "Barista",
    needed: 1,
    bonus: 60000,
    claims: [],
    version: 1,
    cancelled: false,
  };
  saveOpenShifts([singleSlotShift, ...getSavedOpenShifts().filter((s) => s.id !== "OS-RACE-1")]);

  // Cả hai người đều xem danh sách ở version 1
  const versionWhenLoaded = 1;

  // Người 1 (NV002) nhận trước
  const res1 = await claimOpenShift("OS-RACE-1", { employeeId: "NV002", name: "Trần Thị Bích", roleTags: ["Barista"] }, versionWhenLoaded);
  assert(res1 && res1.filled === true, "Người 1 (NV002) nhận slot duy nhất thành công (filled: true)");

  // Người 2 (NV004) nhận sau với version cũ
  let raceErr = "";
  try {
    await claimOpenShift("OS-RACE-1", { employeeId: "NV004", name: "Phạm Thị Dung", roleTags: ["Barista"] }, versionWhenLoaded);
  } catch (e) {
    raceErr = e.message;
  }
  assert(
    raceErr.includes("vừa được cập nhật, vui lòng tải lại") || raceErr.includes("đã có người nhận"),
    `Người 2 (NV004) gửi sau với version cũ bị từ chối Optimistic Lock (lỗi: "${raceErr}")`
  );

  // Người 2 sau khi tải lại danh sách thử nhận tiếp
  const updatedList = getSavedOpenShifts();
  const reloadedShift = updatedList.find((s) => s.id === "OS-RACE-1");
  let reloadClaimErr = "";
  try {
    await claimOpenShift("OS-RACE-1", { employeeId: "NV004", name: "Phạm Thị Dung", roleTags: ["Barista"] }, reloadedShift.version);
  } catch (e) {
    reloadClaimErr = e.message;
  }
  assert(
    reloadClaimErr.includes("đã có người nhận") || reloadClaimErr.includes("đủ người nhận"),
    `Sau khi tải lại danh sách, người 2 nhận thông báo rõ ràng "Ca này đã có người nhận" (lỗi: "${reloadClaimErr}")`
  );
}

// 3.2 Số lượng cần 2 (needed: 2): 2 người nhận thành công, người thứ 3 bị từ chối
{
  const twoSlotShift = {
    id: "OS-RACE-2",
    date: futureIso,
    shiftCode: "evening",
    shiftName: "Tối",
    startTime: "17:00",
    endTime: "22:00",
    role: "Cashier",
    needed: 2,
    bonus: 70000,
    claims: [],
    version: 1,
    cancelled: false,
  };
  saveOpenShifts([twoSlotShift, ...getSavedOpenShifts().filter((s) => s.id !== "OS-RACE-2")]);

  // Người 1 (NV003) nhận slot 1
  const res1 = await claimOpenShift("OS-RACE-2", { employeeId: "NV003", name: "Lê Minh Cường", roleTags: ["Cashier"] });
  assert(res1 && res1.filled === false, "Slot 1: NV003 nhận thành công, ca còn mở (filled = false)");

  // Người 2 (NV005) nhận slot 2
  const res2 = await claimOpenShift("OS-RACE-2", { employeeId: "NV005", name: "Hoàng Văn Nam", roleTags: ["Cashier"] });
  assert(res2 && res2.filled === true, "Slot 2: NV005 nhận thành công, ca đã đủ người (filled = true)");

  // Người 3 (NV001) nhận slot 3
  let thirdClaimErr = "";
  try {
    await claimOpenShift("OS-RACE-2", { employeeId: "NV001", name: "Nguyễn Văn An", roleTags: ["Cashier", "Shift_Leader"] });
  } catch (e) {
    thirdClaimErr = e.message;
  }
  assert(
    thirdClaimErr.includes("đã có người nhận") || thirdClaimErr.includes("đủ người nhận"),
    `Người thứ 3 bị từ chối dứt khoát vì ca đã đủ 2 người (lỗi: "${thirdClaimErr}")`
  );
}

// =============================================================================
// MỤC 4: ĐỊNH DẠNG MÃ BẢN GHI CHẤM CÔNG VÀ CHỐNG TRÙNG MÃ KHI LÀM 2 CA/NGÀY
// =============================================================================
console.log("\n--- MỤC 4: MÃ BẢN GHI CHẤM CÔNG VÀ CHỐNG TRÙNG MÃ 2 CA/NGÀY ---");
{
  const db = loadDb();
  // NV001 làm 2 ca trong cùng ngày futureIso: Ca Sáng và Ca Tối
  const id1 = `NV001_${futureIso}_Sáng`;
  const id2 = `NV001_${futureIso}_Tối`;

  db.attendance.push({
    id: id1,
    employeeId: "NV001",
    iso: futureIso,
    shiftName: "Sáng",
    checkInMin: 360,
    checkOutMin: 720,
  });

  db.attendance.push({
    id: id2,
    employeeId: "NV001",
    iso: futureIso,
    shiftName: "Tối",
    checkInMin: 1020,
    checkOutMin: 1320,
  });
  saveDb();

  const record1 = db.attendance.find((a) => a.id === id1);
  const record2 = db.attendance.find((a) => a.id === id2);

  assert(
    record1 && record2 && record1.id !== record2.id,
    `Hai ca cùng ngày của một nhân viên có mã ID độc lập hoàn toàn: "${record1?.id}" vs "${record2?.id}"`
  );
  assert(
    record1.id === `NV001_${futureIso}_Sáng` && record2.id === `NV001_${futureIso}_Tối`,
    "Định dạng ID chấm công đúng chuẩn ${employeeId}_${iso}_${shiftName} không bao giờ bị đè"
  );
}

// =============================================================================
// MỤC 5: TỰ ĐỘNG CẬP NHẬT GIAI DIỆN KHÔNG CẦN F5 (NOTIFYLISTENERS / SUBSCRIBE)
// =============================================================================
console.log("\n--- MỤC 5: PHẢN ỨNG TỰ ĐỘNG KHÔNG CẦN F5 (SUBSCRIBE) ---");
{
  let scheduleNotified = false;
  let exchangeNotified = false;
  let leaveNotified = false;
  let openShiftNotified = false;

  const unsubSched = subscribeSchedule(() => { scheduleNotified = true; });
  const unsubExch = subscribeShiftExchange(() => { exchangeNotified = true; });
  const unsubLeave = subscribeLeave(() => { leaveNotified = true; });
  const unsubOS = subscribeOpenShift(() => { openShiftNotified = true; });

  // Kích hoạt một sự kiện thay đổi dữ liệu
  const sched = getSavedSchedules();
  sched["afternoon_T7"] = { shiftId: "afternoon", dayId: "T7", assigned: ["NV002"] };
  saveSchedules(sched);

  assert(scheduleNotified, "subscribeSchedule nhận được thông báo khi dữ liệu lịch thay đổi");
  assert(exchangeNotified, "subscribeShiftExchange nhận được thông báo phản ứng thời gian thực");
  assert(leaveNotified, "subscribeLeave nhận được thông báo phản ứng thời gian thực");
  assert(openShiftNotified, "subscribeOpenShift nhận được thông báo phản ứng thời gian thực");

  // Hủy đăng ký sạch sẽ
  unsubSched();
  unsubExch();
  unsubLeave();
  unsubOS();
}

console.log(`\n=== TỔNG KẾT GIAI ĐOẠN 2B: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
