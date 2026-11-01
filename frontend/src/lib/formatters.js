/**
 * File: src/lib/formatters.js
 * Các hàm định dạng hiển thị tiền tệ, số, ngày giờ
 */

import { pad } from "./dateUtils.js";

export { pad };

export const formatDate = (d) => {
  if (!d) return "—";
  if (typeof d === "string" && d.includes("-")) {
    const [y, m, day] = d.split("-");
    if (y && m && day) return `${day}/${m}/${y}`;
  }
  const date = new Date(d);
  return isNaN(date) ? String(d) : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};
export const fmtDate = formatDate;

export const formatTime = (d) =>
  new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

export const formatNumber = (n) => (n == null ? "0" : Number(n).toLocaleString("vi-VN"));
export const fmtNum = formatNumber;

export const formatMoney = (n) => `${formatNumber(n)} ₫`;
export const fmtMoney = formatMoney;

export const formatHours = (h) =>
  Number(h || 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
export const fmtHours = formatHours;

export const initialsOf = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

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

/**
 * Sinh mật khẩu tạm thời ngẫu nhiên (chữ + số, tối thiểu 8 ký tự)
 */
export function generateTempPassword(length = 10) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  let pass = "";
  pass += letters.charAt(Math.floor(Math.random() * letters.length));
  pass += digits.charAt(Math.floor(Math.random() * digits.length));
  const all = letters + digits;
  for (let i = 2; i < length; i++) {
    pass += all.charAt(Math.floor(Math.random() * all.length));
  }
  return pass.split("").sort(() => 0.5 - Math.random()).join("");
}

/**
 * Định dạng thời gian tương đối (vd: "Vừa xong", "5 phút trước", "2 giờ trước", "Hôm qua")
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "Vừa xong";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Vừa xong";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export default {
  pad,
  formatDate,
  fmtDate,
  formatTime,
  formatNumber,
  fmtNum,
  formatMoney,
  fmtMoney,
  formatHours,
  fmtHours,
  initialsOf,
  stripAccents,
  generateTempPassword,
  formatRelativeTime,
};
