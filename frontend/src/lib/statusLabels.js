/**
 * File: src/lib/statusLabels.js
 * Định nghĩa nhãn trạng thái và cấu hình màu sắc dùng chung
 */

export const SCHEDULE_STATUS = {
  draft: { label: "Bản nháp", tone: "neutral" },
  official: { label: "Đã công bố", tone: "success" },
};

export const EXCHANGE_STATUS = {
  pending_peer: { label: "Chờ đồng nghiệp", tone: "warning", hex: "#D97706" },
  pending_employee: { label: "Chờ đồng nghiệp", tone: "warning", hex: "#D97706" },
  pending_manager: { label: "Chờ Manager duyệt", tone: "info", hex: "#2563EB" },
  pending_approval: { label: "Chờ Manager duyệt", tone: "info", hex: "#2563EB" },
  pending: { label: "Chờ Manager duyệt", tone: "info", hex: "#2563EB" },
  approved: { label: "Đã duyệt", tone: "success", hex: "#059669" },
  rejected: { label: "Bị từ chối", tone: "danger", hex: "#DC2626" },
  rejected_peer: { label: "Đồng nghiệp từ chối", tone: "danger", hex: "#DC2626" },
  rejected_employee: { label: "Đồng nghiệp từ chối", tone: "danger", hex: "#DC2626" },
  cancelled: { label: "Đã hủy", tone: "neutral", hex: "#64748B" },
  expired: { label: "Hết hạn", tone: "neutral", hex: "#94A3B8" },
};

export const ATTENDANCE_STATUS = {
  on_time: { label: "Đúng giờ", tone: "success", hex: "#10b981", code: "On-Time" },
  late: { label: "Đi trễ", tone: "warning", hex: "#f59e0b", code: "Late" },
  early_departure: { label: "Về sớm", tone: "warning", hex: "#0ea5e9", code: "Early-Departure" },
  absent: { label: "Vắng mặt", tone: "danger", hex: "#f43f5e", code: "Absent" },
  missing_checkout: { label: "Thiếu giờ ra", tone: "danger", hex: "#8b5cf6", code: "Missing-Checkout" },
  on_leave: { label: "Nghỉ phép", tone: "info", hex: "#a855f7", code: "On-Leave" },
  upcoming: { label: "Chưa diễn ra", tone: "neutral", hex: "#94a3b8", code: "Upcoming" },
  in_progress: { label: "Đang diễn ra", tone: "info", hex: "#3F62C4", code: "In-Progress" },
  completed: { label: "Đã hoàn thành", tone: "success", hex: "#10b981", code: "Completed" },
};

export const ATTENDANCE_CODE_MAP = {
  "On-Time": ATTENDANCE_STATUS.on_time,
  Late: ATTENDANCE_STATUS.late,
  "Early-Departure": ATTENDANCE_STATUS.early_departure,
  Absent: ATTENDANCE_STATUS.absent,
  "Missing-Checkout": ATTENDANCE_STATUS.missing_checkout,
  "On-Leave": ATTENDANCE_STATUS.on_leave,
  Upcoming: ATTENDANCE_STATUS.upcoming,
  "In-Progress": ATTENDANCE_STATUS.in_progress,
};

/**
 * Chỉ cho phép giải trình với: Đi trễ, Về sớm, Vắng mặt, Thiếu giờ ra
 * KHÔNG hiện ở: Đúng giờ, Chưa diễn ra, Đang diễn ra, Nghỉ phép
 */
export function isEligibleForExplanation(status) {
  const norm = String(status || "").toLowerCase().replace(/[\s_]+/g, "-");
  return (
    norm === "late" ||
    norm === "early-departure" ||
    norm === "absent" ||
    norm === "missing-checkout"
  );
}

export function getExchangeStatusInfo(statusKey) {
  const key = String(statusKey || "").toLowerCase();
  return EXCHANGE_STATUS[key] || { label: statusKey || "Chờ xử lý", tone: "neutral" };
}

export function getAttendanceStatusInfo(statusKey) {
  if (!statusKey) return { label: "Chưa rõ", tone: "neutral", hex: "#94a3b8", code: "" };
  if (ATTENDANCE_CODE_MAP[statusKey]) return ATTENDANCE_CODE_MAP[statusKey];
  const key = String(statusKey).toLowerCase().replace(/[\s-]+/g, "_");
  if (ATTENDANCE_STATUS[key]) return ATTENDANCE_STATUS[key];
  if (key === "in_progress" || key === "inprogress") return ATTENDANCE_STATUS.in_progress;
  if (key === "missing_checkout" || key === "missing_check_out") return ATTENDANCE_STATUS.missing_checkout;
  if (key === "early_departure" || key === "early") return ATTENDANCE_STATUS.early_departure;
  if (key === "on_leave" || key === "leave") return ATTENDANCE_STATUS.on_leave;
  if (key === "on_time" || key === "ontime") return ATTENDANCE_STATUS.on_time;
  return { label: statusKey, tone: "neutral", hex: "#94a3b8", code: statusKey };
}

export const STATUSES = {
  AVAILABILITY: {
    DRAFT: "draft",
    SUBMITTED: "submitted",
  },
  LEAVE: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
  },
  SHIFT_EXCHANGE: {
    PENDING_PEER: "pending_peer",
    PENDING_MANAGER: "pending_manager",
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
  },
  OPEN_SHIFT: {
    OPEN: "open",
    CLAIMED: "claimed",
    CANCELLED: "cancelled",
  },
};

export const ALLOWED_TRANSITIONS = {
  availability: {
    draft: ["submitted"],
    submitted: ["submitted"],
  },
  leave: {
    pending: ["approved", "rejected", "cancelled"],
    approved: [],
    rejected: [],
    cancelled: [],
  },
  shiftExchange: {
    pending_peer: ["pending_manager", "rejected", "cancelled"],
    pending_manager: ["approved", "rejected", "cancelled"],
    approved: [],
    rejected: [],
    cancelled: [],
  },
  openShift: {
    open: ["claimed", "cancelled"],
    claimed: [],
    cancelled: [],
  },
};

export function canTransition(entityType, currentStatus, targetStatus) {
  const transitions = ALLOWED_TRANSITIONS[entityType];
  if (!transitions) return false;
  const allowed = transitions[currentStatus];
  if (!allowed) return false;
  return allowed.includes(targetStatus);
}

export function assertTransition(entityType, currentStatus, targetStatus) {
  if (!canTransition(entityType, currentStatus, targetStatus)) {
    throw new Error(
      `Chuyển trạng thái không hợp lệ cho ${entityType}: không thể chuyển từ "${currentStatus}" sang "${targetStatus}".`
    );
  }
}

export default {
  SCHEDULE_STATUS,
  EXCHANGE_STATUS,
  ATTENDANCE_STATUS,
  ATTENDANCE_CODE_MAP,
  isEligibleForExplanation,
  getExchangeStatusInfo,
  getAttendanceStatusInfo,
  STATUSES,
  ALLOWED_TRANSITIONS,
  canTransition,
  assertTransition,
};

