/**
 * File: src/lib/dateUtils.js
 * Tầng: Thư viện (Lib) - Các hàm xử lý ngày tháng thuần
 */

export const pad = (n) => String(n).padStart(2, "0");

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function mondayOf(date = new Date()) {
  const d = startOfDay(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateVN(isoString) {
  if (!isoString || typeof isoString !== "string") return "";
  const parts = isoString.split("-");
  if (parts.length !== 3) return isoString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export const toVN = formatDateVN;

// BACKEND: bỏ cờ demo, dùng giờ máy chủ
export const DEFAULT_DEMO_NOW = "2026-10-31T11:50:00";
export const STORAGE_KEY_DEMO_NOW = "SMART_SCHEDULING_DEMO_NOW";
export const STORAGE_KEY_DEMO_GPS = "SMART_SCHEDULING_DEMO_GPS";

let inMemoryDemoNow = null;

// Tự động nhận cờ demo từ URL query parameters nếu có
if (typeof window !== "undefined" && window.location?.search) {
  try {
    const sp = new URLSearchParams(window.location.search);
    const nowParam = sp.get("now");
    if (nowParam) {
      const isoVal = nowParam.length === 16 ? `${nowParam}:00` : nowParam;
      localStorage.setItem(STORAGE_KEY_DEMO_NOW, isoVal);
    }
    const gpsParam = sp.get("gps");
    if (gpsParam) {
      localStorage.setItem(STORAGE_KEY_DEMO_GPS, gpsParam);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Kiểm tra cờ giờ demo có đang hoạt động hay không
 */
export function isDemoNowActive() {
  if (inMemoryDemoNow !== null) return true;
  if (typeof window !== "undefined" && window.location?.search?.includes("now=")) return true;
  if (typeof localStorage !== "undefined") {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY_DEMO_NOW));
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Kiểm tra cờ GPS demo (?gps=store) có đang hoạt động hay không
 */
export function isDemoGpsActive() {
  if (typeof window !== "undefined" && window.location?.search?.includes("gps=store")) {
    return true;
  }
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(STORAGE_KEY_DEMO_GPS) === "store";
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Lấy mốc thời gian hiện tại của hệ thống.
 * Mặc định: new Date() thật của máy.
 * Khi bật cờ ?now=... hoặc lưu localStorage: lấy mốc giờ demo đã cấu hình.
 * // BACKEND: bỏ cờ demo, dùng giờ máy chủ
 */
export function getNow() {
  if (inMemoryDemoNow) {
    return new Date(inMemoryDemoNow.getTime());
  }
  if (typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DEMO_NOW);
      if (stored) {
        const parsed = new Date(stored);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    } catch {
      /* ignore */
    }
  }
  // Mặc định là giờ máy thật
  return new Date();
}

export function setDemoNow(isoOrDate) {
  if (!isoOrDate) {
    inMemoryDemoNow = null;
    return;
  }
  const d = new Date(isoOrDate);
  inMemoryDemoNow = d;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_DEMO_NOW, d.toISOString());
    } catch {
      /* ignore */
    }
  }
}

export function clearDemoNow() {
  inMemoryDemoNow = null;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_DEMO_NOW);
      localStorage.removeItem(STORAGE_KEY_DEMO_GPS);
    } catch {
      /* ignore */
    }
  }
}

export default {
  pad,
  startOfDay,
  mondayOf,
  addDays,
  toISO,
  formatDateVN,
  toVN,
  DEFAULT_DEMO_NOW,
  STORAGE_KEY_DEMO_NOW,
  STORAGE_KEY_DEMO_GPS,
  isDemoNowActive,
  isDemoGpsActive,
  getNow,
  setDemoNow,
  clearDemoNow,
};

