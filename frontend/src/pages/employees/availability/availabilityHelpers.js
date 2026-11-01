// =============================================================================
// FILE NÀY LÀM GÌ: Tiện ích định dạng và hỗ trợ đăng ký lịch rảnh (Staff)
// Loại: Helpers
// US: US08 (Đăng ký lịch rảnh)
// =============================================================================

/**
 * Định dạng thời điểm đã gửi đăng ký lịch rảnh
 * @param {string} iso - Chuỗi thời gian ISO
 * @returns {string} Chuỗi hiển thị tiếng Việt
 */
export function formatSubmittedAt(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `Đã gửi lúc ${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return "";
  }
}
