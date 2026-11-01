import { useState } from "react";
import { Modal } from "../../../components/FormKit";
import { Button } from "../../../components/FormKit";
import { Field, inputClass } from "../../../components/PageKit";
import { MAX_NEEDED, MAX_NOTE, ROLES, dayLabel, getEditRule, validateOpenShift } from "../../../services/openShiftService";
import { dayOptions } from "./openShiftData";
import { validateBonus, validateNote } from "../../../lib/validators";

// Hai hộp thoại của trang Ca trực mở: mở/sửa ca và xác nhận hủy ca.

const noteClass = "rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-[14px] text-slate-900";

// Mở ca mới (shift = undefined) hoặc sửa ca. Chỉ render khi đang mở nên form luôn bắt đầu đúng dữ liệu.
// catalog = các ca đang hoạt động ở trang Ca & ràng buộc; prefill = dữ liệu điền sẵn khi đi từ trang Tạo lịch.
export function OpenShiftFormModal({ shift, shifts, catalog, prefill, onClose, onSubmit }) {
  const rule = shift ? getEditRule(shift) : { locked: false, minNeeded: 1 };
  const options = dayOptions(shift?.date);
  const [form, setForm] = useState(
    shift ?? prefill ?? { date: options[0].value, shiftCode: catalog[0]?.code ?? "", role: ROLES[0], needed: 1, bonus: 0, note: "" }
  );
  const [error, setError] = useState("");
  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setError("");
  };

  // Ca đã chọn có thể là ca đã bị tạm dừng ở trang cấu hình (khi sửa ca cũ): vẫn hiện để không mất dữ liệu.
  const picked = catalog.find((c) => c.code === form.shiftCode) ?? (shift && { code: shift.shiftCode, name: shift.shiftName, startTime: shift.startTime, endTime: shift.endTime });
  const choices = picked && !catalog.some((c) => c.code === picked.code) ? [...catalog, picked] : catalog;

  const submit = (e) => {
    e.preventDefault();
    const bonusCheck = validateBonus(form.bonus);
    if (!bonusCheck.valid) return setError(bonusCheck.error);
    const noteCheck = validateNote(form.note, { required: false, maxLength: 200, label: "Ghi chú" });
    if (!noteCheck.valid) return setError(noteCheck.error);

    const payload = {
      ...(shift && { id: shift.id }),
      date: form.date,
      shiftCode: form.shiftCode,
      shiftName: picked?.name,
      startTime: picked?.startTime,
      endTime: picked?.endTime,
      role: form.role,
      needed: Number(form.needed),
      bonus: bonusCheck.value,
      note: noteCheck.value,
    };
    const err = picked ? validateOpenShift(payload, shifts) : "Vui lòng chọn ca.";
    return err ? setError(err) : onSubmit(payload);
  };

  return (
    <Modal open title={shift ? "Sửa ca trực mở" : "Mở ca trực"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 text-[15px]">
        {error && <p role="alert" className={noteClass}>{error}</p>}
        {rule.locked && <p className={noteClass}>{rule.reason}</p>}
        {catalog.length === 0 && !shift && <p role="alert" className={noteClass}>Chưa có ca nào đang hoạt động. Hãy bật ít nhất một ca ở trang Ca & ràng buộc.</p>}

        <Field label="Ngày trực">
          <select value={form.date} onChange={set("date")} disabled={rule.locked} className={inputClass}>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>

        <Field label="Ca">
          <select value={form.shiftCode} onChange={set("shiftCode")} disabled={rule.locked} className={inputClass}>
            {choices.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.startTime} – {c.endTime})</option>)}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role_Tag yêu cầu">
            <select value={form.role} onChange={set("role")} disabled={rule.locked} className={inputClass}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Số lượng cần">
            <input type="number" min={rule.minNeeded} max={MAX_NEEDED} value={form.needed} onChange={set("needed")} className={inputClass} />
          </Field>
        </div>
        {shift && rule.minNeeded > 1 && <p className="text-[13px] text-slate-600">Đã có {rule.minNeeded} người nhận nên số lượng cần tối thiểu là {rule.minNeeded}.</p>}

        <Field label="Tiền thưởng khuyến khích (VND, tùy chọn)">
          <input type="number" min={0} step={1000} value={form.bonus} onChange={set("bonus")} disabled={rule.locked} placeholder="0" className={inputClass} />
        </Field>

        <Field label="Ghi chú (tùy chọn)">
          <textarea value={form.note ?? ""} onChange={set("note")} maxLength={MAX_NOTE} rows={2} placeholder="Ví dụ: cuối tuần đông khách" className={`${inputClass} h-auto py-2`} />
        </Field>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>Hủy</Button>
          <Button type="submit" size="lg" disabled={catalog.length === 0 && !shift}>{shift ? "Lưu thay đổi" : "Mở ca trực"}</Button>
        </div>
      </form>
    </Modal>
  );
}

// Xác nhận hủy. Chỉ hủy được khi chưa có người nhận; ca chuyển "Đã hủy" (vẫn lưu lịch sử) và biến mất khỏi danh sách của nhân viên.
export function CancelOpenShiftModal({ shift, onClose, onConfirm }) {
  return (
    <Modal open={!!shift} title="Hủy ca trực mở" onClose={onClose}>
      {shift && (
        <div className="space-y-4 text-[15px]">
          <p className="text-slate-700">
            Ca <b className="text-slate-900">{shift.shiftName}</b> ({shift.startTime} – {shift.endTime}) • {dayLabel(shift.date)} • {shift.role}, cần {shift.needed} người.
          </p>
          <p className="text-[14px] text-slate-600">
            Chưa có nhân viên nào nhận ca này. Nếu hủy, ca chuyển sang “Đã hủy” (vẫn lưu lịch sử) và nhân viên không còn thấy ca này để nhận.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>Quay lại</Button>
            <Button type="button" size="lg" onClick={() => onConfirm(shift)}>Hủy ca</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}