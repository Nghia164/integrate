/**
 * File: src/pages/employees/leave/LeaveModals.jsx
 * Các Modal nghiệp vụ trang Nghỉ phép Staff (US20, US21, US23):
 * 1. CreateLeaveModal - Modal tạo đơn xin nghỉ
 * 2. LeaveDetailModal - Modal xem chi tiết tiến trình đơn nghỉ
 * 3. CancelLeaveModal - Modal xác nhận hủy đơn xin nghỉ
 */

import { CalendarDays, AlertCircle } from "lucide-react";
import { Modal, Button } from "../../../components/FormKit";
import { StatusBadge } from "../../../components/TableKit";
import { getShiftColors } from "../../../lib/shiftColors";
import {
  STATUS_LABELS,
  STATUS_TONES,
  statusOf,
  formatDate,
  formatShiftName,
  formatSubmittedAt,
  shiftFromRequest,
  getCancelEligibility,
} from "./leaveHelpers";

// 1. MODAL TẠO ĐƠN XIN NGHỈ PHÉP
export function CreateLeaveModal({
  open,
  onClose,
  onSubmit,
  formError,
  setFormError,
  selectedShiftId,
  setSelectedShiftId,
  leaveType,
  setLeaveType,
  reason,
  setReason,
  note,
  setNote,
  submitting,
  shifts,
  unavailableShiftIds,
}) {
  return (
    <Modal
      open={open}
      isOpen={open}
      onClose={onClose}
      title="Tạo đơn xin nghỉ phép"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-left">
        {formError && (
          <div
            role="alert"
            className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label htmlFor="leave-shift-select" className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wider text-slate-600">
            Ca cần xin nghỉ <span className="text-rose-500">*</span>
          </label>
          <select
            id="leave-shift-select"
            required
            value={selectedShiftId}
            onChange={(e) => {
              setSelectedShiftId(e.target.value);
              setFormError("");
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#CBE3F0]"
          >
            <option value="">-- Chọn ca chính thức chưa bắt đầu --</option>
            {shifts.map((shift) => {
              const isPending = unavailableShiftIds.has(String(shift.id));
              return (
                <option
                  key={shift.id}
                  value={shift.id}
                  disabled={isPending}
                >
                  {formatDate(shift.date, true)} · {formatShiftName(shift.shiftName)} ({shift.startTime}–{shift.endTime}) · {shift.roleTag}{isPending ? " (Đã có đơn chờ duyệt)" : ""}
                </option>
              );
            })}
          </select>
          {!selectedShiftId && formError === "Vui lòng chọn ca làm việc cần xin nghỉ." && (
            <p className="mt-1 text-xs text-rose-600 font-medium">Vui lòng chọn ca</p>
          )}
        </div>

        <div>
          <label htmlFor="leave-type-select" className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wider text-slate-600">
            Loại nghỉ phép
          </label>
          <select
            id="leave-type-select"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#CBE3F0]"
          >
            <option value="unpaid">Nghỉ việc riêng (Không lương)</option>
            <option value="annual">Nghỉ phép năm (Có lương)</option>
            <option value="sick">Nghỉ ốm đau / Bệnh</option>
            <option value="other">Lý do khác</option>
          </select>
        </div>

        <div>
          <label htmlFor="leave-reason-textarea" className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wider text-slate-600">
            Lý do xin nghỉ <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="leave-reason-textarea"
            required
            rows={3}
            maxLength={200}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setFormError("");
            }}
            placeholder="Nêu rõ lý do cần xin nghỉ ca này (tối đa 200 ký tự)..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#CBE3F0]"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-slate-400">Tối thiểu 5 ký tự</span>
            <span className="text-xs text-slate-400">{reason.length}/200</span>
          </div>
        </div>

        <div>
          <label htmlFor="leave-note-input" className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wider text-slate-600">
            Ghi chú thêm cho Quản lý (Tùy chọn)
          </label>
          <input
            id="leave-note-input"
            type="text"
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Đã nhờ bạn An trông quán phụ..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#CBE3F0]"
          />
        </div>

        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-[13px] text-sky-900 space-y-1">
          <p className="font-semibold text-sky-950 flex items-center gap-1.5">
            <AlertCircle size={15} className="text-sky-600 shrink-0" />
            Quy trình mở ca tự động (Open Shift):
          </p>
          <p className="leading-relaxed">
            Sau khi bạn gửi đơn, Quản lý có thể phê duyệt và đồng thời mở ca này trên Chợ ca trực để các nhân viên khác đăng ký làm thay bạn.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
          >
            {submitting ? "Đang gửi..." : "Gửi đơn xin nghỉ"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// 2. MODAL CHI TIẾT ĐƠN NGHỈ PHÉP
export function LeaveDetailModal({
  detailRequest,
  onClose,
  onCancelRequest,
  shifts,
  openShifts,
  busyId,
}) {
  if (!detailRequest) return null;

  const dShift = shiftFromRequest(detailRequest, shifts);
  const dStatus = statusOf(detailRequest);
  const eligibility = getCancelEligibility(detailRequest, openShifts);
  const canCancel = eligibility.canCancel;
  const cannotCancelReason = eligibility.reason;
  const isBusy = busyId === String(detailRequest.id);
  const dRejectReason = detailRequest.rejectReason || detailRequest.rejectionReason;

  return (
    <Modal
      open={Boolean(detailRequest)}
      onClose={onClose}
      size="md"
      header={
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#CBE3F0] text-[#0F172A] shrink-0">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[16px] font-semibold text-[#0F172A]">
                Chi tiết đơn nghỉ phép
              </h2>
              <StatusBadge tone={STATUS_TONES[dStatus]}>
                {STATUS_LABELS[dStatus] || detailRequest.status}
              </StatusBadge>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Gửi lúc {formatSubmittedAt(detailRequest)}
            </p>
          </div>
        </div>
      }
      footer={
        <>
          {cannotCancelReason && (
            <span className="text-[12px] text-slate-400 italic mr-auto">
              {cannotCancelReason}
            </span>
          )}
          {canCancel && (
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isBusy}
              onClick={() => onCancelRequest(detailRequest)}
            >
              Hủy yêu cầu
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onClose}
          >
            Đóng
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-4 min-w-0 w-full">
        <dl className="divide-y divide-[#E5ECF1] border-y border-[#E5ECF1]">
          <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-slate-500">Ngày làm</dt>
            <dd className="font-medium text-[#0F172A] text-right">{formatDate(dShift.date, true)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-slate-500">Ca làm việc</dt>
            <dd className="font-medium text-[#0F172A] text-right flex items-center gap-1.5 flex-wrap justify-end">
              {(() => {
                const c = getShiftColors(dShift.shiftName);
                return (
                  <>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.border }} />
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: c.bg, color: c.text }}>
                      Ca {dShift.shiftName}
                    </span>
                    <span className="text-slate-500 text-xs">({dShift.startTime} – {dShift.endTime})</span>
                  </>
                );
              })()}
            </dd>
          </div>
          {dShift.roleTag && (
            <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
              <dt className="text-slate-500">Vai trò</dt>
              <dd className="text-right">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[#D9E8F5] text-[#0F172A]">
                  {dShift.roleTag}
                </span>
              </dd>
            </div>
          )}
          {detailRequest.leaveTypeName && (
            <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
              <dt className="text-slate-500">Loại nghỉ</dt>
              <dd className="font-medium text-[#0F172A] text-right">{detailRequest.leaveTypeName}</dd>
            </div>
          )}
        </dl>

        <div>
          <h4 className="text-[14px] font-medium text-[#0F172A] mb-1.5">Lý do nghỉ</h4>
          <div className="bg-[#F4F7F9] border border-[#E5ECF1] rounded-xl p-3 text-[13.5px] text-[#0F172A] leading-relaxed break-words">
            {detailRequest.reason || detailRequest.note || "—"}
          </div>
        </div>

        {dRejectReason && (
          <div>
            <h4 className="text-[14px] font-medium text-rose-600 mb-1">Lý do từ chối</h4>
            <p className="text-[13.5px] text-rose-600">
              {dRejectReason}
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-[#E5ECF1]">
          <h4 className="text-[14px] font-medium text-[#0F172A] mb-3">Tiến trình xử lý</h4>
          <div className="space-y-2 text-[13.5px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">1. Đã gửi:</span>
              <span className="font-medium text-[#0F172A]">{formatSubmittedAt(detailRequest)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">2. Quản lý xem xét:</span>
              <span className="font-medium text-[#0F172A]">
                {canCancel ? "Đang chờ xem xét" : "Đã hoàn tất"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">3. Kết quả:</span>
              <span className={`font-medium ${
                dStatus === "approved" || dStatus === "replacement_confirmed"
                  ? "text-emerald-700"
                  : dStatus === "rejected"
                  ? "text-rose-600"
                  : dStatus === "cancelled"
                  ? "text-slate-600"
                  : "text-amber-700"
              }`}>
                {STATUS_LABELS[dStatus] || detailRequest.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// 3. MODAL XÁC NHẬN HỦY ĐƠN NGHỈ PHÉP
export function CancelLeaveModal({
  confirmCancelRequest,
  onClose,
  onConfirm,
  shifts,
  openShifts,
  busyId,
}) {
  if (!confirmCancelRequest) return null;

  const dShift = shiftFromRequest(confirmCancelRequest, shifts);
  const elig = getCancelEligibility(confirmCancelRequest, openShifts);
  const isBusy = busyId === String(confirmCancelRequest.id);

  return (
    <Modal
      open={Boolean(confirmCancelRequest)}
      title="Xác nhận hủy yêu cầu nghỉ phép"
      onClose={onClose}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-[14px] text-slate-700 leading-relaxed">
          Bạn có chắc chắn muốn hủy đơn xin nghỉ ca <b className="text-slate-900">{dShift.shiftName || "làm việc"}</b> ngày <b className="text-slate-900">{formatDate(dShift.date, true)}</b>?
        </p>

        {elig.hasOpenShift && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[13px] text-amber-800 space-y-1">
            <p className="font-semibold text-amber-900 flex items-center gap-1.5">
              <AlertCircle size={15} className="text-amber-600 shrink-0" />
              Lưu ý về Chợ ca (Open Shift):
            </p>
            <p className="leading-relaxed text-amber-800">
              Ca này đang được mở trên Chợ ca. Khi bạn hủy yêu cầu nghỉ, ca mở trên Chợ ca cũng sẽ tự động bị hủy và ca trực gốc sẽ được khôi phục lại cho bạn.
            </p>
          </div>
        )}

        <p className="text-[12.5px] text-slate-500 italic">
          Sau khi xác nhận hủy, trạng thái đơn sẽ chuyển thành &ldquo;Đã hủy&rdquo;, ca trực gốc được khôi phục và hệ thống sẽ gửi thông báo cho Quản lý.
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
          >
            Đóng
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            disabled={isBusy}
            onClick={() => onConfirm(confirmCancelRequest)}
          >
            {isBusy ? "Đang hủy..." : "Xác nhận hủy"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
