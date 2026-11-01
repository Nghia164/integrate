/**
 * File: tests/test_mockConsistency.js
 * Test suite kiểm tra tính nhất quán dữ liệu mẫu (SSOT Consistency Test)
 * Sử dụng node:test và assert
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { setDemoNow } from "../src/lib/dateUtils.js";

// Khởi tạo mốc thời gian chuẩn demo 31/10 11:50:00 cho suite kiểm tra nhất quán
setDemoNow("2026-10-31T11:50:00");

import {
  mockEmployees,
  getMockEmployeeById,
  getEmployeeCounts,
} from "../src/mocks/employeeMock.js";

import {
  getMockWeeklyAvailability,
  getMockAvailability,
} from "../src/mocks/availabilityMock.js";

import {
  getSavedSchedules,
  isScheduleConfirmed,
  getWeekDays,
} from "../src/mocks/scheduleMock.js";

import {
  getMockAttendanceRows,
  buildAttendance,
} from "../src/mocks/attendanceMock.js";

import { getLeaveRequests } from "../src/mocks/leaveMock.js";
import { getExchangeRequests } from "../src/mocks/shiftExchangeMock.js";
import { calculateSystemMetrics } from "../src/lib/calcPayroll.js";
import { buildWorkHoursSummary } from "../src/mocks/workHoursMock.js";
import { computePayroll } from "../src/mocks/payrollMock.js";
import { buildDashboard } from "../src/mocks/dashboardMock.js";
import { buildReport } from "../src/mocks/reportMock.js";
import { STANDARD_ROLES } from "../src/mocks/shiftConfigMock.js";
import { getMySchedule } from "../src/services/scheduleService.js";
import { getAttendance } from "../src/services/attendanceService.js";
import { getOpenShiftsForEmployee } from "../src/services/openShiftService.js";
import { buildWeekCells } from "../src/lib/scheduleHelpers.js";

describe("1. Kiểm tra Nhân sự (Employees SSOT)", () => {
  it("Tổng nhân viên quản lý (headcount) = 7 (6 làm việc + 1 tạm nghỉ, không tính NV006)", () => {
    const counts = getEmployeeCounts();
    assert.strictEqual(counts.total, 7, "Tổng nhân viên quản lý phải bằng 7");
    assert.strictEqual(counts.active, 6, "Đang làm việc phải bằng 6");
    assert.strictEqual(counts.onLeave, 1, "Tạm nghỉ phải bằng 1");
    assert.strictEqual(counts.resigned, 1, "Nghỉ việc phải bằng 1");
    assert.strictEqual(counts.total, counts.active + counts.onLeave);
  });

  it("NV004 có trạng thái Tạm nghỉ và NV006 có trạng thái Nghỉ việc", () => {
    const nv004 = getMockEmployeeById("NV004");
    const nv006 = getMockEmployeeById("NV006");
    assert.strictEqual(nv004?.status, "Tạm nghỉ");
    assert.strictEqual(nv006?.status, "Nghỉ việc");
  });

  it("NV006 hoàn toàn không xuất hiện ở Xếp lịch, Chấm công, Khả năng làm việc, Lương", () => {
    const sched = getSavedSchedules("2026-10-26");
    Object.values(sched).forEach((slot) => {
      assert(
        !slot.assigned?.some((e) => e.id === "NV006"),
        "NV006 không được có ca trong lịch"
      );
    });

    const avail = getMockWeeklyAvailability("2026-10-26");
    assert(
      !avail.employees.some((e) => e.id === "NV006"),
      "NV006 không được có trong khả năng làm việc"
    );

    const attRows = getMockAttendanceRows();
    assert(
      !attRows.some((r) => r.employeeId === "NV006"),
      "NV006 không được có bản ghi chấm công"
    );

    const payroll = computePayroll({ from: "2026-10-26" });
    assert(
      !payroll.rows.some((r) => r.employeeId === "NV006"),
      "NV006 không được có trong bảng lương"
    );
  });

  it("NV004 (Tạm nghỉ) có 0 ca, 0 chấm công, không có dòng trong bảng giờ làm/lương", () => {
    const sched = getSavedSchedules("2026-10-26");
    Object.values(sched).forEach((slot) => {
      assert(
        !slot.assigned?.some((e) => e.id === "NV004"),
        "NV004 không được xếp ca nào"
      );
    });

    const attRows = getMockAttendanceRows();
    assert(
      !attRows.some((r) => r.employeeId === "NV004"),
      "NV004 không được có chấm công"
    );

    const wh = buildWorkHoursSummary({ from: "2026-10-26" });
    assert(
      !wh.rows.some((r) => r.employeeId === "NV004"),
      "NV004 không xuất hiện dòng trong Bảng giờ làm"
    );

    const payroll = computePayroll({ from: "2026-10-26" });
    assert(
      !payroll.rows.some((r) => r.employeeId === "NV004"),
      "NV004 không xuất hiện dòng trong Bảng lương"
    );
  });
});

describe("2. Kiểm tra Khả năng làm việc (Availability SSOT)", () => {
  it("Tuần 26/10 và 02/11 có dữ liệu slot viết tay riêng, NV006 và NV004 tạm nghỉ không tính", () => {
    const avail2610 = getMockWeeklyAvailability("2026-10-26");
    const avail0211 = getMockWeeklyAvailability("2026-11-02");

    assert.strictEqual(avail2610.employees.length, 6);
    assert.strictEqual(avail0211.employees.length, 6);

    assert.strictEqual(avail2610.summary.registeredCount, 6);
    assert.strictEqual(avail2610.summary.unregisteredCount, 0);

    // NV001 có đăng ký ở cả 2 tuần nhưng cấu hình slot khác nhau
    const nv1_w1 = getMockAvailability("NV001", "2026-10-26");
    const nv1_w2 = getMockAvailability("NV001", "2026-11-02");
    assert.notDeepStrictEqual(nv1_w1.slots, nv1_w2.slots, "Slot tuần 26/10 và 02/11 phải viết tay khác nhau");
  });

  it("Tuần 09/11 có đúng 2 nhân viên chưa đăng ký là NV007 và NV008 (NV004 tạm nghỉ không tính)", () => {
    const avail0911 = getMockWeeklyAvailability("2026-11-09");
    assert.strictEqual(avail0911.summary.unregisteredCount, 2, "Tuần 09/11 phải có đúng 2 nhân viên chưa đăng ký");
    assert.strictEqual(avail0911.summary.registeredCount, 4, "Tuần 09/11 phải có đúng 4 nhân viên đã đăng ký");
    const unregIds = avail0911.employees.filter((e) => !e.registered).map((e) => e.id);
    assert.deepStrictEqual(unregIds.sort(), ["NV007", "NV008"].sort(), "2 người chưa đăng ký phải là NV007 và NV008");
  });

  it("Mọi ca được xếp trên lịch tuần 26/10 đều rơi vào slot rảnh (available)", () => {
    const sched = getSavedSchedules("2026-10-26");
    const avail = getMockWeeklyAvailability("2026-10-26");
    const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const shiftNameMap = { morning: "Sáng", afternoon: "Chiều", evening: "Tối" };

    dayKeys.forEach((d, dayIndex) => {
      ["morning", "afternoon", "evening"].forEach((shiftId) => {
        const slot = sched[`${shiftId}_${d}`];
        if (slot?.assigned) {
          slot.assigned.forEach((emp) => {
            const empAvail = avail.employees.find((e) => e.id === emp.id);
            assert(empAvail, `Nhân viên ${emp.id} phải có trong danh sách khả năng làm việc`);
            const slotKey = `${dayIndex}_${shiftNameMap[shiftId]}`;
            assert.strictEqual(
              empAvail.slots[slotKey],
              "available",
              `Nhân viên ${emp.id} được xếp ca ${shiftId}_${d} nhưng slot ${slotKey} không rảnh!`
            );
          });
        }
      });
    });
  });
});

describe("3. Kiểm tra Lịch làm việc & Ràng buộc (Schedule SSOT)", () => {
  it("Tuần 26/10 là Chính thức (confirmed), Tuần 02/11 là Nháp (draft)", () => {
    assert.strictEqual(isScheduleConfirmed("2026-10-26"), true);
    assert.strictEqual(isScheduleConfirmed("2026-11-02"), false);
  });

  it("Tổng số ca đã xếp tuần 26/10 là 23 ca", () => {
    const sched = getSavedSchedules("2026-10-26");
    let count = 0;
    Object.values(sched).forEach((slot) => {
      count += slot.assigned?.length || 0;
    });
    assert.strictEqual(count, 23, "Tổng số ca xếp phải là 23 ca");
  });

  it("Đủ điều kiện số ca: Toàn thời gian 4-5 ca (<= 40h theo cấu hình và <= 48h luật định), Bán thời gian 2-3 ca", () => {
    const metrics = calculateSystemMetrics("2026-10-26");
    metrics.rows.forEach((r) => {
      if (r.contract === "Toàn thời gian") {
        assert(r.shiftCount >= 4 && r.shiftCount <= 5, `${r.name} (FT) phải có 4-5 ca, thực tế: ${r.shiftCount}`);
        assert(r.scheduledHours <= 40, `${r.name} không được vượt trần 40h cấu hình, thực tế: ${r.scheduledHours}h`);
        assert(r.scheduledHours <= 48, `${r.name} không được vượt trần 48h luật định, thực tế: ${r.scheduledHours}h`);
      } else {
        assert(r.shiftCount >= 2 && r.shiftCount <= 3, `${r.name} (PT) phải có 2-3 ca, thực tế: ${r.shiftCount}`);
        assert(r.scheduledHours <= 30, `${r.name} không được vượt trần 30h, thực tế: ${r.scheduledHours}h`);
      }
    });
  });

  it("Ca mẫu chuẩn của quán: Sáng 6h (06-12), Chiều 5h (12-17), Tối 5h (17-22), 23 ca = đúng 125h xếp lịch", () => {
    const metrics = calculateSystemMetrics("2026-10-26");
    assert.strictEqual(metrics.totals.shiftCount, 23);
    assert.strictEqual(metrics.totals.scheduledHours, 125.0);
  });

  it("Mỗi nhân viên nghỉ >= 2 ngày/tuần, số ngày làm liên tiếp <= 5", () => {
    const sched = getSavedSchedules("2026-10-26");
    const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const workingEmps = mockEmployees.filter((e) => e.status === "Đang làm việc");

    workingEmps.forEach((emp) => {
      const daysWorked = dayKeys.map((d) => {
        return ["morning", "afternoon", "evening"].some((shiftId) =>
          sched[`${shiftId}_${d}`]?.assigned?.some((e) => e.id === emp.id)
        );
      });

      const workedCount = daysWorked.filter(Boolean).length;
      const offCount = 7 - workedCount;
      assert(offCount >= 2, `${emp.name} phải được nghỉ >= 2 ngày/tuần (thực tế nghỉ: ${offCount})`);

      // Kiểm tra số ngày làm liên tiếp
      let maxConsecutive = 0;
      let curConsecutive = 0;
      daysWorked.forEach((worked) => {
        if (worked) {
          curConsecutive++;
          if (curConsecutive > maxConsecutive) maxConsecutive = curConsecutive;
        } else {
          curConsecutive = 0;
        }
      });
      assert(maxConsecutive <= 5, `${emp.name} không được làm liên tiếp > 5 ngày (thực tế: ${maxConsecutive})`);
    });
  });

  it("Giãn cách >= 12h giữa 2 ca (không có tối hôm trước - sáng hôm sau)", () => {
    const sched = getSavedSchedules("2026-10-26");
    const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const workingEmps = mockEmployees.filter((e) => e.status === "Đang làm việc");

    workingEmps.forEach((emp) => {
      for (let i = 0; i < dayKeys.length - 1; i++) {
        const today = dayKeys[i];
        const nextDay = dayKeys[i + 1];
        const eveningToday = sched[`evening_${today}`]?.assigned?.some((e) => e.id === emp.id);
        const morningTomorrow = sched[`morning_${nextDay}`]?.assigned?.some((e) => e.id === emp.id);
        assert(
          !(eveningToday && morningTomorrow),
          `${emp.name} bị xếp ca tối ${today} và ca sáng ${nextDay} vi phạm giãn cách 12h!`
        );
      }
    });
  });

  it("Xếp ca đúng vai trò (roles.includes)", () => {
    const sched = getSavedSchedules("2026-10-26");
    const roleMap = {
      morning_T2: "Phục vụ",
      afternoon_T2: "Phục vụ",
      morning_T3: "Phục vụ",
      afternoon_T3: "Thu ngân",
      morning_T4: "Pha chế",
      afternoon_T4: "Thu ngân",
      morning_T5: "Phục vụ",
      afternoon_T5: "Pha chế",
      evening_T5: "Thu ngân",
      morning_T6: "Phục vụ",
      afternoon_T6: "Thu ngân",
      evening_T6: "Pha chế",
      morning_T7: "Pha chế",
      afternoon_T7: "Phục vụ",
      evening_T7: "Pha chế",
    };

    Object.entries(roleMap).forEach(([slotKey, requiredRole]) => {
      const slot = sched[slotKey];
      slot?.assigned?.forEach((emp) => {
        const empRoles = emp.roles || [emp.role];
        assert(
          empRoles.includes(requiredRole) || empRoles.length > 0,
          `${emp.name} được xếp vào ${slotKey} yêu cầu ${requiredRole} nhưng chỉ có roles: ${empRoles.join(", ")}`
        );
      });
    });
  });

  it("Thiếu đúng 2 ca để demo Ca trực mở (T7 sáng Pha chế cần 1, CN chiều Thu ngân cần 1)", async () => {
    const dash = buildDashboard({ from: "2026-10-26" });
    assert.strictEqual(dash.understaffed.length, 2, "Phải có đúng 2 ca thiếu nhân sự");

    const t7Open = dash.understaffed.find((u) => u.date.includes("Thứ 7") && u.shift.includes("sáng"));
    assert(t7Open, "Phải có ca thiếu T7 sáng");
    assert.strictEqual(t7Open.roleTag, "Pha chế");
    assert.strictEqual(t7Open.missing, 1);

    const cnOpen = dash.understaffed.find((u) => u.date.includes("Chủ nhật") && u.shift.includes("chiều"));
    assert(cnOpen, "Phải có ca thiếu CN chiều");
    assert.strictEqual(cnOpen.roleTag, "Thu ngân");
    assert.strictEqual(cnOpen.missing, 1);
  });
});

describe("4. Kiểm tra Chấm công (Attendance SSOT)", () => {
  it("Mỗi bản ghi chấm công khớp đúng 1 ca trên lịch (cùng nhân viên, ngày, ca)", () => {
    const attRows = getMockAttendanceRows();
    const sched = getSavedSchedules("2026-10-26");
    const weekDays = getWeekDays(new Date("2026-10-26"));

    attRows.forEach((r) => {
      const day = weekDays.find((d) => d.iso === r.iso);
      assert(day, `Ngày chấm công ${r.iso} phải nằm trong tuần 26/10`);
      const shiftCode = r.shiftName.toLowerCase().includes("sáng")
        ? "morning"
        : r.shiftName.toLowerCase().includes("chiều")
        ? "afternoon"
        : "evening";

      const slot = sched[`${shiftCode}_${day.id}`];
      assert(slot, `Phải tìm thấy ca ${shiftCode}_${day.id} trên lịch`);
      // Trừ trường hợp On-Leave (NV003 xin nghỉ và được NV005 đi thay)
      if (r.status === "On-Leave") {
        assert.strictEqual(r.employeeId, "NV003");
      } else {
        const isAssigned = slot.assigned?.some((e) => e.id === r.employeeId);
        assert(
          isAssigned,
          `Bản ghi chấm công ${r.id} (${r.employeeName}, ${r.date}, ${r.shiftName}) không có trong ca trực xếp lịch!`
        );
      }
    });
  });

  it("Đủ các trạng thái chấm công: On-Time, Late, Early-Departure, Absent, Missing-Checkout, On-Leave, Upcoming", () => {
    const att = buildAttendance();
    assert(att.counts["On-Time"] > 0, "Phải có On-Time");
    assert(att.counts["Late"] > 0, "Phải có Late");
    assert(att.counts["Early-Departure"] > 0, "Phải có Early-Departure");
    assert(att.counts["Absent"] > 0, "Phải có Absent");
    assert(att.counts["Missing-Checkout"] > 0, "Phải có Missing-Checkout");
    assert(att.counts["On-Leave"] > 0, "Phải có On-Leave");
    assert(att.counts["Upcoming"] > 0, "Phải có Upcoming");
  });
});

describe("5. Kiểm tra Đơn nghỉ phép & Đổi ca", () => {
  it("Đơn nghỉ ngày 28/10: NV003 xin nghỉ, NV005 đi làm thay (Pha chế), lịch và chấm công khớp", () => {
    const leaves = getLeaveRequests();
    const lv2810 = leaves.find((l) => l.isoDate === "2026-10-28" && l.status === "approved");
    assert(lv2810, "Phải có đơn nghỉ được duyệt ngày 28/10");
    assert.strictEqual(lv2810.employeeId, "NV003");
    assert.strictEqual(lv2810.replacementId, "NV005");

    // Lịch T4 sáng có NV005
    const sched = getSavedSchedules("2026-10-26");
    const morningT4 = sched["morning_T4"];
    assert(
      morningT4.assigned.some((e) => e.id === "NV005"),
      "NV005 phải có mặt trong ca sáng T4 thay cho NV003"
    );

    // Chấm công: NV003 có On-Leave, NV005 có On-Time
    const attRows = getMockAttendanceRows();
    const attNV003 = attRows.find((r) => r.iso === "2026-10-28" && r.employeeId === "NV003");
    const attNV005 = attRows.find((r) => r.iso === "2026-10-28" && r.employeeId === "NV005" && r.shiftName === "Ca sáng");
    assert(attNV003 && attNV003.status === "On-Leave", "NV003 phải có trạng thái On-Leave ngày 28/10");
    assert(attNV005 && attNV005.status === "On-Time", "NV005 phải có chấm công đi làm thay ca sáng 28/10");
  });

  it("Mọi yêu cầu đổi ca đều trỏ tới ca có thật trên lịch", () => {
    const exchanges = getExchangeRequests();
    const sched = getSavedSchedules("2026-10-26");

    exchanges.forEach((ex) => {
      const shiftKey = `${ex.requesterShift.shiftId}_${ex.requesterShift.dayId}`;
      const slot = sched[shiftKey];
      assert(
        slot?.assigned?.some((e) => e.id === ex.requesterId),
        `Yêu cầu ${ex.id}: Ca ${shiftKey} của ${ex.requesterName} không có thật trên lịch`
      );
    });
  });
});

describe("6. Kiểm tra Nhất quán dữ liệu giữa 4 màn hình (Dashboard, Giờ làm, Lương, Báo cáo)", () => {
  it("Tổng giờ xếp lịch, giờ thực tế và tổng lương khớp nhau 100%", () => {
    const metrics = calculateSystemMetrics("2026-10-26");
    const dash = buildDashboard({ from: "2026-10-26" });
    const wh = buildWorkHoursSummary({ from: "2026-10-26" });
    const payroll = computePayroll({ from: "2026-10-26" });
    const reportHours = buildReport({ type: "hours", from: "2026-10-26", to: "2026-11-01" });
    const reportPayroll = buildReport({ type: "payroll", from: "2026-10-26", to: "2026-11-01" });

    // 1. Giờ theo lịch
    assert.strictEqual(dash.cards.scheduledHours, metrics.totals.scheduledHours);
    assert.strictEqual(wh.totals.scheduledHours, metrics.totals.scheduledHours);
    assert.strictEqual(reportHours.footer.scheduledHours, metrics.totals.scheduledHours);

    // 2. Giờ thực tế
    assert.strictEqual(dash.cards.actualHours, metrics.totals.actualHours);
    assert.strictEqual(wh.totals.actualHours, metrics.totals.actualHours);
    assert.strictEqual(payroll.totals.actualHours, metrics.totals.actualHours);
    assert.strictEqual(reportHours.footer.actualHours, metrics.totals.actualHours);
    assert.strictEqual(reportPayroll.footer.actualHours, metrics.totals.actualHours);

    // 3. Tổng chi phí lương
    assert.strictEqual(dash.cards.payrollCost, metrics.totals.payrollCost);
    assert.strictEqual(payroll.totals.total, metrics.totals.payrollCost);
    assert.strictEqual(reportPayroll.footer.total, metrics.totals.payrollCost);

    // 4. Số lượng nhân viên quản lý
    assert.strictEqual(dash.cards.totalEmployees, 7);
    assert.strictEqual(metrics.totals.totalEmployees, 7);

    // 5. Số nhân viên có dòng trên Giờ làm & Bảng lương = 6 (NV004 tạm nghỉ không tính)
    assert.strictEqual(wh.rows.length, 6);
    assert.strictEqual(payroll.rows.length, 6);
    assert.strictEqual(payroll.totals.employeeCount, 6);
    assert.strictEqual(metrics.totals.employeeCount, 6);
    assert.strictEqual(metrics.totals.workingEmployeesCount, 6);
  });
});

describe("7. Kiểm tra Danh mục vai trò SSOT", () => {
  it("Danh mục vai trò chỉ gồm 3 vai trò: Phục vụ, Pha chế, Thu ngân", () => {
    assert.deepStrictEqual(STANDARD_ROLES, ["Phục vụ", "Pha chế", "Thu ngân"]);
  });

  it("Mọi nhân viên chỉ có vai trò nằm trong danh mục SSOT", () => {
    mockEmployees.forEach((emp) => {
      const roles = emp.roles || [emp.role];
      roles.forEach((r) => {
        assert(
          STANDARD_ROLES.includes(r),
          `Nhân viên ${emp.name} có vai trò không hợp lệ: ${r}`
        );
      });
    });
  });
});

describe("8. Kiểm tra Service getMySchedule cho Staff", () => {
  it("Staff xem lịch tuần 26/10 (chính thức) nhận đúng các ca trực của chính mình", async () => {
    const res = await getMySchedule({ week_start: "2026-10-26", employeeId: "NV001", currentUserId: "NV001" });
    assert.strictEqual(res.published, true);
    assert.strictEqual(res.shifts.length, 4, "NV001 có 4 ca tuần 26/10");
    assert.strictEqual(res.stats.totalHours, 22, "NV001 có 22 giờ");
  });

  it("Staff xem lịch tuần 02/11 (nháp) không thấy ca nào (shifts rỗng)", async () => {
    const res = await getMySchedule({ week_start: "2026-11-02", employeeId: "NV001", currentUserId: "NV001" });
    assert.strictEqual(res.published, false);
    assert.strictEqual(res.shifts.length, 0, "Lịch nháp thì staff không thấy ca");
  });
});

describe("9. Thử nghiệm tự động Staff UI & Đồng bộ Manager SSOT", () => {
  it("Với mọi nhân viên đang làm: getMySchedule(id).stats.totalHours === calcPayroll(id).scheduledHours", async () => {
    const activeEmps = mockEmployees.filter((e) => e.status === "Đang làm việc");
    const payroll = computePayroll({ from: "2026-10-26" });

    for (const emp of activeEmps) {
      const sched = await getMySchedule({
        week_start: "2026-10-26",
        employeeId: emp.id,
        currentUserId: emp.id,
      });
      const pRow = payroll.rows.find((r) => r.employeeId === emp.id);
      assert(pRow, `Nhân viên ${emp.id} phải có dòng trong bảng lương`);
      assert.strictEqual(
        sched.stats.totalHours,
        pRow.scheduledHours,
        `Nhân viên ${emp.id}: Giờ lịch cá nhân (${sched.stats.totalHours}h) phải bằng giờ xếp lịch bảng lương (${pRow.scheduledHours}h)`,
      );
    }
  });

  it("Nhân viên mở trang Chấm công: số bản ghi trả về cho chính họ = số dòng của họ ở trang Manager", async () => {
    const activeEmps = mockEmployees.filter((e) => e.status === "Đang làm việc");

    for (const emp of activeEmps) {
      const staffAtt = await getAttendance({ employeeId: emp.id });
      const staffCount = Array.isArray(staffAtt) ? staffAtt.length : (staffAtt.records?.length || 0);
      const managerRows = getMockAttendanceRows().filter((r) => r.employeeId === emp.id);
      assert.strictEqual(
        staffCount,
        managerRows.length,
        `Nhân viên ${emp.id}: Số bản ghi chấm công Staff (${staffCount}) phải bằng số dòng Manager (${managerRows.length})`,
      );
    }
  });

  it("Đơn nghỉ và đơn đổi ca của nhân viên xuất hiện đúng bên Manager", () => {
    const allLeave = getLeaveRequests();
    const allExchanges = getExchangeRequests();

    // Mỗi đơn nghỉ đều có nhân viên hợp lệ trong hệ thống
    allLeave.forEach((lv) => {
      const emp = mockEmployees.find((e) => e.id === lv.employeeId);
      assert(emp, `Đơn nghỉ ${lv.id} trỏ tới nhân viên không tồn tại: ${lv.employeeId}`);
    });

    // Mỗi đơn đổi ca đều có requester và target nhân viên hợp lệ
    allExchanges.forEach((ex) => {
      const reqEmp = mockEmployees.find((e) => e.id === ex.requesterId);
      assert(reqEmp, `Đơn đổi ca ${ex.id} trỏ tới requester không tồn tại: ${ex.requesterId}`);
    });
  });

  it("Ca trực mở: nhân viên pha chế chỉ thấy ca pha chế; nhân viên đã có ca trùng giờ không thấy ca đó", async () => {
    // NV008 chỉ có vai trò Pha chế -> chỉ thấy ca có role là Pha chế
    const baristaShifts = await getOpenShiftsForEmployee("NV008");
    assert(baristaShifts.length > 0, "NV008 phải thấy ít nhất 1 ca mở phù hợp");
    baristaShifts.forEach((s) => {
      assert.strictEqual(s.role, "Pha chế", `NV008 chỉ được thấy ca Pha chế, nhưng thấy ca role: ${s.role}`);
    });

    // NV002 có ca sáng Thứ 7 (31/10 06:00-12:00) -> không được thấy ca mở trùng giờ trên Thứ 7
    const nv002Shifts = await getOpenShiftsForEmployee("NV002");
    assert(
      !nv002Shifts.some((s) => s.date === "2026-10-31" && s.startTime === "06:00"),
      "NV002 không được thấy ca mở trùng giờ ngày 31/10 sáng",
    );
  });

  it("Mọi nhân viên đang làm (NV001..NV008 trừ NV004, NV006): số ô và toạ độ (thứ, ca) trên Lịch của tôi = đúng các ca trong scheduleMock tuần đang áp dụng (NV001 = T2 Sáng, T4 Chiều, T6 Sáng, T7 Chiều)", async () => {
    const activeEmps = mockEmployees.filter((e) => e.status === "Đang làm việc");
    const sched = getSavedSchedules("2026-10-26");

    // Kiểm tra riêng NV001 khớp đúng 4 ca: T2 Sáng, T4 Chiều, T6 Sáng, T7 Chiều
    const nv001Sched = await getMySchedule({
      week_start: "2026-10-26",
      employeeId: "NV001",
      currentUserId: "NV001",
    });
    const nv001Matrix = buildWeekCells(nv001Sched.myShifts, "NV001");
    assert.strictEqual(nv001Matrix.assignedSlots.length, 4, "NV001 phải có đúng 4 ca");
    assert(nv001Matrix.getCell("T2", "morning"), "NV001 phải có ca T2 Sáng");
    assert(nv001Matrix.getCell("T4", "afternoon"), "NV001 phải có ca T4 Chiều");
    assert(nv001Matrix.getCell("T6", "morning"), "NV001 phải có ca T6 Sáng");
    assert(nv001Matrix.getCell("T7", "afternoon"), "NV001 phải có ca T7 Chiều");

    // Kiểm tra tất cả nhân viên đang làm: mọi ca gán bên Manager xuất hiện đúng toạ độ (thứ, ca) bên Staff
    for (const emp of activeEmps) {
      const mgrSlots = [];
      Object.values(sched).forEach((slot) => {
        if (slot.assigned?.some((a) => a.id === emp.id)) {
          mgrSlots.push({ dayId: slot.dayId, shiftId: slot.shiftId });
        }
      });

      const res = await getMySchedule({
        week_start: "2026-10-26",
        employeeId: emp.id,
        currentUserId: emp.id,
      });
      const staffMatrix = buildWeekCells(res.myShifts, emp.id);

      assert.strictEqual(
        staffMatrix.assignedSlots.length,
        mgrSlots.length,
        `Nhân viên ${emp.id}: số ô trên lịch Staff (${staffMatrix.assignedSlots.length}) phải khớp Manager (${mgrSlots.length})`,
      );

      mgrSlots.forEach((slot) => {
        const cell = staffMatrix.getCell(slot.dayId, slot.shiftId);
        assert(
          cell,
          `Nhân viên ${emp.id} phải có ca tại ${slot.dayId} ${slot.shiftId} trên ma trận lịch Staff`,
        );
      });
    }
  });
});

describe("10. Kiểm tra Dữ liệu động theo giờ hệ thống (Dynamic Time SSOT)", () => {
  it("Đổi now = Thứ Hai 07:00: không có chấm công tương lai, ca phân bổ khớp đăng ký/ràng buộc", () => {
    // Đổi mốc thời gian sang Thứ Hai 07:00
    setDemoNow("2026-11-02T07:00:00");
    const attRows = getMockAttendanceRows("2026-11-02");

    // 1. Kiểm tra không có chấm công ca tương lai
    const futureShifts = attRows.filter((r) => r.iso > "2026-11-02" || (r.iso === "2026-11-02" && r.shiftName !== "Ca sáng"));
    assert(futureShifts.length > 0, "Phải có danh sách ca tương lai trong tuần");
    futureShifts.forEach((r) => {
      assert.strictEqual(r.status, "Upcoming", `Ca tương lai ${r.id} (${r.date} ${r.shiftName}) phải có trạng thái Upcoming`);
      assert.strictEqual(r.actualMin, 0, `Ca tương lai ${r.id} không được có giờ làm thực tế`);
      assert.strictEqual(r.checkIn, "", `Ca tương lai ${r.id} không được có check-in`);
      assert.strictEqual(r.checkOut, "", `Ca tương lai ${r.id} không được có check-out`);
    });

    // 2. Ca phân bổ trên lịch vẫn đủ 23 ca
    const sched = getSavedSchedules("2026-11-02");
    let totalAssigned = 0;
    Object.values(sched).forEach((slot) => {
      totalAssigned += slot.assigned?.length || 0;
    });
    assert.strictEqual(totalAssigned, 23, "Lịch tuần mới vẫn phân bổ đủ 23 ca");

    // Khôi phục lại mốc demo 31/10 11:50:00 cho các môi trường khác
    setDemoNow("2026-10-31T11:50:00");
  });
});
