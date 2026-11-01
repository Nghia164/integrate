/**
 * File: src/components/NoticeKit.jsx
 * Bộ thành phần Thông báo & Nhận diện: NoticeBar, NotificationBell, Logo, MenuIcon
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  X,
  ArrowLeftRight,
  Calendar,
  Clock,
  UserX,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import logoUrl from "../assets/logo.png";
import { useAuth } from "../context/AuthContext.jsx";
import { getNotifications, markAsRead } from "../services/notificationService.js";
import { useLiveData } from "../lib/hooks.js";
import { Z_INDEX } from "../lib/layoutTokens.js";
import { NEXT_SHIFT_BAR } from "../lib/shiftColors.js";
import { StatusBadge, Avatar } from "./TableKit.jsx";
import { formatRelativeTime } from "../lib/formatters.js";

export function getNotificationIcon(type) {
  switch (type) {
    case "leave":
      return <Calendar className="h-4 w-4 text-amber-500 shrink-0" />;
    case "exchange":
      return <ArrowLeftRight className="h-4 w-4 text-sky-500 shrink-0" />;
    case "availability":
      return <Clock className="h-4 w-4 text-emerald-500 shrink-0" />;
    case "employee":
      return <UserX className="h-4 w-4 text-rose-500 shrink-0" />;
    case "schedule":
    default:
      return <CalendarDays className="h-4 w-4 text-indigo-500 shrink-0" />;
  }
}

// =============================================================================
// 1. LOGO & SIDEBAR BRAND
// =============================================================================

export { SidebarBrand } from "./SidebarBrand.jsx";

export function Logo({ compact = false, role = "" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#CBE3F0] p-1.5 shadow-2xs">
        <img src={logoUrl} alt="Smart Scheduling" className="h-full w-full object-contain" />
      </div>
      {!compact && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-[16px] font-bold tracking-tight text-[#0F172A]">
              Smart Scheduling
            </span>
            {role && (
              <span className="rounded-md bg-[#D9E8F5] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#0F172A] shrink-0">
                {role}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 2. MENU ICON
// =============================================================================

const PATHS = {
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h10" />
      <path d="M18 6h2" />
      <circle cx="16" cy="6" r="2" />
      <path d="M4 12h2" />
      <path d="M10 12h10" />
      <circle cx="8" cy="12" r="2" />
      <path d="M4 18h10" />
      <path d="M18 18h2" />
      <circle cx="16" cy="18" r="2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  swap: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  checkCircle: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  dollar: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  barChart: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  bot: (
    <>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </>
  ),
  user: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  userPlus: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </>
  ),
  fileText: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </>
  ),
  clipboardCheck: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  wallet: (
    <>
      <path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </>
  ),
  sparkles: (
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3Z" />
  ),
  calendarClock: (
    <>
      <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h5" />
      <path d="M17.5 17.5 16 16.3V14" />
      <circle cx="16" cy="16" r="6" />
    </>
  ),
};

const ALIASES = {
  dashboard: "home",
  employees: "users",
  shiftConfig: "sliders",
  schedule: "calendar",
  availability: "calendarClock",
  workHours: "clock",
  shiftExchange: "swap",
  openShifts: "userPlus",
  leave: "fileText",
  attendance: "clipboardCheck",
  payroll: "wallet",
  dollarSign: "dollar",
  dollar: "dollar",
  reports: "chart",
  assistant: "sparkles",
  profile: "user",
};

export function MenuIcon({ name, size = 18, className = "h-5 w-5", style, ...props }) {
  const actualKey = ALIASES[name] || name;
  const pathContent = PATHS[actualKey];
  if (!pathContent) {
    if (actualKey === "home" || actualKey === "dashboard") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={style}
          aria-hidden="true"
          {...props}
        >
          {PATHS.home}
        </svg>
      );
    }
    return null;
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      {...props}
    >
      {pathContent}
    </svg>
  );
}

// =============================================================================
// 3. NOTICE BAR
// =============================================================================

const TONE_DOT_COLORS = {
  warning: "#F59E0B",
  danger: "#E11D48",
  error: "#E11D48",
  success: "#10B981",
  info: "#2B9FCF",
  neutral: "#94A3B8",
};

export function NoticeBar({
  label = "Thông báo",
  message,
  children,
  dotColor,
  badge,
  badgeTone = "warning",
  action,
  className = "",
  rightContent,
}) {
  const activeDot = dotColor || TONE_DOT_COLORS[badgeTone] || TONE_DOT_COLORS.warning;
  const right = action || rightContent;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all text-[#0F172A] ${className}`}
      style={{
        backgroundColor: NEXT_SHIFT_BAR.bg,
        borderColor: NEXT_SHIFT_BAR.border,
      }}
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {label && (
          <span className="text-[14px] font-normal text-slate-700 shrink-0">
            {label.endsWith(":") ? label : `${label}:`}
          </span>
        )}
        <div className="flex items-center gap-2 text-[14px] font-normal text-[#0F172A] min-w-0">
          {activeDot && (
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: activeDot }}
              aria-hidden="true"
            />
          )}
          <span className="font-normal break-words sm:truncate">
            {message || children}
          </span>
        </div>
      </div>
      {(badge || right) && (
        <div className="flex items-center gap-2.5 shrink-0">
          {badge && <StatusBadge tone={badgeTone}>{badge}</StatusBadge>}
          {right}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 4. NOTIFICATION BELL
// =============================================================================

function notificationList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.notifications)) return payload.data.notifications;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, right: 0, width: 352 });

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const result = await getNotifications({ limit: 15 });
      setNotifications(notificationList(result));
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useLiveData(() => {
    loadNotifications();
  }, [loadNotifications]);

  const updateCoords = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = Math.min(352, window.innerWidth - 32);
    const right = Math.max(16, window.innerWidth - rect.right);
    setCoords({
      top: rect.bottom + 8,
      right,
      width: dropdownWidth,
    });
  }, []);

  useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
      return () => {
        window.removeEventListener("resize", updateCoords);
        window.removeEventListener("scroll", updateCoords, true);
      };
    }
  }, [open, updateCoords]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read_at && !n.is_read).length;

  const handleOpen = () => {
    if (!open) {
      loadNotifications();
    }
    setOpen((prev) => !prev);
  };

  const handleItemClick = async (notif) => {
    if (!notif.read_at && !notif.is_read) {
      try {
        await markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString(), is_read: true } : n))
        );
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        aria-label="Thông báo"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-amber-500 animate-pulse" />
        ) : (
          <Bell className="h-5 w-5 text-slate-600" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-[10.5px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              right: `${coords.right}px`,
              width: `${coords.width}px`,
              zIndex: Z_INDEX.dropdown,
            }}
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl animate-in fade-in-50 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70">
              <span className="text-[14px] font-semibold text-slate-900">Thông báo</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-slate-400">Không có thông báo mới</div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                      !n.read_at && !n.is_read ? "bg-sky-50/40" : ""
                    }`}
                  >
                    <div className="mt-0.5 rounded-lg bg-slate-100 p-1.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-[13px] font-semibold text-slate-800 truncate">
                          {n.title || n.message}
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>
                      {n.content && (
                        <div className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">
                          {n.content}
                        </div>
                      )}
                    </div>
                    {!n.read_at && !n.is_read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-slate-100 bg-slate-50/70 p-2.5 text-center">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(user?.role === "manager" ? "/manager/notifications" : "/employees/notifications");
                }}
                className="inline-flex items-center justify-center gap-1.5 w-full text-[13px] font-semibold text-sky-600 hover:text-sky-700 py-1.5 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
              >
                <span>Xem tất cả thông báo</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export const Badge = StatusBadge;
export const Notice = NoticeBar;

export default {
  Logo,
  MenuIcon,
  NoticeBar,
  NotificationBell,
  StatusBadge,
  Avatar,
  Badge,
  Notice,
};
