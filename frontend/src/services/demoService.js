// =============================================================================
// File: src/services/demoService.js
// Tầng: Dịch vụ (Service) - Quản lý chức năng demo hệ thống
// =============================================================================

/**
 * Đặt lại toàn bộ dữ liệu demo về trạng thái ban đầu và làm mới trình duyệt.
 */
export function resetDemo() {
  // BACKEND: Reset database về seed data ban đầu
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.clear();
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("rememberMe");
  }
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

export default {
  resetDemo,
};
