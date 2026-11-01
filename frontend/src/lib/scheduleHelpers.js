/**
 * File: src/lib/scheduleHelpers.js
 * Tầng: Lib / Pure Helpers
 * Hàm thuần tính toán ma trận lịch tuần cho Staff (US13) và đối soát với Manager
 */

export const STANDARD_SHIFTS = [
  { id: "morning", code: "morning", name: "Sáng", startTime: "06:00", endTime: "12:00", hours: 6 },
  { id: "afternoon", code: "afternoon", name: "Chiều", startTime: "12:00", endTime: "17:00", hours: 5 },
  { id: "evening", code: "evening", name: "Tối", startTime: "17:00", endTime: "22:00", hours: 5 },
];

export const DAY_IDS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/**
 * Chuẩn hóa shiftId về đúng 1 trong 3 ca chuẩn: morning | afternoon | evening
 */
export function normalizeShiftId(shift) {
  if (!shift) return null;
  const sid = String(shift.shiftId || shift.code || shift.id || "").toLowerCase();
  if (sid === "morning" || sid === "shift_1") return "morning";
  if (sid === "afternoon" || sid === "shift_2") return "afternoon";
  if (sid === "evening" || sid === "shift_3") return "evening";

  if (sid.includes("morning") || sid.includes("sáng") || sid.includes("sang")) return "morning";
  if (sid.includes("afternoon") || sid.includes("chiều") || sid.includes("chieu")) return "afternoon";
  if (sid.includes("evening") || sid.includes("tối") || sid.includes("toi") || sid.includes("night") || sid.includes("đêm")) return "evening";

  const st = String(shift.startTime || shift.start || "");
  if (st.startsWith("06") || st.startsWith("07") || st.startsWith("08")) return "morning";
  if (st.startsWith("12") || st.startsWith("13") || st.startsWith("14")) return "afternoon";
  if (st.startsWith("17") || st.startsWith("18") || st.startsWith("22")) return "evening";

  const sname = String(shift.shiftName || shift.name || "").toLowerCase();
  if (sname.includes("sáng") || sname.includes("sang")) return "morning";
  if (sname.includes("chiều") || sname.includes("chieu")) return "afternoon";
  if (sname.includes("tối") || sname.includes("toi")) return "evening";

  return null;
}

/**
 * Xây dựng ma trận ca làm việc tuần (Days x Shifts) cho nhân viên
 * @param {Object|Array} scheduleData Dữ liệu trả về từ getMySchedule hoặc mảng ca
 * @param {string} [empId] Mã nhân viên (ví dụ: 'NV001')
 * @returns {Object} Ma trận ca và thống kê
 */
export function buildWeekCells(scheduleData, empId) {
  const rawShifts = Array.isArray(scheduleData)
    ? scheduleData
    : scheduleData?.shifts || scheduleData?.myShifts || [];

  // Lọc đúng ca của nhân viên
  const myShifts = rawShifts.filter((s) => {
    if (empId && s.employeeId && s.employeeId !== empId) return false;
    return true;
  });

  // Bản đồ lưu trữ ô: key = `${dayKey}_${canonicalShiftId}`
  const cellMap = new Map();
  let shiftCount = 0;
  let totalHours = 0;
  const assignedSlots = [];

  myShifts.forEach((s) => {
    const cShiftId = normalizeShiftId(s);
    if (!cShiftId) return;

    // Chuẩn hóa tên và giờ hiển thị theo đúng ca của nó
    const def = STANDARD_SHIFTS.find((d) => d.id === cShiftId);
    const resolvedName = def?.name || s.shiftName || "Ca";
    const resolvedStart = s.startTime || def?.startTime || "--:--";
    const resolvedEnd = s.endTime || def?.endTime || "--:--";
    const hours = Number(s.hours) || def?.hours || 0;

    const normalizedShift = {
      ...s,
      canonicalShiftId: cShiftId,
      shiftName: resolvedName,
      startTime: resolvedStart,
      endTime: resolvedEnd,
      hours,
    };

    if (s.date) {
      cellMap.set(`${s.date}_${cShiftId}`, normalizedShift);
    }
    if (s.dateIso) {
      cellMap.set(`${s.dateIso}_${cShiftId}`, normalizedShift);
    }
    if (s.dayId) {
      cellMap.set(`${s.dayId}_${cShiftId}`, normalizedShift);
    }

    shiftCount += 1;
    totalHours += hours;
    assignedSlots.push({
      id: s.id,
      dayId: s.dayId,
      date: s.date || s.dateIso,
      shiftId: cShiftId,
      shiftName: resolvedName,
      startTime: resolvedStart,
      endTime: resolvedEnd,
      hours,
      shift: normalizedShift,
    });
  });

  return {
    shiftDefs: STANDARD_SHIFTS,
    cellMap,
    getCell: (dateOrDayId, shiftId) => {
      const cId = typeof shiftId === "object" ? normalizeShiftId(shiftId) : normalizeShiftId({ shiftId });
      return cellMap.get(`${dateOrDayId}_${cId}`) || null;
    },
    assignedSlots,
    stats: {
      shiftCount,
      totalHours,
    },
  };
}

export default {
  STANDARD_SHIFTS,
  DAY_IDS,
  normalizeShiftId,
  buildWeekCells,
};
