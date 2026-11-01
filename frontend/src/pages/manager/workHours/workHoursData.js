/**
 * Hằng số và hàm tiện ích cho module Giờ làm việc (US14 - Tổng hợp giờ làm)
 */

export const round1 = (n) => Math.round(n * 10) / 10;
export const fmtHours = (h) => `${h.toLocaleString("vi-VN")}h`;
export const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

/**
 * Mức hoàn thành giờ làm so với lịch:
 * >= 100%: xanh lá (#10b981)
 * >= 80%: vàng cam (#f59e0b)
 * < 80%: đỏ (#f43f5e)
 */
export const ratioHex = (ratio) => (ratio >= 100 ? "#10b981" : ratio >= 80 ? "#f59e0b" : "#f43f5e");
