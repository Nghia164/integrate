/**
 * File: src/mocks/shiftExchangeMock.js
 * Dữ liệu yêu cầu đổi ca mẫu (Static Mock Data)
 */

import { mockEmployees } from "./employeeMock.js";

let mockExchangeRequests = [
  {
    id: "EX-2026-005",
    requesterId: "NV003",
    requesterName: "Lê Minh Cường",
    sender_id: "NV003",
    sender_name: "Lê Minh Cường",
    sender_email: "leminhcuong@gmail.com",
    requesterShift: {
      date: "Thứ 6, 30/10/2026",
      isoDate: "2026-10-30",
      dayId: "T6",
      shiftId: "afternoon",
      shiftName: "Ca chiều",
      time: "12:00 - 17:00",
    },
    shift: {
      date: "Thứ 6, 30/10/2026",
      isoDate: "2026-10-30",
      dayId: "T6",
      shiftId: "afternoon",
      shiftName: "Ca chiều",
      time: "12:00 - 17:00",
    },
    targetEmployeeId: "NV005",
    targetEmployeeName: "Hoàng Văn Nam",
    recipient_id: "NV005",
    recipient_name: "Hoàng Văn Nam",
    recipient_email: "hoangvannam@gmail.com",
    targetShift: {
      date: "Thứ 7, 31/10/2026",
      isoDate: "2026-10-31",
      dayId: "T7",
      shiftId: "evening",
      shiftName: "Ca tối",
      time: "17:00 - 22:00",
    },
    exchangeType: "swap",
    reason: "Đổi ca chiều Thứ 6 lấy ca tối Thứ 7 để xử lý việc riêng.",
    note: "Đổi ca chiều Thứ 6 lấy ca tối Thứ 7 để xử lý việc riêng.",
    status: "pending_manager",
    createdAt: "26/10/2026 09:30",
    sent_at: "26/10/2026 09:30",
    peerRespondedAt: "26/10/2026 10:15",
    managerNote: "",
  },
  {
    id: "EX-2026-001",
    requesterId: "NV001",
    requesterName: "Nguyễn Văn An",
    sender_id: "NV001",
    sender_name: "Nguyễn Văn An",
    sender_email: "nguyenvanan@gmail.com",
    requesterShift: {
      date: "Thứ 2, 26/10/2026",
      isoDate: "2026-10-26",
      dayId: "T2",
      shiftId: "morning",
      shiftName: "Ca sáng",
      time: "06:00 - 12:00",
    },
    shift: {
      date: "Thứ 2, 26/10/2026",
      isoDate: "2026-10-26",
      dayId: "T2",
      shiftId: "morning",
      shiftName: "Ca sáng",
      time: "06:00 - 12:00",
    },
    targetEmployeeId: "NV002",
    targetEmployeeName: "Trần Thị Bích",
    recipient_id: "NV002",
    recipient_name: "Trần Thị Bích",
    recipient_email: "tranthibich@gmail.com",
    targetShift: {
      date: "Thứ 4, 28/10/2026",
      isoDate: "2026-10-28",
      dayId: "T4",
      shiftId: "morning",
      shiftName: "Ca sáng",
      time: "06:00 - 12:00",
    },
    exchangeType: "swap",
    reason: "Bận việc gia đình đầu tuần.",
    note: "Bận việc gia đình đầu tuần.",
    status: "approved",
    createdAt: "24/10/2026 08:00",
    sent_at: "24/10/2026 08:00",
    peerRespondedAt: "24/10/2026 09:00",
    managerNote: "Đã duyệt.",
  },
];

export const initialExchangeRequests = mockExchangeRequests;

export function getExchangeRequests() {
  return JSON.parse(JSON.stringify(mockExchangeRequests));
}

export function saveExchangeRequests(requests) {
  // BACKEND: Lưu danh sách yêu cầu đổi ca vào bảng shift_exchanges
  mockExchangeRequests = requests;
  return { success: true };
}

export function updateExchangeStatus(id, newStatus, managerNote = "") {
  // BACKEND: Cập nhật trạng thái đổi ca và hoán đổi ca trong bảng schedules
  const item = mockExchangeRequests.find((r) => r.id === id);
  if (item) {
    item.status = newStatus;
    item.managerNote = managerNote;
  }
  return { success: true, item };
}

export const getEligiblePartners = () => mockEmployees.filter((e) => e.status === "Đang làm việc");

export function getExchangeCandidates() {
  return mockEmployees.filter((e) => e.status === "Đang làm việc");
}


export function createExchangeRequest(data) {
  const item = {
    ...data,
    id: `EX-2026-${String(mockExchangeRequests.length + 1).padStart(3, "0")}`,
    status: "waiting_peer",
    createdAt: new Date().toISOString(),
  };
  mockExchangeRequests.push(item);
  return item;
}

export function peerRespondExchange(id, data) {
  const item = mockExchangeRequests.find((r) => r.id === id);
  if (item) {
    item.status = data.action === "accept" || data.status === "accepted" ? "waiting_manager" : "peer_rejected";
    item.peerRespondedAt = new Date().toISOString();
  }
  return item;
}

export function managerApproveExchange(id, managerNote = "") {
  return updateExchangeStatus(id, "approved", managerNote).item;
}

export function managerRejectExchange(id, rejectReason = "") {
  return updateExchangeStatus(id, "rejected", rejectReason).item;
}

export function cancelExchangeRequest(id) {
  const item = mockExchangeRequests.find((r) => r.id === id);
  if (item) {
    item.status = "cancelled";
  }
  return item;
}

export default {
  mockExchangeRequests,
  initialExchangeRequests,
  getExchangeRequests,
  saveExchangeRequests,
  updateExchangeStatus,
  getEligiblePartners,
  getExchangeCandidates,
  createExchangeRequest,
  peerRespondExchange,
  managerApproveExchange,
  managerRejectExchange,
  cancelExchangeRequest,
};

