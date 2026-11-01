/**
 * Tầng: Bố cục chính (Layout - Employee / Staff)
 * Chức năng: Khung điều hướng giao diện Nhân viên dùng chung AppShell:
 *   - Thanh bên menu trắng bo góc lớn nổi trên nền xanh pastel (--shell-bg: #DCEBF5)
 *   - Panel làm việc nền #F4F7F9 với Header cố định và Vùng nội dung cuộn riêng
 * Bố cục chuẩn theo ảnh mẫu thiết kế (Design Tokens 2026: #0F172A, #CBE3F0, #D9E8F5, #F4F7F9, #DCEBF5)
 */

import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell, MenuIcon } from "../components/NoticeKit";
import { SidebarBrand } from "../components/SidebarBrand";
import AppShell from "../components/AppShell";
import { getTodayAttendanceStatus, subscribeAttendance } from "../services/attendanceService";
import { getNow, isDemoNowActive, isDemoGpsActive, clearDemoNow } from "../lib/dateUtils";


const ACTIVE_PILL = "bg-[#CBE3F0] font-medium text-[#0F172A] shadow-2xs";
const IDLE_PILL = "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900";

const DATE_FMT = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function LiveClock() {
  const [now, setNow] = useState(() => getNow());
  useEffect(() => {
    const t = setInterval(() => setNow(getNow()), 1000);
    return () => clearInterval(t);
  }, []);
  const dateStr = DATE_FMT.format(now);
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  return (
    <p className="truncate text-[13.5px] font-normal text-slate-600">
      {dateCapitalized} · <span className="tabular-nums font-medium">{TIME_FMT.format(now)}</span>
    </p>
  );
}

function initials(name = "") {
  if (!name || typeof name !== "string") return "NV";
  const clean = name.replace(/\([^)]*\)/g, "").trim();
  const words = clean.split(/\s+/).filter((w) => /[a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/.test(w));
  if (words.length === 0) return "NV";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const first = words[0].match(/[a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/)?.[0] || "";
  const last = words[words.length - 1].match(/[a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/)?.[0] || "";
  return (first + last).toUpperCase() || "NV";
}

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconButton({ label, onClick, className = "", children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0F172A] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20 ${className}`}
    >
      {children}
    </button>
  );
}

// Danh mục menu Staff chia 2 nhóm
const MENU_GROUPS = [
  {
    title: "LỊCH VÀ CA",
    items: [
      { to: "/employees/schedule", icon: "calendar", label: "Lịch của tôi" },
      { to: "/employees/availability", icon: "calendarClock", label: "Đăng ký rảnh/bận" },
      { to: "/employees/shift-exchange", icon: "swap", label: "Đổi ca" },
      { to: "/employees/open-shifts", icon: "userPlus", label: "Ca trực mở" },
    ],
  },
  {
    title: "CÁ NHÂN",
    items: [
      { to: "/employees/leave", icon: "fileText", label: "Nghỉ phép" },
      { to: "/employees/attendance", icon: "clipboardCheck", label: "Chấm công" },
      { to: "/employees/profile", icon: "user", label: "Thông tin cá nhân" },
    ],
  },
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  const [attendanceStatus, setAttendanceStatus] = useState(() =>
    getTodayAttendanceStatus(user?.employeeId || user?.id || "NV001")
  );

  useEffect(() => {
    const update = () => {
      setAttendanceStatus(getTodayAttendanceStatus(user?.employeeId || user?.id || "NV001"));
    };
    update();
    const unsub = subscribeAttendance(update);
    const interval = setInterval(update, 30000);
    return () => {
      unsub?.();
      clearInterval(interval);
    };
  }, [user?.employeeId, user?.id]);

  // Nội dung thanh bên (Sidebar)
  const sidebarContent = (
    <div className="flex h-full flex-col min-h-0">
      {/* Đầu sidebar: Brand Block Staff + Nút đóng trên Mobile */}
      <div className={`flex h-[72px] shrink-0 items-center justify-between border-b border-slate-100 px-4 ${collapsed ? "md:justify-center md:px-0" : ""}`}>
        <SidebarBrand
          subtitle="CỔNG NHÂN VIÊN"
          collapsed={collapsed}
          to="/employees/schedule"
        />
        <IconButton label="Đóng menu" onClick={() => setMobileOpen(false)} className="md:hidden">
          <svg {...svgProps} className="h-5 w-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </IconButton>
      </div>

      {/* Danh sách mục menu chia 2 nhóm */}
      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-3.5 pb-4 pt-2 [scrollbar-width:thin]">
        {MENU_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <p
              className={`px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${
                collapsed ? "md:hidden" : ""
              }`}
            >
              {group.title}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl px-3 py-2.5 text-[14px] transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20 ${
                    collapsed ? "gap-0 md:justify-center md:px-0" : "gap-3"
                  } ${isActive ? ACTIVE_PILL : IDLE_PILL}`
                }
              >
                <MenuIcon name={item.icon} size={18} />
                <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Chân sidebar: Nút Đăng xuất */}
      <div className="shrink-0 border-t border-slate-100 p-3 bg-white">
        <button
          type="button"
          onClick={handleLogout}
          title="Đăng xuất"
          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[14px] font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <svg {...svgProps} className="h-5 w-5 shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          <span className={collapsed ? "md:hidden" : ""}>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <AppShell
      sidebar={sidebarContent}
      collapsed={collapsed}
      mobileOpen={mobileOpen}
      onMobileClose={() => setMobileOpen(false)}
      headerLeft={
        <>
          <IconButton label="Mở menu" onClick={() => setMobileOpen(true)} className="md:hidden">
            <svg {...svgProps} className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </IconButton>
          <IconButton
            label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:grid"
          >
            <svg {...svgProps} className="h-5 w-5">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M9 4v16" />
            </svg>
          </IconButton>
          <LiveClock />
          {/* BACKEND: bỏ cờ demo, dùng giờ máy chủ */}
          {isDemoNowActive() && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11.5px] font-medium text-amber-900">
              <span>Giờ demo{isDemoGpsActive() ? " · GPS demo" : ""}</span>
              <button
                type="button"
                onClick={() => {
                  clearDemoNow();
                  window.location.href = window.location.pathname;
                }}
                className="underline hover:text-amber-950 font-semibold cursor-pointer ml-0.5"
                title="Thoát giờ demo"
              >
                Thoát giờ demo
              </button>
            </span>
          )}
        </>
      }
      headerSearch={
        <div className="relative w-full">
          <svg
            {...svgProps}
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Tìm ca của tôi..."
            className="h-9 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-[13.5px] outline-none placeholder:text-slate-400 focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10 transition-all shadow-2xs"
          />
        </div>
      }
      headerRight={
        <>
          {attendanceStatus?.showChip && (
            <Link
              to="/employees/attendance"
              title="Bấm để tới trang Chấm công"
              className={`hidden lg:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                attendanceStatus?.isCheckedIn
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : attendanceStatus?.canCheckIn
                    ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  attendanceStatus?.isCheckedIn
                    ? "bg-emerald-500"
                    : attendanceStatus?.canCheckIn
                      ? "bg-amber-500 animate-pulse"
                      : "bg-[#0F172A]"
                }`}
              />
              <span className="truncate max-w-[180px]">{attendanceStatus?.label}</span>
            </Link>
          )}

          <NotificationBell />

          <div className="flex items-center gap-2 pl-1">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold bg-[#CBE3F0] text-[#0F172A] shadow-2xs"
              title={`${user?.name || "Nhân viên"} (${user?.employeeId || "NV"})`}
            >
              {initials(user?.name)}
            </span>
            <span className="hidden sm:inline-block text-[14px] font-medium text-slate-800 truncate max-w-[140px]">
              {user?.name || "Nhân viên"}
            </span>
          </div>
        </>
      }
    >
      <Outlet />
    </AppShell>
  );
}
