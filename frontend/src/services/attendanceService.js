// =============================================================================
// File: src/services/attendanceService.js
// Tầng: Dịch vụ chấm công dùng chung cho Manager và Staff (US24, US25, US26)
// =============================================================================

import {
  buildAttendance,
  adjustRecord,
  recordHistory,
  createMockCheckIn,
  createMockCheckOut,
  getMockAttendance,
  getMockAttendanceConfig,
  submitExplanation as mockSubmitExplanation,
  listMyExplanations as mockListMyExplanations,
  cancelExplanation as mockCancelExplanation,
  listExplanationsForManager as mockListExplanationsForManager,
  approveExplanation as mockApproveExplanation,
  rejectExplanation as mockRejectExplanation,
  getAttendanceRecordHistory as mockGetAttendanceRecordHistory,
  adjustMockAttendance as mockAdjustMockAttendance,
  getMockAttendanceRows,
} from "../mocks/attendanceMock.js";
import { getCurrentUser } from "./authService.js";
import { getNow, toISO, toVN } from "../lib/dateUtils.js";
import { getSavedSchedules } from "../mocks/scheduleMock.js";
import { STANDARD_SHIFTS } from "../lib/scheduleHelpers.js";

export { getMockAttendanceRows };

export const subscribeAttendance = () => {
  return () => {};
};

/**
 * Lấy trạng thái chấm công của nhân viên trong ngày hôm nay (dùng cho Topbar chip & Thẻ Ca hôm nay)
 */
export function getTodayAttendanceStatus(empId) {
  const u = getCurrentUser();
  const uid = empId || u?.employeeId || u?.id || "NV001";
  const now = getNow();
  const todayIso = toISO(now);

  const sched = getSavedSchedules("2026-10-26");
  let todayShift = null;

  const DAY_IDS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const dayIndex = (now.getDay() + 6) % 7;
  const currentDayId = DAY_IDS[dayIndex];

  // Lấy ca phân công của nhân viên hôm nay
  Object.values(sched).forEach((slot) => {
    if (slot.dayId === currentDayId) {
      const match = slot.assigned?.find((e) => e.id === uid);
      if (match) {
        const def = STANDARD_SHIFTS.find((d) => d.id === slot.shiftId);
        todayShift = {
          shiftId: slot.shiftId,
          shiftName: def?.name || "Chiều",
          startTime: def?.startTime || "12:00",
          endTime: def?.endTime || "17:00",
        };
      }
    }
  });

  if (!todayShift) {
    return { hasShift: false, canCheckIn: false, showChip: false };
  }

  // Khung check-in: 15 phút trước giờ ca bắt đầu đến khi ca kết thúc
  const [sH, sM] = todayShift.startTime.split(":").map(Number);
  const [eH, eM] = todayShift.endTime.split(":").map(Number);
  const startObj = new Date(now);
  startObj.setHours(sH, sM, 0, 0);
  const endObj = new Date(now);
  endObj.setHours(eH, eM, 0, 0);
  const openTime = new Date(startObj.getTime() - 15 * 60000);

  const isInWindow = now >= openTime && now <= endObj;

  // Kiểm tra nhật ký chấm công thực tế
  const rows = getMockAttendanceRows();
  const attRow = rows.find((r) => r.employeeId === uid && (r.iso === todayIso || r.date === toVN(todayIso) || r.date === "31/10/2026"));
  const isCheckedIn = Boolean(attRow?.checkIn);
  const isCheckedOut = Boolean(attRow?.checkOut);

  if (isCheckedOut) {
    return {
      hasShift: true,
      canCheckIn: false,
      isCheckedIn: false,
      isCheckedOut: true,
      showChip: false,
    };
  }

  if (isCheckedIn) {
    return {
      hasShift: true,
      canCheckIn: false,
      isCheckedIn: true,
      showChip: true,
      label: `Đang làm ca ${todayShift.shiftName} (${todayShift.startTime})`,
      tone: "success",
    };
  }

  if (isInWindow) {
    return {
      hasShift: true,
      canCheckIn: true,
      isCheckedIn: false,
      showChip: true,
      shiftName: todayShift.shiftName,
      startTime: todayShift.startTime,
      label: `Sẵn sàng check-in ca ${todayShift.shiftName} (${todayShift.startTime})`,
      tone: "warning",
    };
  }

  // Ngoài khung giờ thì ẩn chip theo yêu cầu
  return {
    hasShift: true,
    canCheckIn: false,
    isCheckedIn: false,
    showChip: false,
  };
}

/**
 * Thao tác check-in nhanh của nhân viên hôm nay
 */
export async function staffCheckInToday({ employeeId, shiftName }) {
  // BACKEND: Nhân viên check-in ca hôm nay (lưu tọa độ GPS, ảnh check-in và thời gian thực tế vào bảng attendance_logs)
  const now = getNow();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;
  return { success: true, checkInTime: timeStr, employeeId, shiftName };
}

// ---------- Staff (US24 - Check-in/out) ----------
export const getAttendanceConfig = async () => {
  return getMockAttendanceConfig();
};

export const checkIn = async (data) => {
  // BACKEND: server kiểm tra giờ + GPS (chống giả mạo vị trí)
  const u = getCurrentUser();
  if (u && u.role === "staff" && u.employeeId && data?.employeeId && data.employeeId !== u.employeeId) {
    throw new Error("Không thể chấm công hộ nhân viên khác.");
  }
  const empId = data?.employeeId || u?.employeeId || u?.id || "NV001";
  return createMockCheckIn({ ...data, employeeId: empId });
};

export const checkOut = async (data) => {
  // BACKEND: server kiểm tra giờ + GPS (chống giả mạo vị trí)
  const u = getCurrentUser();
  if (u && u.role === "staff" && u.employeeId && data?.employeeId && data.employeeId !== u.employeeId) {
    throw new Error("Không thể chấm công hộ nhân viên khác.");
  }
  const empId = data?.employeeId || u?.employeeId || u?.id || "NV001";
  return createMockCheckOut({ ...data, employeeId: empId });
};

export const getAttendance = async (params) => {
  const u = getCurrentUser();
  const empId =
    (u?.role === "staff" ? (u.employeeId || u.id) : params?.employeeId) ||
    (typeof params === "string" ? params : params?.employeeId);
  return getMockAttendance({ employeeId: empId });
};

// ---------- Manager (US25 (Đối soát) & US26 (Điều chỉnh)) ----------

export async function getAttendanceRecords(params) {
  return buildAttendance(params);
}

export async function adjustAttendance(id, payload) {
  // BACKEND: Quản lý điều chỉnh bản ghi chấm công (lưu lịch sử điều chỉnh vào attendance_audit_logs)
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw new Error("Chỉ Quản lý mới có quyền điều chỉnh chấm công.");
  }
  return adjustRecord(id, payload);
}

export async function getAttendanceHistory(id) {
  return recordHistory(id);
}

// ---------- Giải trình chấm công (Staff & Manager) ----------

export async function submitExplanation(payload) {
  // BACKEND: Nhân viên gửi đơn giải trình chấm công (quên chấm công / đi muộn có lý do) vào bảng attendance_explanations
  return mockSubmitExplanation(payload);
}

export function listMyExplanations(options) {
  return mockListMyExplanations(options) || [];
}

export async function cancelExplanation(id) {
  // BACKEND: Nhân viên hủy đơn giải trình đang chờ duyệt
  return mockCancelExplanation(id);
}

export function listExplanationsForManager(options) {
  return mockListExplanationsForManager(options) || [];
}

export async function approveExplanation(explanationId, options) {
  // BACKEND: Quản lý duyệt giải trình: cập nhật trạng thái đơn thành approved, tự động cập nhật giờ chấm công thực tế tương ứng trong bảng attendance_logs
  return mockApproveExplanation(explanationId, options);
}

export async function rejectExplanation(explanationId, options) {
  // BACKEND: Quản lý từ chối giải trình, lưu lý do và thông báo cho nhân viên
  return mockRejectExplanation(explanationId, options);
}

export function getAttendanceRecordHistory(recordId) {
  return mockGetAttendanceRecordHistory(recordId);
}

export function adjustMockAttendance(recordId, patch) {
  // BACKEND: Lưu điều chỉnh trực tiếp trên sổ chấm công
  return mockAdjustMockAttendance(recordId, patch);
}

export default {
  subscribeAttendance,
  getTodayAttendanceStatus,
  staffCheckInToday,
  getAttendanceConfig,
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceRecords,
  adjustAttendance,
  getAttendanceHistory,
  submitExplanation,
  listMyExplanations,
  cancelExplanation,
  listExplanationsForManager,
  approveExplanation,
  rejectExplanation,
  getAttendanceRecordHistory,
  adjustMockAttendance,
};
