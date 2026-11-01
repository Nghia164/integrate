/**
 * File: src/pages/employees/openShifts/openShiftsHelpers.js
 * Các hàm tiện ích & cấu hình cho trang Ca trực mở Staff (US18, US19)
 */

export const TABS = [
  { id: "open", label: "Ca phù hợp" },
  { id: "my_claims", label: "Ca đã nhận của tôi" },
];

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

export function getShiftDurationHours(startTime, endTime) {
  if (!startTime || !endTime) return "0.0";
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let startMinutes = sh * 60 + (sm || 0);
  let endMinutes = eh * 60 + (em || 0);
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  return ((endMinutes - startMinutes) / 60).toFixed(1);
}
