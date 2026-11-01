// BACKEND: server tính, FE chỉ hiển thị
// =============================================================================
// File: src/lib/calcPayroll.js
// Thư viện tính toán chuẩn hóa Giờ làm và Bảng lương (SSOT Calculation)
// Hàm thuần túy dùng chung cho Dashboard (US28), WorkHours (US14), Payroll (US27), Reports (US29)
// =============================================================================

import { mockEmployees } from "../services/employeeService.js";
import { getSavedSchedules } from "../services/scheduleService.js";
import { getMockAttendanceRows } from "../services/attendanceService.js";

/**
 * Tính toán số liệu giờ làm và lương chuẩn hóa cho toàn bộ nhân viên (US13, US14, US27, US28, US29)
 * Đảm bảo 100% nhất quán giữa Dashboard, Giờ làm, Bảng lương và Báo cáo
 */
export function calculateSystemMetrics(targetWeekMonday = "2026-10-26") {
  // BACKEND: Server tính toán tổng hợp giờ làm, chấm công và chi phí lương từ bảng schedules, attendance_logs và employees
  const schedules = getSavedSchedules(targetWeekMonday);
  const attendanceRows = getMockAttendanceRows(targetWeekMonday);

  // Danh sách nhân viên hoạt động (loại trừ Nghỉ việc - NV006)
  const activeEmployees = mockEmployees.filter((e) => e.status !== "Nghỉ việc");
  // Nhân viên Tạm nghỉ (NV004) không có ca và không có dòng trong bảng giờ làm/lương
  const workingEmployees = activeEmployees.filter((e) => e.status !== "Tạm nghỉ");

  const shiftHoursMap = {
    morning: 6,
    afternoon: 5,
    evening: 5,
  };

  const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const employeeRows = workingEmployees.map((emp) => {
    // 1. Tính tổng giờ xếp lịch
    let scheduledHours = 0;
    let shiftCount = 0;

    dayKeys.forEach((d) => {
      ["morning", "afternoon", "evening"].forEach((shiftId) => {
        const slotKey = `${shiftId}_${d}`;
        const slot = schedules[slotKey];
        if (slot && Array.isArray(slot.assigned)) {
          if (slot.assigned.some((assignedEmp) => assignedEmp.id === emp.id)) {
            scheduledHours += shiftHoursMap[shiftId] || 5;
            shiftCount++;
          }
        }
      });
    });

    // 2. Tính số giờ làm thực tế từ chấm công
    const empAttRows = attendanceRows.filter((r) => r.employeeId === emp.id);
    let actualMin = 0;
    let nightHours = 0;
    let lateMin = 0;
    let earlyMin = 0;

    empAttRows.forEach((r) => {
      actualMin += r.actualMin || 0;
      if (r.isNight && r.actualMin > 0) {
        nightHours += Math.round((r.actualMin / 60) * 10) / 10;
      }
      lateMin += r.lateMin || 0;
      earlyMin += r.earlyMin || 0;
    });

    const actualHours = Math.round((actualMin / 60) * 10) / 10;
    const diffHours = Math.round((actualHours - scheduledHours) * 10) / 10;

    // 3. Tính lương
    const hourlyWage = emp.hourlyWage || 28000;
    const basePay = Math.round(actualHours * hourlyWage);
    // Ca đêm phụ cấp 20% lương giờ
    const surcharge = Math.round(nightHours * (hourlyWage * 0.2));
    // Thưởng ca trực mở cho nhân viên nhận ca mở (NV001 nhận ca thưởng 50.000đ khi ca đã kết thúc / có giờ làm)
    const openShiftBonus = emp.id === "NV001" && (actualHours > 0 || targetWeekMonday === "2026-10-26") ? 50000 : 0;
    const total = basePay + surcharge + openShiftBonus;

    return {
      id: emp.id,
      employeeId: emp.id,
      name: emp.name,
      roles: emp.roles || [emp.role || "Phục vụ"],
      roleTag: emp.roleTag || emp.roles?.[0] || emp.role || "Phục vụ",
      contract: emp.contract || "Toàn thời gian",
      hourlyWage,
      scheduledHours,
      actualHours,
      shiftCount,
      diffHours,
      nightHours,
      holidayHours: 0,
      lateMinutes: lateMin,
      earlyMinutes: earlyMin,
      basePay,
      surcharge,
      openShiftBonus,
      total,
      netSalary: total,
    };
  });

  const totals = {
    scheduledHours: Math.round(employeeRows.reduce((s, r) => s + r.scheduledHours, 0) * 10) / 10,
    actualHours: Math.round(employeeRows.reduce((s, r) => s + r.actualHours, 0) * 10) / 10,
    diffHours: Math.round(employeeRows.reduce((s, r) => s + r.diffHours, 0) * 10) / 10,
    nightHours: Math.round(employeeRows.reduce((s, r) => s + r.nightHours, 0) * 10) / 10,
    holidayHours: 0,
    basePay: employeeRows.reduce((s, r) => s + r.basePay, 0),
    surcharge: employeeRows.reduce((s, r) => s + r.surcharge, 0),
    openShiftBonus: employeeRows.reduce((s, r) => s + r.openShiftBonus, 0),
    total: employeeRows.reduce((s, r) => s + r.total, 0),
    payrollCost: employeeRows.reduce((s, r) => s + r.total, 0),
    shiftCount: employeeRows.reduce((s, r) => s + r.shiftCount, 0),
    totalShifts: employeeRows.reduce((s, r) => s + r.shiftCount, 0),
    completedShifts: attendanceRows.filter((r) =>
      r.status === "On-Time" || r.status === "Late" || r.status === "Early-Departure" || r.status === "Missing-Checkout"
    ).length,
    lateCount: attendanceRows.filter((r) => r.status === "Late").length,
    absentCount: attendanceRows.filter((r) => r.status === "Absent").length,
    totalEmployees: activeEmployees.length, // 7 nhân viên (6 đang làm + 1 tạm nghỉ)
    workingEmployeesCount: workingEmployees.length, // 6 nhân viên có ca
    employeeCount: workingEmployees.length, // 6 nhân viên có dòng trong bảng giờ làm/lương
  };

  return {
    rows: employeeRows,
    totals,
  };
}

export default {
  calculateSystemMetrics,
};
