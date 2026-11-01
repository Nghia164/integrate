// =============================================================================
// File: src/services/availabilityService.js
// Tầng: Dịch vụ đăng ký và tổng hợp khả năng làm việc (US08, US09)
// Nghiệp vụ: Đăng ký lịch rảnh (Staff), tổng hợp khả năng làm việc theo tuần (Manager)
// =============================================================================

import {
  getMockAvailability,
  saveMockAvailability,
  getMockWeeklyAvailability,
  isMockEmployeeAvailable,
} from "../mocks/availabilityMock.js";
import { mondayOf, addDays, toISO, toVN, startOfDay, getNow } from "../lib/dateUtils.js";
import { getCurrentUser } from "./authService.js";
import { ERROR_CODES, AppError } from "./errors.js";

export { addDays, toISO, toVN };

export const isEmployeeAvailable = isMockEmployeeAvailable;

/**
 * Tính toán deadline đăng ký cho một tuần: Thứ Sáu trước tuần đó lúc 23:59:59
 */
export function calculateDeadline(weekMondayIso) {
  const [y, m, d] = weekMondayIso.split("-").map(Number);
  const monday = new Date(y, m - 1, d);
  const deadline = addDays(monday, -3); // Thứ Sáu trước tuần áp dụng
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

function resolveEffectiveEmployeeId(explicitEmployeeId) {
  const sessionUser = getCurrentUser();
  if (sessionUser) {
    if (sessionUser.role === "staff") {
      const selfEmpId = sessionUser.employeeId || sessionUser.id;
      if (explicitEmployeeId && explicitEmployeeId !== selfEmpId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Bạn không có quyền thực hiện thao tác trên hồ sơ nhân viên khác.",
          403
        );
      }
      return { user: sessionUser, employeeId: selfEmpId };
    }
    return { user: sessionUser, employeeId: explicitEmployeeId || null };
  }
  return { user: null, employeeId: explicitEmployeeId || null };
}

/**
 * Lấy thông tin đăng ký lịch rảnh của nhân viên cho một tuần (US08 - Staff)
 */
export async function getMyAvailability(params = {}) {
  const { weekMonday, employeeId: paramEmpId } = params;
  const { employeeId } = resolveEffectiveEmployeeId(paramEmpId);

  const now = getNow();
  let targetMondayIso = weekMonday;

  if (!targetMondayIso) {
    const curMon = mondayOf(startOfDay(now));
    const nextMon = addDays(curMon, 7);
    targetMondayIso = toISO(nextMon);
  }

  const deadline = calculateDeadline(targetMondayIso);
  const isPastDeadline = now.getTime() > deadline.getTime();

  const mockData = getMockAvailability(employeeId || "NV001", targetMondayIso);

  return {
    ...mockData,
    isPastDeadline,
    isLocked: isPastDeadline,
  };
}

/**
 * Lưu đăng ký lịch rảnh của nhân viên cho một tuần (US08 - Staff)
 */
export async function saveMyAvailability(payload = {}) {
  const { employeeId: paramEmpId, weekMonday, slots, expectedVersion } = payload;
  const { user, employeeId } = resolveEffectiveEmployeeId(paramEmpId);

  if (!employeeId) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "Không xác định được danh tính nhân viên.", 403);
  }
  if (!weekMonday) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Chưa chọn tuần làm việc.", 422);
  }

  const now = getNow();
  const deadline = calculateDeadline(weekMonday);
  if (now.getTime() > deadline.getTime()) {
    throw new AppError(
      ERROR_CODES.DEADLINE_EXCEEDED,
      "Đã hết hạn đăng ký cho tuần này (Hạn chót: 23:59:59 Thứ Sáu trước tuần làm việc).",
      400
    );
  }

  // BACKEND: Lưu đăng ký khả năng làm việc của nhân viên vào bảng employee_availabilities, kiểm tra hạn chót (thứ 6 trước tuần làm việc) và gửi thông báo tổng hợp cho Manager.
  const record = saveMockAvailability(employeeId, weekMonday, slots, {
    expectedVersion,
    userId: user?.userId || user?.id,
  });

  return {
    ok: true,
    data: record,
    ...record,
  };
}

/**
 * Lấy tổng hợp khả năng làm việc của toàn bộ nhân viên theo tuần cho Manager (US09)
 */
export function getWeeklyStaffAvailability(weekMondayIso) {
  return getMockWeeklyAvailability(weekMondayIso);
}

/**
 * Lắng nghe thay đổi (No-op sau khi gỡ db.js)
 */
export function subscribeAvailability() {
  return () => {};
}

/**
 * Đếm số ca rảnh, bận và chưa chọn từ dữ liệu slots
 */
export function countAvailabilitySlots(slots = {}, totalSlots = 21) {
  const values = Object.values(slots || {});
  const available = values.filter((v) => v === "available").length;
  const busy = values.filter((v) => v === "busy").length;
  const unselected = Math.max(0, totalSlots - available - busy);
  return {
    available,
    busy,
    unselected,
  };
}

export default {
  getMyAvailability,
  saveMyAvailability,
  getWeeklyStaffAvailability,
  subscribeAvailability,
  calculateDeadline,
  isEmployeeAvailable,
  countAvailabilitySlots,
};
