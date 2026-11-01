import { useLocation, NavLink } from "react-router-dom";
import { Button } from "./FormKit.jsx";
import { MenuIcon } from "./NoticeKit.jsx";
import { getPageTitle } from "../lib/menuConfig";

// Hàng tab dùng chung (StatusTabs)
export function StatusTabs({
  tabs = [],
  value,
  onChange,
  counts = {},
  variant = "pill",
  className = "",
}) {
  if (variant === "pill") {
    return (
      <div className={`inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-100/70 p-1 text-[14px] ${className}`}>
        {tabs.map((item) => {
          const id = Array.isArray(item) ? item[0] : item.id ?? item.value ?? item.to;
          const label = Array.isArray(item) ? item[1] : item.label;
          const count = counts?.[id];
          const isLink = Boolean(item.to);

          if (isLink) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                    isActive
                      ? "bg-[#CBE3F0] text-[#0F172A] font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`
                }
              >
                <span>{label}</span>
                {count != null && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {count}
                  </span>
                )}
              </NavLink>
            );
          }

          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange?.(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                active
                  ? "bg-[#CBE3F0] text-[#0F172A] font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <span>{label}</span>
              {count != null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    active ? "bg-white text-[#0F172A] shadow-2xs" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={`flex items-center gap-6 border-b border-[#E5ECF1] w-full min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] ${className}`}
    >
      {tabs.map((item) => {
        const id = Array.isArray(item) ? item[0] : item.id ?? item.value ?? item.to;
        const label = Array.isArray(item) ? item[1] : item.label;
        const count = counts?.[id];
        const isLink = Boolean(item.to);

        if (isLink) {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `relative inline-flex items-center gap-1.5 pb-3 pt-1 text-[15px] whitespace-nowrap transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] focus-visible:rounded-xs cursor-pointer -mb-px ${
                  isActive
                    ? "border-b-2 border-[#0F172A] font-semibold text-[#0F172A]"
                    : "border-b-2 border-transparent text-slate-600 hover:text-[#0F172A] hover:border-[#CBE3F0]"
                }`
              }
            >
              <span>{label}</span>
              {count != null && (
                <span className="text-[12px] text-slate-500 font-medium">({count})</span>
              )}
            </NavLink>
          );
        }

        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(id)}
            className={`relative inline-flex items-center gap-1.5 pb-3 pt-1 text-[15px] whitespace-nowrap transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] focus-visible:rounded-xs cursor-pointer -mb-px ${
              active
                ? "border-b-2 border-[#0F172A] font-semibold text-[#0F172A]"
                : "border-b-2 border-transparent text-slate-600 hover:text-[#0F172A] hover:border-[#CBE3F0]"
            }`}
          >
            <span>{label}</span>
            {count != null && (
              <span className="text-[12px] text-slate-500 font-medium">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Khung thẻ trắng dùng chung
export function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[#0E1A3A]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-[#62718F]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Bộ lọc Dropdown dùng chung
export function FilterSelect({ label, value, onChange, options = [], className = "w-44" }) {
  const hasAll = options.some((o) => (typeof o === "object" ? o.value : o) === "all");
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 rounded-xl border border-slate-200 bg-white px-3 text-[14px] text-slate-800 outline-none focus:border-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/15 ${className}`}
    >
      {!hasAll && <option value="all">Tất cả {label ? label.toLowerCase() : ""}</option>}
      {options.map((opt) => {
        const val = typeof opt === "object" ? opt.value : opt;
        const lbl = typeof opt === "object" ? opt.label : opt;
        return (
          <option key={val} value={val}>
            {lbl}
          </option>
        );
      })}
    </select>
  );
}

export const PERIOD_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "range", label: "Tùy chọn" },
];

export function Field({ label, className = "", children }) {
  return (
    <div className={`w-full ${className}`}>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}

export function FilterBar({
  children,
  onClear,
  canClear = true,
  onExport,
  exportDisabled = false,
  exporting = false,
  errors = [],
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        {children}

        <div className="flex w-full shrink-0 gap-3 sm:ml-auto sm:w-auto">
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={!canClear}
              className="h-11 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              Xóa bộ lọc
            </button>
          )}

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              disabled={exportDisabled || exporting}
              className="h-11 flex-1 rounded-lg bg-[#3F62C4] px-5 text-sm font-medium text-white shadow-sm hover:bg-[#3251A8] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {exporting ? "Đang xuất..." : "Xuất Excel"}
            </button>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600">
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// Các phần dùng chung của trang quản lý (Chấm công, Giờ làm, Bảng lương, ...).
// Đặt file tại: src/components/PageKit.jsx
// Sửa ở đây là mọi trang dùng nó đổi theo.

// ---------- nhãn tiếng Việt dùng chung ----------
export const ROLE_LABEL = { Shift_Leader: "Quản lý ca", Barista: "Pha chế", Cashier: "Thu ngân", Waiter: "Phục vụ", Manager: "Quản lý" };
export const roleLabel = (tag) => ROLE_LABEL[tag] ?? String(tag ?? "").replace(/_/g, " ");

export const CONTRACT_LABEL = { "Full-time": "Toàn thời gian", "Part-time": "Bán thời gian" };
export const contractLabel = (c) => CONTRACT_LABEL[c] ?? c ?? "—";

// ---------- dải tab cho nhóm Chấm công & Giờ làm: Chấm công / Giờ làm ----------
export const ATTENDANCE_TABS = [
  { to: "/manager/attendance", label: "Chấm công" },
  { to: "/manager/work-hours", label: "Giờ làm" },
];
export const HR_TABS = ATTENDANCE_TABS;

// ---------- dải tab cho nhóm Lịch làm việc: Tạo lịch tự động / Lịch đã tạo ----------
export const SCHEDULE_TABS = [
  { to: "/manager/schedule", label: "Tạo lịch tự động" },
  { to: "/manager/schedule/created", label: "Lịch đã tạo" },
];

function SubNav({ tabs }) {
  if (!tabs) return null;
  return <StatusTabs tabs={tabs} />;
}


// ---------- đầu trang: Tiêu đề h1 + subtitle + actions + tabs ----------
// Chuẩn thiết kế 2026: Nằm trong 1 CARD RIÊNG (trắng, bo góc rounded-2xl, viền mảnh border-slate-200/90 shadow-2xs p-5)
// - Breadcrumb nhỏ phía trên tiêu đề: "Nhóm menu / Tên trang"
// - Icon của trang nằm bên TRÁI tiêu đề, trong ô bo góc nền #CBE3F0
// - Tiêu đề ~22px weight 600-700, bên dưới là câu chú thích xám
// - Nút hành động của trang (nếu có) nằm bên phải card
export function PageHeader({
  title,
  subtitle,
  description,
  breadcrumb,
  breadcrumbs,
  icon,
  badge,
  actions,
  tabs,
  className = "",
}) {
  const { pathname } = useLocation();
  const displayTitle =
    title ??
    (breadcrumbs && breadcrumbs[breadcrumbs.length - 1]?.label) ??
    (Array.isArray(breadcrumb) && breadcrumb[breadcrumb.length - 1]) ??
    getPageTitle(pathname);
  const displayDesc = description || subtitle;
  const crumbs = breadcrumb || breadcrumbs;

  const hasHeader = displayTitle || displayDesc || actions || tabs || icon || badge;
  if (!hasHeader) return null;

  return (
    <div
      data-title={typeof displayTitle === "string" ? displayTitle : undefined}
      className={`rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all ${className}`}
    >
      {/* HÀNG 0: Breadcrumb nhỏ phía trên tiêu đề */}
      {Array.isArray(crumbs) && crumbs.length > 0 && (
        <nav aria-label="Đường dẫn trang" className="mb-2 flex items-center gap-1.5 text-[12px] text-slate-400">
          {crumbs.map((c, idx) => {
            const isLast = idx === crumbs.length - 1;
            const label = typeof c === "string" ? c : c?.label;
            return (
              <span key={idx} className="inline-flex items-center gap-1.5">
                {idx > 0 && <span className="text-slate-300">/</span>}
                <span className={isLast ? "font-semibold text-slate-700" : "font-normal hover:text-slate-600"}>
                  {label}
                </span>
              </span>
            );
          })}
        </nav>
      )}

      {/* HÀNG 1: Icon bên trái + Tiêu đề & Mô tả + Nút hành động bên phải */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {icon && (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#CBE3F0] text-[#0F172A] shadow-2xs">
              {typeof icon === "string" ? <MenuIcon name={icon} size={22} /> : icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[22px] font-bold tracking-tight text-[#0F172A] leading-tight">
                {displayTitle}
              </h1>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {displayDesc && (
              <p className="mt-1 text-[13.5px] font-normal leading-normal text-slate-500">
                {displayDesc}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* HÀNG 2: Tab chức năng nằm BÊN TRONG card PageHeader ngay dưới mô tả */}
      {tabs && (
        <div className="mt-4">
          <SubNav tabs={tabs} />
        </div>
      )}
    </div>
  );
}

// ---------- khung trắng bo góc + đầu trang ----------
// Chuẩn thiết kế 2026: Tách thành các Card riêng rẽ (PageHeader riêng, Stats riêng, Content riêng)
// cách nhau bằng khoảng trống đều gap-5
export function PageCard({
  title,
  subtitle,
  description,
  breadcrumb,
  breadcrumbs,
  icon,
  actions,
  tabs,
  stats,
  notices,
  children,
  className = "",
  contentClassName = "",
}) {
  const hasHeader = title || subtitle || description || breadcrumb || breadcrumbs || icon || actions || tabs;

  if (!hasHeader && !stats && !notices) {
    return (
      <div className={`rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-6 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {hasHeader && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          description={description}
          breadcrumb={breadcrumb}
          breadcrumbs={breadcrumbs}
          icon={icon}
          actions={actions}
          tabs={tabs}
        />
      )}
      {stats}
      {notices}
      {children && (
        <div className={`rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-6 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
}

// ---------- hàng ô số liệu tóm tắt (KPI Cards) ----------
// Chuẩn thiết kế 2026: Lưới các card nhỏ trắng riêng rẽ bo góc lớn rounded-2xl:
// - Nhãn nhỏ viết hoa (uppercase text-slate-500)
// - Số lớn tabular-nums text-[#0F172A]
// - Chú thích nhỏ
// - Icon trong ô nền #CBE3F0 ở góc phải
// items: [{ key, icon (node), label, value, note?, color?, dot? (mã màu), active?, onClick? }]
export function StatStrip({ items = [], compact = false, className = "", style = {} }) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={`grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] items-stretch ${className}`}
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", ...style }}
    >
      {items.map((it) => {
        const dotColor = it.dot || it.color;
        const hasFooter = Boolean(it.footer);
        const content = (
          <>
            <div className="flex items-center justify-between gap-2 w-full mb-1 min-w-0">
              <p className="flex items-center gap-1.5 min-w-0 flex-1 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                {dotColor && (
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                )}
                <span className="truncate min-w-0" title={typeof it.label === "string" ? it.label : undefined}>
                  {it.label}
                </span>
              </p>
              {it.icon && (
                <div className="grid h-8 w-8 min-w-[32px] min-h-[32px] shrink-0 place-items-center rounded-lg bg-[#CBE3F0] text-[#0F172A] shadow-2xs">
                  {it.icon}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 my-0.5">
              <div className="flex items-baseline gap-x-2 min-w-0">
                <span className={`font-bold leading-tight tabular-nums text-[#0F172A] whitespace-nowrap ${compact ? "text-[20px]" : "text-[22px] sm:text-[24px]"}`}>
                  {it.value}
                </span>
                {it.badge && (
                  <span className="text-[12px] font-medium text-slate-600 truncate whitespace-nowrap">
                    {it.badge}
                  </span>
                )}
              </div>
              {it.note && (
                <p className="text-[12px] font-normal text-slate-500 truncate max-w-full mt-0.5" title={typeof it.note === "string" ? it.note : undefined}>
                  {it.note}
                </p>
              )}
            </div>

            {hasFooter && (
              <div className="mt-3 pt-2 bg-slate-50/70 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 px-4 sm:px-5 pb-2.5 rounded-b-2xl border-t border-slate-100/80 flex items-center justify-between gap-2 text-[11.5px] text-slate-500 min-w-0 [&>*]:whitespace-nowrap [&>*]:min-w-0">
                {it.footer}
              </div>
            )}
          </>
        );

        const cardBase = `h-full rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between overflow-hidden text-left transition-all min-w-0`;

        return it.onClick ? (
          <button
            key={it.key || it.label}
            type="button"
            data-stat-card="true"
            aria-pressed={!!it.active}
            onClick={it.onClick}
            className={`${cardBase} hover:bg-slate-50/80 hover:border-slate-300 active:scale-[0.99] cursor-pointer ${
              it.active ? "ring-2 ring-[#0F172A] border-[#0F172A] bg-slate-50" : ""
            }`}
          >
            {content}
          </button>
        ) : (
          <div key={it.key || it.label} data-stat-card="true" className={cardBase}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

// ---------- ô chọn kỳ "Tuần này | 📅 12/10 – 18/10/2026" ----------
// Hỗ trợ cả 2 kiểu dùng:
// 1. Manager: { label, options, value, onChange, children }
// 2. Staff: { label, onPrev, onNext, onToday, todayLabel, children }
export function PeriodControl({
  label,
  options = [],
  value,
  onChange,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  prevTitle = "Kỳ trước",
  nextTitle = "Kỳ sau",
  onToday,
  todayLabel,
  children,
}) {
  return (
    <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white shadow-2xs text-[13.5px]">
      {Array.isArray(options) && options.length > 0 && (
        <>
          <select
            aria-label={label}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-full cursor-pointer rounded-l-xl bg-transparent pl-3 pr-2 text-slate-800 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0F172A]"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="h-5 w-px bg-slate-200" />
        </>
      )}

      {onToday && (
        <>
          <button
            type="button"
            onClick={onToday}
            className="px-2.5 h-full hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#0F172A]"
          >
            {todayLabel || "Hôm nay"}
          </button>
          <span className="h-5 w-px bg-slate-200" />
        </>
      )}

      <div className="flex items-center gap-2 px-3 text-slate-800">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span className="tabular-nums font-medium">{children ?? label}</span>
      </div>

      {(onPrev || onNext) && (
        <>
          <span className="h-5 w-px bg-slate-200" />
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              disabled={prevDisabled}
              title={prevTitle}
              aria-label={prevTitle}
              aria-disabled={prevDisabled}
              className={`flex h-full w-8 items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] ${
                prevDisabled
                  ? "text-slate-300 opacity-60 cursor-not-allowed"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100 cursor-pointer"
              }`}
            >
              ‹
            </button>
          )}
          {onPrev && onNext && <span className="h-5 w-px bg-slate-200" />}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              title={nextTitle}
              aria-label={nextTitle}
              aria-disabled={nextDisabled}
              className={`flex h-full w-8 items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] ${
                nextDisabled
                  ? "text-slate-300 opacity-60 cursor-not-allowed"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100 cursor-pointer"
              }`}
            >
              ›
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function DateRangeInputs({ from, to, onFrom, onTo }) {
  const cls = "w-36 bg-transparent text-[14px] outline-none cursor-pointer";
  return (
    <>
      <input aria-label="Từ ngày" type="date" value={from || ""} onChange={(e) => onFrom(e.target.value)} className={cls} />
      <span className="text-slate-400">–</span>
      <input aria-label="Đến ngày" type="date" value={to || ""} onChange={(e) => onTo(e.target.value)} className={cls} />
    </>
  );
}

export const inputClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-[14px] text-slate-800 focus:border-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/15";

export const selectClass =
  "h-10 w-44 rounded-xl border border-slate-200 bg-white px-3 text-[14px] text-slate-800 focus:border-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/15";

// ---------- ô tìm kiếm (chuẩn bo góc rounded-xl, h-10, có nút xóa ×) ----------
export function SearchInput({
  value = "",
  onChange,
  onClear,
  placeholder = "Tìm kiếm...",
  size = "md",
  className = "w-full min-w-0",
}) {
  const hCls = size === "sm" ? "h-8 text-[13px]" : size === "lg" ? "h-11 text-[14.5px]" : "h-10 text-[14px]";

  const handleChange = (e) => {
    if (typeof onChange === "function") {
      onChange(e.target.value);
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onClear === "function") {
      onClear();
    } else if (typeof onChange === "function") {
      onChange("");
    }
  };

  const stringValue = typeof value === "object" && value !== null ? String(value) : (value ?? "");

  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">Tìm kiếm</span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="text"
        value={stringValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${hCls} w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-8 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/15`}
      />
      {Boolean(stringValue) && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="Xóa nội dung tìm kiếm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </label>
  );
}

// ---------- nút "Xuất Excel" ----------
export function ExportButton({ onClick, disabled, loading, size = "md", className = "" }) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={`h-10 whitespace-nowrap ${className}`}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m7 10 5 5 5-5" />
          <path d="M12 15V3" />
        </svg>
      }
    >
      {loading ? "Đang xuất..." : "Xuất Excel"}
    </Button>
  );
}

// ---------- thanh công cụ chuẩn duy nhất (Toolbar) ----------
// Quy chuẩn thiết kế đồng nhất:
// - Chiều cao: 40px (h-10) cho mọi thành phần (SearchInput, selects, buttons).
// - Tại >= 1280px: Toàn bộ nằm trên 1 dòng duy nhất, không rớt dòng hay tràn ngoài khung.
// - Dưới 1024px: Ô tìm kiếm chiếm 1 dòng trên, các ô lọc và nút hành động nằm dòng dưới (flex-wrap).
// - Điện thoại (< 640px): Tự động dàn dòng gọn gàng, không cuộn ngang.
export function Toolbar({
  tabs,
  search,
  filters,
  viewToggle,
  onClear,
  clearText = "Xóa bộ lọc",
  canClear = true,
  actions,
  legend,
  left,
  right,
  children,
  className = "",
}) {
  const clearBtn = onClear && canClear ? (
    <Button type="button" variant="ghost" size="md" onClick={onClear} className="h-10 text-[13.5px] whitespace-nowrap shrink-0">
      {clearText}
    </Button>
  ) : null;

  if (left !== undefined || right !== undefined) {
    return (
      <div data-testid="toolbar" className={`w-full mb-4 ${className}`}>
        {tabs && <div className="w-full mb-3 pb-3 border-b border-slate-100">{tabs}</div>}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full min-w-0">
          {left && <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1 min-w-0">{left}</div>}
          {children}
          {right && <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto ml-auto lg:ml-0">{right}</div>}
        </div>
        {legend && <div className="mt-2 text-[13px] text-slate-500 font-normal line-clamp-2">{legend}</div>}
      </div>
    );
  }

  const rightActions = (viewToggle || actions) ? (
    <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto ml-auto lg:ml-0">
      {viewToggle}
      {actions}
    </div>
  ) : null;

  return (
    <div data-testid="toolbar" className={`w-full mb-4 ${className}`}>
      {tabs && (
        <div className="w-full mb-3 pb-3 border-b border-slate-100">
          {tabs}
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          {search && (
            <div className="w-full sm:w-auto sm:flex-1 sm:max-w-xs md:max-w-sm min-w-0 shrink-0 sm:shrink">
              {search}
            </div>
          )}
          {filters && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              {filters}
            </div>
          )}
          {clearBtn}
          {children}
        </div>
        {rightActions}
      </div>
      {legend && (
        <div className="mt-2 text-[13px] text-slate-500 font-normal line-clamp-2">
          {legend}
        </div>
      )}
    </div>
  );
}

// ---------- dòng chú giải riêng (Legend) ----------
export function Legend({ children, className = "" }) {
  if (!children) return null;
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 pb-3 text-xs text-slate-600 ${className}`}>
      {children}
    </div>
  );
}

// ---------- hộp thông báo ----------
// tone: "success" (xanh lá) | "error" (đỏ) | "info" (xám)
// dot: mã màu chấm đầu dòng; action: nút/liên kết bên phải
const TONES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-slate-200 bg-slate-50 text-slate-800",
};
export function Alert({ tone = "info", dot, action, className = "mb-3", children }) {
  return (
    <div role={tone === "info" ? undefined : tone === "error" ? "alert" : "status"} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-[14px] ${TONES[tone]} ${className}`}>
      <span className="flex items-center gap-2.5">
        {dot && <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} />}
        {children}
      </span>
      {action}
    </div>
  );
}

// ---------- phân trang ----------
function pageList(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const arr = [...new Set([1, count, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out = [];
  arr.forEach((n, i) => {
    if (i && n - arr[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

function PageBtn({ children, active, ...props }) {
  return (
    <button
      type="button"
      className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "border-slate-900 bg-white text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Pagination({
  page = 1,
  pageCount,
  total = 0,
  pageSize = 7,
  onPage,
  onPageChange,
  onPageSize,
  onPageSizeChange,
  sizes,
  pageSizes = [7, 10, 20],
  unit = "bản ghi",
}) {
  const handlePage = onPage || onPageChange || (() => {});
  const handlePageSize = onPageSize || onPageSizeChange || (() => {});
  const availableSizes = sizes || pageSizes;
  const count = pageCount ?? Math.max(1, Math.ceil((total || 0) / (pageSize || 10)));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-[14px] text-slate-600">
      <span>
        {total === 0 ? `0 ${unit}` : `Hiển thị ${from}–${to} trong ${total} ${unit}`}
      </span>
      <div className="flex items-center gap-1.5">
        <PageBtn onClick={() => handlePage(1)} disabled={page === 1} aria-label="Trang đầu">«</PageBtn>
        <PageBtn onClick={() => handlePage(page - 1)} disabled={page === 1} aria-label="Trang trước">‹</PageBtn>
        {pageList(page, count).map((n) =>
          typeof n === "number" ? (
            <PageBtn key={n} active={n === page} onClick={() => handlePage(n)} aria-current={n === page ? "page" : undefined}>
              {n}
            </PageBtn>
          ) : (
            <span key={n} className="px-1 text-slate-400">…</span>
          )
        )}
        <PageBtn onClick={() => handlePage(page + 1)} disabled={page === count} aria-label="Trang sau">›</PageBtn>
        <PageBtn onClick={() => handlePage(count)} disabled={page === count} aria-label="Trang cuối">»</PageBtn>
      </div>
      <div className="w-32">
        <select aria-label="Số dòng mỗi trang" value={pageSize} onChange={(e) => handlePageSize(Number(e.target.value))} className={`${inputClass} w-full`}>
          {availableSizes.map((n) => (
            <option key={n} value={n}>
              {n} / trang
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export { StatusPill, StatusBadge, Avatar, initialsOf, EmptyState } from "./TableKit.jsx";
export { NoticeBar } from "./NoticeKit.jsx";
export { WeekGrid } from "./CalendarKit.jsx";
export default {
  PageHeader,
  StatusTabs,
  Card,
  FilterSelect,
  FilterBar,
  Field,
  PERIOD_OPTIONS,
};

