import { useState } from "react";
import { Modal } from "../../../../components/FormKit";
import { Button } from "../../../../components/FormKit";
import { Field, inputClass } from "../../../../components/PageKit";
import { LEAVE_TYPES, roleLabel } from "../leaveShared";
import { validateDate, validateLeaveReason } from "../../../../lib/validators";

const SHIFTS = { "Ca sáng": "06:00 - 12:00", "Ca chiều": "12:00 - 17:00", "Ca tối": "17:00 - 22:00" };
const DAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const dateLabel = (iso) => `${DAYS[new Date(`${iso}T00:00`).getDay()]}, ${iso.split("-").reverse().join("/")}`;

const EMPTY = { isoDate: "", shiftName: "Ca sáng", leaveType: "emergency", reason: "" };

// Hộp thoại tạo đơn xin nghỉ. Chỉ render khi đang mở nên form luôn bắt đầu trống.
export default function CreateLeaveModal({ employees, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...EMPTY, employeeId: employees[0]?.id });
  const [error, setError] = useState("");
  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    const dateCheck = validateDate(form.isoDate, { canBePast: false, label: "Ngày xin nghỉ" });
    if (!dateCheck.valid) return setError(dateCheck.error);
    const reasonCheck = validateLeaveReason(form.reason);
    if (!reasonCheck.valid) return setError(reasonCheck.error);

    onSubmit({
      ...form,
      reason: reasonCheck.value,
      shiftDate: dateLabel(form.isoDate),
      shiftTime: SHIFTS[form.shiftName],
      leaveTypeName: LEAVE_TYPES[form.leaveType],
    });
  };

  return (
    <Modal open title="Tạo đơn xin nghỉ" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 text-[15px]">
        {error && (
          <p role="alert" className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-[14px] text-slate-900">
            {error}
          </p>
        )}

        <Field label="Nhân viên xin nghỉ">
          <select value={form.employeeId} onChange={set("employeeId")} className={inputClass}>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.id} - {roleLabel(emp.roleTag) || emp.role})
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ngày xin nghỉ">
            <input type="date" value={form.isoDate} onChange={set("isoDate")} className={inputClass} />
          </Field>
          <Field label="Ca làm việc">
            <select value={form.shiftName} onChange={set("shiftName")} className={inputClass}>
              {Object.entries(SHIFTS).map(([name, time]) => (
                <option key={name} value={name}>
                  {name} ({time})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Loại nghỉ">
          <select value={form.leaveType} onChange={set("leaveType")} className={inputClass}>
            <option value="emergency">Nghỉ đột xuất</option>
            <option value="planned">Nghỉ phép cá nhân (đã lên lịch)</option>
          </select>
        </Field>

        <Field label="Lý do xin nghỉ">
          <textarea
            rows={3}
            value={form.reason}
            onChange={set("reason")}
            placeholder="Nhập lý do cụ thể..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#0F172A] focus:ring-4 focus:ring-[#0F172A]/20"
          />
        </Field>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" size="lg">
            Tạo đơn
          </Button>
        </div>
      </form>
    </Modal>
  );
}
