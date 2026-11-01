/**
 * File: src/pages/employees/shiftExchange/shiftExchangeHelpers.js
 * Các hàm tiện ích & cấu hình cho trang Đổi ca Staff (US15, US16, US17)
 */

export const STATUS_LABELS = {
  pending_peer: "Chờ đồng nghiệp",
  pending_employee: "Chờ đồng nghiệp",
  pending_manager: "Chờ Quản lý duyệt",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
  declined: "Đồng nghiệp từ chối",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};

export const STATUS_TONES = {
  pending_peer: "warning",
  pending_employee: "warning",
  pending_manager: "info",
  approved: "success",
  rejected: "error",
  declined: "error",
  cancelled: "neutral",
  expired: "neutral",
};

export function requestStatus(request) {
  const raw = String(request?.status ?? "pending_employee").toLowerCase();
  if (raw === "pending_peer") return "pending_employee";
  return raw;
}

export function stripAccents(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(dateStr, includeWeekday = false) {
  if (!dateStr) return "Chưa có thông tin ca";
  const str = String(dateStr).trim();
  if (/^(Thứ|Chủ|CN|T\d)/i.test(str)) return str;
  let dObj;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.slice(0, 10).split("-").map(Number);
    dObj = new Date(y, m - 1, d);
  } else {
    dObj = new Date(str);
  }
  if (!dObj || Number.isNaN(dObj.getTime())) return str;
  const d = String(dObj.getDate()).padStart(2, "0");
  const m = String(dObj.getMonth() + 1).padStart(2, "0");
  const y = dObj.getFullYear();
  const weekday = includeWeekday
    ? `${dObj.toLocaleDateString("vi-VN", { weekday: "short" })}, `
    : "";
  return `${weekday}${d}/${m}/${y}`;
}

export function formatShiftName(name) {
  if (!name) return "Ca làm việc";
  const trimmed = String(name).trim();
  if (/^ca\s+/i.test(trimmed)) return trimmed;
  return `Ca ${trimmed}`;
}

export function formatTimeRange(timeStr) {
  if (!timeStr) return "--:-- – --:--";
  const str = String(timeStr).trim();
  if (str.includes(" - ")) return str.replace(" - ", " – ");
  if (str.includes("-")) return str.replace("-", " – ");
  return str;
}

export function shiftFromRequest(request) {
  const shiftObj = request.shift ?? request.schedule_shift ?? request.work_shift ?? null;
  const shiftId = request.shift_id ?? request.shiftId ?? shiftObj?.id;
  const dateVal =
    request.shiftDate ??
    request.isoDate ??
    request.date ??
    request.shift_date ??
    shiftObj?.shiftDate ??
    shiftObj?.date;
  const nameVal =
    request.shiftName ??
    request.shift_name ??
    request.name ??
    shiftObj?.shiftName ??
    shiftObj?.shift_name ??
    shiftObj?.name;
  const timeVal =
    request.shiftTime ??
    request.time ??
    (request.startTime && request.endTime ? `${request.startTime} - ${request.endTime}` : null) ??
    (shiftObj?.startTime && shiftObj?.endTime ? `${shiftObj.startTime} - ${shiftObj.endTime}` : null) ??
    (shiftObj?.start_time && shiftObj?.end_time ? `${shiftObj.start_time} - ${shiftObj.end_time}` : null);
  const roleTag =
    request.roleTag ??
    request.role_tag ??
    shiftObj?.roleTag ??
    shiftObj?.role_tag;

  return {
    id: shiftId,
    date: dateVal,
    shiftName: nameVal,
    time: timeVal,
    roleTag,
    hasShiftInfo: Boolean(dateVal || nameVal),
  };
}

export function sentAt(request) {
  const raw = request.createdAt ?? request.created_at ?? request.createdDate ?? request.submitted_at;
  if (!raw) return "—";
  const str = String(raw).trim();
  const dmyMatch = str.match(/^(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+|T)(\d{2}:\d{2})/);
  if (dmyMatch) return `${dmyMatch[1]} · ${dmyMatch[2]}`;
  const dObj = new Date(str);
  if (Number.isNaN(dObj.getTime())) return str;
  const d = String(dObj.getDate()).padStart(2, "0");
  const m = String(dObj.getMonth() + 1).padStart(2, "0");
  const y = dObj.getFullYear();
  const t = dObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${d}/${m}/${y} · ${t}`;
}
