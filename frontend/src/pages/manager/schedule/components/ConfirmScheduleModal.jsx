import { Modal } from "../../../../components/FormKit";
import { Button } from "../../../../components/FormKit";
import { CheckCircle2 } from "lucide-react";
import { WEEK_LABEL } from "../scheduleShared";

export default function ConfirmScheduleModal({
  open,
  assignedEmployeesCount,
  weekLabel = WEEK_LABEL,
  onClose,
  onConfirm,
}) {
  return (
    <Modal open={open} title="Xác nhận lịch làm việc" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-[#EEF9F2] p-3.5">
          <CheckCircle2 size={24} className="shrink-0 text-emerald-600" />
          <div className="text-xs text-emerald-900">
            <div className="font-bold text-sm text-emerald-800">
              Sẵn sàng phát hành lịch tuần này!
            </div>
            <div>Tuần áp dụng: {weekLabel}</div>
          </div>
        </div>

        <p className="text-sm text-slate-700">
          Bạn có chắc chắn muốn xác nhận và ban hành lịch làm việc cho tuần này?
        </p>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1.5">
          <div>• Tổng số ca đã xếp: <strong className="text-slate-800">21 ca</strong></div>
          <div>• Số nhân viên tham gia: <strong className="text-slate-800">{assignedEmployeesCount} nhân viên</strong></div>
          <div>• Trạng thái sau xác nhận: <strong className="text-emerald-600">Chính thức (Đã phát hành)</strong></div>
          <div>• Toàn bộ nhân viên sẽ nhận được thông báo lịch làm việc mới qua ứng dụng.</div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" size="md" onClick={onConfirm}>
            Xác nhận & Ban hành
          </Button>
        </div>
      </div>
    </Modal>
  );
}
