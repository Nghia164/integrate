/**
 * File: src/mocks/scheduleMock.js
 * Dữ liệu lịch làm việc và kho ca mẫu (Static Mock Data)
 */

import { mockEmployees } from "./employeeMock.js";
import { mondayOf, addDays, toISO, toVN, startOfDay, getNow } from "../lib/dateUtils.js";

export const employeeRoster = mockEmployees;

export const getEmployeeById = (id) => mockEmployees.find((e) => e.id === id) || null;

export const getWeekDays = (baseDate = getNow()) => {
  const mon = mondayOf(startOfDay(baseDate));
  const dayNames = [
    { id: "T2", label: "T2", name: "Thứ 2" },
    { id: "T3", label: "T3", name: "Thứ 3" },
    { id: "T4", label: "T4", name: "Thứ 4" },
    { id: "T5", label: "T5", name: "Thứ 5" },
    { id: "T6", label: "T6", name: "Thứ 6" },
    { id: "T7", label: "T7", name: "Thứ 7" },
    { id: "CN", label: "CN", name: "Chủ nhật" },
  ];

  return dayNames.map((d, index) => {
    const cur = addDays(mon, index);
    const iso = toISO(cur);
    const vn = toVN(iso);
    const [day, month] = vn.split("/");
    return {
      id: d.id,
      dayIndex: index,
      label: d.label,
      date: `${day}/${month}`,
      fullDate: `${d.name}, ${vn}`,
      iso,
      active: true,
    };
  });
};

export const initialDays = getWeekDays(getNow());

export const getCurrentWeekLabel = (baseDate = getNow()) => {
  const mon = mondayOf(startOfDay(baseDate));
  const sun = addDays(mon, 6);
  return `Tuần ${toVN(toISO(mon))} – ${toVN(toISO(sun))}`;
};

export const initialShiftDemands = [
  {
    id: "morning",
    name: "Ca sáng (06:00 - 12:00)",
    shortName: "Sáng",
    time: "06:00 - 12:00",
    phucVu: 1,
    phaChe: 1,
    thuNgan: 0,
    total: 2,
    color: "blue",
  },
  {
    id: "afternoon",
    name: "Ca chiều (12:00 - 17:00)",
    shortName: "Chiều",
    time: "12:00 - 17:00",
    phucVu: 0,
    phaChe: 1,
    thuNgan: 1,
    total: 2,
    color: "amber",
  },
  {
    id: "evening",
    name: "Ca tối (17:00 - 22:00)",
    shortName: "Tối",
    time: "17:00 - 22:00",
    phucVu: 1,
    phaChe: 0,
    thuNgan: 0,
    total: 1,
    color: "indigo",
  },
];

export const DAILY_SHIFT_REQUIREMENTS = {
  T2: {
    morning: { phucVu: 1, phaChe: 0, thuNgan: 0, total: 1 },
    afternoon: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
    evening: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
  },
  T3: {
    morning: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
    afternoon: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
    evening: { phucVu: 1, phaChe: 0, thuNgan: 0, total: 1 },
  },
  T4: {
    morning: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
    afternoon: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
    evening: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
  },
  T5: {
    morning: { phucVu: 1, phaChe: 0, thuNgan: 0, total: 1 },
    afternoon: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
    evening: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
  },
  T6: {
    morning: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
    afternoon: { phucVu: 0, phaChe: 1, thuNgan: 1, total: 2 },
    evening: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
  },
  T7: {
    morning: { phucVu: 0, phaChe: 1, thuNgan: 1, total: 2 },
    afternoon: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
    evening: { phucVu: 1, phaChe: 0, thuNgan: 0, total: 1 },
  },
  CN: {
    morning: { phucVu: 1, phaChe: 0, thuNgan: 0, total: 1 },
    afternoon: { phucVu: 0, phaChe: 1, thuNgan: 0, total: 1 },
    evening: { phucVu: 0, phaChe: 0, thuNgan: 1, total: 1 },
  },
};

export const initialConstraints = [
  {
    id: "sufficient_staff",
    category: "hard",
    title: "Đủ số lượng nhân viên",
    desc: "Đảm bảo mỗi ca có đủ số lượng nhân viên theo nhu cầu định biên.",
    type: "users",
    color: "blue",
    enabled: true,
  },
  {
    id: "no_overlap",
    category: "hard",
    title: "Không trùng ca",
    desc: "Đảm bảo nhân viên không được phân công các ca bị trùng thời gian.",
    type: "clock",
    color: "indigo",
    enabled: true,
  },
  {
    id: "min_rest",
    category: "hard",
    title: "Thời gian nghỉ tối thiểu",
    desc: "Đảm bảo nhân viên có đủ thời gian nghỉ giữa 2 ngày làm liên tiếp (Điều 109 BLLĐ 2019, tối thiểu 12 giờ).",
    type: "coffee",
    color: "orange",
    enabled: true,
    inputLabel: "Thời gian nghỉ tối thiểu",
    value: 12,
    unit: "giờ",
  },
  {
    id: "max_consecutive",
    category: "hard",
    title: "Số ngày làm liên tiếp tối đa",
    desc: "Đảm bảo mỗi tuần có ít nhất 24h nghỉ ngơi liên tục (Bộ luật Lao động).",
    type: "alert",
    color: "red",
    enabled: true,
    inputLabel: "Số ngày liên tiếp tối đa",
    value: 6,
    unit: "ngày",
  },
  {
    id: "max_hours",
    category: "hard",
    title: "Giới hạn giờ làm việc",
    desc: "Không cho nhân viên vượt quá số giờ làm tối đa mỗi tuần (tối đa 48 giờ/tuần).",
    type: "timer",
    color: "green",
    enabled: true,
    inputLabel: "Số giờ làm tối đa",
    value: 40,
    unit: "giờ/tuần",
  },
  {
    id: "no_clopening",
    category: "hard",
    title: "Không xếp ca tối rồi ca sáng hôm sau",
    desc: "Nhân viên đóng ca tối muộn thì hôm sau không bị xếp ca mở cửa sáng sớm.",
    type: "clock",
    color: "indigo",
    enabled: true,
  },
  {
    id: "respect_approved_leave",
    category: "hard",
    title: "Không xếp ca vào ngày nghỉ đã duyệt",
    desc: "Nhân viên có đơn xin nghỉ đã được Manager duyệt sẽ không bị xếp ca.",
    type: "alert",
    color: "red",
    enabled: true,
  },
  {
    id: "role_match",
    category: "hard",
    title: "Theo vai trò chuyên môn (Role_Tag)",
    desc: "Chỉ phân công nhân viên vào ca phù hợp với vai trò yêu cầu (Phục vụ, Pha chế, Thu ngân).",
    type: "shield",
    color: "amber",
    enabled: true,
  },
  {
    id: "fair_hours_distribution",
    category: "soft",
    title: "Phân bổ giờ làm công bằng",
    desc: "Cố gắng chia đều tổng số giờ làm việc giữa các nhân viên trong tuần để đảm bảo công bằng.",
    type: "timer",
    color: "green",
    enabled: true,
  },
  {
    id: "availability",
    category: "soft",
    title: "Theo thời gian rảnh",
    desc: "Chỉ phân công nhân viên vào những ca mà họ đã đăng ký rảnh.",
    type: "calendar",
    color: "orange",
    enabled: true,
  },
  {
    id: "fair_weekend_distribution",
    category: "soft",
    title: "Chia đều ca cuối tuần",
    desc: "Chia đều các ca Thứ 7 và Chủ nhật giữa các nhân viên trong nhóm.",
    type: "calendar",
    color: "blue",
    enabled: true,
  },
];

export function roleBadgeClass(role) {
  if (role === "Phục vụ") return "bg-[#E8EEFB] text-[#3452A8] border-[#BFD0F5]";
  if (role === "Pha chế") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-purple-50 text-purple-700 border-purple-200";
}

export function syncShiftDemands(demands, savedShifts) {
  if (!Array.isArray(savedShifts) || savedShifts.length === 0) return demands;
  return demands;
}

export function getShiftInfo(schedules, shiftDemands, days, selectedShiftKey) {
  const [shiftId, dayId] = selectedShiftKey.split("_");
  const demand = shiftDemands.find((d) => d.id === shiftId) || shiftDemands[0];
  const day = days.find((d) => d.id === dayId) || days[1];
  const shiftSchedule = schedules[selectedShiftKey] || { assigned: [] };
  const assigned = shiftSchedule.assigned || [];

  return {
    shiftKey: selectedShiftKey,
    shiftId,
    dayId,
    demand,
    day,
    assigned,
    totalMissing: Math.max(0, demand.total - assigned.length),
    isSatisfied: assigned.length >= demand.total,
  };
}

const empById = (id) => mockEmployees.find((e) => e.id === id);

function createInitialScheduleWeek() {
  const dayKeys = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const sched = {};
  dayKeys.forEach((d) => {
    sched[`morning_${d}`] = { shiftId: "morning", dayId: d, assigned: [] };
    sched[`afternoon_${d}`] = { shiftId: "afternoon", dayId: d, assigned: [] };
    sched[`evening_${d}`] = { shiftId: "evening", dayId: d, assigned: [] };
  });

  // T2: Sáng (NV001, NV002), Chiều (NV005, NV007)
  sched.morning_T2.assigned = [empById("NV001"), empById("NV002")].filter(Boolean);
  sched.afternoon_T2.assigned = [empById("NV005"), empById("NV007")].filter(Boolean);

  // T3: Sáng (NV007, NV008), Chiều (NV003)
  sched.morning_T3.assigned = [empById("NV007"), empById("NV008")].filter(Boolean);
  sched.afternoon_T3.assigned = [empById("NV003")].filter(Boolean);

  // T4: Sáng (NV002, NV005 - NV005 đi làm thay NV003 xin nghỉ), Chiều (NV001)
  sched.morning_T4.assigned = [empById("NV002"), empById("NV005")].filter(Boolean);
  sched.afternoon_T4.assigned = [empById("NV001")].filter(Boolean);

  // T5: Sáng (NV007), Chiều (NV005, NV008), Tối (NV003)
  sched.morning_T5.assigned = [empById("NV007")].filter(Boolean);
  sched.afternoon_T5.assigned = [empById("NV005"), empById("NV008")].filter(Boolean);
  sched.evening_T5.assigned = [empById("NV003")].filter(Boolean);

  // T6: Sáng (NV001, NV002), Chiều (NV003), Tối (NV005)
  sched.morning_T6.assigned = [empById("NV001"), empById("NV002")].filter(Boolean);
  sched.afternoon_T6.assigned = [empById("NV003")].filter(Boolean);
  sched.evening_T6.assigned = [empById("NV005")].filter(Boolean);

  // T7: Sáng (NV002 - thiếu 1 Pha chế -> OS001), Chiều (NV001, NV007), Tối (NV005, NV008)
  sched.morning_T7.assigned = [empById("NV002")].filter(Boolean);
  sched.afternoon_T7.assigned = [empById("NV001"), empById("NV007")].filter(Boolean);
  sched.evening_T7.assigned = [empById("NV005"), empById("NV008")].filter(Boolean);

  // CN: Chiều thiếu 1 Thu ngân -> OS002
  return sched;
}

const mockSchedulesState = {
  "2026-10-26": {
    schedules: createInitialScheduleWeek(),
    confirmed: true,
  },
  "2026-11-02": {
    schedules: createInitialScheduleWeek(),
    confirmed: false,
  },
};

export function getSavedSchedules(weekMonday) {
  const key = weekMonday || toISO(mondayOf(getNow()));
  if (!mockSchedulesState[key]) {
    const isDraft = key === "2026-11-02";
    mockSchedulesState[key] = {
      schedules: createInitialScheduleWeek(),
      confirmed: !isDraft,
    };
  }
  return mockSchedulesState[key].schedules;
}

export function saveSchedules(a, b) {
  // BACKEND: Lưu lịch tuần vào bảng schedules
  const weekMonday = typeof a === "string" ? a : (typeof b === "string" ? b : null);
  const schedules = typeof a === "object" && a !== null ? a : b;
  const key = weekMonday || toISO(mondayOf(getNow()));
  mockSchedulesState[key] = {
    ...(mockSchedulesState[key] || {}),
    schedules,
  };
  return { success: true };
}

export function getFutureShiftsForEmployee(empId) {
  const futureShifts = [];
  const now = getNow();
  const todayIso = toISO(now);
  const demandMeta = {
    morning: { name: "Ca Sáng", time: "06:00 - 12:00" },
    afternoon: { name: "Ca Chiều", time: "12:00 - 17:00" },
    evening: { name: "Ca Tối", time: "17:00 - 22:00" },
  };

  const weekMonday = toISO(mondayOf(now));
  const saved = getSavedSchedules(weekMonday);
  const weekDays = getWeekDays(now);

  weekDays.forEach((day) => {
    if (day.iso >= todayIso) {
      ["morning", "afternoon", "evening"].forEach((shiftId) => {
        const key = `${shiftId}_${day.id}`;
        const slot = saved[key];
        if (slot && Array.isArray(slot.assigned)) {
          const isAssigned = slot.assigned.some((e) => e.id === empId);
          if (isAssigned) {
            futureShifts.push({
              key,
              date: day.date,
              fullDate: day.fullDate,
              iso: day.iso,
              shiftName: demandMeta[shiftId]?.name || shiftId,
              time: demandMeta[shiftId]?.time || "",
            });
          }
        }
      });
    }
  });

  return futureShifts;
}

export function freeFutureShiftsForEmployee(empId) {
  // BACKEND: Giải phóng các ca chính thức tương lai của nhân viên đã nghỉ việc sang Chưa có người (unfilled)
  const future = getFutureShiftsForEmployee(empId);
  const now = getNow();
  const weekMonday = toISO(mondayOf(now));
  const saved = getSavedSchedules(weekMonday);

  future.forEach((f) => {
    if (saved[f.key] && Array.isArray(saved[f.key].assigned)) {
      saved[f.key].assigned = saved[f.key].assigned.filter((e) => e.id !== empId);
    }
  });
  saveSchedules(saved, weekMonday);
  return future;
}

export function restoreEmployeeShiftInSchedule(empId, shiftDate, shiftIdOrName) {
  // BACKEND: Khôi phục ca trực gốc cho nhân viên khi hủy đơn nghỉ phép
  const emp = mockEmployees.find((e) => e.id === empId);
  if (!emp || !shiftDate) return false;

  const targetDate = new Date(shiftDate);
  const weekMonday = toISO(mondayOf(targetDate));
  const saved = getSavedSchedules(weekMonday);
  const weekDays = getWeekDays(targetDate);
  const day = weekDays.find((d) => d.iso === shiftDate);
  if (!day) return false;

  const shiftCode =
    String(shiftIdOrName || "").toLowerCase().includes("sáng") || shiftIdOrName === "morning"
      ? "morning"
      : String(shiftIdOrName || "").toLowerCase().includes("chiều") || shiftIdOrName === "afternoon"
      ? "afternoon"
      : "evening";

  const key = `${shiftCode}_${day.id}`;
  if (saved[key]) {
    if (!Array.isArray(saved[key].assigned)) saved[key].assigned = [];
    if (!saved[key].assigned.some((e) => e.id === empId)) {
      saved[key].assigned.push(emp);
    }
    saveSchedules(saved, weekMonday);
    return true;
  }
  return false;
}

export function confirmSchedule(weekMonday) {
  // BACKEND: Công bố lịch tuần vào bảng weekly_schedules (status = 'published')
  const key = weekMonday || toISO(mondayOf(getNow()));
  mockSchedulesState[key] = {
    ...(mockSchedulesState[key] || {}),
    confirmed: true,
  };
  return { success: true };
}

export function isScheduleConfirmed(weekMonday) {
  const key = weekMonday || toISO(mondayOf(getNow()));
  if (mockSchedulesState[key] && typeof mockSchedulesState[key].confirmed === "boolean") {
    return mockSchedulesState[key].confirmed;
  }
  if (key === "2026-11-02") return false;
  return true;
}

export const shiftTemplates = [
  { id: "TMP01", name: "Ca Sáng chuẩn", startTime: "06:00", endTime: "12:00", duration: 6 },
  { id: "TMP02", name: "Ca Chiều chuẩn", startTime: "12:00", endTime: "17:00", duration: 5 },
  { id: "TMP03", name: "Ca Tối chuẩn", startTime: "17:00", endTime: "22:00", duration: 5 },
];

export const getSavedTemplates = () => shiftTemplates;
export const saveTemplates = (templates) => ({ success: true, templates });

export const WEEK_LABEL = getCurrentWeekLabel();


export const generateInitialSchedules = () => getSavedSchedules();

export function mergeConfigConstraints(baseConstraints, savedConstraintsList) {
  if (!Array.isArray(savedConstraintsList) || savedConstraintsList.length === 0) {
    return baseConstraints;
  }
  const savedMap = new Map(savedConstraintsList.map((c) => [c.id, c]));
  return baseConstraints.map((c) => {
    let s = savedMap.get(c.id);
    if (!s) {
      if (c.id === "min_rest") s = savedMap.get("rest_between_shifts");
      else if (c.id === "max_consecutive") s = savedMap.get("max_consecutive_days");
      else if (c.id === "max_hours") s = savedMap.get("max_hours_per_week");
      else if (c.id === "role_match") s = savedMap.get("skill_match");
      else if (c.id === "availability") s = savedMap.get("preference_matching");
      else if (c.id === "fair_hours_distribution") s = savedMap.get("fair_hours_distribution");
      else if (c.id === "fair_weekend_distribution") s = savedMap.get("fair_weekend_distribution");
      else if (c.id === "no_clopening") s = savedMap.get("no_clopening");
      else if (c.id === "respect_approved_leave") s = savedMap.get("respect_approved_leave");
    }
    if (!s) return c;
    return {
      ...c,
      enabled: s.enabled !== undefined ? !!s.enabled : c.enabled,
      ...(s.value !== undefined && { value: s.value }),
    };
  });
}

export const mergeConfigShifts = (s) => s || initialShiftDemands;

export default {
  employeeRoster,
  getEmployeeById,
  getWeekDays,
  initialDays,
  getCurrentWeekLabel,
  initialShiftDemands,
  DAILY_SHIFT_REQUIREMENTS,
  initialConstraints,
  roleBadgeClass,
  syncShiftDemands,
  getShiftInfo,
  getSavedSchedules,
  saveSchedules,
  confirmSchedule,
  isScheduleConfirmed,
  shiftTemplates,
  getSavedTemplates,
  saveTemplates,
  WEEK_LABEL,
  generateInitialSchedules,
  mergeConfigConstraints,
  mergeConfigShifts,
};


