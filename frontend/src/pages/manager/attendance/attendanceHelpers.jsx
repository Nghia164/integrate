// =============================================================================
// FILE NÀY LÀM GÌ: Tiện ích xử lý dữ liệu, định dạng hiển thị và cấu hình cột bảng chấm công
// Loại: Helpers
// US: US25 (Đối soát chấm công), US26 (Điều chỉnh chấm công)
// =============================================================================
/* eslint-disable react-refresh/only-export-components */

import { Person, StatusPill, RowActions } from "../../../components/TableKit";
import { getNow } from "../../../lib/dateUtils";


export const STATUS_META = {
  "On-Time": { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", tint: "bg-emerald-50 text-emerald-600", num: "text-emerald-600", ring: "ring-emerald-300", icon: "clipboardCheck" },
  Late: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500", tint: "bg-amber-50 text-amber-600", num: "text-amber-600", ring: "ring-amber-300", icon: "clock" },
  "Early-Departure": { badge: "bg-sky-50 text-sky-700", dot: "bg-sky-500", tint: "bg-sky-50 text-sky-600", num: "text-sky-600", ring: "ring-sky-300", icon: "calendar" },
  Absent: { badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500", tint: "bg-rose-50 text-rose-600", num: "text-rose-600", ring: "ring-rose-300", icon: "fileText" },
  "Missing-Checkout": { badge: "bg-violet-50 text-violet-700", dot: "bg-violet-500", tint: "bg-violet-50 text-violet-600", num: "text-violet-600", ring: "ring-violet-300", icon: "userPlus" },
  "On-Leave": { badge: "bg-purple-50 text-purple-700", dot: "bg-purple-500", tint: "bg-purple-50 text-purple-600", num: "text-purple-600", ring: "ring-purple-300", icon: "calendar" },
  "In-Progress": { badge: "bg-[#EEF2FB] text-[#314FA4]", dot: "bg-[#3F62C4]", tint: "bg-[#EEF2FB] text-[#314FA4]", num: "text-[#3F62C4]", ring: "ring-[#4A6FD0]", icon: "clock" },
  Upcoming: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400", tint: "bg-slate-100 text-slate-600", num: "text-slate-600", ring: "ring-slate-300", icon: "calendar" },
};

export const STATUS_LIST = Object.keys(STATUS_META);

export const STATUS_VI = {
  "On-Time": "Đúng giờ",
  Late: "Đi trễ",
  "Early-Departure": "Về sớm",
  Absent: "Vắng mặt",
  "Missing-Checkout": "Thiếu giờ ra",
  "On-Leave": "Nghỉ phép",
  "In-Progress": "Đang diễn ra",
  Upcoming: "Chưa diễn ra",
};

export const STATUS_HEX = {
  "On-Time": "#10b981",
  Late: "#f59e0b",
  "Early-Departure": "#0ea5e9",
  Absent: "#f43f5e",
  "Missing-Checkout": "#8b5cf6",
  "On-Leave": "#a855f7",
  "In-Progress": "#3F62C4",
  Upcoming: "#94a3b8",
};

export const PERIOD_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "range", label: "Tùy chọn" },
];

export const ROLE_VI = {
  Shift_Leader: "Quản lý ca",
  Barista: "Pha chế",
  Cashier: "Thu ngân",
  Waiter: "Phục vụ",
  Manager: "Quản lý",
};

export const roleVi = (r) => ROLE_VI[r] ?? String(r).replace(/_/g, " ");

/** Chuyển định dạng HH:MM sang tổng số phút trong ngày */
export const toMin = (hhmm) => {
  if (!hhmm || !String(hhmm).includes(":")) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

/** Định dạng số phút sang chuỗi "XgYY" (ví dụ: 480 -> "8g00") */
export const fmtDuration = (min) =>
  min == null || min < 0 ? "—" : `${Math.floor(min / 60)}g${String(min % 60).padStart(2, "0")}`;

export const pad = (n) => String(n).padStart(2, "0");
export const fmtDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

export const todayISO = () => {
  const d = getNow();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const dateKey = (vn) => vn.split("/").reverse().join("-");

export const AX_START = 6 * 60;
export const AX_END = 23 * 60;
export const AX_TICKS = [6, 10, 14, 18, 22];

export const pct = (m) => Math.min(100, Math.max(0, ((m - AX_START) / (AX_END - AX_START)) * 100));

export const schedParts = (r) => String(r.scheduled ?? "").split(/\s*[-–]\s*/).map(toMin);

/** Trả về nhãn thứ ngày thân thiện (Hôm nay, Hôm qua, Thứ 2...) */
export function dayLabel(vn) {
  const [d, m, y] = vn.split("/").map(Number);
  const date = new Date(y, m - 1, d);
  const today = getNow();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - date) / 86400000);
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Hôm qua";
  const names = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return `${names[date.getDay()]}, ${vn.slice(0, 5)}`;
}

/**
 * Kiểm tra trạng thái bản ghi chấm công có khớp với bộ lọc trạng thái được chọn không
 */
export function matchStatusFilter(recordStatus, filterStatus) {
  if (!filterStatus || filterStatus === "all") return true;
  if (filterStatus === "late_early") {
    return recordStatus === "Late" || recordStatus === "Early-Departure";
  }
  if (filterStatus === "absent_missing") {
    return recordStatus === "Absent" || recordStatus === "Missing-Checkout";
  }
  if (filterStatus === "incomplete") {
    return recordStatus === "Upcoming" || recordStatus === "In-Progress";
  }
  return recordStatus === filterStatus;
}

/** Hiển thị trực quan giờ vào – ra dạng "08:05 ····· 7g55 ····· 16:00" */
export function InOut({ r }) {
  if (r.status === "Absent") return <span className="text-slate-400">Không có dữ liệu</span>;
  if (r.status === "Upcoming") return <span className="text-slate-400">Chưa bắt đầu</span>;
  if (r.status === "On-Leave") return <span className="font-medium text-purple-600">Nghỉ phép</span>;
  if (r.status === "In-Progress" && !r.checkIn) {
    return <span className="font-medium text-[#3F62C4]">Chờ check-in</span>;
  }
  const a = toMin(r.checkIn);
  const b = toMin(r.checkOut);
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap tabular-nums">
      <span>{r.checkIn || "—"}</span>
      <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-400">
        <span className="w-5 border-t border-dotted border-slate-300" />
        {a != null && b != null ? fmtDuration(b - a) : "—"}
        <span className="w-5 border-t border-dotted border-slate-300" />
      </span>
      {r.checkOut ? (
        <span>{r.checkOut}</span>
      ) : (
        <span className="font-medium text-slate-900">{r.status === "In-Progress" ? "Đang làm" : "Chưa có giờ ra"}</span>
      )}
    </span>
  );
}

/** Cấu hình cột hiển thị cho bảng Đối soát chấm công */
export function getAttendanceColumns({ onOpenDetail }) {
  const menuItems = (r) => [
    { label: "Xem chi tiết", onClick: () => onOpenDetail({ employeeId: r.employeeId }) },
    {
      label: r.locked ? "Điều chỉnh (kỳ lương đã chốt)" : "Điều chỉnh",
      disabled: r.locked,
      onClick: () => onOpenDetail({ employeeId: r.employeeId, rowId: r.id }),
    },
  ];

  return [
    { key: "employee", label: "Nhân viên", render: (r) => <Person name={r.employeeName} sub={r.employeeId} /> },
    { key: "date", label: "Ngày", className: "whitespace-nowrap", render: (r) => r.date },
    {
      key: "shift",
      label: "Ca",
      className: "whitespace-nowrap",
      render: (r) => (
        <>
          {r.shiftName}
          <span className="block text-[12px] text-slate-500">{r.scheduled}</span>
        </>
      ),
    },
    { key: "inout", label: "Giờ vào – ra", render: (r) => <InOut r={r} /> },
    {
      key: "late",
      label: "Đi trễ / Về sớm",
      className: "whitespace-nowrap",
      render: (r) =>
        r.lateMin > 0 || r.earlyMin > 0 ? (
          <span className="font-medium">
            {r.lateMin > 0 && <span className="block">Đi trễ {r.lateMin} phút</span>}
            {r.earlyMin > 0 && <span className="block">Về sớm {r.earlyMin} phút</span>}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <StatusPill status={r.status} fixed>{STATUS_VI[r.status] ?? r.status}</StatusPill>
          {r.adjusted && <span title="Đã chỉnh sửa" className="text-[12px] text-slate-500">✎ Đã sửa</span>}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => <RowActions label={`Thao tác với ca của ${r.employeeName}`} items={menuItems(r)} />,
    },
  ];
}
