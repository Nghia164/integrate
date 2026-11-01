// =============================================================================
// File: src/services/leaveService.js
// Tầng: Dịch Vụ Nghỉ Phép (US20, US21, US22, US23)
// =============================================================================

import {
  getSavedLeaveRequests,
  saveLeaveRequests,
  getAIReplacementCandidates,
  initialLeaveRequests,
} from "../mocks/leaveMock.js";
import { getCurrentUser } from "./authService.js";
import { getSavedOpenShifts, saveOpenShifts } from "./openShiftService.js";
import { createNotification } from "./notificationService.js";
import { restoreEmployeeShiftInSchedule } from "./scheduleService.js";

const ALLOWED = {
  approve: ["pending"],
  reject: ["pending"],
  requestReplacement: ["approved"],
  respond: ["replacement_pending"],
  cancelRequest: ["replacement_pending"],
  openShift: ["approved"],
};

const NO_REPLACEMENT = {
  replacementId: null,
  replacementName: null,
  replacementRole: null,
  replacementRequestedAt: null,
  replacementAssignedAt: null,
};

const now = () =>
  `${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

const businessError = (message) => Object.assign(new Error(message), { business: true });

function transition(id, action, patch) {
  const list = getSavedLeaveRequests();
  const req = list.find((r) => r.id === id);
  if (!req) throw businessError("Không tìm thấy đơn xin nghỉ.");
  if (!ALLOWED[action].includes(req.status)) {
    throw businessError(
      req.status === "rejected"
        ? "Đơn này đã bị từ chối nên không thể xử lý tiếp."
        : "Trạng thái đơn đã thay đổi, vui lòng tải lại danh sách."
    );
  }
  const next = { ...req, ...patch(req) };
  saveLeaveRequests(list.map((r) => (r.id === id ? next : r)));
  return next;
}

export async function getLeaveRequests(params) {
  let list = getSavedLeaveRequests();
  if (params?.status && params.status !== "all") list = list.filter((r) => r.status === params.status);
  if (params?.employeeId && params.employeeId !== "all")
    list = list.filter((r) => r.employeeId === params.employeeId);
  return list;
}

export async function submitLeave(data) {
  // BACKEND: Tạo đơn xin nghỉ phép vào bảng leave_requests, kiểm tra kỳ lương chưa chốt, gửi thông báo cho Manager
  const list = getSavedLeaveRequests();
  const newReq = {
    id: `LV-2026-${String(list.length + 1).padStart(3, "0")}`,
    status: "pending",
    createdAt: now(),
    managerNote: "",
    openShiftCreated: false,
    declinedIds: [],
    ...NO_REPLACEMENT,
    ...data,
  };
  saveLeaveRequests([newReq, ...list]);
  return newReq;
}

export const createLeaveRequest = submitLeave;

export async function getReplacementSuggestions(id) {
  const item = getSavedLeaveRequests().find((r) => r.id === id);
  if (!item) throw businessError("Không tìm thấy đơn xin nghỉ.");
  return getAIReplacementCandidates(item);
}

export async function approveLeave(id, managerNote = "") {
  // BACKEND: Duyệt đơn nghỉ phép: kiểm tra kỳ lương chưa chốt, ca chưa diễn ra, chưa check-in; gỡ nhân viên khỏi lịch (schedules); tạo bản ghi vắng phép trên sổ chấm công (attendance); gửi thông báo cho nhân viên
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw businessError("Chỉ Quản lý mới có quyền phê duyệt đơn nghỉ phép.");
  }
  const next = transition(id, "approve", () => ({
    status: "approved",
    managerNote: managerNote || "Đã duyệt đơn nghỉ.",
  }));
  return next;
}

export async function rejectLeave(id, managerNote = "") {
  // BACKEND: Từ chối đơn nghỉ phép, ghi lý do từ chối vào bảng leave_requests và gửi thông báo cho nhân viên
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw businessError("Chỉ Quản lý mới có quyền từ chối đơn nghỉ phép.");
  }
  if (!managerNote.trim()) throw businessError("Vui lòng nhập lý do từ chối.");
  const next = transition(id, "reject", () => ({ status: "rejected", managerNote: managerNote.trim() }));
  return next;
}

export async function requestReplacement(id, candidate) {
  // BACKEND: Gửi yêu cầu tìm người làm thay ca nghỉ phép cho nhân viên được chọn
  if (!candidate?.id) throw businessError("Chưa chọn nhân viên thay thế.");
  const next = transition(id, "requestReplacement", (cur) => ({
    status: "replacement_pending",
    replacementId: candidate.id,
    replacementName: candidate.name,
    replacementRole: candidate.roleTag || candidate.role || "",
    replacementRequestedAt: now(),
    replacementAssignedAt: null,
    declinedIds: (cur.declinedIds || []).filter((x) => x !== candidate.id),
  }));
  return next;
}

export async function respondReplacement(id, accept, note = "") {
  // BACKEND: Nhân viên phản hồi nhận ca làm thay hoặc từ chối; nếu nhận ca làm thay thì cập nhật phân công lịch làm việc (schedules)
  if (accept) {
    return transition(id, "respond", () => ({
      status: "replacement_confirmed",
      replacementAssignedAt: now(),
      managerNote: note ? `Người thay nhận ca: ${note}` : "Người thay đã nhận ca.",
    }));
  }
  return transition(id, "respond", (cur) => ({
    status: "approved",
    declinedIds: [...new Set([...(cur.declinedIds || []), cur.replacementId])],
    ...NO_REPLACEMENT,
    managerNote: note ? `Người thay từ chối: ${note}` : "Người thay đã từ chối.",
  }));
}

export async function cancelReplacementRequest(id) {
  // BACKEND: Hủy yêu cầu tìm người làm thay ca nghỉ
  return transition(id, "cancelRequest", () => ({
    status: "approved",
    ...NO_REPLACEMENT,
  }));
}

export async function createOpenShiftFromLeave(id) {
  // BACKEND: Chuyển ca nghỉ phép thành ca trực mở (open_shifts) để toàn bộ nhân viên có thể đăng ký nhận ca
  const u = getCurrentUser();
  if (u && u.role !== "manager") {
    throw businessError("Chỉ Quản lý mới có quyền tạo ca trực mở từ đơn nghỉ.");
  }
  return transition(id, "openShift", () => ({
    openShiftCreated: true,
  }));
}

export async function cancelLeaveRequest(id) {
  // BACKEND: Nhân viên hủy đơn xin nghỉ phép (US23)
  // Quy tắc:
  // - Cho phép hủy khi trạng thái "Chờ duyệt", hoặc "Đã duyệt" NHƯNG chưa có người thay thế.
  // - Nếu đã có người thay thế (replacement_confirmed): chặn hủy với lỗi "Không thể hủy vì đã có người thay thế".
  // - Nếu Chợ ca liên kết đã có người nhận (filled): chặn hủy với lỗi "Không thể hủy vì đã có người nhận ca".
  // - Nếu Chợ ca còn mở (open): hủy luôn ca trên Chợ ca.
  // - Sau khi hủy: trạng thái đơn thành 'cancelled', ca trực gốc của nhân viên được khôi phục, gửi thông báo cho Manager.
  const list = getSavedLeaveRequests();
  const req = list.find((r) => r.id === id);
  if (!req) throw businessError("Không tìm thấy đơn xin nghỉ.");

  if (req.status === "replacement_confirmed") {
    throw businessError("Không thể hủy vì đã có người thay thế");
  }

  // Kiểm tra Chợ ca (Open Shift)
  const openShifts = getSavedOpenShifts();
  const linkedOpenShift = openShifts.find(
    (os) => !os.cancelled && os.date === req.date && (os.shiftName === req.shiftName || os.shiftId === req.shiftId)
  );

  if (linkedOpenShift) {
    const isFilled = linkedOpenShift.status === "filled" || (linkedOpenShift.claims && linkedOpenShift.claims.length > 0);
    if (isFilled) {
      throw businessError("Không thể hủy vì đã có người nhận ca");
    }
    linkedOpenShift.cancelled = true;
    linkedOpenShift.status = "cancelled";
    saveOpenShifts(openShifts);
  }

  req.status = "cancelled";
  req.cancelledAt = now();
  saveLeaveRequests(list);

  if (req.date && req.employeeId) {
    restoreEmployeeShiftInSchedule(req.employeeId, req.date, req.shiftId || req.shiftName);
  }

  const empName = req.employeeName || req.name || "Nhân viên";
  const shiftInfo = req.shiftName ? `ca ${req.shiftName} ngày ${req.date}` : `ngày ${req.date}`;
  await createNotification({
    title: "Đơn nghỉ phép đã hủy",
    content: `${empName} đã hủy yêu cầu nghỉ phép ${shiftInfo}. Ca trực gốc đã được khôi phục.`,
    type: "leave",
    link: "/manager/leave",
    recipientRole: "manager",
  });

  return { success: true, req };
}

export const resetMockLeaveData = () => ({ success: true });
export { getAIReplacementCandidates, initialLeaveRequests, getSavedLeaveRequests };

export const subscribeLeave = () => {
  return () => {};
};

export default {
  getLeaveRequests,
  submitLeave,
  createLeaveRequest,
  getReplacementSuggestions,
  approveLeave,
  rejectLeave,
  requestReplacement,
  respondReplacement,
  cancelReplacementRequest,
  cancelLeaveRequest,
  resetMockLeaveData,
  getAIReplacementCandidates,
  initialLeaveRequests,
  getSavedLeaveRequests,
  createOpenShiftFromLeave,
  subscribeLeave,
};


