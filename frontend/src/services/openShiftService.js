// =============================================================================
// File: src/services/openShiftService.js
// Tầng: Service - Nghiệp vụ và tương tác dữ liệu Ca trực mở (US18, US19)
// =============================================================================

import {
  ROLES,
  MAX_NEEDED,
  MAX_NOTE,
  dayLabel,
  startOf,
  statusOf,
  weekdayOf,
  fmtDate,
  getCancelRule,
  getEditRule,
  validateOpenShift,
  validateClaim,
  isEligible,
  isClaimedBy,
  toISO,
  parseISO,
  todayISO,
  addDaysISO,
  getSavedOpenShifts,
  saveOpenShifts,
} from "../mocks/openShiftMock.js";
import { getCurrentUser } from "./authService.js";
import { getEmployeeById } from "./employeeService.js";
import { getMySchedule } from "./scheduleService.js";

export {
  ROLES,
  MAX_NEEDED,
  MAX_NOTE,
  dayLabel,
  startOf,
  statusOf,
  weekdayOf,
  fmtDate,
  getCancelRule,
  getEditRule,
  validateOpenShift,
  validateClaim,
  isEligible,
  isClaimedBy,
  toISO,
  parseISO,
  todayISO,
  addDaysISO,
  getSavedOpenShifts,
  saveOpenShifts,
};

const businessError = (message) => Object.assign(new Error(message), { business: true });

function find(list, id) {
  const s = list.find((x) => x.id === id);
  if (!s) throw businessError("Không tìm thấy ca trực mở, vui lòng tải lại danh sách.");
  return s;
}

const commit = (list, shift) => {
  const next = { ...shift, version: (shift.version ?? 1) + 1 };
  saveOpenShifts(list.map((s) => (s.id === next.id ? next : s)));
  return next;
};

export const getOpenShifts = async (params) => {
  let list = getSavedOpenShifts();
  if (params?.status === "open") {
    list = list.filter((s) => !s.cancelled && (s.claims?.length || 0) < s.needed);
  } else if (params?.status === "filled") {
    list = list.filter((s) => (s.claims?.length || 0) >= s.needed);
  }
  return list;
};

export async function createOpenShift(p) {
  // BACKEND: Tạo ca trực mở mới vào bảng open_shifts, kiểm tra thông tin hợp lệ, gửi thông báo cho nhân viên phù hợp
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw businessError("Chỉ Quản lý mới có quyền tạo ca trực mở.");
  }
  const list = getSavedOpenShifts();
  const err = validateOpenShift(p, list);
  if (err) throw businessError(err);

  const n = Math.max(0, ...list.map((s) => Number(s.id?.replace(/\D/g, "") || 0))) + 1;
  const shift = {
    ...p,
    id: `OS${String(n).padStart(3, "0")}`,
    needed: Number(p.needed),
    bonus: Number(p.bonus) || 0,
    note: (p.note ?? "").trim(),
    cancelled: false,
    version: 1,
    claims: [],
  };
  saveOpenShifts([shift, ...list]);
  return shift;
}

export async function updateOpenShift(p) {
  // BACKEND: Cập nhật thông tin ca trực mở trong bảng open_shifts
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw businessError("Chỉ Quản lý mới có quyền chỉnh sửa ca trực mở.");
  }
  const list = getSavedOpenShifts();
  const s = find(list, p.id);
  const rule = getEditRule(s);
  if (!rule.allowed) throw businessError(rule.reason);
  if (rule.locked && (p.date !== s.date || p.shiftCode !== s.shiftCode || p.role !== s.role || Number(p.bonus) !== s.bonus))
    throw businessError(rule.reason);
  const err = validateOpenShift(p, list);
  if (err) throw businessError(err);
  return commit(list, { ...s, ...p, needed: Number(p.needed), bonus: Number(p.bonus) || 0, note: (p.note ?? "").trim() });
}

export async function cancelOpenShift(id) {
  // BACKEND: Hủy ca trực mở (nếu chưa có ai nhận), đánh dấu status = cancelled trong bảng open_shifts
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw businessError("Chỉ Quản lý mới có quyền hủy ca trực mở.");
  }
  const list = getSavedOpenShifts();
  const s = find(list, id);
  const rule = getCancelRule(s);
  if (!rule.allowed) throw businessError(rule.reason);
  commit(list, { ...s, cancelled: true });
  return { action: "cancelled" };
}

export const acceptOpenShift = (id, data, expectedVersion) =>
  claimOpenShift(id, data, expectedVersion);

/**
 * Kiểm tra 4 điều kiện nhận ca trực mở:
 * 1. Vai trò: employee.roles.includes(s.role)
 * 2. Không trùng giờ: nhân viên không có ca trực cùng khung giờ trong ngày
 * 3. Đủ nghỉ tối thiểu: giãn cách >= 12h giữa ca trước và ca sau
 * 4. Chưa vượt giờ tối đa tuần: tổng giờ tuần của nhân viên + giờ ca mở <= 40h
 * BACKEND: server kiểm tra lại + Optimistic Locking
 */
export async function checkOpenShiftEligibility(shift, empId) {
  if (!shift) return { eligible: false, reason: "Không tìm thấy ca trực mở." };
  if (shift.cancelled) return { eligible: false, reason: "Ca này đã bị hủy." };
  if ((shift.claims?.length || 0) >= shift.needed) return { eligible: false, reason: "Ca này đã đủ người đăng ký." };

  const emp = await getEmployeeById(empId);
  if (!emp) return { eligible: false, reason: "Không tìm thấy thông tin nhân viên." };
  const empRoles = emp.roles || [emp.role || "Phục vụ"];

  // Điều kiện 1: Vai trò phù hợp
  if (shift.role && !empRoles.includes(shift.role)) {
    return { eligible: false, reason: `Vai trò của bạn (${empRoles.join(", ")}) không phù hợp với ca này (${shift.role}).` };
  }

  // Lấy lịch của nhân viên tuần này
  const mySchedule = await getMySchedule({ employeeId: empId, currentUserId: empId });
  const myShifts = mySchedule?.myShifts || [];
  const totalWeeklyHours = mySchedule?.stats?.totalHours || myShifts.reduce((s, r) => s + (r.hours || 0), 0);

  // Điều kiện 2: Không trùng giờ ca cùng ngày
  const hasConflict = myShifts.some((m) => {
    if (m.date !== shift.date) return false;
    if (m.shiftCode === shift.shiftCode || m.shiftId === shift.shiftCode || m.shiftName === shift.shiftName) return true;
    return shift.startTime < m.endTime && shift.endTime > m.startTime;
  });
  if (hasConflict) {
    return { eligible: false, reason: "Trùng lịch với ca trực đã được phân công trong ngày." };
  }

  // Điều kiện 3: Đủ nghỉ tối thiểu (>= 12h)
  const shiftStartMin = shift.startTime ? Number(shift.startTime.split(":")[0]) * 60 + Number(shift.startTime.split(":")[1]) : 360;
  const shiftEndMin = shift.endTime ? Number(shift.endTime.split(":")[0]) * 60 + Number(shift.endTime.split(":")[1]) : 720;
  const shiftDay = new Date(`${shift.date}T00:00:00`);

  const violatesRest = myShifts.some((m) => {
    const mDay = new Date(`${m.date}T00:00:00`);
    const dayDiff = Math.round((shiftDay - mDay) / (1000 * 60 * 60 * 24));
    const mStartMin = m.startTime ? Number(m.startTime.split(":")[0]) * 60 + Number(m.startTime.split(":")[1]) : 360;
    const mEndMin = m.endTime ? Number(m.endTime.split(":")[0]) * 60 + Number(m.endTime.split(":")[1]) : 720;

    if (dayDiff === 1) {
      const rest = 24 * 60 - mEndMin + shiftStartMin;
      if (rest < 12 * 60) return true;
    }
    if (dayDiff === -1) {
      const rest = 24 * 60 - shiftEndMin + mStartMin;
      if (rest < 12 * 60) return true;
    }
    return false;
  });
  if (violatesRest) {
    return { eligible: false, reason: "Không đảm bảo thời gian nghỉ tối thiểu 12 giờ giữa 2 ca làm việc." };
  }

  // Điều kiện 4: Chưa vượt giờ tối đa tuần (<= 40h)
  const shiftHours = (shiftEndMin - shiftStartMin) / 60;
  if (totalWeeklyHours + shiftHours > 40) {
    return {
      eligible: false,
      reason: `Vượt quá giới hạn giờ làm tối đa trong tuần (40 giờ/tuần). Hiện tại: ${totalWeeklyHours}h + ca mở: ${shiftHours}h = ${totalWeeklyHours + shiftHours}h.`,
    };
  }

  return { eligible: true, reason: null };
}

/**
 * Lấy danh sách ca trực mở phù hợp cho nhân viên (US19)
 * Dùng filter + some theo 4 điều kiện
 * // BACKEND: server kiểm tra lại + Optimistic Locking
 */
export async function getOpenShiftsForEmployee(empId) {
  // BACKEND: server kiểm tra lại + Optimistic Locking
  const openList = getSavedOpenShifts().filter((s) => !s.cancelled && (s.claims?.length || 0) < s.needed);
  const results = [];
  for (const s of openList) {
    const check = await checkOpenShiftEligibility(s, empId);
    if (check.eligible) {
      results.push(s);
    }
  }
  return results;
}

export async function claimOpenShift(shiftId, employee, expectedVersion) {
  // BACKEND: server kiểm tra lại + Optimistic Locking
  let actualShiftId = shiftId;
  let actualEmployee = employee;
  let actualVersion = expectedVersion;

  if (typeof shiftId === "object" && shiftId !== null) {
    actualShiftId = shiftId.shiftId || shiftId.id;
    actualEmployee = shiftId.employee || {
      employeeId: shiftId.employeeId || shiftId.id,
      name: shiftId.name,
      phone: shiftId.phone,
      roles: shiftId.roles || shiftId.roleTags,
    };
    actualVersion = shiftId.version ?? shiftId.expectedVersion;
  }

  const list = getSavedOpenShifts();
  const s = find(list, actualShiftId);
  const empId = actualEmployee?.employeeId || actualEmployee?.id || "NV001";

  // Kiểm tra lại 4 điều kiện
  const check = await checkOpenShiftEligibility(s, empId);
  if (!check.eligible) {
    throw businessError(`Bạn không thể nhận ca này: ${check.reason}`);
  }

  if (actualVersion !== undefined && s.version !== actualVersion)
    throw businessError("Ca này vừa được cập nhật, vui lòng tải lại danh sách rồi nhận lại.");

  const claim = {
    id: `C${Date.now()}`,
    employeeId: empId,
    name: actualEmployee?.name || empId,
    phone: actualEmployee?.phone ?? "",
    claimedAt: new Date().toISOString(),
  };
  const next = commit(list, { ...s, claims: [...(s.claims || []), claim] });

  return { ok: true, shift: next, filled: next.claims.length >= next.needed, bonus: next.bonus };
}

export const subscribeOpenShift = () => {
  return () => {};
};

export default {
  ROLES,
  MAX_NEEDED,
  MAX_NOTE,
  dayLabel,
  statusOf,
  weekdayOf,
  fmtDate,
  getCancelRule,
  getEditRule,
  validateOpenShift,
  validateClaim,
  isEligible,
  isClaimedBy,
  toISO,
  parseISO,
  todayISO,
  addDaysISO,
  getOpenShifts,
  createOpenShift,
  updateOpenShift,
  cancelOpenShift,
  acceptOpenShift,
  claimOpenShift,
  getOpenShiftsForEmployee,
  subscribeOpenShift,
};
