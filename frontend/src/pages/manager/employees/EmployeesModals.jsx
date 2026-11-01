// =============================================================================
// File: src/pages/manager/employees/EmployeesModals.jsx
// Tầng: Hộp thoại Quản lý Nhân sự (Employee Modals Container & Modals)
// Nghiệp vụ: Thêm nhân viên (US05), Sửa nhân viên, Cấp tài khoản & Mật khẩu tạm (US02),
// Thôi việc & Giải phóng ca tương lai (US06)
// =============================================================================

import { useEffect, useState } from "react";
import { Copy, Check, AlertTriangle, AlertCircle } from "lucide-react";
import { Modal, Button } from "../../../components/FormKit";
import { EmployeeFields, Field, FormError, fieldClass, getFieldClass } from "./employeeShared";
import { generateTempPassword } from "../../../lib/formatters";
import { getFutureShiftsForEmployee } from "../../../services/scheduleService";
import {
  validateName,
  validatePhone,
  validateEmail,
  validateHourlyWage,
} from "../../../lib/validators";

const emptyAddForm = {
  id: "",
  name: "",
  phone: "",
  birthDate: "",
  contract: "Bán thời gian",
  roles: ["Phục vụ"],
  role: "Phục vụ",
  hourlyWage: 28000,
  createAccount: true,
  email: "",
};

/**
 * 1. Hộp thoại thêm nhân viên mới (US05 / US02)
 */
export function AddEmployeeModal({ open, nextId, isEmailTaken, onClose, onCreate }) {
  const [form, setForm] = useState(emptyAddForm);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        ...emptyAddForm,
        id: nextId,
        roles: ["Phục vụ"],
        role: "Phục vụ",
      });
      setError("");
      setFieldErrors({});
      setSubmitting(false);
    }
  }, [open, nextId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const res = validateName(value);
      setFieldErrors((prev) => ({ ...prev, name: res.valid ? "" : res.error }));
    } else if (name === "phone") {
      const res = validatePhone(value);
      setFieldErrors((prev) => ({ ...prev, phone: res.valid ? "" : res.error }));
    } else if (name === "email" && form.createAccount) {
      const res = validateEmail(value);
      if (!res.valid) {
        setFieldErrors((prev) => ({ ...prev, email: res.error }));
      } else if (isEmailTaken(value)) {
        setFieldErrors((prev) => ({ ...prev, email: "Email này đã được dùng cho tài khoản khác." }));
      } else {
        setFieldErrors((prev) => ({ ...prev, email: "" }));
      }
    } else if (name === "hourlyWage" && value) {
      const res = validateHourlyWage(value);
      setFieldErrors((prev) => ({ ...prev, hourlyWage: res.valid ? "" : res.error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { createAccount, email } = form;

    const nameCheck = validateName(form.name);
    const phoneCheck = validatePhone(form.phone);
    const roles = form.roles || (form.role ? [form.role] : []);
    const wageCheck = form.hourlyWage ? validateHourlyWage(form.hourlyWage) : { valid: true, value: 28000 };

    let emailCheck = { valid: true };
    if (createAccount) {
      emailCheck = validateEmail(email);
      if (emailCheck.valid && isEmailTaken(email)) {
        emailCheck = { valid: false, error: "Email này đã được dùng cho tài khoản khác." };
      }
    }

    const errors = {};
    if (!nameCheck.valid) errors.name = nameCheck.error;
    if (!phoneCheck.valid) errors.phone = phoneCheck.error;
    if (roles.length === 0) errors.roles = "Nhân viên phải có ít nhất một Role_Tag";
    if (!wageCheck.valid) errors.hourlyWage = wageCheck.error;
    if (!emailCheck.valid) errors.email = emailCheck.error;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Vui lòng kiểm tra lại các trường thông tin bên dưới.");
      return;
    }

    setSubmitting(true);
    let tempPassword = null;
    if (createAccount) {
      tempPassword = generateTempPassword(10);
    }

    try {
      await onCreate({
        id: form.id,
        name: nameCheck.value,
        phone: phoneCheck.value,
        birthDate: form.birthDate,
        roles: form.roles,
        role: form.roles[0],
        contract: form.contract,
        hourlyWage: wageCheck.value,
        status: "Đang làm việc",
        account: createAccount
          ? {
              email: email.trim(),
              password: tempPassword,
              status: "active",
              mustChangePassword: true,
              tempPassword,
            }
          : null,
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Lỗi khi thêm nhân viên.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasFormErrors = Object.values(fieldErrors).some(Boolean);

  return (
    <Modal open={open} title="Thêm nhân viên" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 pr-1">
        <FormError message={error} />

        <h4 className="mb-3 text-[14px] font-semibold text-slate-900">Thông tin nhân viên</h4>
        <EmployeeFields
          form={form}
          onChange={handleChange}
          onBlur={handleBlur}
          errors={fieldErrors}
        />

        <div className="mt-6 border-t border-slate-200 pt-5">
          <h4 className="text-[14px] font-semibold text-slate-900">Tài khoản đăng nhập</h4>
          <p className="mb-3 mt-1 text-[13px] text-slate-500">
            Quản lý có thể cấp tài khoản cho nhân viên ngay khi tạo hồ sơ.
          </p>

          <label className="mb-4 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="createAccount"
              checked={form.createAccount}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <span className="text-[14px] text-slate-800">Cấp tài khoản cho nhân viên</span>
          </label>

          {form.createAccount && (
            <div className="space-y-4">
              <Field label="Email đăng nhập *" error={fieldErrors.email}>
                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="nhanvien@gmail.com"
                  className={getFieldClass(Boolean(fieldErrors.email))}
                />
              </Field>
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-[13px] text-sky-900 leading-relaxed">
                <p className="font-semibold text-sky-950">Mật khẩu tạm thời tự động (US02)</p>
                <p className="mt-0.5 text-sky-800">
                  Hệ thống tự động sinh mật khẩu tạm thời ngẫu nhiên (chữ + số, tối thiểu 8 ký tự). Mật khẩu chỉ hiển thị 1 lần duy nhất sau khi lưu để sao chép. Nhân viên bắt buộc phải đổi mật khẩu khi đăng nhập lần đầu.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={!form.roles || form.roles.length === 0 || hasFormErrors} loading={submitting}>
            Thêm nhân viên
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * 2. Hộp thoại chỉnh sửa thông tin nhân viên
 */
export function EditEmployeeModal({
  open,
  selected,
  form,
  onChange,
  error,
  onClose,
  onSubmit,
}) {
  return (
    <Modal open={open} title="Sửa nhân viên" onClose={onClose}>
      <form onSubmit={onSubmit} className="max-h-[75vh] overflow-y-auto pr-1">
        <FormError message={error} />
        <EmployeeFields form={form} onChange={onChange} />
        {selected?.account && (
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
            <h4 className="text-[14px] font-semibold text-slate-900">Tài khoản đăng nhập</h4>
            <Field label="Email đăng nhập">
              <input
                type="email"
                name="email"
                value={form.email || ""}
                onChange={onChange}
                className={fieldClass}
              />
            </Field>
            <p className="text-[12px] text-slate-500">
              * Để cấp lại mật khẩu tạm thời cho nhân viên, vui lòng dùng tùy chọn <strong>&quot;Đặt lại mật khẩu&quot;</strong> tại cột Thao tác ở danh sách nhân viên.
            </p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={!form.roles || form.roles.length === 0}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * 3. Hộp thoại cấp tài khoản nhân viên (US02)
 */
export function GrantAccountModal({
  open,
  selected,
  form,
  onChange,
  error,
  onClose,
  onSubmit,
}) {
  return (
    <Modal open={open} title={`Cấp tài khoản cho ${selected?.name || ""}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <p className="text-[13px] text-slate-600">
          Nhân viên sẽ dùng email này để đăng nhập vào hệ thống.
        </p>
        <Field label="Email đăng nhập *">
          <input
            type="email"
            name="email"
            value={form.email || ""}
            onChange={onChange}
            placeholder="nhanvien@gmail.com"
            className={fieldClass}
          />
        </Field>
        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-[13px] text-sky-900 leading-relaxed">
          <p className="font-semibold text-sky-950">Mật khẩu tạm thời tự động (US02)</p>
          <p className="mt-0.5 text-sky-800">
            Hệ thống sẽ tự động sinh mật khẩu tạm thời ngẫu nhiên (chữ + số, tối thiểu 8 ký tự). Mật khẩu chỉ hiển thị 1 lần duy nhất sau khi lưu để bạn sao chép và gửi cho nhân viên. Nhân viên bắt buộc phải đổi mật khẩu khi đăng nhập lần đầu.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit">Cấp tài khoản</Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * 4. Hộp thoại hiển thị mật khẩu tạm thời 1 LẦN DUY NHẤT (US02)
 */
export function TempPasswordModal({ open, data, created, onClose }) {
  const payload = data || created;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (payload?.tempPassword) {
      navigator.clipboard.writeText(payload.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!open || !payload) return null;

  return (
    <Modal
      open={open}
      title={payload.isReset ? "Đặt lại mật khẩu thành công" : "Cấp tài khoản thành công"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-[13px] text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950">Mật khẩu chỉ hiển thị 1 lần duy nhất!</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Hãy sao chép và gửi mật khẩu này cho nhân viên. Sau khi đóng hộp thoại này, bạn sẽ <strong>không thể xem lại</strong> mật khẩu này được nữa.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div>
            <p className="text-[12px] font-medium text-slate-500">Nhân viên</p>
            <p className="font-semibold text-slate-900">{payload.name}</p>
          </div>
          <div>
            <p className="text-[12px] font-medium text-slate-500">Email đăng nhập</p>
            <p className="text-[14px] text-slate-800">{payload.email}</p>
          </div>
          <div>
            <p className="text-[12px] font-medium text-slate-500">Mật khẩu tạm thời</p>
            <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <span className="font-mono text-[16px] font-bold tracking-wider text-slate-900 select-all">
                {payload.tempPassword}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center gap-1.5"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" onClick={onClose}>
            Đã sao chép & Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { TempPasswordModal as AccountSuccessModal };

/**
 * 5. Hộp thoại xác nhận cho nhân viên thôi việc (US06)
 * Liệt kê rõ các ca chính thức trong tương lai
 */
export function TerminateEmployeeModal({ open, selected, onClose, onConfirm }) {
  const [futureShifts, setFutureShifts] = useState([]);

  useEffect(() => {
    if (open && selected?.id) {
      const shifts = getFutureShiftsForEmployee(selected.id);
      setFutureShifts(shifts);
    } else {
      setFutureShifts([]);
    }
  }, [open, selected]);

  return (
    <Modal open={open} title="Cho nhân viên nghỉ việc" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[14px] text-slate-700">
          Bạn có chắc muốn cho nhân viên <b className="text-slate-900">{selected?.name}</b> ({selected?.id}) nghỉ việc?
        </p>

        {futureShifts.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-900">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>Nhân viên có {futureShifts.length} ca chính thức trong tương lai sẽ chuyển thành Chưa có người:</span>
            </div>
            <ul className="space-y-1.5 pl-6 text-[13px] text-amber-800 list-disc">
              {futureShifts.map((s) => (
                <li key={s.key}>
                  <span className="font-semibold">{s.fullDate || s.date}</span>: {s.shiftName} ({s.time})
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-amber-700 italic pt-1">
              Các ca này sẽ tự động chuyển thành &ldquo;Chưa có người&rdquo; để Quản lý phân công lại.
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-slate-500 italic">
            Nhân viên hiện không có ca trực chính thức nào trong tương lai.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" variant="danger" size="lg" onClick={onConfirm}>
            Xác nhận cho nghỉ việc
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * 6. Khung chứa toàn bộ Modal nhân viên (EmployeeModalsContainer)
 */
export default function EmployeeModalsContainer({
  modal,
  employees,
  selected,
  form,
  error,
  created,
  isEmailTaken,
  closeModal,
  handleChange,
  handleAdd,
  handleUpdate,
  handleCreateAccount,
  confirmDelete,
}) {
  return (
    <>
      <AddEmployeeModal
        open={modal === "add"}
        nextId={`NV${String(employees.length + 1).padStart(3, "0")}`}
        isEmailTaken={isEmailTaken}
        onClose={closeModal}
        onCreate={handleAdd}
      />
      <EditEmployeeModal
        open={modal === "edit"}
        selected={selected}
        form={form}
        onChange={handleChange}
        error={error}
        onClose={closeModal}
        onSubmit={handleUpdate}
      />
      <GrantAccountModal
        open={modal === "account"}
        selected={selected}
        form={form}
        onChange={handleChange}
        error={error}
        onClose={closeModal}
        onSubmit={handleCreateAccount}
      />
      <TempPasswordModal
        open={modal === "success"}
        created={created}
        onClose={closeModal}
      />
      <TerminateEmployeeModal
        open={modal === "delete"}
        selected={selected}
        onClose={closeModal}
        onConfirm={confirmDelete}
      />
    </>
  );
}
