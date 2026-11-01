/**
 * File: src/mocks/dashboardMock.js
 * Dữ liệu thống kê tổng quan Dashboard mẫu (Static Mock Data)
 */

import { getSavedSchedules, isScheduleConfirmed, getCurrentWeekLabel } from "./scheduleMock.js";
import { mockEmployees } from "./employeeMock.js";
import { getNow, mondayOf, toISO } from "../lib/dateUtils.js";
import { calculateSystemMetrics } from "../lib/calcPayroll.js";
import { buildAttendance } from "./attendanceMock.js";

export function buildDashboard({ from = "2026-10-26", to = "2026-11-01", roleTag = "all", shiftName = "all" } = {}) {
  const now = getNow();
  const currentMonIso = toISO(mondayOf(now));
  const targetMonIso = from ? toISO(mondayOf(new Date(from))) : currentMonIso;
  const isConfirmed = isScheduleConfirmed(targetMonIso);

  const metrics = calculateSystemMetrics(targetMonIso);
  const totalShifts = metrics.totals.totalShifts;
  const completedShifts = metrics.totals.completedShifts;
  const scheduledHours = metrics.totals.scheduledHours;
  const actualHours = metrics.totals.actualHours;
  const payrollCost = metrics.totals.payrollCost;
  const lateCount = metrics.totals.lateCount;
  const absentCount = metrics.totals.absentCount;
  const lateRate = completedShifts > 0 ? Math.round((lateCount / completedShifts) * 1000) / 10 : 0;
  const absentRate = totalShifts > 0 ? Math.round((absentCount / totalShifts) * 1000) / 10 : 0;
  const fillRequired = 25;
  const fillFilled = 23;
  const fillRate = Math.round((fillFilled / fillRequired) * 1000) / 10;
  const totalEmployees = 7;

  const cards = {
    totalShifts,
    completedShifts,
    scheduledHours,
    actualHours,
    payrollCost,
    lateCount,
    lateRate,
    absentCount,
    absentRate,
    fillRate,
    fillFilled,
    fillRequired,
    totalEmployees,
  };

  const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  let schedule = [];
  const activeEmployees = mockEmployees.filter((e) => e.status !== "Nghỉ việc");

  if (isConfirmed) {
    const sched = getSavedSchedules(targetMonIso);
    activeEmployees.forEach((emp) => {
      if (roleTag !== "all") {
        const empRoles = emp.roles || [emp.roleTag || emp.role];
        if (!empRoles.includes(roleTag)) return;
      }
      const shifts = dayKeys.map((d) => {
        const isMorning = sched[`morning_${d}`]?.assigned?.some((e) => e.id === emp.id);
        const isAfternoon = sched[`afternoon_${d}`]?.assigned?.some((e) => e.id === emp.id);
        const isEvening = sched[`evening_${d}`]?.assigned?.some((e) => e.id === emp.id);

        if (isMorning && (shiftName === "all" || shiftName === "Sáng")) return "Sáng";
        if (isAfternoon && (shiftName === "all" || shiftName === "Chiều")) return "Chiều";
        if (isEvening && (shiftName === "all" || shiftName === "Tối")) return "Tối";
        return null;
      });

      schedule.push({
        employee: emp.name,
        employeeId: emp.id,
        shifts,
      });
    });
  }

  const weekLabel = getCurrentWeekLabel(new Date(targetMonIso));

  const understaffed = [
    {
      id: "UND-001",
      date: "Thứ 7, 31/10/2026",
      shift: "Ca sáng",
      roleTag: "Pha chế",
      required: 2,
      assigned: 1,
      missing: 1,
      resolved: false,
    },
    {
      id: "UND-002",
      date: "Chủ nhật, 01/11/2026",
      shift: "Ca chiều",
      roleTag: "Thu ngân",
      required: 1,
      assigned: 0,
      missing: 1,
      resolved: false,
    },
  ];

  const hoursPerEmployee = activeEmployees.map((emp) => {
    const r = metrics.rows.find((row) => row.employeeId === emp.id);
    return {
      employeeId: emp.id,
      name: emp.name,
      scheduled: r ? r.scheduledHours : 0,
      actual: r ? r.actualHours : 0,
      count: r ? r.shiftCount : 0,
    };
  });

  const attData = buildAttendance();

  return {
    weekLabel,
    schedule,
    periodLabel: "Tuần này (26/10 - 01/11/2026)",
    from: from || "2026-10-26",
    to: to || "2026-11-01",
    empty: false,
    cards,
    total: totalShifts,
    totalEmployees,
    completedTotal: completedShifts,
    lateCount,
    absentCount,
    payrollCost,
    fillRequired,
    fillFilled,
    hoursPerEmployee,
    sumHoursScheduled: scheduledHours,
    sumHoursActual: actualHours,
    costPerBucket: [
      { label: "26/10", cost: Math.round(payrollCost * 0.16) },
      { label: "27/10", cost: Math.round(payrollCost * 0.14) },
      { label: "28/10", cost: Math.round(payrollCost * 0.18) },
      { label: "29/10", cost: Math.round(payrollCost * 0.16) },
      { label: "30/10", cost: Math.round(payrollCost * 0.18) },
      { label: "31/10", cost: Math.round(payrollCost * 0.18) },
      { label: "01/11", cost: 0 },
    ],
    attendance: [
      { name: "On-Time", value: attData.counts["On-Time"] },
      { name: "Late", value: attData.counts["Late"] },
      { name: "Early-Departure", value: attData.counts["Early-Departure"] },
      { name: "Absent", value: attData.counts["Absent"] },
      { name: "Missing-Checkout", value: attData.counts["Missing-Checkout"] },
      { name: "On-Leave", value: attData.counts["On-Leave"] },
      { name: "In-Progress", value: attData.counts["In-Progress"] },
      { name: "Upcoming", value: attData.counts["Upcoming"] },
    ],
    fillByShift: [
      { shift: "Sáng", required: 14, filled: 14, rate: 100 },
      { shift: "Chiều", required: 14, filled: 13, rate: 93 },
      { shift: "Tối", required: 7, filled: 6, rate: 86 },
    ],
    understaffed,
    todo: {
      pendingLeave: 2,
      pendingExchange: 1,
      understaffed: understaffed.length,
    },
    todos: [
      { id: "TDO-01", type: "leave", title: "2 đơn xin nghỉ phép chờ duyệt", link: "/manager/leave" },
      { id: "TDO-02", type: "exchange", title: "1 yêu cầu đổi ca chờ phê duyệt", link: "/manager/shift-exchange" },
      { id: "TDO-03", type: "openShift", title: "1 ca trực mở chưa có nhân viên nhận", link: "/manager/open-shifts" },
    ],
    suggestions: [
      "Định biên ca Tối Thứ 6 có nguy cơ thiếu 1 Thu ngân, khuyến nghị mở thêm Open Shift.",
      "Tỷ lệ đi làm đúng giờ tuần này đạt 88%, tăng 4% so với tuần trước.",
    ],
  };
}

export default {
  buildDashboard,
};