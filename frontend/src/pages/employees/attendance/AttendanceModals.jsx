// =============================================================================
// FILE NÀY LÀM GÌ: Hộp thoại giải trình, chi tiết bản ghi và thông báo chấm công (Staff)
// Loại: Modals
// US: US24 (Check-in/Check-out), US25/US26 (Lịch sử & Giải trình)
// =============================================================================

import { Clock, FileText, CheckCircle2, Info } from "lucide-react";
import { Modal } from "../../../components/FormKit";
import { Button } from "../../../components/FormKit";
import { StatusBadge } from "../../../components/TableKit";
import { STATUS_MAP, formatClock, formatDate, formatDuration } from "./attendanceHelpers";

/**
 * Hộp thoại tạo giải trình sự cố chấm công
 */
export function CreateExplanationModal({
  open,
  onClose,
  submitting,
  form,
  setForm,
  eligibleShifts,
  modalIssueType,
  error,
  onSubmit,
}) {
  return (
    <Modal
      open={open}
      title="Gửi giải trình sự cố chấm công"
      onClose={() => !submitting && onClose()}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-left text-[14px]">
        {eligibleShifts.length === 0 ? (
          <div className="py-4 text-center text-slate-500">
            <p className="font-medium text-slate-700">Không có ca nào đủ điều kiện gửi giải trình.</p>
            <p className="text-[12.5px] text-slate-500 mt-1">
              Chỉ những ca đã kết thúc có sự cố Quên check-in (Vắng mặt) hoặc Quên check-out mới được gửi giải trình.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">Ca cần giải trình:</label>
              <select
                value={form.shiftId}
                onChange={(e) => {
                  const sid = e.target.value;
                  const s = eligibleShifts.find((x) => (x.id || x.shift_id) === sid);
                  const rawSt = String(s?.status || "").toLowerCase();
                  const isAbsent = rawSt === "absent" || (!s?.checkIn && !s?.check_in_at);
                  const preIn = s?.check_in_at ? formatClock(s.check_in_at) : (s?.shift?.start_time || "08:00");
                  const preOut = s?.shift?.end_time || "16:30";
                  setForm({
                    ...form,
                    shiftId: sid,
                    proposedIn: isAbsent ? "08:00" : preIn,
                    proposedOut: preOut,
                  });
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13.5px] font-medium text-slate-800 outline-none focus:border-[#0F172A]"
              >
                {eligibleShifts.map((s) => (
                  <option key={s.id || s.shift_id} value={s.id || s.shift_id}>
                    {formatDate(s.shift?.date || s.check_in_at)} - Ca {s.shift?.shift_name || s.shiftName} (
                    {s.shift?.start_time || s.startTime || "--:--"} – {s.shift?.end_time || s.endTime || "--:--"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">Loại sự cố:</label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13.5px] font-semibold text-slate-800">
                {modalIssueType}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1">Giờ vào đề nghị:</label>
                <input
                  type="time"
                  value={form.proposedIn}
                  disabled={modalIssueType === "Quên check-out"}
                  onChange={(e) => setForm({ ...form, proposedIn: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13.5px] font-medium text-slate-800 outline-none focus:border-[#0F172A] disabled:bg-slate-100 disabled:text-slate-500"
                />
                {modalIssueType === "Quên check-out" && (
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Đã có giờ vào thực tế</span>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1">Giờ ra đề nghị:</label>
                <input
                  type="time"
                  value={form.proposedOut}
                  onChange={(e) => setForm({ ...form, proposedOut: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13.5px] font-medium text-slate-800 outline-none focus:border-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[13px] font-medium text-slate-700">Lý do giải trình (bắt buộc):</label>
                <span className="text-[11.5px] text-slate-400">{form.reason.length}/300</span>
              </div>
              <textarea
                rows={3}
                maxLength={300}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Ví dụ: điện thoại hết pin lúc tan ca, đã xác nhận với Quản lý ca..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13.5px] text-slate-800 outline-none focus:border-[#0F172A]"
              />
            </div>

            {error && <p className="text-[13px] text-rose-600">{error}</p>}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={onSubmit}
                loading={submitting}
              >
                {submitting ? "Đang gửi…" : "Gửi giải trình"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/**
 * Hộp thoại chi tiết giải trình
 */
export function ExplanationDetailModal({ detail, onClose }) {
  if (!detail) return null;
  return (
    <Modal
      open={Boolean(detail)}
      title="Chi tiết giải trình"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-left text-[13.5px]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5ECF1]">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#CBE3F0] text-[#0F172A]">
              <FileText className="h-4 w-4" />
            </span>
            <span className="font-semibold text-[#0F172A]">Thông tin giải trình</span>
          </div>
          <StatusBadge
            tone={
              detail.status === "approved"
                ? "success"
                : detail.status === "rejected"
                ? "error"
                : detail.status === "cancelled"
                ? "neutral"
                : "warning"
            }
          >
            {detail.status === "approved"
              ? "Đã duyệt"
              : detail.status === "rejected"
              ? "Bị từ chối"
              : detail.status === "cancelled"
              ? "Đã hủy"
              : "Chờ duyệt"}
          </StatusBadge>
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between py-1 border-b border-[#E5ECF1]">
            <span className="text-slate-500">Ca làm việc</span>
            <span className="font-medium text-[#0F172A]">
              {formatDate(detail.date)} · Ca {detail.shiftName}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-[#E5ECF1]">
            <span className="text-slate-500">Sự cố</span>
            <span className="font-medium text-[#0F172A]">
              {detail.issueType === "missing_checkin" ? "Quên check-in" : "Quên check-out"}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-[#E5ECF1]">
            <span className="text-slate-500">Giờ đề nghị</span>
            <span className="font-bold text-[#0F172A] tabular-nums">
              {detail.proposedIn} – {detail.proposedOut}
            </span>
          </div>

          <div className="py-1 border-b border-[#E5ECF1]">
            <span className="text-slate-500 block mb-1">Lý do giải trình</span>
            <p className="font-medium text-slate-800 bg-slate-50 rounded-lg p-2.5 text-[13px]">
              “{detail.reason}”
            </p>
          </div>

          <div className="pt-2">
            <span className="text-[12.5px] font-semibold text-slate-700 block mb-2">Tiến trình xử lý:</span>
            <div className="space-y-2 text-[12.5px] pl-3 border-l-2 border-slate-200">
              <div>
                <span className="font-medium text-slate-800 block">Đã gửi giải trình</span>
                <span className="text-slate-500 tabular-nums">
                  {new Date(detail.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>

              {detail.status === "approved" && (
                <div className="text-emerald-800">
                  <span className="font-semibold block">Quản lý đã phê duyệt</span>
                  <span>Giờ áp dụng: {detail.appliedIn} – {detail.appliedOut}</span>
                </div>
              )}

              {detail.status === "rejected" && (
                <div className="text-rose-800">
                  <span className="font-semibold block">Quản lý đã từ chối</span>
                  <span>Lý do: {detail.rejectReason || "Không đạt yêu cầu."}</span>
                </div>
              )}

              {detail.status === "pending" && (
                <div className="text-amber-700">
                  <span className="font-medium block">Đang chờ Quản lý xem xét và đối soát</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="primary" size="md" onClick={onClose} className="w-full">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Hộp thoại chi tiết bản ghi chấm công & khu vực điều chỉnh bởi quản lý
 */
export function RecordDetailModal({ record, history = [], onClose }) {
  if (!record) return null;
  return (
    <Modal
      open={Boolean(record)}
      title="Chi tiết chấm công"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5ECF1]">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#CBE3F0] text-[#0F172A]">
              <Clock className="h-4 w-4" />
            </span>
            <span className="text-[14px] font-semibold text-[#0F172A]">Thông tin ca</span>
          </div>
          <StatusBadge tone={STATUS_MAP[record.status]?.tone || "neutral"}>
            {STATUS_MAP[record.status]?.label || record.status}
          </StatusBadge>
        </div>

        <div className="space-y-2.5 text-[13.5px]">
          <div className="flex justify-between py-1 border-b border-[#E5ECF1]">
            <span className="text-slate-500">Ngày làm</span>
            <span className="font-medium text-[#0F172A]">
              {formatDate(record.shift?.date || record.check_in_at)}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-[#E5ECF1]">
            <span className="text-slate-500">Ca làm việc</span>
            <span className="font-medium text-[#0F172A]">
              Ca {record.shift?.shift_name || record.shiftName} (
              {record.shift?.start_time || "--:--"} – {record.shift?.end_time || "--:--"})
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-[#E5ECF1]">
            <span className="text-slate-500">Giờ vào thực tế</span>
            <div className="text-right">
              <span className="font-medium text-[#0F172A] tabular-nums">
                {formatClock(record.check_in_at)}
              </span>
              {record.late_minutes > 0 && (
                <span className="block text-[11px] text-amber-600 font-medium">
                  Trễ {record.late_minutes} phút
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between py-1 border-b border-[#E5ECF1]">
            <span className="text-slate-500">Giờ ra thực tế</span>
            <div className="text-right">
              <span className="font-medium text-[#0F172A] tabular-nums">
                {record.check_out_at ? formatClock(record.check_out_at) : "—"}
              </span>
              {record.early_minutes > 0 && (
                <span className="block text-[11px] text-amber-600 font-medium">
                  Về sớm {record.early_minutes} phút
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between py-1 border-b border-[#E5ECF1]">
            <span className="text-slate-500">Thời lượng làm việc</span>
            <span className="font-medium text-[#0F172A] tabular-nums">
              {record.total_working_minutes
                ? formatDuration(record.total_working_minutes)
                : "—"}
            </span>
          </div>

          {/* KHU "ĐIỀU CHỈNH BỞI QUẢN LÝ" (US26) */}
          {record.adjusted && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[13px]">
                <Info className="h-4 w-4 text-amber-700" /> Điều chỉnh bởi Quản lý
              </div>

              {history.length > 0 ? (
                <div className="space-y-2 pl-3 border-l-2 border-amber-300">
                  {history.map((item, idx) => (
                    <div key={idx} className="text-[12.5px] space-y-0.5">
                      <div className="flex justify-between text-amber-950 font-medium">
                        <span>Quản lý</span>
                        <span className="text-[11.5px] text-amber-700 tabular-nums">{item.at}</span>
                      </div>
                      <div className="text-amber-900">
                        Giờ vào: {item.inBefore || "—"} → <strong>{item.inAfter || "—"}</strong> · Giờ ra:{" "}
                        {item.outBefore || "—"} → <strong>{item.outAfter || "—"}</strong>
                      </div>
                      <p className="text-[12px] text-amber-800 italic">Lý do: {item.reason}</p>
                      {(item.source === "explanation" || item.explanationId) && (
                        <span className="inline-block rounded bg-amber-100 px-1.5 py-0.2 text-[10.5px] font-medium text-amber-800">
                          Theo giải trình của nhân viên
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12.5px] text-amber-900">
                  <p>
                    Giờ gốc: {record.original_check_in || "--:--"} –{" "}
                    {record.original_check_out || "--:--"} → Giờ mới:{" "}
                    {formatClock(record.check_in_at)} – {formatClock(record.check_out_at)}
                  </p>
                  {record.adjust_reason && (
                    <p className="mt-1 text-amber-800 italic">Lý do: {record.adjust_reason}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button variant="primary" size="md" onClick={onClose} className="w-full">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Hộp thoại thông báo hoàn thành check-in / check-out
 */
export function ConfirmAttendanceModal({ data, onClose }) {
  if (!data) return null;
  return (
    <Modal
      open={Boolean(data)}
      title={data?.title || "Thông báo chấm công"}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="text-center py-2 space-y-3">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-900">{data.title}</h3>
        <p className="text-[14px] text-slate-600">{data.message}</p>
        {data.duration && (
          <p className="text-[13.5px] font-medium text-slate-700">
            Tổng thời gian làm việc: <strong className="text-slate-900">{data.duration}</strong>
          </p>
        )}
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={onClose} className="w-full">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
