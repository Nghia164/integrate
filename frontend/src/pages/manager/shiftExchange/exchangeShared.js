// Hằng số và hàm nhỏ dùng chung cho trang Đổi ca.

export const DEFAULT_FILTERS = { status: "all", role: "all", q: "" };
export const PAGE_SIZES = [7, 10, 20];

// Tab trạng thái. "rejected" gộp cả yêu cầu bị từ chối lẫn đã hủy.
export const TABS = [
  ["all", "Tất cả"],
  ["pending_manager", "Chờ quản lý duyệt"],
  ["pending_peer", "Chờ đồng nghiệp"],
  ["approved", "Đã phê duyệt"],
  ["rejected", "Từ chối / Đã hủy"],
];

// Huy hiệu trạng thái trong bảng: nhãn + màu chấm
export const STATUS_META = {
  pending_manager: { label: "Chờ quản lý duyệt", hex: "#f59e0b" },
  pending_peer: { label: "Chờ đồng nghiệp", hex: "#0ea5e9" },
  approved: { label: "Đã phê duyệt", hex: "#10b981" },
  rejected: { label: "Bị từ chối", hex: "#f43f5e" },
  cancelled: { label: "Đã hủy", hex: "#94a3b8" },
};

export const ROLE_OPTIONS = [
  { value: "Phục vụ", label: "Phục vụ" },
  { value: "Pha chế", label: "Pha chế" },
  { value: "Thu ngân", label: "Thu ngân" },
];

// Màu khung thông báo theo loại
export const NOTICE_STYLE = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

// Yêu cầu có thuộc tab nào: tab "rejected" gồm cả "cancelled".
export const inTab = (req, tab) => tab === "all" || req.status === tab || (tab === "rejected" && req.status === "cancelled");

// Chữ cái đầu của họ và tên, dùng cho ảnh đại diện tròn
export const initialsOf = (name = "") => {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  return (p.length > 1 ? p[p.length - 2][0] + p[p.length - 1][0] : p[0][0]).toUpperCase();
};

// Ca làm viết đầy đủ, dùng trong hộp thoại chi tiết: "Ca tối (17:00 - 22:00)".
export const shiftText = (s) => `${s.shiftName} (${s.time})`;

// Bản gọn cho bảng: "Tối · 17:00–22:00" và ngày bỏ năm ("Thứ 2, 13/10"). Ca null nghĩa là người nhận chỉ trực thay.
export const shiftBrief = (s) => {
  const name = s.shiftName.replace(/^Ca\s+/i, "");
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} · ${s.time.replace(/\s*-\s*/, "–")}`;
};
export const dateBrief = (d) => d.replace(/\/\d{4}$/, "");
