import { X } from "lucide-react";
import { Button } from "../../../../components/FormKit";
import { Loading } from "../../../../components/FormKit";
import { Avatar } from "../../../../components/TableKit";
import { roleLabel } from "../leaveShared";
import LeaveStatus from "./LeaveStatus";
import LeaveCandidateItem from "./LeaveCandidateItem";

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-2 text-[15px]">
    <dt className="text-slate-600">{label}</dt>
    <dd className="text-right font-medium text-slate-900">{children}</dd>
  </div>
);

const Notice = ({ children }) => (
  <p className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-[15px] text-slate-900">{children}</p>
);

// Chi tiết đơn + danh sách người thay được gợi ý + nút duyệt / từ chối.
export default function LeaveDetailModal({
  req,
  candidates,
  loading,
  onClose,
  onApprove,
  onReject,
  onPick,
  onRespond,
  onCancelRequest,
  onOpenShift,
}) {
  if (!req) return null;
  const { status } = req;
  const suggesting = (status === "pending" || status === "approved") && !req.openShiftCreated;
  const canPick = status === "approved";

  return (
    <div
      className="fixed inset-0 z-[45] grid place-items-center bg-slate-900/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Đầu thẻ */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[18px] font-semibold text-slate-900">Đơn xin nghỉ #{req.id}</h2>
            <LeaveStatus status={req.status} />
            <span className="text-[14px] text-slate-600">Gửi lúc {req.createdAt}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid flex-1 overflow-y-auto md:grid-cols-5 md:divide-x md:divide-slate-200">
          {/* Trái: thông tin đơn */}
          <div className="space-y-5 p-6 md:col-span-2">
            <div className="flex items-center gap-3">
              <Avatar name={req.employeeName} size="xl" />
              <div>
                <p className="font-semibold text-slate-900">{req.employeeName}</p>
                <p className="text-[14px] text-slate-600">{req.employeeId} • {roleLabel(req.roleTag)}</p>
              </div>
            </div>
            <dl className="divide-y divide-slate-200 border-y border-slate-200">
              <Row label="Ngày làm">{req.shiftDate}</Row>
              <Row label="Ca">{req.shiftName} ({req.shiftTime})</Row>
              <Row label="Loại nghỉ">{req.leaveTypeName}</Row>
            </dl>
            <div>
              <p className="text-[14px] font-semibold text-slate-700">Lý do</p>
              <p className="mt-1 text-[15px] text-slate-900">{req.reason}</p>
            </div>
            {req.managerNote && (
              <div>
                <p className="text-[14px] font-semibold text-slate-700">Ghi chú xử lý</p>
                <p className="mt-1 text-[15px] text-slate-900">{req.managerNote}</p>
              </div>
            )}
          </div>

          {/* Phải: người thay thế */}
          <div className="space-y-4 p-6 md:col-span-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-semibold text-slate-900">
                  {suggesting ? "Gợi ý người thay (AI)" : "Người thay ca"}
                </h3>
                {suggesting && (
                  <p className="text-[14px] text-slate-600">
                    AI tự đối chiếu kỹ năng, thời gian rảnh và giới hạn 40 giờ mỗi tuần.
                  </p>
                )}
              </div>
              {status === "approved" && !req.openShiftCreated && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  onClick={onOpenShift}
                >
                  Tạo ca trực mở
                </Button>
              )}
            </div>

            {status === "rejected" ? (
              <Notice>Đơn đã bị từ chối nên không cần bố trí người thay.</Notice>
            ) : status === "replacement_confirmed" ? (
              <Notice>
                <b>{req.replacementName}</b> đã xác nhận nhận ca lúc {req.replacementAssignedAt}.
              </Notice>
            ) : status === "replacement_pending" ? (
              <div className="space-y-3 rounded-lg border border-slate-300 p-4">
                <p className="text-[15px] text-slate-900">
                  Đã gửi đề nghị cho <b>{req.replacementName}</b> ({req.replacementRole}) lúc {req.replacementRequestedAt}. Ca này chưa có người thay cho tới khi {req.replacementName} xác nhận.
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={onCancelRequest}>
                    Rút đề nghị, chọn người khác
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => onRespond(false)}>
                    Người thay từ chối
                  </Button>
                  <Button type="button" size="sm" onClick={() => onRespond(true)}>
                    Người thay đã nhận
                  </Button>
                </div>
                <p className="text-[13px] text-slate-600">
                  Hai nút “Người thay…” để giả lập phản hồi của nhân viên khi chưa có ứng dụng phía nhân viên.
                </p>
              </div>
            ) : req.openShiftCreated ? (
              <Notice>Ca trực mở đã được đăng, đang chờ nhân viên khác nhận ca.</Notice>
            ) : loading ? (
              <Loading text="AI đang phân tích lịch rảnh và kỹ năng..." />
            ) : (
              <>
                {!canPick && <Notice>Hãy phê duyệt đơn trước. Sau đó mới gửi đề nghị cho người thay.</Notice>}
                <ul className="space-y-3">
                  {candidates.map((c, i) => (
                    <LeaveCandidateItem
                      key={c.id}
                      cand={c}
                      best={i === 0}
                      onPick={canPick ? onPick : undefined}
                    />
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Chân thẻ */}
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-3">
          {req.status === "pending" && (
            <>
              <Button type="button" variant="outline" size="lg" onClick={() => onReject(req)}>
                Từ chối
              </Button>
              <Button type="button" size="lg" onClick={() => onApprove(req.id)}>
                Phê duyệt
              </Button>
            </>
          )}
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
