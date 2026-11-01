/**
 * File: src/pages/employees/shiftExchange/ShiftExchangeModals.jsx
 * Các Modal nghiệp vụ trang Đổi ca Staff (US15, US16, US17):
 * 1. CreateExchangeModal - Tạo yêu cầu đổi ca
 * 2. DeclineExchangeModal - Từ chối yêu cầu đổi ca
 * 3. CancelExchangeModal - Xác nhận hủy yêu cầu đổi ca
 * 4. ExchangeDetailModal - Xem chi tiết yêu cầu đổi ca
 */

import { ArrowLeftRight, ShieldCheck } from "lucide-react";
import { Modal, Button } from "../../../components/FormKit";
import { StatusBadge } from "../../../components/TableKit";
import { getShiftColors } from "../../../lib/shiftColors";
import {
  STATUS_LABELS,
  STATUS_TONES,
  requestStatus,
  formatDate,
  formatShiftName,
  shiftFromRequest,
  sentAt,
} from "./shiftExchangeHelpers";

// 1. MODAL TẠO YÊU CẦU ĐỔI CA
export function CreateExchangeModal({
  isOpen,
  onClose,
  onSubmit,
  shifts,
  selectedShiftId,
  chooseShift,
  selectedShift,
  eligibleCandidates,
  targetEmployeeId,
  setTargetEmployeeId,
  selectedCandidate,
  message,
  setMessage,
  sending,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title="Tạo yêu cầu đổi ca"
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Nhóm 1: Thông tin ca làm việc */}
        <div>
          <h4 className="mb-3 text-[14px] font-semibold text-slate-900">Thông tin ca làm việc</h4>
          <div>
            <label htmlFor="shift-select-input" className="block mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-slate-600">
              Chọn ca bạn muốn đổi <span className="text-rose-500">*</span>
            </label>
            <select
              id="shift-select-input"
              value={selectedShiftId}
              onChange={(e) => chooseShift(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13.5px] text-slate-800 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#CBE3F0]"
            >
              <option value="">-- Chọn ca đã công bố --</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {formatDate(shift.date)} · Ca {shift.shiftName} ({shift.startTime}–{shift.endTime}) · {shift.roleTag}
                </option>
              ))}
            </select>
          </div>

          {selectedShift && (() => {
            const colors = getShiftColors(selectedShift.shiftName || selectedShift.name);
            return (
              <div
                className="mt-3 rounded-xl p-3 text-[12.5px]"
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: colors.border,
                  backgroundColor: colors.bg,
                }}
              >
                <div className="font-bold text-slate-900">
                  {formatDate(selectedShift.date, true)} · {formatShiftName(selectedShift.shiftName)}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-slate-700">
                  <span className="font-semibold">{selectedShift.startTime} – {selectedShift.endTime}</span>
                  <span>·</span>
                  <span>{selectedShift.roleTag}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Nhóm 2: Đồng nghiệp & Lý do */}
        <div className="border-t border-slate-200 pt-5 space-y-4">
          <h4 className="text-[14px] font-semibold text-slate-900">Đồng nghiệp & Lý do</h4>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="candidate-select-input" className="block text-[12px] font-semibold uppercase tracking-wider text-slate-600">
                Đồng nghiệp nhận ca <span className="text-rose-500">*</span>
              </label>
              {selectedShift && (
                <span className="text-[11.5px] text-slate-500">
                  {eligibleCandidates.length} người phù hợp
                </span>
              )}
            </div>
            <select
              id="candidate-select-input"
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
              disabled={!selectedShift}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13.5px] text-slate-800 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#CBE3F0] disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {selectedShift ? "-- Chọn đồng nghiệp rảnh ca này --" : "-- Hãy chọn ca trước --"}
              </option>
              {eligibleCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.roles ? (Array.isArray(c.roles) ? c.roles.join(", ") : c.roles) : c.roleTag || "Nhân viên"})
                </option>
              ))}
            </select>
          </div>

          {selectedCandidate && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-[12.5px] text-emerald-900 flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>{selectedCandidate.name}</strong> hoàn toàn rảnh vào khung giờ này và đủ điều kiện làm thay.
              </span>
            </div>
          )}

          <div>
            <label htmlFor="reason-textarea-input" className="block mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-slate-600">
              Lời nhắn gửi đồng nghiệp <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="reason-textarea-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Nhập lý do đổi ca và lời nhắn gửi đồng nghiệp..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13.5px] text-slate-800 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#CBE3F0]"
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[11.5px] text-slate-400">Nêu rõ lý do để đồng nghiệp dễ đồng ý</span>
              <span className="text-[11.5px] text-slate-400">{message.length}/200</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={sending || !selectedShiftId || !targetEmployeeId || !message.trim()}
          >
            {sending ? "Đang gửi..." : "Gửi yêu cầu đổi ca"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// 2. MODAL TỪ CHỐI YÊU CẦU
export function DeclineExchangeModal({
  declineTarget,
  onClose,
  declineReason,
  setDeclineReason,
  confirmDecline,
  busyId,
}) {
  if (!declineTarget) return null;

  return (
    <Modal
      isOpen={Boolean(declineTarget)}
      title="Từ chối yêu cầu đổi ca"
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-[14px] text-slate-600">
          Bạn đang từ chối yêu cầu đổi ca từ <strong>{declineTarget?.sender_name || declineTarget?.requesterName || "Đồng nghiệp"}</strong>.
        </p>
        <div>
          <label htmlFor="decline-reason-input" className="block mb-1.5 text-[13px] font-semibold text-slate-700">
            Lý do từ chối <span className="font-normal text-slate-400">(tùy chọn)</span>
          </label>
          <textarea
            id="decline-reason-input"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value.slice(0, 200))}
            rows={3}
            maxLength={200}
            placeholder="Nhập lý do để đồng nghiệp hiểu và tìm người khác..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#CBE3F0]"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            disabled={busyId === String(declineTarget?.id)}
            onClick={confirmDecline}
          >
            {busyId === String(declineTarget?.id) ? "Đang xử lý..." : "Xác nhận từ chối"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// 3. MODAL HỦY YÊU CẦU
export function CancelExchangeModal({
  cancelTarget,
  onClose,
  confirmCancel,
  busyId,
}) {
  if (!cancelTarget) return null;

  return (
    <Modal
      isOpen={Boolean(cancelTarget)}
      title="Hủy yêu cầu đổi ca"
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-[14px] text-slate-600">
          Bạn có chắc chắn muốn hủy yêu cầu đổi ca này không? Sau khi hủy, yêu cầu sẽ được chuyển sang trạng thái &ldquo;Đã hủy&rdquo; và đồng nghiệp không thể tiếp nhận nữa.
        </p>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Quay lại
          </Button>
          <Button
            variant="danger"
            disabled={busyId === String(cancelTarget?.id)}
            onClick={confirmCancel}
          >
            {busyId === String(cancelTarget?.id) ? "Đang xử lý..." : "Xác nhận hủy"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// 4. MODAL CHI TIẾT YÊU CẦU ĐỔI CA
export function ExchangeDetailModal({
  detailRequest,
  onClose,
  currentUserId,
  currentUserEmail,
  user,
  onCancel,
  onAccept,
  onDecline,
}) {
  if (!detailRequest) return null;

  const dStatus = requestStatus(detailRequest);
  const dSenderId = detailRequest.sender_id ?? detailRequest.sender?.id ?? detailRequest.requesterId;
  const dRecipientId = detailRequest.recipient_id ?? detailRequest.recipient?.id ?? detailRequest.targetEmployeeId ?? detailRequest.receiver?.id;
  const isOutgoing =
    String(dSenderId ?? "") === String(currentUserId) ||
    (Boolean(currentUserEmail) && (detailRequest.sender_email ?? detailRequest.sender?.email) === currentUserEmail);
  const isIncoming =
    String(dRecipientId ?? "") === String(currentUserId) ||
    (Boolean(currentUserEmail) && (detailRequest.recipient_email ?? detailRequest.recipient?.email ?? detailRequest.receiver?.email) === currentUserEmail) ||
    !isOutgoing;

  const senderName = isOutgoing ? (user?.name || "Bạn") : (detailRequest.sender_name ?? detailRequest.requesterName ?? detailRequest.sender?.name ?? "Người gửi");
  const senderRole = isOutgoing ? (user?.roleTag || "Nhân viên") : (detailRequest.requesterRoleTag ?? detailRequest.requesterRole ?? detailRequest.sender?.roleTag ?? "Nhân viên");

  const recipientName = isOutgoing ? (detailRequest.recipient_name ?? detailRequest.targetEmployeeName ?? detailRequest.recipient?.name ?? detailRequest.receiver?.name ?? "Đồng nghiệp") : (user?.name || "Bạn");
  const recipientRole = isOutgoing ? (detailRequest.targetRoleTag ?? detailRequest.targetEmployeeRole ?? detailRequest.recipient?.roleTag ?? "Nhân viên") : (user?.roleTag || "Nhân viên");

  const giveShift = shiftFromRequest(detailRequest);
  const targetShift = detailRequest.targetShift ?? detailRequest.target_shift ?? detailRequest.receiver_shift ?? detailRequest.recipient_shift;
  const exchangeType = detailRequest.exchangeType ?? (targetShift ? "swap" : "cover");
  const typeLabel = exchangeType === "swap" ? "Hoán đổi 2 ca" : "Nhờ làm thay ca";
  const noteText = detailRequest.note ?? detailRequest.reason ?? detailRequest.message;
  const rejectReason = detailRequest.rejectReason ?? detailRequest.response_reason ?? (dStatus === "rejected" ? detailRequest.managerNote : "");

  const canCancel = isOutgoing && ["pending_employee", "pending_manager"].includes(dStatus);
  const canRespond = isIncoming && dStatus === "pending_employee";

  return (
    <Modal
      open={Boolean(detailRequest)}
      onClose={onClose}
      size="md"
      header={
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#CBE3F0] text-[#0F172A] shrink-0">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[16px] font-semibold text-[#0F172A]">
                Chi tiết yêu cầu đổi ca
              </h2>
              <StatusBadge tone={STATUS_TONES[dStatus]}>
                {STATUS_LABELS[dStatus] || dStatus}
              </StatusBadge>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Gửi lúc {sentAt(detailRequest)}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          {canCancel && (
            <Button
              variant="outline"
              size="md"
              onClick={() => onCancel(detailRequest)}
            >
              Hủy yêu cầu
            </Button>
          )}
          {canRespond && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => onDecline(detailRequest)}
              >
                Từ chối
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => onAccept(detailRequest)}
              >
                Đồng ý đổi ca
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="md"
            className="ml-auto"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-4 min-w-0 w-full text-left">
        <dl className="divide-y divide-[#E5ECF1] border-y border-[#E5ECF1]">
          <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-slate-500">Hình thức</dt>
            <dd className="font-semibold text-[#0F172A] text-right">{typeLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-slate-500">Người yêu cầu</dt>
            <dd className="font-medium text-[#0F172A] text-right flex items-center gap-1.5 justify-end">
              <span>{senderName}</span>
              <span className="text-xs text-slate-500">({senderRole})</span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-slate-500">Người nhận yêu cầu</dt>
            <dd className="font-medium text-[#0F172A] text-right flex items-center gap-1.5 justify-end">
              <span>{recipientName}</span>
              <span className="text-xs text-slate-500">({recipientRole})</span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-slate-500">Ca cần đổi</dt>
            <dd className="font-medium text-[#0F172A] text-right">
              {formatDate(giveShift.date, true)} · {formatShiftName(giveShift.shiftName)} ({giveShift.time})
            </dd>
          </div>
        </dl>

        {noteText && (
          <div>
            <h4 className="text-[14px] font-medium text-[#0F172A] mb-1.5">Lời nhắn</h4>
            <div className="bg-[#F4F7F9] border border-[#E5ECF1] rounded-xl p-3 text-[13.5px] text-[#0F172A] leading-relaxed break-words">
              {noteText}
            </div>
          </div>
        )}

        {rejectReason && (
          <div>
            <h4 className="text-[14px] font-medium text-rose-600 mb-1">Lý do từ chối</h4>
            <p className="text-[13.5px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
              {rejectReason}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
