/**
 * File: src/pages/employees/leave/leaveHelpers.js
 * Các hàm tiện ích & cấu hình trạng thái cho trang Nghỉ phép Staff (US20, US21)
 */

import { getNow } from "../../../lib/dateUtils.js";

export const STATUS_LABELS = {
  pending: "Chờ duyệt",
  pending_approval: "Chờ duyệt",
  approved: "Đã duyệt",
  replacement_confirmed: "Đã duyệt",
  rejected: "Bị từ chối",
  cancelled: "Đã hủy",
};

export const STATUS_TONES = {
  pending: "warning",
  pending_approval: "warning",
  approved: "success",
  replacement_confirmed: "success",
  rejected: "error",
  cancelled: "neutral",
};

export function statusOf(request) {
  return String(request?.status || "pending").toLowerCase();
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

export function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function mondayOf(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function timeText(value) {
  if (!value) return "--:--";
  const match = String(value).match(/(?:T|\s)?(\d{2}:\d{2})/);
  if (match) return match[1];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function localDateTime(date, time) {
  const value = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  const [hour = 0, minute = 0] = String(time ?? "00:00").slice(0, 5).split(":").map(Number);
  value.setHours(hour, minute, 0, 0);
  return value;
}

export function normalizeShifts(payload) {
  const body = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  const schedule = body?.schedule && !Array.isArray(body.schedule) ? { ...body, ...body.schedule } : body;
  const published = schedule?.published ?? schedule?.official_published ?? schedule?.is_official_published ?? schedule?.isOfficialPublished ?? schedule?.is_published;
  if (published === false || ["0", "false", "no"].includes(String(published).toLowerCase())) return [];
  const values = Array.isArray(schedule) ? schedule : schedule?.myShifts ?? schedule?.shifts ?? schedule?.events ?? schedule?.schedule_items ?? [];

  return values
    .filter((shift) => {
      const official = shift.published ?? shift.is_official ?? shift.isOfficial;
      const type = String(shift.schedule_type ?? shift.type ?? "").toLowerCase();
      return official !== false
        && !["0", "false", "no"].includes(String(official).toLowerCase())
        && !["draft", "unofficial", "proposed", "pending"].includes(type);
    })
    .map((shift, index) => {
      const date = String(shift.date ?? shift.shift_date ?? shift.work_date ?? shift.start_at ?? shift.starts_at ?? "").slice(0, 10);
      const startTime = timeText(shift.start_time ?? shift.startTime ?? shift.starts_at ?? shift.start_at);
      const endTime = timeText(shift.end_time ?? shift.endTime ?? shift.ends_at ?? shift.end_at);
      const role = shift.role_tag ?? shift.roleTag ?? shift.role?.name ?? shift.required_role?.name;
      const status = String(shift.status ?? shift.request_status ?? shift.leave_status ?? "").toLowerCase();
      return {
        id: shift.id ?? shift.schedule_shift_id ?? `${date}-${startTime}-${index}`,
        date,
        shiftName: shift.shift_name ?? shift.shiftName ?? shift.name ?? "Ca làm việc",
        startTime,
        endTime,
        roleTag: Array.isArray(role)
          ? role.map((item) => typeof item === "object" ? item.name ?? item.label : item).filter(Boolean).join(", ")
          : typeof role === "object"
            ? role?.name ?? role?.label ?? "Chưa xác định"
            : role ?? "Chưa xác định",
        status,
        startsAt: localDateTime(date, startTime),
      };
    })
    .filter((shift) => shift.date && shift.startsAt > getNow() && !/pending_(exchange|leave)|leave_pending|waiting/.test(shift.status))
    .sort((a, b) => a.startsAt - b.startsAt);
}

export function listFrom(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.requests)) return payload.requests;
  return [];
}

export function formatDate(value, includeWeekday = true) {
  if (!value) return "Chưa có thông tin ca";
  const str = String(value).trim();
  if (/^(Thứ|Chủ|CN|T\d)/i.test(str)) {
    return str;
  }
  let dateObj;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [year, month, day] = str.slice(0, 10).split("-").map(Number);
    dateObj = new Date(year, month - 1, day);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const [day, month, year] = str.slice(0, 10).split("/").map(Number);
    dateObj = new Date(year, month - 1, day);
  } else {
    dateObj = new Date(str);
  }
  if (!dateObj || Number.isNaN(dateObj.getTime())) return str;
  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  const weekdayStr = includeWeekday
    ? `${dateObj.toLocaleDateString("vi-VN", { weekday: "short" })}, `
    : "";
  return `${weekdayStr}${d}/${m}/${y}`;
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

export function shiftFromRequest(request, shiftsList = []) {
  const shiftObj = request.shift ?? request.schedule_shift ?? request.work_shift ?? null;
  const shiftId = request.shift_id ?? request.shiftId ?? shiftObj?.id;
  const matchedScheduleShift = shiftsList.find((s) => String(s.id) === String(shiftId));

  const dateVal =
    request.shiftDate ??
    request.isoDate ??
    request.date ??
    request.shift_date ??
    shiftObj?.shiftDate ??
    shiftObj?.date ??
    matchedScheduleShift?.date;

  const nameVal =
    request.shiftName ??
    request.shift_name ??
    request.name ??
    shiftObj?.shiftName ??
    shiftObj?.shift_name ??
    shiftObj?.name ??
    matchedScheduleShift?.shiftName;

  const timeVal =
    request.shiftTime ??
    request.time ??
    (request.startTime && request.endTime ? `${request.startTime} - ${request.endTime}` : null) ??
    (shiftObj?.startTime && shiftObj?.endTime ? `${shiftObj.startTime} - ${shiftObj.endTime}` : null) ??
    (shiftObj?.start_time && shiftObj?.end_time ? `${shiftObj.start_time} - ${shiftObj.end_time}` : null) ??
    (matchedScheduleShift ? `${matchedScheduleShift.startTime} - ${matchedScheduleShift.endTime}` : null);

  const roleTag =
    request.roleTag ??
    request.role_tag ??
    shiftObj?.roleTag ??
    shiftObj?.role_tag ??
    matchedScheduleShift?.roleTag;

  return {
    id: shiftId,
    date: dateVal,
    shiftName: nameVal,
    time: timeVal,
    roleTag,
    hasShiftInfo: Boolean(dateVal || nameVal),
  };
}

export function formatSubmittedAt(request) {
  const raw = request.createdAt ?? request.created_at ?? request.submitted_at ?? request.sent_at;
  if (!raw) return "—";
  const str = String(raw).trim();
  const dmyMatch = str.match(/^(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+|T)(\d{2}:\d{2})/);
  if (dmyMatch) {
    return `${dmyMatch[1]} · ${dmyMatch[2]}`;
  }
  const dateObj = new Date(str);
  if (Number.isNaN(dateObj.getTime())) {
    return str;
  }
  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  const time = dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${d}/${m}/${y} · ${time}`;
}

export function getCancelEligibility(req, openShifts = []) {
  const s = statusOf(req);
  if (["cancelled", "rejected"].includes(s)) {
    return { canCancel: false, reason: null };
  }
  if (s === "replacement_confirmed") {
    return { canCancel: false, reason: "Không thể hủy vì đã có người thay thế" };
  }
  const reqDate = req.date || req.shift_date;
  const linkedOpen = openShifts.find(
    (os) => !os.cancelled && os.date === reqDate && (os.shiftName === req.shiftName || os.shiftId === req.shiftId || os.shiftCode === req.shiftId)
  );
  if (linkedOpen) {
    const isFilled = linkedOpen.status === "filled" || (linkedOpen.claims && linkedOpen.claims.length > 0);
    if (isFilled) {
      return { canCancel: false, reason: "Không thể hủy vì đã có người nhận ca" };
    }
    return {
      canCancel: true,
      hasOpenShift: true,
      reason: null,
    };
  }
  if (["pending", "pending_approval", "approved", "replacement_pending"].includes(s)) {
    return { canCancel: true, reason: null };
  }
  return { canCancel: false, reason: null };
}

export function errorText(error) {
  return error?.response?.data?.message ?? error?.message ?? "Không thể thực hiện thao tác. Vui lòng thử lại.";
}
