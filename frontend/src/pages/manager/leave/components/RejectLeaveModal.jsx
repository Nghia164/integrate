import { useState } from "react";
import { Modal } from "../../../../components/FormKit";
import { Button } from "../../../../components/FormKit";

// Hộp thoại từ chối đơn. Render với key={item.id} để ô lý do được làm trống mỗi lần mở.
export default function RejectLeaveModal({ item, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const confirm = () =>
    reason.trim() ? onConfirm(reason) : setError("Vui lòng nhập lý do để báo cho nhân viên.");

  return (
    <Modal open={!!item} title="Từ chối đơn xin nghỉ" onClose={onClose}>
      <div className="space-y-4 text-[15px]">
        <p className="text-slate-700">
          Đơn của <b className="text-slate-900">{item?.employeeName}</b>. Lý do sẽ được gửi cho nhân viên.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          placeholder="Ví dụ: Không thể bố trí người thay kịp ca này."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#0F172A] focus:ring-4 focus:ring-[#0F172A]/20"
        />
        {error && <p role="alert" className="text-[14px] font-medium text-rose-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" size="lg" onClick={confirm}>
            Xác nhận từ chối
          </Button>
        </div>
      </div>
    </Modal>
  );
}
