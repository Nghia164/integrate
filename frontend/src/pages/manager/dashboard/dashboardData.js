import { formatMoney, formatNumber } from "../../../lib/formatters";
import { SHIFT_COLORS } from "../../../lib/shiftColors";


export const PERIODS = [
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "range", label: "Tùy chọn" },
];

export const SHIFT_OPTIONS = ["Sáng", "Chiều", "Tối"];
export const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const SHIFT_STYLE = {
  "Sáng": {
    bg: SHIFT_COLORS.morning.bg,
    fg: SHIFT_COLORS.morning.text,
    dot: SHIFT_COLORS.morning.dot,
  },
  "Chiều": {
    bg: SHIFT_COLORS.afternoon.bg,
    fg: SHIFT_COLORS.afternoon.text,
    dot: SHIFT_COLORS.afternoon.dot,
  },
  "Tối": {
    bg: SHIFT_COLORS.evening.bg,
    fg: SHIFT_COLORS.evening.text,
    dot: SHIFT_COLORS.evening.dot,
  },
};

// Màu biểu đồ trung tính
export const C = {
  grid: "#e2e8f0",
  muted: "#64748b",
  ink: "#0f172a",
  soft: "#cbd5e1",
  main: "#334155",
};

export const AXIS_TICK = { fill: C.muted, fontSize: 12 };

export const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "none",
  background: C.ink,
  boxShadow: "0 8px 24px rgba(15,23,42,0.18)",
  fontSize: 12.5,
};

export const TOOLTIP_TEXT = {
  itemStyle: { color: "#fff" },
  labelStyle: { color: "#fff" },
};

export const fmtNum = formatNumber;
export const fmtMoney = formatMoney;
