import { Modal } from "../../../components/FormKit";
import { Button } from "../../../components/FormKit";
import { Person, StatusPill } from "../../../components/TableKit";
import { formatMoney } from "../../../lib/formatters";

import { dayLabel, getCancelRule, getEditRule, statusOf } from "../../../services/openShiftService";
import { REG_STATUS, STATUS } from "./openShiftData";

// Chi tiết ca trực mở: thông tin ca + danh sách nhận ca/đăng ký.
// Nút Sửa / Hủy ca nằm ở cuối hộp thoại, bị khóa kèm lý do nếu không được phép.

function Info({ label, children }) {
  return (
    <div>
      <p className="text-[13px] text-slate-600">{label}</p>
      <p className="font-medium text-slate-900">{children}</p>
    </div>
  );
}

export default function ShiftDetailModal({ shift, busy, onClose, onApprove, onReject, onEdit, onCancel }) {
  const status = shift ? statusOf(shift) : "open";
  const edit = shift && getEditRule(shift);
  const cancel = shift && getCancelRule(shift);
  const canDecide = status === "open";
  const attendees = shift ? (shift.claims || shift.registrations || []) : [];

  return (
    <Modal open={!!shift} title="Chi tiết ca trực mở" onClose={onClose}>
      {shift && (
        <div className="space-y-5 text-[15px]">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-3">
            <Info label="Ngày">{dayLabel(shift.date)}</Info>
            <Info label="Ca">{shift.shiftName} ({shift.startTime} – {shift.endTime})</Info>
            <Info label="Role_Tag">{shift.role}</Info>
            <Info label="Đã nhận / Cần">{attendees.length} / {shift.needed} người</Info>
            <Info label="Tiền thưởng">{shift.bonus > 0 ? formatMoney(shift.bonus) : "Không có"}</Info>
            <div>
              <p className="mb-1 text-[13px] text-slate-600">Trạng thái</p>
              <StatusPill hex={STATUS[status]?.hex || "#94a3b8"}>{STATUS[status]?.label || status}</StatusPill>
            </div>
          </div>

          {!canDecide && (
            <p className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-[14px] text-slate-900">
              {status === "filled" && "Ca đã đủ người được duyệt."}
              {status === "closed" && "Ca đã quá giờ bắt đầu, không còn duyệt thêm."}
              {status === "cancelled" && "Ca đã bị hủy, chỉ để xem lịch sử."}
            </p>
          )}

          <div>
            <h3 className="mb-1 text-[15px] font-semibold text-slate-900">Nhân viên nhận ca ({attendees.length})</h3>
            {attendees.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-slate-500">Chưa có nhân viên nào nhận ca này.</p>
            ) : (
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {attendees.map((r) => {
                  const st = r.status || "claimed";
                  const regConfig = REG_STATUS[st] || { label: "Đã nhận ca", hex: "#10b981" };
                  return (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <Person name={r.name} sub={`${r.employeeId || ""} • ${r.phone || ""}`} />
                      <span className="flex items-center gap-2">
                        <StatusPill hex={regConfig.hex}>{regConfig.label}</StatusPill>
                        {canDecide && r.status === "pending" && onApprove && onReject && (
                          <>
                            <Button type="button" size="sm" disabled={busy} onClick={() => onApprove(shift.id, r.id)}>Duyệt</Button>
                            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onReject(shift.id, r.id)}>Từ chối</Button>
                          </>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {canDecide && attendees.some((r) => r.status === "pending") && (
              <p className="mt-2 text-[13px] text-slate-600">Khi đủ {shift.needed} người được duyệt, các đăng ký còn chờ sẽ tự chuyển sang “Đã từ chối”.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" disabled={!edit.allowed} title={edit.allowed ? undefined : edit.reason} onClick={() => onEdit(shift)}>Sửa ca</Button>
              <Button type="button" variant="outline" size="lg" disabled={!cancel.allowed} title={cancel.allowed ? undefined : cancel.reason} onClick={() => onCancel(shift)}>
                {cancel.mode === "delete" ? "Xóa ca" : "Hủy ca"}
              </Button>
            </div>
            <Button type="button" size="lg" onClick={onClose}>Đóng</Button>
          </div>
          {!edit.allowed && <p className="text-[13px] text-slate-600">{edit.reason}</p>}
        </div>
      )}
    </Modal>
  );
}