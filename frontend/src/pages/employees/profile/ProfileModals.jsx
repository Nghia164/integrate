/** FILE NÀY LÀM GÌ: Modal đổi mật khẩu và modal hủy thay đổi hồ sơ | Loại: Giao diện Staff | US: US02, US07 */

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button, Modal } from "../../../components/FormKit";
import { changePassword } from "../../../services/authService";
import { validatePassword } from "../../../lib/validators";

export function CancelEditModal({ open, onClose, onConfirm }) {
  return (
    <Modal open={open} onClose={onClose} title="Hủy các thay đổi?" size="sm">
      <div className="space-y-4">
        <p className="text-[14px] text-slate-600">
          Bạn có các thông tin đã chỉnh sửa nhưng chưa lưu. Bạn có chắc chắn muốn bỏ qua các thay đổi này không?
        </p>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="md" onClick={onClose}>
            Tiếp tục chỉnh sửa
          </Button>
          <Button variant="danger" size="md" onClick={onConfirm}>
            Bỏ thay đổi
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ChangePasswordModal({ open, onClose, onSuccess }) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentError, setCurrentError] = useState("");
  const [newError, setNewError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
    setCurrentError("");
    setNewError("");
    setConfirmError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCurrentError("");
    setNewError("");
    setConfirmError("");

    let hasErr = false;
    if (!currentPass) {
      setCurrentError("Vui lòng nhập mật khẩu hiện tại.");
      hasErr = true;
    }
    const passCheck = validatePassword(newPass);
    if (!passCheck.valid) {
      setNewError(passCheck.error);
      hasErr = true;
    } else if (newPass === currentPass) {
      setNewError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      hasErr = true;
    }

    if (!confirmPass) {
      setConfirmError("Vui lòng xác nhận mật khẩu mới.");
      hasErr = true;
    } else if (confirmPass !== newPass) {
      setConfirmError("Mật khẩu xác nhận không khớp.");
      hasErr = true;
    }

    if (hasErr) return;

    setSubmitting(true);
    try {
      // BACKEND: Xác thực mật khẩu cũ bằng bcrypt và băm lưu mật khẩu mới
      await changePassword(currentPass, newPass);
      handleClose();
      onSuccess();
    } catch (err) {
      setCurrentError(err?.message || "Không thể đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const passwordFields = [
    { key: "cur", label: "Mật khẩu hiện tại", val: currentPass, set: setCurrentPass, err: currentError, show: showCurrent, toggle: setShowCurrent, holder: "Nhập mật khẩu hiện tại" },
    { key: "new", label: "Mật khẩu mới", val: newPass, set: setNewPass, err: newError, show: showNew, toggle: setShowNew, holder: "Tối thiểu 8 ký tự gồm chữ và số" },
    { key: "cfm", label: "Xác nhận mật khẩu mới", val: confirmPass, set: setConfirmPass, err: confirmError, show: showConfirm, toggle: setShowConfirm, holder: "Nhập lại mật khẩu mới" },
  ];

  return (
    <Modal open={open} onClose={handleClose} title="Đổi mật khẩu" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {passwordFields.map((f) => (
          <div key={f.key}>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">{f.label}</label>
            <div className="relative">
              <input
                type={f.show ? "text" : "password"}
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.holder}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-[14px] text-slate-900 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/15"
              />
              <button
                type="button"
                onClick={() => f.toggle((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
              >
                {f.show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {f.err && <p className="mt-1 text-[12px] text-rose-600">{f.err}</p>}
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={handleClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" size="md" loading={submitting}>
            Lưu mật khẩu
          </Button>
        </div>
      </form>
    </Modal>
  );
}
