// =============================================================================
// FILE NÀY LÀM GÌ: Tiện ích xử lý dữ liệu và logic đọc trạng thái ca cho US09
// Loại: Helpers
// US: US09 (Quản lý Khả năng làm việc của nhân viên)
// =============================================================================

import { STANDARD_ROLES } from "../../../services/shiftConfigService.js";

export const ROLE_OPTIONS = [
  { value: "all", label: "Tất cả vai trò" },
  ...STANDARD_ROLES.map((r) => ({ value: r, label: r })),
];

export const STATUS_TABS = [
  ["all", "Tất cả"],
  ["registered", "Đã đăng ký"],
  ["unregistered", "Chưa đăng ký"],
];

/**
 * Đọc trạng thái từng ca làm việc của nhân viên từ dữ liệu slots
 * @param {object} emp - Đối tượng nhân viên kèm slots đăng ký
 * @param {number} dayIndex - Thứ tự ngày trong tuần (0..6 tương ứng T2..CN)
 * @param {string} shiftName - Tên ca ("Sáng", "Chiều", "Tối")
 * @returns {"available" | "busy" | "unregistered"} Trạng thái rảnh, bận hoặc chưa đăng ký
 */
export function getSlotStatus(emp, dayIndex, shiftName) {
  if (!emp || !emp.registered) return "unregistered";
  const val = emp.slots?.[`${dayIndex}_${shiftName}`];
  return val === "available" ? "available" : "busy";
}

/**
 * Chuyển đổi mã trạng thái ca sang nhãn hiển thị tiếng Việt
 * @param {"available" | "busy" | "unregistered"} status
 * @returns {"Rảnh" | "Bận" | "Chưa đăng ký"}
 */
export function getSlotLabel(status) {
  if (status === "available") return "Rảnh";
  if (status === "busy") return "Bận";
  return "Chưa đăng ký";
}

/**
 * Đếm số ca rảnh và ca bận từ dữ liệu slots (dùng chung cho cả Manager và Staff)
 * @param {object} slots - Đối tượng slots dạng { "0_Sáng": "available", ... }
 * @param {number} totalSlots - Tổng số ca trong tuần (mặc định 21)
 * @returns {{ available: number, busy: number, unselected: number }}
 */
export function countAvailabilitySlots(slots = {}, totalSlots = 21) {
  const values = Object.values(slots || {});
  const available = values.filter((v) => v === "available").length;
  const busy = values.filter((v) => v === "busy").length;
  const unselected = Math.max(0, totalSlots - available - busy);
  return {
    available,
    busy,
    unselected,
  };
}

/**
 * Tính toán cảnh báo thiếu người theo từng ca x ngày trong tuần
 * So sánh số nhân sự rảnh với định mức nhân sự trong templates ca
 */
export function calculateShiftShortages(employees = [], days = [], shifts = [], templates = []) {
  const warnings = [];
  const getRequired = (shiftName) => {
    const tpl = templates.find((t) => t.name?.toLowerCase().includes(shiftName.toLowerCase()));
    if (!tpl) return 2;
    if (typeof tpl.total === "number" && tpl.total > 0) return tpl.total;
    const sum = (Number(tpl.phucVu) || 0) + (Number(tpl.phaChe) || 0) + (Number(tpl.thuNgan) || 0);
    return sum > 0 ? sum : 2;
  };

  days.forEach((day) => {
    shifts.forEach((s) => {
      const required = getRequired(s.name);
      const availCount = employees.filter(
        (emp) => getSlotStatus(emp, day.dayIndex, s.name) === "available"
      ).length;

      if (availCount < required) {
        warnings.push({
          key: `${day.dayIndex}_${s.name}`,
          dayIndex: day.dayIndex,
          dayName: day.dayName,
          dateVn: day.dateVn,
          shiftName: s.name,
          availCount,
          required,
          shortage: required - availCount,
          level: "shortage",
        });
      } else if (availCount === required) {
        warnings.push({
          key: `${day.dayIndex}_${s.name}`,
          dayIndex: day.dayIndex,
          dayName: day.dayName,
          dateVn: day.dateVn,
          shiftName: s.name,
          availCount,
          required,
          shortage: 0,
          level: "tight",
        });
      }
    });
  });

  return warnings;
}
