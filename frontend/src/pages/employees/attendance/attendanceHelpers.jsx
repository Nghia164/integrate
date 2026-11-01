// =============================================================================
// FILE NÀY LÀM GÌ: Tiện ích xử lý dữ liệu và định dạng chấm công nhân viên (Staff)
// Loại: Helpers
// US: US24 (Check-in/Check-out), US25/US26 (Lịch sử & Giải trình)
// =============================================================================

export const TIME_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "month", label: "Tháng này" },
  { id: "week", label: "Tuần này" },
];

export const STATUS_MAP = {
  on_time: { label: "Đúng giờ", tone: "success" },
  completed: { label: "Đúng giờ", tone: "success" },
  checked_out: { label: "Đúng giờ", tone: "success" },
  late: { label: "Đi trễ", tone: "warning" },
  early_departure: { label: "Về sớm", tone: "warning" },
  absent: { label: "Vắng mặt", tone: "danger" },
  missing_checkout: { label: "Thiếu giờ ra", tone: "danger" },
  missing_check_out: { label: "Thiếu giờ ra", tone: "danger" },
  on_leave: { label: "Nghỉ phép", tone: "info" },
  upcoming: { label: "Chưa diễn ra", tone: "neutral" },
  in_progress: { label: "Đang diễn ra", tone: "info" },
  checked_in: { label: "Đang diễn ra", tone: "info" },
};

/**
 * Chuyển ngày sang chuỗi ISO yyyy-mm-dd
 */
export function toIsoDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Lấy mốc Thứ 2 của tuần
 */
export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Định dạng giờ phút hiển thị HH:mm
 */
export function formatClock(val) {
  if (!val) return "--:--";
  const str = String(val).trim();
  const match = str.match(/(\d{2}:\d{2})/);
  if (match) return match[1];
  const d = new Date(val);
  if (!Number.isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return str.slice(0, 5);
}

/**
 * Định dạng ngày hiển thị dd/MM/yyyy
 */
export function formatDate(val) {
  if (!val) return "—";
  const str = String(val).slice(0, 10);
  const parts = str.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(val);
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return String(val);
}

/**
 * Định dạng thời lượng làm việc (phút -> X giờ Y phút)
 */
export function formatDuration(minutes) {
  const safe = Math.max(0, Number(minutes) || 0);
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

/**
 * Bỏ dấu tiếng Việt để tìm kiếm
 */
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
