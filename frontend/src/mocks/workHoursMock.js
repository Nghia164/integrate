/**
 * File: src/mocks/workHoursMock.js
 * Dữ liệu tổng hợp giờ làm việc mẫu (Static Mock Data)
 */

import { mockEmployees } from "./employeeMock.js";
import { STANDARD_ROLES } from "./shiftConfigMock.js";
import { pad, toISO, toVN, startOfDay, mondayOf, addDays } from "../lib/dateUtils.js";
import { calculateSystemMetrics } from "../lib/calcPayroll.js";
import { getMockAttendanceRows } from "./attendanceMock.js";

export { mockEmployees };
export const mockRoleTags = STANDARD_ROLES;



export function resolvePeriod({ from = "", to = "" } = {}) {
  const mon = mondayOf(new Date());
  return {
    label: "Tuần này",
    from: from || toISO(mon),
    to: to || toISO(addDays(mon, 6)),
  };
}



export const SHIFT_DEFS = {
  "Sáng": { start: "06:00", end: "12:00", night: false, multiplier: 1.0 },
  "Chiều": { start: "12:00", end: "17:00", night: false, multiplier: 1.0 },
  "Tối": { start: "17:00", end: "22:00", night: true, multiplier: 1.2 },
};
export const SHIFT_NAMES = Object.keys(SHIFT_DEFS);

export const WEEKLY_PATTERN = {
  NV001: { 0: "Sáng", 1: "Tối", 3: "Sáng", 5: "Tối", 6: "Sáng" },
  NV002: { 0: "Chiều", 2: "Tối", 4: "Chiều", 5: "Sáng", 6: "Chiều" },
  NV003: { 1: "Sáng", 2: "Sáng", 4: "Chiều", 6: "Tối" },
  NV004: { 0: "Tối", 3: "Tối", 4: "Sáng", 5: "Chiều" },
  NV005: { 2: "Chiều", 3: "Chiều", 5: "Sáng", 6: "Sáng" },
  NV007: { 0: "Sáng", 1: "Sáng", 2: "Chiều", 4: "Sáng", 5: "Chiều" },
  NV008: { 0: "Tối", 1: "Chiều", 2: "Tối", 3: "Tối", 4: "Tối", 6: "Tối" },
};

export const toMin = (hhmm) => {
  if (!hhmm || !String(hhmm).includes(":")) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

export const fmtMin = (min) => {
  if (min == null) return "—";
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
};

export function buildWorkHoursSummary(params = {}) {
  const from = params.from || "2026-10-26";
  const targetMon = toISO(mondayOf(new Date(from)));
  const { rows } = calculateSystemMetrics(targetMon);

  let filtered = rows;
  if (params.roleTag && params.roleTag !== "all") {
    filtered = filtered.filter((r) => r.roles?.includes(params.roleTag) || r.roleTag === params.roleTag);
  }
  if (params.employeeId && params.employeeId !== "all") {
    filtered = filtered.filter((r) => r.employeeId === params.employeeId);
  }

  return {
    rows: filtered,
    totals: {
      scheduledHours: Math.round(filtered.reduce((s, r) => s + r.scheduledHours, 0) * 10) / 10,
      actualHours: Math.round(filtered.reduce((s, r) => s + r.actualHours, 0) * 10) / 10,
      diffHours: Math.round(filtered.reduce((s, r) => s + r.diffHours, 0) * 10) / 10,
      nightHours: Math.round(filtered.reduce((s, r) => s + (r.nightHours || 0), 0) * 10) / 10,
      holidayHours: 0,
      otHours: 0,
      shiftCount: filtered.reduce((s, r) => s + r.shiftCount, 0),
    },
    periodLabel: "Tuần 26/10/2026 - 01/11/2026",
  };
}

export function buildWorkHoursDetail(employeeId) {
  const emp = mockEmployees.find((e) => e.id === employeeId) || mockEmployees[0];
  const attendanceRows = getMockAttendanceRows().filter((r) => r.employeeId === emp.id);
  const shifts = attendanceRows.map((r, idx) => ({
    id: r.id || `SH-${idx + 1}`,
    date: r.iso,
    shiftName: r.shiftName,
    scheduled: r.scheduled,
    scheduledHours: Math.round((r.scheduledMin / 60) * 10) / 10,
    actualIn: r.checkIn,
    actualOut: r.checkOut,
    actualHours: Math.round((r.actualMin / 60) * 10) / 10,
    lateMinutes: r.lateMin,
    earlyMinutes: r.earlyMin,
    otHours: 0,
    status: r.status,
  }));
  return {
    employee: emp,
    shifts,
    totals: {
      scheduledHours: Math.round(shifts.reduce((s, r) => s + r.scheduledHours, 0) * 10) / 10,
      actualHours: Math.round(shifts.reduce((s, r) => s + r.actualHours, 0) * 10) / 10,
      otHours: 0,
      lateMinutes: shifts.reduce((s, r) => s + r.lateMinutes, 0),
    },
  };
}

export const buildSummary = buildWorkHoursSummary;
export const buildDetail = buildWorkHoursDetail;
export const adjustShift = (id, payload) => ({ success: true, id, payload });
export const listShifts = () => [];

export {
  pad,
  toISO,
  toVN,
  startOfDay,
  mondayOf,
  addDays,
};

export default {
  mockRoleTags,
  SHIFT_DEFS,
  SHIFT_NAMES,
  WEEKLY_PATTERN,
  buildWorkHoursSummary,
  buildWorkHoursDetail,
  buildSummary,
  buildDetail,
  adjustShift,
};