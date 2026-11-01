/**
 * File: src/components/FormKit.jsx
 * Bộ thành phần Form & Tương tác người dùng: Button, Modal, Input, Loading, ErrorMessage
 */

import React, { useEffect, useRef } from "react";
import {
  Plus,
  Check,
  ArrowRight,
  Send,
  History,
  UserPlus,
  RefreshCw,
  X,
  Calendar,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Z_INDEX } from "../lib/layoutTokens.js";

// =============================================================================
// 1. BUTTON
// =============================================================================

const ICON_MAP = {
  plus: Plus,
  add: Plus,
  check: Check,
  arrow: ArrowRight,
  send: Send,
  history: History,
  userPlus: UserPlus,
  refresh: RefreshCw,
  close: X,
  x: X,
  calendar: Calendar,
  search: Search,
  filter: SlidersHorizontal,
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all cursor-pointer " +
  "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] focus-visible:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS = {
  primary: "bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-2xs active:scale-[0.99]",
  secondary: "border border-slate-200 bg-white text-[#0F172A] hover:bg-slate-50 hover:text-black shadow-2xs",
  outline: "border border-slate-300 bg-white text-[#0F172A] hover:bg-[#F4F7F9] shadow-2xs",
  soft: "bg-[#CBE3F0] text-[#0F172A] hover:bg-[#B7D6E7]",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-[#0F172A]",
  danger: "bg-[#D64550] text-white hover:bg-[#B93842] shadow-2xs",
};

const BUTTON_SIZES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-[13.5px]",
  lg: "h-10 px-4 text-[14px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon = null,
  className = "",
  disabled = false,
  children,
  ...props
}) {
  const renderedIcon = React.isValidElement(icon)
    ? icon
    : typeof icon === "string" && ICON_MAP[icon]
      ? React.createElement(ICON_MAP[icon], { className: "h-4 w-4 shrink-0", "aria-hidden": "true" })
      : typeof icon === "function" || (typeof icon === "object" && icon !== null && icon.$$typeof && !icon.props)
        ? React.createElement(icon, { className: "h-4 w-4 shrink-0", "aria-hidden": "true" })
        : null;

  return (
    <button
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary} ${BUTTON_SIZES[size] ?? BUTTON_SIZES.md} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : (
        renderedIcon
      )}
      {children}
    </button>
  );
}

// =============================================================================
// 2. INPUT & FORM INPUT
// =============================================================================

export const inputClass =
  "h-9 rounded-xl border border-slate-200/90 bg-white px-3 text-[13.5px] text-slate-800 transition-colors " +
  "focus:border-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0F172A] disabled:bg-slate-50 disabled:text-slate-400";

export const selectClass = `${inputClass} cursor-pointer`;

export function Input({ className = "", ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function FormInput({ label, error, className = "", id, ...props }) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  return (
    <div className="space-y-1 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-slate-700">
          {label}
        </label>
      )}
      <input id={inputId} className={`${inputClass} w-full ${error ? "border-rose-400" : ""} ${className}`} {...props} />
      {error && <p className="text-[12px] text-rose-600">{error}</p>}
    </div>
  );
}

// =============================================================================
// 3. MODAL
// =============================================================================

const SIZE_MAP = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
};

export function Modal({
  open,
  isOpen,
  title,
  header,
  footer,
  onClose,
  children,
  maxWidth,
  size,
  bodyClassName = "",
  className = "",
}) {
  const isVisible = open ?? isOpen ?? false;
  const previousFocusRef = useRef(null);
  const modalBoxRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      previousFocusRef.current = document.activeElement;
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        if (modalBoxRef.current) {
          const focusable = modalBoxRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable) {
            focusable.focus();
          } else {
            modalBoxRef.current.focus?.();
          }
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose?.();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = prevOverflow;
        window.removeEventListener("keydown", handleKeyDown);
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const widthClass = maxWidth || (size && SIZE_MAP[size]) || (footer || header ? "max-w-4xl" : "max-w-2xl");
  const hasStructuredLayout = Boolean(header || footer);

  return (
    <div
      style={{ zIndex: Z_INDEX.modal }}
      className="fixed inset-0 grid place-items-center bg-slate-900/50 p-4 transition-opacity animate-in fade-in-50 duration-150"
      onClick={onClose}
    >
      <div
        ref={modalBoxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`flex max-h-[90vh] w-full ${widthClass} flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {header ? (
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 bg-white shrink-0">
            {header}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : title ? (
          <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 bg-white shrink-0">
            <h3 id="modal-title" className="text-[17px] font-semibold text-slate-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className={`flex-1 overflow-y-auto ${hasStructuredLayout ? "" : "p-6"} ${bodyClassName}`}>
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-3.5 bg-slate-50/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// 4. LOADING & ERROR MESSAGE
// =============================================================================

export function Loading({ message = "Đang tải dữ liệu..." }) {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#0F172A]" />
      <span>{message}</span>
    </div>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-700">
      {message}
    </div>
  );
}

export default {
  Button,
  Input,
  FormInput,
  Modal,
  Loading,
  ErrorMessage,
  inputClass,
  selectClass,
};
