/**
 * File: src/components/TableKit.jsx
 * Bộ thành phần Bảng & Phân trang: Table, TablePagination, StatusBadge, Avatar, RowActions
 */

import { useEffect, useRef, useState } from "react";
import { Pagination } from "./PageKit.jsx";
import { getAttendanceStatusInfo } from "../lib/statusLabels.js";

// ---------- initialsOf ----------
export const initialsOf = (name = "") => {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  return (p.length === 1 ? p[0].slice(0, 2) : p[p.length - 2][0] + p[p.length - 1][0]).toUpperCase();
};

export function Avatar({ name, size = "md", className = "" }) {
  const cls =
    size === "sm"
      ? "h-7 w-7 text-[11px]"
      : size === "lg"
      ? "h-11 w-11 text-[14px]"
      : size === "xl"
      ? "h-12 w-12 text-[15px]"
      : "h-9 w-9 text-[12px]";
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-[#CBE3F0] font-semibold text-[#0F172A] shadow-2xs ${cls} ${className}`}>
      {initialsOf(name)}
    </span>
  );
}

// Ô "Nhân viên": ảnh + tên + dòng phụ
export function Person({ name, sub, className = "" }) {
  return (
    <span className={`flex items-center gap-3 min-w-0 ${className}`}>
      <Avatar name={name} />
      <span className="min-w-0">
        <span className="block font-medium whitespace-nowrap truncate" title={name}>{name}</span>
        {sub && <span className="block text-[12px] text-slate-500 whitespace-nowrap truncate" title={sub}>{sub}</span>}
      </span>
    </span>
  );
}

// ---------- huy hiệu trạng thái ----------
const TONES = {
  success: { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  warning: { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  error: { bg: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  danger: { bg: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  neutral: { bg: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  gray: { bg: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  info: { bg: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  blue: { bg: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
};

export function StatusPill({ hex = "#94a3b8", tone, status, fixed = false, children, className = "" }) {
  let displayLabel = children;
  let effectiveTone = tone;
  let effectiveHex = hex;

  if (status) {
    const info = getAttendanceStatusInfo(status);
    displayLabel = children || info.label;
    effectiveTone = tone || info.tone;
    effectiveHex = hex || info.hex;
  }

  const toneCfg = effectiveTone ? TONES[effectiveTone] || TONES.neutral : null;
  const styleObj = !effectiveTone && effectiveHex ? { backgroundColor: `${effectiveHex}1a`, color: "#1e293b" } : undefined;
  const dotColor = !effectiveTone && effectiveHex ? { backgroundColor: effectiveHex } : undefined;
  const fixedClasses = fixed ? "min-w-[125px] h-7 justify-center px-3" : "px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-[12px] font-medium ${
        toneCfg ? toneCfg.bg : ""
      } ${fixedClasses} ${className}`}
      style={styleObj}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneCfg ? toneCfg.dot : ""}`}
        style={dotColor}
      />
      <span>{displayLabel}</span>
    </span>
  );
}

export const StatusBadge = StatusPill;

// ---------- nút "⋮" + menu thao tác ----------
export function RowActions({ items, label = "Thao tác" }) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [anchor, setAnchor] = useState(null);

  useEffect(() => {
    if (!anchor) return undefined;
    const close = (e) => {
      if (e.type === "mousedown" && (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target))) return;
      setAnchor(null);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [anchor]);

  const toggle = (e) => {
    e.stopPropagation();
    if (anchor) return setAnchor(null);
    const r = e.currentTarget.getBoundingClientRect();
    setAnchor({ right: r.right, top: r.top, bottom: r.bottom });
  };

  const openUp = anchor && anchor.bottom + 40 * items.length + 20 > window.innerHeight;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        onClick={toggle}
        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      {anchor && (
        <div
          ref={menuRef}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            right: window.innerWidth - anchor.right,
            top: openUp ? undefined : anchor.bottom + 4,
            bottom: openUp ? window.innerHeight - anchor.top + 4 : undefined,
          }}
          className="z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-lg"
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                setAnchor(null);
                it.onClick();
              }}
              className={`block w-full px-4 py-2 text-left text-[14px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white ${it.danger ? "text-rose-600" : "text-slate-800"}`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ---------- TABLE CHÍNH ----------
export function Table({
  columns = [],
  rows = [],
  footer,
  maxHeight,
  onRowClick,
  minWidth,
  variant = "default",
  rowClassName,
  rowAriaLabel,
}) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const alignClass = (c) => {
    if (c.align === "center") return "text-center";
    if (c.align === "right") return "text-right";
    return "text-left";
  };
  const clean = variant === "clean";

  const wrapStyle = maxHeight ? { maxHeight, overflowY: "auto" } : undefined;
  const tableStyle = minWidth ? { minWidth } : undefined;

  if (clean) {
    const last = safeColumns.length - 1;
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs" style={wrapStyle}>
        <table className="w-full text-[14px]" style={tableStyle}>
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80">
              {safeColumns.map((c, i) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={`whitespace-nowrap bg-slate-50/80 px-4 py-3.5 text-[13px] font-semibold text-slate-600 ${alignClass(c)} ${
                    i === 0 ? "rounded-tl-2xl" : ""
                  } ${i === last ? "rounded-tr-2xl" : ""} ${maxHeight ? "sticky top-0 z-10" : ""}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[14px] text-slate-800">
            {safeRows.map((row, i) => (
              <tr
                key={row.id ?? i}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                aria-label={rowAriaLabel ? rowAriaLabel(row) : (onRowClick ? "Xem chi tiết" : undefined)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(row);
                  }
                } : undefined}
                className={`transition-colors ${
                  onRowClick
                    ? "cursor-pointer hover:bg-slate-50/80 focus-visible:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F172A]"
                    : "cursor-default"
                } ${rowClassName ? rowClassName(row) : row.className ?? ""}`}
              >
                {safeColumns.map((c) => (
                  <td
                    key={c.key}
                    style={c.width ? { width: c.width } : undefined}
                    className={`px-4 py-3.5 align-middle ${alignClass(c)} ${c.className ?? ""}`}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                {safeColumns.map((c) => (
                  <td
                    key={c.key}
                    style={c.width ? { width: c.width } : undefined}
                    className={`px-4 py-3.5 align-middle tabular-nums ${alignClass(c)}`}
                  >
                    {footer[c.key] ?? ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" style={wrapStyle}>
      <table className="w-full border-collapse text-sm" style={tableStyle}>
        <thead>
          <tr>
            {safeColumns.map((c) => (
              <th
                key={c.key}
                style={c.width ? { width: c.width } : undefined}
                className={`whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold text-[#59667a] ${alignClass(c)}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeRows.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`${i % 2 === 0 ? "bg-white" : "bg-[#fafbfe]"} ${onRowClick ? "cursor-pointer" : "cursor-default"}`}
            >
              {safeColumns.map((c) => (
                <td
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={`px-3 py-3 align-middle text-[12px] text-[#2e384a] ${alignClass(c)}`}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-[#fafbfe] font-semibold text-[#141f33]">
              {safeColumns.map((c) => (
                <td
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={`px-3 py-3 align-middle text-[12px] ${alignClass(c)}`}
                >
                  {footer[c.key] ?? ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default Table;

// ---------- TABLE PAGINATION ----------
export function TablePagination({
  page,
  pageCount,
  pageSize,
  total,
  unit = "mục",
  pageSizes = [7, 10, 20],
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      total={total}
      unit={unit}
      pageSizes={pageSizes}
      onPage={onPageChange}
      onPageSize={onPageSizeChange}
    />
  );
}

// ---------- TRẠNG THÁI RỖNG CHUẨN (EMPTY STATE) ----------
export function EmptyState({
  title = "Không tìm thấy kết quả phù hợp",
  description = "Thử thay đổi từ khóa hoặc bộ lọc",
  onClear,
  canClear = false,
  className = "",
}) {
  return (
    <div className={`rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center ${className}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <p className="text-[15px] font-semibold text-slate-800">{title}</p>
      {description && <p className="mt-1 text-[13.5px] text-slate-500">{description}</p>}
      {canClear && onClear && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBE3F0] bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
