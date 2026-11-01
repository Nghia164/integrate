// =============================================================================
// File: src/services/notificationService.js
// Tầng: Dịch Vụ Thông Báo (Notifications Service)
// =============================================================================

import {
  getMockNotifications,
  addMockNotification,
  markMockNotificationAsRead,
  markAllMockNotificationsAsRead,
} from "../mocks/notificationMock.js";
import { getCurrentUser } from "./authService.js";

/**
 * Lấy danh sách thông báo của người dùng hiện tại (US30)
 */
export async function getNotifications(params = {}) {
  const user = params.user || getCurrentUser();
  return getMockNotifications({ ...params, user });
}

/**
 * Tạo thông báo mới
 */
export async function createNotification(notif) {
  // BACKEND: Thêm thông báo mới vào bảng notifications và push realtime
  return addMockNotification(notif);
}

/**
 * Đánh dấu thông báo là đã đọc
 */
export async function markAsRead(id) {
  // BACKEND: Đánh dấu thông báo đã đọc trong bảng notifications
  return markMockNotificationAsRead(id);
}

/**
 * Đánh dấu toàn bộ thông báo là đã đọc
 */
export async function markAllAsRead() {
  // BACKEND: Đánh dấu toàn bộ thông báo đã đọc của user trong bảng notifications
  const user = getCurrentUser();
  return markAllMockNotificationsAsRead(user);
}

export default {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
};
