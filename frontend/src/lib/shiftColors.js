/**
 * File: src/lib/shiftColors.js
 * Bảng màu và quy chuẩn hiển thị theo Ca làm việc (US10, US13)
 */

export const SHIFT_COLORS = {
  morning: {
    code: "morning",
    name: "Sáng",
    shiftName: "Ca Sáng",
    bg: "#E6F4FA",
    border: "#2B9FCF",
    text: "#0C3B54",
    dot: "#2B9FCF",
    badgeBg: "#D4EEF9",
    badgeText: "#0C3B54",
    rowHeaderBg: "#F5FAFD",
  },
  afternoon: {
    code: "afternoon",
    name: "Chiều",
    shiftName: "Ca Chiều",
    bg: "#E4F5F1",
    border: "#2A9D8F",
    text: "#0B4A43",
    dot: "#2A9D8F",
    badgeBg: "#D1EFE9",
    badgeText: "#0B4A43",
    rowHeaderBg: "#F4FBF9",
  },
  evening: {
    code: "evening",
    name: "Tối",
    shiftName: "Ca Tối",
    bg: "#ECEBF8",
    border: "#5B5BC4",
    text: "#27276B",
    dot: "#5B5BC4",
    badgeBg: "#DFDEF3",
    badgeText: "#27276B",
    rowHeaderBg: "#F7F7FD",
  },
};

export const NEXT_SHIFT_BAR = {
  bg: "#F4F7F9",
  border: "#D9E8F5",
  text: "#0F172A",
};

export const TODAY_HIGHLIGHT = {
  bg: "#F0F6FB",
  cellBg: "#F0F6FB",
  border: "#0F172A",
  text: "#0F172A",
  colBg: "#F0F6FB",
  badgeBg: "#0F172A",
  badgeText: "#FFFFFF",
};

export const EMPTY_SHIFT_CELL = {
  bg: "#FAFBFC",
  border: "#E5ECF1",
};

export const EMPTY_CELL = {
  bg: "#FAFBFC",
  border: "#E5ECF1",
  text: "",
};

export const LEAVE_COLOR = {
  code: "leave",
  name: "Nghỉ phép",
  shiftName: "Nghỉ phép",
  bg: "#FAF5FF",
  border: "#9333EA",
  text: "#6B21A8",
  dot: "#9333EA",
  badgeBg: "#F3E8FF",
  badgeText: "#6B21A8",
  rowHeaderBg: "#FCF9FE",
};

export const DEFAULT_CUSTOM_SHIFT = {
  code: "custom",
  name: "Ca khác",
  shiftName: "Ca làm việc",
  bg: "#EDF3FA",
  border: "#477699",
  text: "#133852",
  dot: "#477699",
  badgeBg: "#DCE8F4",
  badgeText: "#133852",
  rowHeaderBg: "#F6F9FD",
};

export const THEME_TOKENS = {
  navy: "#0F172A",
  navyHover: "#1E293B",
  activeBg: "#CBE3F0",
  highlight: "#D9E8F5",
  pageBg: "#F4F7F9",
  shellBg: "#DCEBF5",
  nextShiftBg: "#F4F7F9",
  todayBg: "#F0F6FB",
};

export function getShiftColors(shift, customShifts = []) {
  if (!shift) return SHIFT_COLORS.morning;

  if (typeof shift === "object" && (shift.isLeave || shift.type === "leave")) {
    return LEAVE_COLOR;
  }

  const raw = String(
    shift?.shiftCode ||
    shift?.shiftName ||
    shift?.name ||
    shift?.shift_name ||
    shift?.title ||
    shift?.id ||
    shift ||
    ""
  ).toLowerCase();

  if (raw.includes("sáng") || raw.includes("sang") || raw.includes("morning") || raw.includes("shift_1")) {
    return SHIFT_COLORS.morning;
  }
  if (raw.includes("chiều") || raw.includes("chieu") || raw.includes("afternoon") || raw.includes("shift_2")) {
    return SHIFT_COLORS.afternoon;
  }
  if (raw.includes("tối") || raw.includes("toi") || raw.includes("evening") || raw.includes("night") || raw.includes("shift_3")) {
    return SHIFT_COLORS.evening;
  }
  if (raw.includes("nghỉ") || raw.includes("nghi") || raw.includes("leave")) {
    return LEAVE_COLOR;
  }

  if (Array.isArray(customShifts) && customShifts.length > 0) {
    const matched = customShifts.find((s) => {
      const sName = String(s.name || s.shiftName || s.id || "").toLowerCase();
      return raw.includes(sName);
    });
    if (matched && matched.bg && matched.border) {
      return {
        code: matched.id || "custom",
        name: matched.name || "Ca khác",
        shiftName: `Ca ${matched.name || "khác"}`,
        bg: matched.bg,
        border: matched.border,
        text: matched.text || "#1E293B",
        dot: matched.border,
        badgeBg: matched.bg,
        badgeText: matched.text || "#1E293B",
        rowHeaderBg: matched.rowHeaderBg || "#F8FAFC",
      };
    }
  }

  return DEFAULT_CUSTOM_SHIFT;
}

export const getShiftTheme = getShiftColors;
export const getShiftColor = getShiftColors;

export function getShiftBadgeStyle(shiftNameOrType) {
  const theme = getShiftColors(shiftNameOrType);
  return {
    backgroundColor: theme.badgeBg,
    color: theme.badgeText,
  };
}

export function getShiftCardStyle(shiftNameOrType) {
  const theme = getShiftColors(shiftNameOrType);
  return {
    backgroundColor: theme.bg,
    borderLeftColor: theme.border,
    color: theme.text,
  };
}

export function getShiftRowHeaderStyle(shiftNameOrType) {
  const theme = getShiftColors(shiftNameOrType);
  return {
    backgroundColor: theme.rowHeaderBg,
    borderLeftColor: theme.border,
  };
}

export const DEFAULT_SHIFT_LEGENDS = [
  { ...SHIFT_COLORS.morning, label: "Ca Sáng (06:00 - 12:00)" },
  { ...SHIFT_COLORS.afternoon, label: "Ca Chiều (12:00 - 17:00)" },
  { ...SHIFT_COLORS.evening, label: "Ca Tối (17:00 - 22:00)" },
  { ...LEAVE_COLOR, label: "Nghỉ phép" },
];

export function calculateScheduleStats(shifts) {
  const list = Array.isArray(shifts) ? shifts : [];
  const shiftCount = list.length;
  const totalHours =
    Math.round(
      list.reduce((sum, s) => {
        const d = Number(s.duration);
        if (!isNaN(d) && d > 0) return sum + d;
        if (s.startTime && s.endTime) {
          const [sh, sm] = s.startTime.split(":").map(Number);
          const [eh, em] = s.endTime.split(":").map(Number);
          return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        }
        return sum;
      }, 0) * 10
    ) / 10;

  return {
    shiftCount,
    totalShifts: shiftCount,
    totalHours,
  };
}

export default {
  SHIFT_COLORS,
  NEXT_SHIFT_BAR,
  TODAY_HIGHLIGHT,
  EMPTY_SHIFT_CELL,
  EMPTY_CELL,
  LEAVE_COLOR,
  DEFAULT_CUSTOM_SHIFT,
  THEME_TOKENS,
  getShiftColors,
  getShiftTheme,
  getShiftColor,
  getShiftBadgeStyle,
  getShiftCardStyle,
  getShiftRowHeaderStyle,
  DEFAULT_SHIFT_LEGENDS,
  calculateScheduleStats,
};

