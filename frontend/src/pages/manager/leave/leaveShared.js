// Hằng số và hàm nhỏ dùng chung cho trang Đơn xin nghỉ.

export const DEFAULT_FILTERS = { status: "all", role: "all", type: "all", q: "" };
export const PAGE_SIZES = [7, 10, 20];

// Tab trạng thái: [mã, nhãn ngắn]
export const TABS = [
  ["all", "Tất cả"],
  ["pending", "Chờ duyệt"],
  ["approved", "Cần người thay"],
  ["replacement_pending", "Chờ xác nhận"],
  ["replacement_confirmed", "Đã có người thay"],
  ["rejected", "Đã từ chối"],
];

// Huy hiệu trạng thái trong bảng: nhãn + màu chấm
export const STATUS_META = {
  pending: { label: "Chờ duyệt", hex: "#f59e0b" },
  approved: { label: "Đã duyệt", hex: "#3b82f6" },
  replacement_pending: { label: "Chờ xác nhận", hex: "#8b5cf6" },
  replacement_confirmed: { label: "Đã có người thay", hex: "#10b981" },
  rejected: { label: "Đã từ chối", hex: "#f43f5e" },
  cancelled: { label: "Đã hủy", hex: "#94a3b8" },
};

export const STATUS = {
  pending: { label: "Chờ duyệt", hex: "#f59e0b" },
  approved: { label: "Đã duyệt, cần người thay", hex: "#0ea5e9" },
  replacement_pending: { label: "Chờ người thay xác nhận", hex: "#8b5cf6" },
  replacement_confirmed: { label: "Đã có người thay", hex: "#10b981" },
  rejected: { label: "Đã từ chối", hex: "#f43f5e" },
  cancelled: { label: "Đã hủy", hex: "#94a3b8" },
};

import { STANDARD_ROLES } from "../../../services/shiftConfigService";

export const roleLabel = (tag) => tag ?? "";

export const LEAVE_TYPES = { emergency: "Nghỉ ốm đột xuất", planned: "Nghỉ việc cá nhân" };

export const outlineBtn =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[14px] font-medium text-slate-900 hover:bg-slate-50";

export const ROLE_OPTIONS = STANDARD_ROLES.map((r) => ({ value: r, label: r }));

export const TYPE_OPTIONS = [
  { value: "emergency", label: "Đột xuất" },
  { value: "planned", label: "Kế hoạch" },
];

// Màu khung thông báo theo loại (giống khung xanh lá của trang Quản lý nhân viên)
export const NOTICE_STYLE = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

// Chữ cái đầu của họ và tên, dùng cho ảnh đại diện tròn
export const initialsOf = (name = "") => {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  return (p.length > 1 ? p[p.length - 2][0] + p[p.length - 1][0] : p[0][0]).toUpperCase();
};
