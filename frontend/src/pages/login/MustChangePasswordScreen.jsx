// =============================================================================
// File: src/pages/login/MustChangePasswordScreen.jsx
// Màn hình bắt buộc đổi mật khẩu lần đầu (US02)
// Chặn người dùng truy cập mọi tính năng khi mustChangePassword = true
// =============================================================================

import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, LogOut } from "lucide-react";
import { Button } from "../../components/FormKit";
import { useAuth } from "../../context/AuthContext";
import { changePassword } from "../../services/authService";

export default function MustChangePasswordScreen() {
  const { user, completePasswordChange, logout } = useAuth();

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!currentPass.trim()) {
      newErrors.currentPass = "Vui lòng nhập mật khẩu hiện tại.";
    }

    if (!newPass.trim()) {
      newErrors.newPass = "Vui lòng nhập mật khẩu mới.";
    } else if (newPass.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPass)) {
      newErrors.newPass = "Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ và số.";
    } else if (newPass === currentPass) {
      newErrors.newPass = "Mật khẩu mới phải khác mật khẩu hiện tại.";
    }

    if (!confirmPass.trim()) {
      newErrors.confirmPass = "Vui lòng xác nhận mật khẩu mới.";
    } else if (confirmPass !== newPass) {
      newErrors.confirmPass = "Mật khẩu xác nhận không khớp.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      // BACKEND: Gọi API /auth/change-password để cập nhật mật khẩu và gỡ cờ must_change_password
      await changePassword(currentPass, newPass);
      setSuccessToast(true);
      setTimeout(() => {
        completePasswordChange();
      }, 1500);
    } catch (err) {
      if (err.field === "currentPassword" || err.message?.includes("hiện tại")) {
        setErrors({ currentPass: err.message || "Mật khẩu hiện tại không đúng." });
      } else if (err.field === "newPassword") {
        setErrors({ newPass: err.message });
      } else {
        setErrors({ general: err.message || "Không thể đổi mật khẩu. Vui lòng thử lại." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Toast thông báo thành công */}
      {successToast && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-5 py-3.5 text-[14px] font-medium text-white shadow-xl animate-fade-in"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>Đổi mật khẩu thành công</span>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F172A] text-white shadow-md">
          <Lock className="h-7 w-7 text-amber-400" />
        </div>
        <h2 className="mt-5 text-center text-2xl font-bold tracking-tight text-slate-900">
          Đổi mật khẩu lần đầu
        </h2>
        <p className="mt-2 text-center text-[13px] text-slate-500 max-w-sm mx-auto">
          Tài khoản của bạn đang dùng mật khẩu tạm thời. Để bảo mật thông tin, bạn bắt buộc phải tạo mật khẩu mới trước khi truy cập hệ thống.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {errors.general && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-[13px] text-rose-800">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[12px] text-amber-900">
            Xin chào <strong>{user?.name || user?.email}</strong>. Bạn không thể đóng màn hình này khi chưa hoàn tất đổi mật khẩu.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mật khẩu hiện tại */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">
                Mật khẩu hiện tại (mật khẩu tạm) *
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Nhập mật khẩu tạm thời"
                  className={`h-11 w-full rounded-xl border px-3.5 pr-10 text-[14px] text-slate-900 outline-none transition-colors ${
                    errors.currentPass
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                      : "border-slate-200 bg-white focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.currentPass && (
                <p className="mt-1.5 text-[12px] text-rose-600 font-medium">{errors.currentPass}</p>
              )}
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">
                Mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự gồm cả chữ và số"
                  className={`h-11 w-full rounded-xl border px-3.5 pr-10 text-[14px] text-slate-900 outline-none transition-colors ${
                    errors.newPass
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                      : "border-slate-200 bg-white focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPass && (
                <p className="mt-1.5 text-[12px] text-rose-600 font-medium">{errors.newPass}</p>
              )}
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">
                Xác nhận mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`h-11 w-full rounded-xl border px-3.5 pr-10 text-[14px] text-slate-900 outline-none transition-colors ${
                    errors.confirmPass
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                      : "border-slate-200 bg-white focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPass && (
                <p className="mt-1.5 text-[12px] text-rose-600 font-medium">{errors.confirmPass}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center text-[14px]"
                loading={submitting}
              >
                Lưu mật khẩu mới & Tiếp tục
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 flex justify-center">
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
            >
              <LogOut size={15} />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
