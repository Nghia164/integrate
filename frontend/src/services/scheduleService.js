// =============================================================================
// File: src/services/scheduleService.js
// Tầng: Dịch vụ dữ liệu (Service / Schedule)
// Nghiệp vụ: Lịch làm việc tuần (Manager - US11, US12) & Xem lịch cá nhân (Staff - US13)
// =============================================================================

import {
  employeeRoster,
  getEmployeeById,
  getWeekDays,
  getCurrentWeekLabel,
  initialDays,
  initialShiftDemands,
  initialConstraints,
  DAILY_SHIFT_REQUIREMENTS,
  generateInitialSchedules,
  getSavedSchedules,
  saveSchedules,
  confirmSchedule,
  isScheduleConfirmed,
  getFutureShiftsForEmployee,
  freeFutureShiftsForEmployee,
  restoreEmployeeShiftInSchedule,
  getShiftInfo,
  roleBadgeClass,
  mergeConfigConstraints,
  mergeConfigShifts,
  WEEK_LABEL,
} from "../mocks/scheduleMock.js";
import { getLeaveRequests } from "../mocks/leaveMock.js";
import { getOpenShifts } from "./openShiftService.js";
import { WEEKLY_PATTERN } from "../mocks/workHoursMock.js";
import { mondayOf, addDays, toISO, toVN, startOfDay, getNow } from "../lib/dateUtils.js";
import { calculateScheduleStats } from "../lib/shiftColors.js";
import { getCurrentUser } from "./authService.js";

export {
  calculateScheduleStats,
  employeeRoster,
  getEmployeeById,
  getWeekDays,
  getCurrentWeekLabel,
  initialDays,
  initialShiftDemands,
  initialConstraints,
  DAILY_SHIFT_REQUIREMENTS,
  generateInitialSchedules,
  getSavedSchedules,
  saveSchedules,
  confirmSchedule,
  isScheduleConfirmed,
  getFutureShiftsForEmployee,
  freeFutureShiftsForEmployee,
  restoreEmployeeShiftInSchedule,
  getShiftInfo,
  roleBadgeClass,
  mergeConfigConstraints,
  mergeConfigShifts,
  WEEK_LABEL,
  WEEKLY_PATTERN,
  mondayOf,
  addDays,
  toISO,
  toVN,
  getNow,
};

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

/** Lấy toàn bộ dữ liệu bảng lịch làm việc tuần (Manager) */
export async function getScheduleBoard(weekKey) {
  await delay(100);
  const schedules = getSavedSchedules();
  return {
    weekKey: weekKey || WEEK_LABEL,
    schedules,
    employees: employeeRoster,
    days: initialDays,
    demands: initialShiftDemands,
    constraints: initialConstraints,
  };
}

/** Lưu bản nháp lịch làm việc tuần */
export async function saveScheduleDraft(schedules, weekMonday = null) {
  // BACKEND: Lưu bản nháp lịch phân ca tuần vào bảng schedules với status = DRAFT
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw new Error("Chỉ Quản lý mới có quyền lưu bản nháp lịch làm việc.");
  }
  await delay(100);
  saveSchedules(schedules, weekMonday);
  return { ok: true, schedules };
}

/** Công bố lịch làm việc chính thức (Official) */
export async function publishSchedule(schedules, weekMonday = null) {
  // BACKEND: Chuyển trạng thái lịch tuần thành OFFICIAL/PUBLISHED, gửi thông báo push/email tới toàn bộ nhân viên có ca làm
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw new Error("Chỉ Quản lý mới có quyền công bố lịch làm việc.");
  }
  await delay(100);
  confirmSchedule(schedules, weekMonday);
  return { ok: true, status: "OFFICIAL", schedules };
}

/** Lắng nghe thay đổi dữ liệu lịch làm việc (No-op sau khi gỡ db.js) */
export const subscribeSchedule = () => () => {};

// ---------- API giả lập tương thích ----------
export const generateSchedule = async () => {
  // BACKEND: Chạy thuật toán lập lịch tối ưu (Constraint Programming / OR-Tools) trên máy chủ
  await delay(200);
  return { ok: true, schedules: getSavedSchedules() };
};



export const getSchedule = async (params) => {
  return getScheduleBoard(params?.weekMonday);
};

export const updateShift = async (id, data) => {
  // BACKEND: Cập nhật phân công ca trong bảng schedules
  return { id, ...data };
};

export const applySchedule = async (data) => {
  // BACKEND: Áp dụng lịch tự động vào lịch tuần
  return { ok: true, ...data };
};

/**
 * Chuyển đổi một ca làm việc thành định dạng Event chuẩn của FullCalendar
 */
export function shiftToCalendarEvent(shift) {
  const [sh, sm] = (shift.startTime || "06:00").split(":");
  const [eh, em] = (shift.endTime || "12:00").split(":");
  const start = `${shift.date}T${sh.padStart(2, "0")}:${sm.padStart(2, "0")}:00`;
  const end = `${shift.date}T${eh.padStart(2, "0")}:${em.padStart(2, "0")}:00`;

  return {
    id: shift.id,
    title: `Ca ${shift.shiftName}: ${shift.startTime} – ${shift.endTime}`,
    start,
    end,
    backgroundColor: "transparent",
    borderColor: "transparent",
    extendedProps: {
      ...shift,
      isLeave: false,
    },
  };
}

/**
 * Chuyển đổi một đơn nghỉ phép đã duyệt thành Event của FullCalendar
 */
export function leaveToCalendarEvent(leave) {
  return [
    {
      id: `leave_bg_${leave.id}`,
      title: "Nghỉ phép",
      start: leave.isoDate,
      allDay: true,
      display: "background",
      backgroundColor: "#F5F3FF",
      extendedProps: {
        isLeave: true,
        isBackground: true,
        ...leave,
      },
    },
    {
      id: `leave_item_${leave.id}`,
      title: "🏖️ Nghỉ phép",
      start: leave.isoDate,
      allDay: true,
      backgroundColor: "#EDE9FE",
      borderColor: "#DDD6FE",
      textColor: "#6B21A8",
      extendedProps: {
        isLeave: true,
        ...leave,
      },
    },
  ];
}

/**
 * Lấy lịch làm việc của nhân viên đăng nhập (US13 - Staff)
 * Đọc trực tiếp từ kho SSOT getSavedSchedules và lọc theo employeeId
 */
export async function getMySchedule({ week_start, employeeId, currentUserId } = {}) {
  const currentUser = getCurrentUser();
  const effectiveUserId = currentUserId || currentUser?.employeeId || currentUser?.id || "NV001";
  const targetEmpId = employeeId || effectiveUserId;

  if (
    effectiveUserId &&
    targetEmpId &&
    effectiveUserId !== targetEmpId &&
    !String(effectiveUserId).startsWith("QL") &&
    effectiveUserId !== "manager" &&
    currentUser?.role !== "manager"
  ) {
    throw new Error("Không đủ quyền truy cập lịch của nhân viên khác.");
  }

  await delay(100);
  const now = getNow();
  const currentMonday = mondayOf(startOfDay(now));
  const currentMondayIso = toISO(currentMonday);
  const targetMondayIso = week_start || currentMondayIso;
  const targetMonday = new Date(targetMondayIso);

  const published = isScheduleConfirmed(targetMondayIso);
  const isManager = currentUser?.role === "manager" || String(effectiveUserId).startsWith("QL") || effectiveUserId === "manager";

  const sunday = addDays(targetMonday, 6);
  const weekLabel = `Tuần ${toVN(targetMondayIso)} – ${toVN(toISO(sunday))}`;
  const todayIso = toISO(now);

  const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
  const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const days = dayKeys.map((id, index) => {
    const d = addDays(targetMonday, index);
    const dIso = toISO(d);
    return {
      id,
      dayIndex: index,
      dayName: dayNames[index],
      iso: dIso,
      dateIso: dIso,
      dateVn: toVN(dIso).slice(0, 5),
      label: id,
      isToday: dIso === todayIso,
    };
  });

  // Nhân viên không thấy lịch nháp (chưa công bố)
  if (!published && !isManager) {
    return {
      weekStart: targetMondayIso,
      weekLabel,
      published: false,
      days,
      shifts: [],
      myShifts: [],
      allCoworkerShifts: [],
      openShifts: [],
      approvedLeaves: [],
      approvedLeaveDates: [],
      calendarEvents: [],
      stats: {
        totalHours: 0,
        contractHours: 40,
        shiftCount: 0,
        openShiftCount: 0,
        nextShift: null,
        published: false,
      },
      todayShift: null,
      todaySummary: {
        todayDateIso: todayIso,
        todayShift: null,
        todayStatus: {
          hasShift: false,
          label: "Chưa có lịch làm việc được công bố",
          tone: "neutral",
          canCheckIn: false,
        },
      },
    };
  }

  const saved = getSavedSchedules(targetMondayIso);
  const shiftMeta = {
    morning: { shiftName: "Sáng", startTime: "06:00", endTime: "12:00", hours: 6 },
    afternoon: { shiftName: "Chiều", startTime: "12:00", endTime: "17:00", hours: 5 },
    evening: { shiftName: "Tối", startTime: "17:00", endTime: "22:00", hours: 5 },
  };

  const myShifts = [];
  const allCoworkerShifts = [];

  days.forEach((day) => {
    ["morning", "afternoon", "evening"].forEach((shiftId) => {
      const slotKey = `${shiftId}_${day.id}`;
      const slot = saved[slotKey];
      const meta = shiftMeta[shiftId];
      if (slot && Array.isArray(slot.assigned)) {
        slot.assigned.forEach((emp) => {
          const shiftItem = {
            id: `shift_${targetMondayIso}_${day.id}_${shiftId}_${emp.id}`,
            date: day.iso,
            dayId: day.id,
            shiftId,
            shiftName: meta.shiftName,
            startTime: meta.startTime,
            endTime: meta.endTime,
            hours: meta.hours,
            role: emp.roleTag || emp.roles?.[0] || emp.role || "Phục vụ",
            roleTag: emp.roleTag || emp.roles?.[0] || emp.role || "Phục vụ",
            employeeId: emp.id,
            employeeName: emp.name,
            isMyShift: emp.id === targetEmpId,
            is_official: true,
          };
          if (emp.id === targetEmpId) {
            myShifts.push(shiftItem);
          } else {
            allCoworkerShifts.push(shiftItem);
          }
        });
      }
    });
  });

  // Tìm đơn nghỉ đã duyệt
  const allLeaves = getLeaveRequests();
  const approvedLeaves = allLeaves.filter(
    (l) => l.employeeId === targetEmpId && l.status === "approved"
  );
  const approvedLeaveDates = approvedLeaves.map((l) => l.isoDate || l.shiftDate);

  // Ca mở tuần này
  let openShifts;
  try {
    const rawOpen = await getOpenShifts({ weekStart: targetMondayIso });
    openShifts = Array.isArray(rawOpen) ? rawOpen : (rawOpen?.data || []);
  } catch {
    openShifts = [];
  }

  const targetEmp = getEmployeeById(targetEmpId);
  const totalHours = myShifts.reduce((s, r) => s + r.hours, 0);
  const contractHours = targetEmp?.contract === "Toàn thời gian" ? 40 : 20;
  const nextShift = myShifts.find((s) => s.date >= todayIso) || myShifts[0] || null;

  const todayShiftItem = myShifts.find((s) => s.date === todayIso);
  const todayShift = todayShiftItem
    ? {
        code: todayShiftItem.shiftId,
        name: todayShiftItem.shiftName,
        start: todayShiftItem.startTime,
        end: todayShiftItem.endTime,
        roleTag: todayShiftItem.role,
      }
    : null;

  const todaySummary = {
    todayDateIso: todayIso,
    todayShift,
    todayStatus: {
      hasShift: Boolean(todayShiftItem),
      shiftName: todayShiftItem?.shiftName || "",
      startTime: todayShiftItem?.startTime || "",
      endTime: todayShiftItem?.endTime || "",
      isCheckedIn: false,
      label: todayShiftItem
        ? `Sẵn sàng check-in ca ${todayShiftItem.shiftName} (${todayShiftItem.startTime})`
        : "Không có ca trực hôm nay",
      tone: todayShiftItem ? "warning" : "neutral",
      canCheckIn: Boolean(todayShiftItem),
    },
  };

  return {
    weekStart: targetMondayIso,
    weekLabel,
    published,
    days,
    shifts: myShifts,
    myShifts,
    allCoworkerShifts,
    openShifts,
    approvedLeaves,
    approvedLeaveDates,
    calendarEvents: [],
    stats: {
      totalHours,
      contractHours,
      shiftCount: myShifts.length,
      openShiftCount: openShifts.length,
      nextShift,
      published,
    },
    todayShift,
    todaySummary,
  };
}

export default {
  getScheduleBoard,
  saveScheduleDraft,
  publishSchedule,
  subscribeSchedule,
  generateSchedule,
  getSchedule,
  updateShift,
  applySchedule,
  shiftToCalendarEvent,
  leaveToCalendarEvent,
  getMySchedule,
  calculateScheduleStats,
  employeeRoster,
  getEmployeeById,
  getWeekDays,
  getCurrentWeekLabel,
  initialDays,
  initialShiftDemands,
  initialConstraints,
  DAILY_SHIFT_REQUIREMENTS,
  generateInitialSchedules,
  getSavedSchedules,
  saveSchedules,
  confirmSchedule,
  isScheduleConfirmed,
  getFutureShiftsForEmployee,
  freeFutureShiftsForEmployee,
  restoreEmployeeShiftInSchedule,
  getShiftInfo,
  roleBadgeClass,
  mergeConfigConstraints,
  mergeConfigShifts,
  WEEK_LABEL,
  WEEKLY_PATTERN,
  mondayOf,
  addDays,
  toISO,
  toVN,
  getNow,
};
