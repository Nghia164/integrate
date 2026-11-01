// =============================================================================
// File: src/services/replacementService.js
// Tầng: Dịch Vụ Gợi Ý Thay Thế (US22 / FR08)
// =============================================================================

const TIMEOUT_MS = 8000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const withTimeout = (promise) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS))]);

const MOCK_CANDIDATES = [
  { id: "NV003", name: "Lê Minh Cường", role: "Pha chế", roles: ["Pha chế"], roleTag: "Pha chế", score: 92, reasons: ["Rảnh ca này", "Đúng Role_Tag", "Giờ tuần hiện tại 24/40", "Đủ thời gian nghỉ"] },
  { id: "NV005", name: "Hoàng Văn Nam", role: "Pha chế", roles: ["Pha chế", "Phục vụ"], roleTag: "Pha chế", score: 85, reasons: ["Rảnh ca này", "Đúng Role_Tag", "Giờ tuần hiện tại 32/40", "Đủ thời gian nghỉ"] },
  { id: "NV004", name: "Phạm Thị Dung", role: "Pha chế", roles: ["Pha chế"], roleTag: "Pha chế", score: 71, reasons: ["Rảnh ca này", "Đúng Role_Tag", "Giờ tuần hiện tại 36/40", "Nghỉ vừa đủ tối thiểu"] },
];

async function mockSuggest(requestId) {
  await wait(300);
  if (String(requestId).endsWith("-error")) throw new Error("unavailable");
  return String(requestId).endsWith("-empty") ? [] : MOCK_CANDIDATES;
}

export function getReplacementSuggestions(requestId) {
  return withTimeout(mockSuggest(requestId));
}

export async function confirmReplacement(requestId, candidateId) {
  // BACKEND: Xác nhận người làm thay cho đơn nghỉ phép, cập nhật vào bảng leave_requests và bảng schedules, gửi thông báo cho nhân viên được gán
  await wait(300);
  return { status: "Replacement Confirmed", requestId, candidateId };
}

export default {
  getReplacementSuggestions,
  confirmReplacement,
};