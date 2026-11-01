/**
 * Tầng: Bố cục chính (Layout - Manager)
 * Chức năng: Khung điều hướng giao diện Quản lý dùng chung AppShell:
 *   - Thanh bên menu trắng bo góc lớn nổi trên nền xanh pastel (--shell-bg: #DCEBF5)
 *   - Panel làm việc nền #F4F7F9 với Header cố định và Vùng nội dung cuộn riêng
 * Bố cục chuẩn theo ảnh mẫu thiết kế (Design Tokens 2026: #0F172A, #CBE3F0, #D9E8F5, #F4F7F9, #DCEBF5)
 */

import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell, MenuIcon } from "../components/NoticeKit";
import { SidebarBrand } from "../components/SidebarBrand";
import AppShell from "../components/AppShell";
import { MENU_GROUPS } from "../lib/menuConfig";
import { getNow, isDemoNowActive, isDemoGpsActive, clearDemoNow } from "../lib/dateUtils";



// Trạng thái mục menu được chọn
const ACTIVE_PILL = "bg-[#CBE3F0] font-medium text-[#0F172A] shadow-2xs";
const IDLE_PILL = "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900";

// ---------- Đồng hồ chạy theo giây ----------
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

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}

function initials(name = "") {
  if (!name || typeof name !== "string") return "QL";
  const clean = name.replace(/\([^)]*\)/g, "").trim();
  const words = clean.split(/\s+/).filter((w) => /[a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/.test(w));
  if (words.length === 0) return "QL";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const first = words[0].match(/[a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/)?.[0] || "";
  const last = words[words.length - 1].match(/[a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/)?.[0] || "";
  return (first + last).toUpperCase() || "QL";
}

// Mục đơn trong menu
function MenuLink({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
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
  );
}

// Mục cha có menu con xổ xuống theo chuẩn Accordion (chỉ 1 nhóm mở tại 1 thời điểm)
function MenuGroup({ item, collapsed, isOpen, onToggle }) {
  const { pathname } = useLocation();

  // Kiểm tra đường dẫn đang khớp mục con nào của nhóm
  const active = item.children
    ? item.children.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`))
    : false;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        title={collapsed ? item.label : undefined}
        className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20 cursor-pointer ${
          collapsed ? "justify-center md:px-0" : "justify-between"
        } ${active ? "font-semibold text-[#0F172A]" : IDLE_PILL}`}
      >
        <span className={`flex items-center ${collapsed ? "gap-0" : "gap-3"}`}>
          <MenuIcon name={item.icon} size={18} />
          <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
        </span>
        <span className={collapsed ? "md:hidden" : ""}>
          <Chevron open={isOpen} />
        </span>
      </button>

      {isOpen && (
        <div className={`ml-[21px] mt-1 flex flex-col gap-0.5 border-l-2 border-[#CBE3F0] pl-3 ${collapsed ? "md:hidden" : ""}`}>
          {item.children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              end
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-[13.5px] transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20 ${
                  isActive ? ACTIVE_PILL : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

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

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

// Tìm nhóm menu cha chứa đường dẫn hiện tại để mở mặc định
function findActiveGroupName(path) {
  for (const group of MENU_GROUPS) {
    for (const item of group.items) {
      if (item.children) {
        if (item.children.some((c) => path === c.to || path.startsWith(`${c.to}/`))) {
          return item.label;
        }
      }
    }
  }
  return null;
}

export default function ManagerLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Accordion state: chỉ 1 nhóm mở tại một thời điểm (chuỗi khóa nhóm hoặc null)
  const [openGroup, setOpenGroup] = useState(() => findActiveGroupName(pathname));

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Tự động mở nhóm chứa đường dẫn đang active khi pathname đổi, hoặc null nếu trang đơn
  useEffect(() => {
    setOpenGroup(findActiveGroupName(pathname));
  }, [pathname]);

  const handleToggleGroup = (label) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroup(label);
    } else {
      setOpenGroup((prev) => (prev === label ? null : label));
    }
  };

  // Nội dung thanh bên (Sidebar)
  const sidebarContent = (
    <div className="flex h-full flex-col min-h-0">
      {/* Đầu sidebar: Brand Block Manager + Nút đóng trên Mobile */}
      <div className={`flex h-[72px] shrink-0 items-center justify-between border-b border-slate-100 px-4 transition-all ${collapsed ? "md:justify-center md:px-0" : ""}`}>
        <SidebarBrand
          subtitle="CỔNG QUẢN LÝ"
          collapsed={collapsed}
          to="/manager/dashboard"
        />
        <IconButton label="Đóng menu" onClick={() => setMobileOpen(false)} className="md:hidden">
          <svg {...svgProps} className="h-5 w-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </IconButton>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-3.5 pb-4 pt-2 [scrollbar-width:thin]">
        {MENU_GROUPS.map((g) => (
          <div key={g.title} className="flex flex-col gap-1">
            <p className={`px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${collapsed ? "md:hidden" : ""}`}>
              {g.title}
            </p>
            {g.items.map((m) =>
              m.children ? (
                <MenuGroup
                  key={m.label}
                  item={m}
                  collapsed={collapsed}
                  isOpen={openGroup === m.label}
                  onToggle={() => handleToggleGroup(m.label)}
                />
              ) : (
                <MenuLink key={m.to} item={m} collapsed={collapsed} />
              )
            )}
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
            placeholder="Tìm kiếm nhanh..."
            className="h-9 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-[13.5px] outline-none placeholder:text-slate-400 focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10 transition-all shadow-2xs"
          />
        </div>
      }
      headerRight={
        <>
          <NotificationBell />

          <div className="flex items-center gap-2 pl-1">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold bg-[#CBE3F0] text-[#0F172A] shadow-2xs"
              title={`${user?.name || "Quản lý"}`}
            >
              {initials(user?.name)}
            </span>
            <span className="hidden sm:inline-block text-[14px] font-medium text-slate-800 truncate max-w-[140px]">
              {user?.name || "Quản lý"}
            </span>
          </div>
        </>
      }
    >
      <Outlet />
    </AppShell>
  );
}
