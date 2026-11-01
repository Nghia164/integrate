/**
 * File: src/mocks/leaveMock.js
 * Dữ liệu đơn xin nghỉ phép mẫu (Static Mock Data)
 */

import { mockEmployees } from "./employeeMock.js";

let mockLeaveRequests = [
  {
    id: "LV-2026-001",
    employeeId: "NV002",
    employeeName: "Trần Thị Bích",
    shiftDate: "Thứ 7, 31/10/2026",
    isoDate: "2026-10-31",
    shiftId: "morning",
    shiftName: "Ca sáng",
    shiftTime: "06:00 - 12:00",
    leaveType: "emergency",
    leaveTypeName: "Nghỉ ốm đột xuất",
    reason: "Bị cảm sốt cần nghỉ ngơi và đi khám tại bệnh viện vào sáng Thứ 7.",
    status: "pending",
    createdAt: "26/10/2026 08:30",
    replacementId: null,
    replacementAssignedAt: null,
    managerNote: "",
    openShiftCreated: false,
  },
  {
    id: "LV-2026-002",
    employeeId: "NV001",
    employeeName: "Nguyễn Văn An",
    shiftDate: "Thứ 7, 31/10/2026",
    isoDate: "2026-10-31",
    shiftId: "afternoon",
    shiftName: "Ca chiều",
    shiftTime: "12:00 - 17:00",
    leaveType: "study",
    leaveTypeName: "Việc học tập / Thi cử",
    reason: "Lịch thi học phần trùng với ca trực chiều Thứ 7.",
    status: "pending",
    createdAt: "26/10/2026 10:00",
    replacementId: null,
    replacementAssignedAt: null,
    managerNote: "",
    openShiftCreated: false,
  },
  {
    id: "LV-2026-003",
    employeeId: "NV003",
    employeeName: "Lê Minh Cường",
    shiftDate: "Thứ 4, 28/10/2026",
    isoDate: "2026-10-28",
    shiftId: "morning",
    shiftName: "Ca sáng",
    shiftTime: "06:00 - 12:00",
    leaveType: "personal",
    leaveTypeName: "Nghỉ phép cá nhân",
    reason: "Khám sức khỏe định kỳ.",
    status: "approved",
    createdAt: "24/10/2026 09:00",
    replacementId: "NV005",
    replacementName: "Hoàng Văn Nam",
    replacementRole: "Pha chế",
    replacementAssignedAt: "25/10/2026 14:00",
    managerNote: "Đã duyệt, Hoàng Văn Nam nhận trực thay (vai trò Pha chế).",
    openShiftCreated: false,
  },
  {
    id: "LV-2026-004",
    employeeId: "NV005",
    employeeName: "Hoàng Văn Nam",
    shiftDate: "Thứ 6, 30/10/2026",
    isoDate: "2026-10-30",
    shiftId: "evening",
    shiftName: "Ca tối",
    shiftTime: "17:00 - 22:00",
    leaveType: "personal",
    leaveTypeName: "Nghỉ phép cá nhân",
    reason: "Việc gia đình.",
    status: "rejected",
    createdAt: "25/10/2026 11:00",
    replacementId: null,
    replacementAssignedAt: null,
    managerNote: "Ca tối cuối tuần đông khách, không thể phê duyệt.",
    openShiftCreated: false,
  },
];

export const initialLeaveRequests = mockLeaveRequests;

export function getLeaveRequests() {
  return JSON.parse(JSON.stringify(mockLeaveRequests));
}

export function getSavedLeaveRequests() {
  return getLeaveRequests();
}

export function saveLeaveRequests(requests) {
  // BACKEND: Lưu đơn nghỉ phép vào bảng leave_requests
  mockLeaveRequests = requests;
  return { success: true };
}

export function createLeaveRequestMock(payload) {
  // BACKEND: Tạo đơn xin nghỉ phép trong bảng leave_requests
  const item = {
    ...payload,
    id: `LV-2026-${String(mockLeaveRequests.length + 1).padStart(3, "0")}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  mockLeaveRequests.push(item);
  return { success: true, item };
}

export function updateLeaveStatus(id, newStatus, managerNote = "") {
  // BACKEND: Cập nhật trạng thái đơn nghỉ và đồng bộ ca On-Leave vào schedules
  const item = mockLeaveRequests.find((l) => l.id === id);
  if (item) {
    item.status = newStatus;
    item.managerNote = managerNote;
  }
  return { success: true, item };
}

export function getAIReplacementCandidates(leaveRequest) {
  if (!leaveRequest) return [];
  const activeEmployees = mockEmployees.filter((e) => e.status !== "Nghỉ việc" && e.id !== leaveRequest.employeeId);

  return activeEmployees.map((cand) => {
    const candRoles = cand.roles || [cand.role || cand.roleTag];
    const targetRole = leaveRequest.roleTag || leaveRequest.role;
    const sameRole = candRoles.includes(targetRole);
    let matchScore = 75;
    const reasons = [];

    if (sameRole) {
      matchScore += 18;
      reasons.push(`Cùng vị trí chuyên môn: ${candRoles.join(", ")}`);
    } else {
      reasons.push(`Có kỹ năng hỗ trợ vị trí ${targetRole}`);
    }

    reasons.push("Đang rảnh khung giờ này");
    reasons.push("Đạt tiêu chuẩn thời gian nghỉ giữa 2 ca");

    return {
      id: cand.id,
      name: cand.name,
      role: cand.role || candRoles[0],
      roles: candRoles,
      roleTag: candRoles[0],
      avatar: cand.avatar,
      contract: cand.contract,
      phone: cand.phone,
      matchScore: Math.min(99, matchScore),
      reasons,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export default {
  mockLeaveRequests,
  initialLeaveRequests,
  getLeaveRequests,
  getSavedLeaveRequests,
  saveLeaveRequests,
  createLeaveRequestMock,
  updateLeaveStatus,
  getAIReplacementCandidates,
};