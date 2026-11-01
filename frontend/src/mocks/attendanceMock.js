/**
 * File: src/mocks/attendanceMock.js
 * Dữ liệu chấm công và đối soát mẫu (Static Mock Data)
 */

import { mockEmployees } from "./employeeMock.js";
import { mondayOf, addDays, toISO, toVN, getNow } from "../lib/dateUtils.js";

export const STATUSES = [
  "On-Time",
  "Late",
  "Early-Departure",
  "Absent",
  "Missing-Checkout",
  "On-Leave",
  "In-Progress",
  "Upcoming",
];

export const ATTENDANCE_TEMPLATE = [
  // Thứ 2 (dayIndex: 0)
  { id: "ATT-001", dayIndex: 0, employeeId: "NV001", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 360, checkIn: "06:00", checkOut: "12:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-002", dayIndex: 0, employeeId: "NV002", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 350, checkIn: "06:10", checkOut: "12:00", lateMin: 10, earlyMin: 0, status: "Late", isNight: false, coefficient: 1.0 },
  { id: "ATT-003", dayIndex: 0, employeeId: "NV005", shiftName: "Ca chiều", shiftId: "afternoon", scheduled: "12:00 - 17:00", scheduledMin: 300, actualMin: 270, checkIn: "12:00", checkOut: "16:30", lateMin: 0, earlyMin: 30, status: "Early-Departure", isNight: false, coefficient: 1.0 },
  { id: "ATT-004", dayIndex: 0, employeeId: "NV007", shiftName: "Ca chiều", shiftId: "afternoon", scheduled: "12:00 - 17:00", scheduledMin: 300, actualMin: 300, checkIn: "12:00", checkOut: "17:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },

  // Thứ 3 (dayIndex: 1)
  { id: "ATT-005", dayIndex: 1, employeeId: "NV007", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 360, checkIn: "06:00", checkOut: "", lateMin: 0, earlyMin: 0, status: "Missing-Checkout", isNight: false, coefficient: 1.0 },
  { id: "ATT-006", dayIndex: 1, employeeId: "NV008", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 360, checkIn: "06:00", checkOut: "12:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-007", dayIndex: 1, employeeId: "NV003", shiftName: "Ca chiều", shiftId: "afternoon", scheduled: "12:00 - 17:00", scheduledMin: 300, actualMin: 0, checkIn: "", checkOut: "", lateMin: 0, earlyMin: 0, status: "Absent", isNight: false, coefficient: 1.0 },

  // Thứ 4 (dayIndex: 2)
  { id: "ATT-008", dayIndex: 2, employeeId: "NV002", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 360, checkIn: "06:00", checkOut: "12:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-009", dayIndex: 2, employeeId: "NV003", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 0, checkIn: "", checkOut: "", lateMin: 0, earlyMin: 0, status: "On-Leave", isNight: false, coefficient: 1.0 },
  { id: "ATT-010", dayIndex: 2, employeeId: "NV005", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 360, checkIn: "06:00", checkOut: "12:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-011", dayIndex: 2, employeeId: "NV001", shiftName: "Ca chiều", shiftId: "afternoon", scheduled: "12:00 - 17:00", scheduledMin: 300, actualMin: 300, checkIn: "12:00", checkOut: "17:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },

  // Thứ 5 (dayIndex: 3)
  { id: "ATT-012", dayIndex: 3, employeeId: "NV007", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 360, checkIn: "06:00", checkOut: "12:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-013", dayIndex: 3, employeeId: "NV005", shiftName: "Ca chiều", shiftId: "afternoon", scheduled: "12:00 - 17:00", scheduledMin: 300, actualMin: 300, checkIn: "12:00", checkOut: "17:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-014", dayIndex: 3, employeeId: "NV008", shiftName: "Ca chiều", shiftId: "afternoon", scheduled: "12:00 - 17:00", scheduledMin: 300, actualMin: 300, checkIn: "12:00", checkOut: "17:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-015", dayIndex: 3, employeeId: "NV003", shiftName: "Ca tối", shiftId: "evening", scheduled: "17:00 - 22:00", scheduledMin: 300, actualMin: 300, checkIn: "17:00", checkOut: "22:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: true, coefficient: 1.2 },

  // Thứ 6 (dayIndex: 4)
  { id: "ATT-016", dayIndex: 4, employeeId: "NV001", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 360, checkIn: "06:00", checkOut: "12:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-017", dayIndex: 4, employeeId: "NV002", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 360, checkIn: "06:00", checkOut: "12:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-018", dayIndex: 4, employeeId: "NV003", shiftName: "Ca chiều", shiftId: "afternoon", scheduled: "12:00 - 17:00", scheduledMin: 300, actualMin: 300, checkIn: "12:00", checkOut: "17:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-019", dayIndex: 4, employeeId: "NV005", shiftName: "Ca tối", shiftId: "evening", scheduled: "17:00 - 22:00", scheduledMin: 300, actualMin: 300, checkIn: "17:00", checkOut: "22:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: true, coefficient: 1.2 },

  // Thứ 7 (dayIndex: 5)
  { id: "ATT-020", dayIndex: 5, employeeId: "NV002", shiftName: "Ca sáng", shiftId: "morning", scheduled: "06:00 - 12:00", scheduledMin: 360, actualMin: 360, checkIn: "06:00", checkOut: "12:00", lateMin: 0, earlyMin: 0, status: "On-Time", isNight: false, coefficient: 1.0 },
  { id: "ATT-021", dayIndex: 5, employeeId: "NV001", shiftName: "Ca chiều", shiftId: "afternoon", scheduled: "12:00 - 17:00", scheduledMin: 300, actualMin: 0, checkIn: "", checkOut: "", lateMin: 0, earlyMin: 0, status: "Upcoming", isNight: false, coefficient: 1.0, shift_id: "shift_2026-10-26_T7_afternoon_NV001" },
  { id: "ATT-022", dayIndex: 5, employeeId: "NV007", shiftName: "Ca chiều", shiftId: "afternoon", scheduled: "12:00 - 17:00", scheduledMin: 300, actualMin: 0, checkIn: "", checkOut: "", lateMin: 0, earlyMin: 0, status: "Upcoming", isNight: false, coefficient: 1.0 },
  { id: "ATT-023", dayIndex: 5, employeeId: "NV005", shiftName: "Ca tối", shiftId: "evening", scheduled: "17:00 - 22:00", scheduledMin: 300, actualMin: 0, checkIn: "", checkOut: "", lateMin: 0, earlyMin: 0, status: "Upcoming", isNight: true, coefficient: 1.2 },
  { id: "ATT-024", dayIndex: 5, employeeId: "NV008", shiftName: "Ca tối", shiftId: "evening", scheduled: "17:00 - 22:00", scheduledMin: 300, actualMin: 0, checkIn: "", checkOut: "", lateMin: 0, earlyMin: 0, status: "Upcoming", isNight: true, coefficient: 1.2 },
];

export function generateAttendanceRows(weekStartMonday, targetNow = getNow()) {
  const mon = weekStartMonday ? mondayOf(new Date(weekStartMonday)) : mondayOf(targetNow);
  const monIso = toISO(mon);
  const isDefaultDemoBaseline =
    monIso === "2026-10-26" &&
    targetNow.getFullYear() === 2026 &&
    targetNow.getMonth() === 9 &&
    targetNow.getDate() === 31;

  return ATTENDANCE_TEMPLATE.map((tpl) => {
    const shiftDate = addDays(mon, tpl.dayIndex);
    const iso = toISO(shiftDate);
    const date = toVN(iso);
    const emp = mockEmployees.find((e) => e.id === tpl.employeeId);

    if (isDefaultDemoBaseline) {
      return {
        id: tpl.id,
        shift_id: tpl.shift_id || `shift_${monIso}_${tpl.dayIndex}_${tpl.shiftId}_${tpl.employeeId}`,
        iso,
        date,
        employeeId: tpl.employeeId,
        employeeName: emp?.name || tpl.employeeId,
        shiftName: tpl.shiftName,
        scheduled: tpl.scheduled,
        scheduledMin: tpl.scheduledMin,
        actualMin: tpl.actualMin,
        checkIn: tpl.checkIn,
        checkOut: tpl.checkOut,
        lateMin: tpl.lateMin,
        earlyMin: tpl.earlyMin,
        status: tpl.status,
        adjusted: false,
        locked: false,
        isNight: tpl.isNight,
        isHoliday: false,
        coefficient: tpl.coefficient,
      };
    }

    const [startH, startM] = tpl.scheduled.split(" - ")[0].split(":").map(Number);
    const [endH, endM] = tpl.scheduled.split(" - ")[1].split(":").map(Number);
    const shiftStart = new Date(shiftDate);
    shiftStart.setHours(startH, startM, 0, 0);
    const shiftEnd = new Date(shiftDate);
    shiftEnd.setHours(endH, endM, 0, 0);

    const hasEnded = shiftEnd <= targetNow || (shiftEnd.getTime() - 15 * 60000) <= targetNow.getTime();
    const isOngoing = !hasEnded && shiftStart <= targetNow;

    let status;
    let actualMin;
    let checkIn;
    let checkOut;
    let lateMin = 0;
    let earlyMin = 0;

    if (hasEnded) {
      status = tpl.status;
      actualMin = tpl.actualMin;
      checkIn = tpl.checkIn;
      checkOut = tpl.checkOut;
      lateMin = tpl.lateMin;
      earlyMin = tpl.earlyMin;
    } else if (isOngoing) {
      status = "In-Progress";
      checkIn = tpl.checkIn || "06:00";
      checkOut = "";
      actualMin = 0;
    } else {
      status = "Upcoming";
      actualMin = 0;
      checkIn = "";
      checkOut = "";
    }

    return {
      id: tpl.id,
      shift_id: tpl.shift_id || `shift_${monIso}_${tpl.dayIndex}_${tpl.shiftId}_${tpl.employeeId}`,
      iso,
      date,
      employeeId: tpl.employeeId,
      employeeName: emp?.name || tpl.employeeId,
      shiftName: tpl.shiftName,
      scheduled: tpl.scheduled,
      scheduledMin: tpl.scheduledMin,
      actualMin,
      checkIn,
      checkOut,
      lateMin,
      earlyMin,
      status,
      adjusted: false,
      locked: false,
      isNight: tpl.isNight,
      isHoliday: false,
      coefficient: tpl.coefficient,
    };
  });
}

let generatedAttendanceCache = null;
let lastCacheKey = null;

export function getMockAttendanceRows(weekMonday) {
  const targetNow = getNow();
  const mon = weekMonday || toISO(mondayOf(targetNow));
  const cacheKey = `${mon}_${targetNow.toISOString()}`;
  if (!generatedAttendanceCache || lastCacheKey !== cacheKey) {
    generatedAttendanceCache = generateAttendanceRows(mon, targetNow);
    lastCacheKey = cacheKey;
  }
  return JSON.parse(JSON.stringify(generatedAttendanceCache));
}

export function buildAttendance({ from, employeeId = "all", status = "all" } = {}) {
  const weekStart = from || toISO(mondayOf(getNow()));
  const allRows = getMockAttendanceRows(weekStart);
  let filtered = [...allRows];
  if (employeeId !== "all") {
    filtered = filtered.filter((r) => r.employeeId === employeeId);
  }
  if (status !== "all") {
    filtered = filtered.filter((r) => r.status === status);
  }

  const counts = {
    total: allRows.length,
    completedTotal: allRows.filter(
      (r) =>
        r.status === "On-Time" ||
        r.status === "Late" ||
        r.status === "Early-Departure" ||
        r.status === "Missing-Checkout" ||
        r.status === "Absent"
    ).length,
    "On-Time": allRows.filter((r) => r.status === "On-Time").length,
    Late: allRows.filter((r) => r.status === "Late").length,
    "Early-Departure": allRows.filter((r) => r.status === "Early-Departure").length,
    Absent: allRows.filter((r) => r.status === "Absent").length,
    "Missing-Checkout": allRows.filter((r) => r.status === "Missing-Checkout").length,
    "On-Leave": allRows.filter((r) => r.status === "On-Leave").length,
    "In-Progress": allRows.filter((r) => r.status === "In-Progress").length,
    Upcoming: allRows.filter((r) => r.status === "Upcoming").length,
  };

  const monDate = new Date(weekStart);
  const sunDate = addDays(monDate, 6);

  return {
    periodLabel: `Tuần ${toVN(toISO(monDate))} - ${toVN(toISO(sunDate))}`,
    from: toISO(monDate),
    to: toISO(sunDate),
    counts,
    rows: filtered,
  };
}

export function adjustRecord(id, payload) {
  // BACKEND: Cập nhật giờ chấm công và lưu vết kiểm toán vào attendance_adjustments
  const allRows = getMockAttendanceRows();
  const row = allRows.find((r) => r.id === id);
  if (row) {
    if (payload.in) row.checkIn = payload.in;
    if (payload.out) row.checkOut = payload.out;
    row.adjusted = true;
    row.adjustReason = payload.reason;
  }
  return { success: true, row };
}

export function recordHistory() {
  return [
    {
      at: "2026-10-26T12:05:00Z",
      by: "Quản lý Cửa Hàng",
      oldIn: "06:10",
      newIn: "06:05",
      reason: "Nhân viên báo máy quét vân tay lỗi",
    },
  ];
}

// Staff self-service attendance mock state
const staffCheckinState = {
  isCheckedIn: false,
  checkInTime: null,
  shift: {
    shiftName: "Ca sáng",
    time: "06:00 - 12:00",
    date: "Hôm nay, 31/10/2026",
  },
};

export function checkInStaffMock(data) {
  // BACKEND: Ghi nhận check-in của nhân viên kèm GPS/Wi-Fi
  staffCheckinState.isCheckedIn = true;
  const now = getNow();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  staffCheckinState.checkInTime = timeStr;
  const targetShiftId = data?.shift_id || data?.shiftId;
  const empId = data?.employeeId || "NV001";
  const allRows = getMockAttendanceRows();
  const row = allRows.find(
    (r) =>
      (targetShiftId && (r.shift_id === targetShiftId || r.id === targetShiftId)) ||
      (r.employeeId === empId && (r.iso === toISO(now) || r.iso === "2026-10-31")),
  );
  if (row) {
    row.checkIn = timeStr;
    row.status = "In-Progress";
  }
  return { ok: true, success: true, serverTime: timeStr, ...staffCheckinState };
}

export function checkOutStaffMock(data) {
  // BACKEND: Ghi nhận check-out của nhân viên
  staffCheckinState.isCheckedIn = false;
  const now = getNow();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const targetShiftId = data?.shift_id || data?.shiftId;
  const empId = data?.employeeId || "NV001";
  const allRows = getMockAttendanceRows();
  const row = allRows.find(
    (r) =>
      (targetShiftId && (r.shift_id === targetShiftId || r.id === targetShiftId)) ||
      (r.employeeId === empId && (r.iso === toISO(now) || r.iso === "2026-10-31")),
  );
  if (row) {
    row.checkOut = timeStr;
    row.status = "On-Time";
    row.actualMin = row.scheduledMin || 300;
  }
  return { ok: true, success: true, serverTime: timeStr, workedMinutes: 300 };
}

export function getStaffAttendanceStatus(empId) {
  const allRows = getMockAttendanceRows();
  const rawList = empId
    ? allRows.filter((r) => r.employeeId === empId)
    : allRows;
  const records = rawList.map((r) => ({
    ...r,
    shift_id: r.id,
    check_in_at: r.checkIn ? `${r.iso}T${r.checkIn}:00` : null,
    check_out_at: r.checkOut ? `${r.iso}T${r.checkOut}:00` : null,
    late_minutes: r.lateMin || 0,
    early_minutes: r.earlyMin || 0,
    total_working_minutes: r.actualMin || 0,
    shift: {
      id: r.id,
      shift_name: r.shiftName,
      shiftName: r.shiftName,
      start_time: r.scheduled?.split(" - ")[0] || "06:00",
      end_time: r.scheduled?.split(" - ")[1] || "12:00",
      startTime: r.scheduled?.split(" - ")[0] || "06:00",
      endTime: r.scheduled?.split(" - ")[1] || "12:00",
      date: r.iso,
    },
  }));
  return {
    ...staffCheckinState,
    records,
  };
}

export function submitExplanationMock(payload) {
  // BACKEND: Nộp giải trình chấm công vào bảng attendance_explanations
  return { success: true, payload };
}

export function listMyExplanationsMock() {
  return [];
}

export function listExplanationsForManagerMock() {
  return [];
}

export function approveExplanationMock(id) {
  // BACKEND: Quản lý phê duyệt giải trình chấm công
  return { success: true, id };
}

export function rejectExplanationMock(id, reason) {
  // BACKEND: Quản lý từ chối giải trình chấm công
  return { success: true, id, reason };
}


export const createMockCheckIn = (data) => checkInStaffMock(data);
export const createMockCheckOut = (data) => checkOutStaffMock(data);
export const getMockAttendance = (params) => {
  const empId = typeof params === "string" ? params : params?.employeeId;
  return getStaffAttendanceStatus(empId);
};
export const getMockAttendanceConfig = () => ({
  allowedRadiusMeters: 100,
  officeCoords: { lat: 10.7769, lng: 106.7009 },
  photoRequired: true,
  wifiBssid: "00:11:22:33:44:55",
});
export const submitExplanation = (payload) => submitExplanationMock(payload);
export const listMyExplanations = () => listMyExplanationsMock();
export const cancelExplanation = (id) => ({ success: true, id });
export const listExplanationsForManager = () => listExplanationsForManagerMock();
export const approveExplanation = (id) => approveExplanationMock(id);
export const rejectExplanation = (id, reason) => rejectExplanationMock(id, reason);
export const getAttendanceRecordHistory = (id) => recordHistory(id);
export const adjustMockAttendance = (id, patch) => adjustRecord(id, patch);

export default {
  STATUSES,
  buildAttendance,
  getMockAttendanceRows,
  adjustRecord,
  recordHistory,
  checkInStaffMock,
  checkOutStaffMock,
  getStaffAttendanceStatus,
  submitExplanationMock,
  listMyExplanationsMock,
  listExplanationsForManagerMock,
  approveExplanationMock,
  rejectExplanationMock,
  createMockCheckIn,
  createMockCheckOut,
  getMockAttendance,
  getMockAttendanceConfig,
  submitExplanation,
  listMyExplanations,
  cancelExplanation,
  listExplanationsForManager,
  approveExplanation,
  rejectExplanation,
  getAttendanceRecordHistory,
  adjustMockAttendance,
};