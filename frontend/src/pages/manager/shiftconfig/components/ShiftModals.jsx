import { useState } from "react";
import { Info, AlertTriangle } from "lucide-react";
import { Modal } from "../../../../components/FormKit";
import { Button } from "../../../../components/FormKit";
import { Field, inputClass } from "../../../../components/PageKit";
import {
  SHIFT_STATUS,
  fmtDuration,
  validateShift,
  getShiftDurationMin,
  isOvernightShift,
  shiftsOverlap,
} from "../shiftConfigData";

// Hai hộp thoại của trang Ca & ràng buộc: thêm/sửa ca mẫu và xác nhận xóa.

const EMPTY = { name: "", startTime: "06:00", endTime: "12:00", multiplier: 1.0, status: "active" };

// Thêm ca (shift = undefined) hoặc sửa ca. Chỉ render khi đang mở nên form luôn bắt đầu đúng dữ liệu.
export function ShiftFormModal({ shift, shifts = [], onClose, onSubmit, onSave }) {
  const handleSubmit = onSubmit || onSave;
  const [form, setForm] = useState(
    shift ? { multiplier: 1.0, ...shift } : EMPTY
  );
  const [error, setError] = useState("");
  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    const err = validateShift(form, shifts || []);
    return err ? setError(err) : handleSubmit({ ...form, name: form.name.trim(), multiplier: Number(form.multiplier) || 1.0 });
  };

  // Giờ hợp lệ thì hiện thời lượng; trùng giờ với ca đang hoạt động khác thì nhắc (không chặn).
  const duration = getShiftDurationMin(form.startTime, form.endTime);
  const isOvernight = isOvernightShift(form.startTime, form.endTime);
  const valid = form.startTime && form.endTime && form.startTime !== form.endTime;
  const overlap = valid
    ? (shifts || [])
        .filter((s) => s.id !== form.id && s.status === "active" && shiftsOverlap(form.startTime, form.endTime, s.startTime, s.endTime))
        .map((s) => s.name)
    : [];

  return (
    <Modal open title={shift ? `Sửa ca mẫu: ${shift.name}` : "Thêm ca mẫu"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 text-[15px]">
        {error && <p role="alert" className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-[14px] text-slate-900">{error}</p>}

        <Field label="Tên ca">
          <input value={form.name} onChange={set("name")} maxLength={30} placeholder="Ví dụ: Sáng" className={inputClass} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Giờ bắt đầu">
            <input type="time" value={form.startTime} onChange={set("startTime")} className={inputClass} />
          </Field>
          <Field label="Giờ kết thúc">
            <input type="time" value={form.endTime} onChange={set("endTime")} className={inputClass} />
          </Field>
        </div>

        {valid && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-[14px] text-slate-700">
            <span>Thời lượng mỗi ca:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{fmtDuration(duration)}</span>
              {isOvernight && (
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[12px] font-semibold text-indigo-700">
                  Qua đêm (+1 ngày)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Hệ số lương của ca làm việc */}
        <Field label="Hệ số lương ca (mặc định 1.0, ca đêm/ca đặc biệt có thể cao hơn)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="3.0"
              value={form.multiplier ?? 1.0}
              onChange={set("multiplier")}
              className={inputClass}
            />
            <span className="shrink-0 text-[14px] font-medium text-slate-600">lần lương cơ bản</span>
          </div>
        </Field>

        {overlap.length > 0 && (
          <p className="flex items-start gap-1.5 text-[13px] text-slate-600">
            <Info size={16} className="mt-0.5 shrink-0 text-slate-500" />
            Trùng giờ với {overlap.map((n) => `“${n}”`).join(", ")}. Hệ thống vẫn cho lưu nếu quán chạy ca gối.
          </p>
        )}

        <Field label="Trạng thái">
          <select value={form.status} onChange={set("status")} className={inputClass}>
            {Object.entries(SHIFT_STATUS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>Hủy</Button>
          <Button type="submit" size="lg">Lưu ca mẫu</Button>
        </div>
      </form>
    </Modal>
  );
}

// Xác nhận xóa ca.
export function DeleteShiftModal({ shift, lastActive, isUsed, inUse, onClose, onConfirm, onConfirmDelete, onPause, onConfirmPause }) {
  const used = isUsed || inUse;
  const handleConfirm = onConfirm || onConfirmDelete;
  const handlePause = onPause || onConfirmPause;
  if (!shift) return null;

  return (
    <Modal open title={`Xóa ca mẫu “${shift.name}”?`} onClose={onClose}>
      <div className="space-y-4 text-[15px] text-slate-700">
        {lastActive ? (
          <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-[14px] text-amber-900">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
            Đây là ca duy nhất đang hoạt động. Nếu xóa, thuật toán sẽ không có ca nào để xếp lịch.
          </p>
        ) : used ? (
          <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-[14px] text-amber-900">
            <p className="flex items-start gap-2 font-medium">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
              Ca này đã được sử dụng trong lịch làm việc hoặc chấm công!
            </p>
            <p>
              Theo nguyên tắc toàn vẹn dữ liệu, ca đã dùng không thể xóa vĩnh viễn để tránh làm hỏng lịch sử chấm công và bảng lương.
              Bạn chỉ có thể chuyển ca sang trạng thái <strong>Tạm dừng</strong>.
            </p>
          </div>
        ) : (
          <p>
            Ca này sẽ bị gỡ khỏi danh mục ca mẫu. Lịch đã xếp trước đây (nếu có) không bị ảnh hưởng.
            Nếu chỉ muốn ngừng dùng tạm thời, bạn nên chọn <strong>Tạm dừng</strong> thay vì xóa.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>Giữ lại</Button>
          {shift.status === "active" && (
            <Button type="button" variant="outline" size="lg" onClick={() => handlePause(shift)}>
              Tạm dừng ca này
            </Button>
          )}
          {!isUsed && (
            <Button type="button" variant="danger" size="lg" onClick={() => handleConfirm(shift)}>
              Xóa hẳn
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
