// =============================================================================
// File: src/services/shiftExchangeService.js
// Tầng: Dịch vụ Đổi ca làm việc (US15, US16, US17)
// =============================================================================

import {
  getExchangeRequests as mockGetExchangeRequests,
  createExchangeRequest as mockCreateExchangeRequest,
  peerRespondExchange as mockPeerRespondExchange,
  managerApproveExchange as mockManagerApproveExchange,
  managerRejectExchange as mockManagerRejectExchange,
  cancelExchangeRequest as mockCancelExchangeRequest,
} from "../mocks/shiftExchangeMock.js";
import { getCurrentUser } from "./authService.js";
import { getEmployees } from "./employeeService.js";
import { getSavedSchedules } from "./scheduleService.js";

export const getExchangeRequests = (params) => {
  const all = mockGetExchangeRequests(params);
  if (!params) return all;
  const u = getCurrentUser();
  const uid = u?.employeeId || u?.id;
  if (params.direction === "sent") {
    return all.filter((r) => r.requesterId === uid || r.sender_id === uid);
  }
  if (params.direction === "received") {
    return all.filter((r) => r.targetEmployeeId === uid || r.recipient_id === uid);
  }
  return all;
};

export const getExchangeCandidates = async (shift, currentUserId) => {
  const u = getCurrentUser();
  const selfId = currentUserId || u?.employeeId || u?.id;
  const employees = await getEmployees();
  const workingEmployees = employees.filter((e) => e.status === "Đang làm việc" && e.id !== selfId);

  const shiftRole = shift?.role || shift?.roleTag || shift?.shiftRole;
  const shiftDate = shift?.date || shift?.isoDate;
  const shiftId = shift?.shiftId || shift?.shiftCode;

  const schedules = getSavedSchedules("2026-10-26");
  const dayKeyMap = {
    "2026-10-26": "T2",
    "2026-10-27": "T3",
    "2026-10-28": "T4",
    "2026-10-29": "T5",
    "2026-10-30": "T6",
    "2026-10-31": "T7",
    "2026-11-01": "CN",
  };
  const dayKey = dayKeyMap[shiftDate] || shift?.dayId;

  return workingEmployees
    .filter((emp) => {
      // 1. Cùng vai trò ca (roles.includes)
      const empRoles = emp.roles || [emp.role || "Phục vụ"];
      if (shiftRole && !empRoles.includes(shiftRole)) return false;

      // 2. Không trùng ca cùng ngày
      if (dayKey && schedules) {
        const hasShiftSameDay = ["morning", "afternoon", "evening"].some((code) => {
          const slot = schedules[`${code}_${dayKey}`];
          return slot?.assigned?.some((assignedEmp) => assignedEmp.id === emp.id);
        });
        if (hasShiftSameDay) return false;

        // 3. Đủ nghỉ tối thiểu (>= 12h: ví dụ ca sáng thì tối hôm trước không có ca)
        if (shiftId === "morning") {
          const prevDays = { T3: "T2", T4: "T3", T5: "T4", T6: "T5", T7: "T6", CN: "T7" };
          const prevDay = prevDays[dayKey];
          if (prevDay) {
            const eveningPrev = schedules[`evening_${prevDay}`];
            if (eveningPrev?.assigned?.some((assignedEmp) => assignedEmp.id === emp.id)) return false;
          }
        }
      }

      return true;
    })
    .map((emp) => ({
      // Chỉ lộ tên, vai trò, ca (không SĐT, lương, chấm công)
      id: emp.id,
      employeeId: emp.id,
      name: emp.name,
      roles: emp.roles || [emp.role || "Phục vụ"],
      roleTag: emp.roleTag || emp.roles?.[0] || emp.role || "Phục vụ",
    }));
};

export const createExchangeRequest = async (data) => {
  // BACKEND: Tạo yêu cầu đổi ca vào bảng shift_exchanges, gửi thông báo cho đồng nghiệp được chọn
  return mockCreateExchangeRequest(data);
};

export const sendExchangeRequest = createExchangeRequest;

export const peerRespondExchange = async (id, data) => {
  // BACKEND: Đồng nghiệp phản hồi chấp thuận hoặc từ chối đổi ca, cập nhật status (waiting_manager / peer_rejected)
  return mockPeerRespondExchange(id, data);
};

export const managerApproveExchange = async (id, managerNote) => {
  // BACKEND: Manager phê duyệt hoán đổi ca: kiểm tra xung đột lịch, luật nghỉ 12h, hoán đổi 2 nhân viên trong bảng schedules và cập nhật attendance
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw new Error("Chỉ Quản lý mới có quyền phê duyệt đơn đổi ca.");
  }
  return mockManagerApproveExchange(id, managerNote);
};

export const managerRejectExchange = async (id, rejectReason) => {
  // BACKEND: Manager từ chối đổi ca, lưu lý do và thông báo cho 2 nhân viên
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw new Error("Chỉ Quản lý mới có quyền từ chối đơn đổi ca.");
  }
  return mockManagerRejectExchange(id, rejectReason);
};

export const cancelExchangeRequest = async (id) => {
  // BACKEND: Nhân viên hủy yêu cầu đổi ca đang chờ xử lý
  return mockCancelExchangeRequest(id);
};

export const respondExchange = async (id, data) => {
  if (data.action === "peer_respond" || data.action === "accept" || data.action === "decline") {
    return peerRespondExchange(id, data);
  }
  if (data.action === "approve") {
    return managerApproveExchange(id, data.managerNote);
  }
  if (data.action === "reject") {
    return managerRejectExchange(id, data.rejectReason);
  }
  if (data.action === "cancel") {
    return cancelExchangeRequest(id);
  }
  return { id, ...data };
};

export const subscribeShiftExchange = () => {
  return () => {};
};

export const mockStore = {
  getExchangeRequests,
  getExchangeCandidates,
  createExchangeRequest,
  peerRespondExchange,
  managerApproveExchange,
  managerRejectExchange,
  cancelExchangeRequest,
};

export default {
  getExchangeRequests,
  getExchangeCandidates,
  createExchangeRequest,
  sendExchangeRequest,
  peerRespondExchange,
  managerApproveExchange,
  managerRejectExchange,
  cancelExchangeRequest,
  respondExchange,
  subscribeShiftExchange,
  mockStore,
};
