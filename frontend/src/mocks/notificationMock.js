/**
 * File: src/mocks/notificationMock.js
 * Dữ liệu thông báo mẫu (Static Mock Data)
 */

let mockNotifications = [
  {
    id: "NOTIF-001",
    title: "Đơn xin nghỉ phép mới",
    content: "Trần Thị Bích gửi đơn xin nghỉ ca sáng Thứ 7 (31/10/2026).",
    type: "leave",
    link: "/manager/leave",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    is_read: false,
    read_at: null,
    recipientRole: "manager",
  },
  {
    id: "NOTIF-002",
    title: "Yêu cầu đổi ca chờ duyệt",
    content: "Lê Minh Cường và Hoàng Văn Nam gửi yêu cầu đổi ca trực Thứ 6.",
    type: "exchange",
    link: "/manager/shift-exchange",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    is_read: false,
    read_at: null,
    recipientRole: "manager",
  },
  {
    id: "NOTIF-003",
    title: "Đăng ký lịch rảnh tuần mới",
    content: "Vũ Minh Thảo đã nộp đăng ký lịch rảnh tuần sau.",
    type: "availability",
    link: "/manager/availability",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    is_read: true,
    read_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    recipientRole: "manager",
  },
  {
    id: "NOTIF-004",
    title: "Cần phân công lại ca tương lai",
    content: "Đỗ Kim Ngân đã nghỉ việc. Cần phân công lại 3 ca tương lai.",
    type: "employee",
    link: "/manager/schedule",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    is_read: false,
    read_at: null,
    recipientRole: "manager",
  },
  {
    id: "NOTIF-005",
    title: "Yêu cầu nghỉ phép đã bị hủy",
    content: "Phạm Thị Dung đã hủy yêu cầu nghỉ phép ca Tối Thứ 6.",
    type: "leave",
    link: "/manager/leave",
    created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    is_read: true,
    read_at: new Date(Date.now() - 1000 * 60 * 1400).toISOString(),
    recipientRole: "manager",
  },
  // Staff notifications
  {
    id: "NOTIF-STF-001",
    title: "Lịch làm việc đã được công bố",
    content: "Quản lý đã công bố lịch làm việc chính thức tuần từ 27/10 đến 02/11.",
    type: "schedule",
    link: "/employees/schedule",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    is_read: false,
    read_at: null,
    recipientRole: "staff",
  },
  {
    id: "NOTIF-STF-002",
    title: "Đơn xin nghỉ phép đã được duyệt",
    content: "Quản lý đã phê duyệt đơn xin nghỉ ca Chiều Chủ Nhật của bạn.",
    type: "leave",
    link: "/employees/leave",
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    is_read: false,
    read_at: null,
    recipientRole: "staff",
    recipientId: "NV001",
  },
  {
    id: "NOTIF-STF-003",
    title: "Yêu cầu đổi ca được chấp thuận",
    content: "Đồng nghiệp đã đồng ý yêu cầu đổi ca trực Thứ 7 của bạn.",
    type: "exchange",
    link: "/employees/shift-exchange",
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    is_read: true,
    read_at: new Date(Date.now() - 1000 * 60 * 250).toISOString(),
    recipientRole: "staff",
    recipientId: "NV001",
  },
  {
    id: "NOTIF-STF-004",
    title: "Nhắc nhở đăng ký lịch rảnh",
    content: "Vui lòng hoàn thành đăng ký khung giờ rảnh tuần tới trước 23:59 Chủ Nhật.",
    type: "availability",
    link: "/employees/availability",
    created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    is_read: true,
    read_at: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
    recipientRole: "staff",
  },
];

export function getMockNotifications(params = {}) {
  let list = JSON.parse(JSON.stringify(mockNotifications));
  const user = params.user;
  if (user) {
    const role = user.role === "manager" ? "manager" : "staff";
    const empId = user.employeeId || user.id;
    list = list.filter((n) => {
      const notifRole = n.recipientRole || "manager";
      if (notifRole !== role) return false;
      if (role === "staff" && n.recipientId && n.recipientId !== empId) return false;
      return true;
    });
  }
  return list;
}

export function markNotificationAsReadMock(id) {
  // BACKEND: Đánh dấu thông báo đã đọc trong bảng notifications
  const notif = mockNotifications.find((n) => n.id === id);
  if (notif) {
    notif.is_read = true;
    notif.read_at = new Date().toISOString();
  }
  return { success: true, id };
}

export const markMockNotificationAsRead = markNotificationAsReadMock;

export function markAllMockNotificationsAsRead(user) {
  const role = user?.role === "manager" ? "manager" : "staff";
  const empId = user?.employeeId || user?.id;

  mockNotifications.forEach((n) => {
    const notifRole = n.recipientRole || "manager";
    if (user) {
      if (notifRole !== role) return;
      if (role === "staff" && n.recipientId && n.recipientId !== empId) return;
    }
    n.is_read = true;
    n.read_at = new Date().toISOString();
  });
  return { success: true };
}

export function addMockNotification(notif) {
  const newNotif = {
    id: `NOTIF-${String(Date.now()).slice(-4)}`,
    title: notif.title || "Thông báo",
    content: notif.content || "",
    type: notif.type || "system",
    link: notif.link || "/manager/schedule",
    created_at: new Date().toISOString(),
    is_read: false,
    read_at: null,
    recipientRole: notif.recipientRole || "manager",
    recipientId: notif.recipientId || null,
    ...notif,
  };
  mockNotifications.unshift(newNotif);
  return newNotif;
}

export default {
  mockNotifications,
  getMockNotifications,
  addMockNotification,
  markNotificationAsReadMock,
  markMockNotificationAsRead,
  markAllMockNotificationsAsRead,
};

