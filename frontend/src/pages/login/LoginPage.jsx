/**
 * File: src/pages/login/LoginPage.jsx
 * Tầng: Giao diện Đăng nhập (Auth Presentation - Smart Scheduling 2026)
 *
 * Giai đoạn B: Dọn sạch giao diện đăng nhập:
 * - 1 ô đăng nhập duy nhất (Email & Mật khẩu), vai trò do tài khoản quyết định
 * - Căn giữa 1 card duy nhất trên nền --shell-bg (#F4F7F9)
 * - Sử dụng Logo chuẩn từ components/Logo
 * - Không còn tài khoản demo, không còn nút chọn vai trò hay nội dung thừa
 * - Thông báo lỗi bảo mật, validation rõ ràng bằng tiếng Việt có dấu
 */

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  ArrowLeft,
  Lock,
  Mail,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { login } from "../../services/authService";
import { getDestinationPath } from "./routeGuards";
import { Logo } from "../../components/NoticeKit";


const FONT = '"Be Vietnam Pro", ui-sans-serif, system-ui, "Segoe UI", sans-serif';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const REMEMBERED_EMAIL_KEY = "SMART_SCHEDULING_REMEMBERED_EMAIL";

function Banner({ tone, children }) {
  const isError = tone === "error";
  const Icon = isError ? AlertCircle : Info;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13.5px] leading-snug ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-sky-200 bg-sky-50 text-sky-900"
      }`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export default function LoginPage() {
  const { saveLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const expired = params.get("expired") === "1";

  const accountInputRef = useRef(null);
  const [account, setAccount] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY));
    } catch {
      return false;
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Tự động focus vào ô tài khoản khi nạp trang (nếu đã có email thì focus mật khẩu)
  useEffect(() => {
    if (account) {
      document.getElementById("password")?.focus();
    } else {
      accountInputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const next = {};
    const cleanAccount = account.trim();

    // Kiểm tra ô tài khoản: chấp nhận email hoặc mã nhân viên (NV001, etc.)
    if (!cleanAccount) {
      next.account = "Vui lòng nhập email hoặc mã nhân viên.";
    } else if (!EMAIL_RE.test(cleanAccount) && !/^nv\d{3}$/i.test(cleanAccount) && cleanAccount.toLowerCase() !== "manager") {
      next.account = "Vui lòng nhập đúng định dạng email hoặc mã NV (ví dụ: NV001).";
    }

    // Kiểm tra ô mật khẩu
    if (!password) {
      next.password = "Vui lòng nhập mật khẩu.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const data = await login(cleanAccount, password, rememberMe);

      // Lưu tài khoản (chỉ lưu email vào localStorage, TUYỆT ĐỐI không lưu mật khẩu)
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, cleanAccount);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      saveLogin(data, rememberMe);

      // Chuyển hướng: nếu vào từ route bảo vệ hợp lệ thì quay lại route đó, ngược lại về trang chính của vai trò
      const targetPath = getDestinationPath(data.user, location.state);
      navigate(targetPath, { replace: true });
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("không còn hoạt động")) {
        setError("Tài khoản không còn hoạt động.");
      } else if (err?.code === "ERR_NETWORK" || msg.includes("Network Error")) {
        setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.");
      } else {
        // Thông báo chung bảo mật không tiết lộ sai ô nào
        setError("Tài khoản hoặc mật khẩu không đúng.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between bg-[var(--page-bg,#F4F7F9)] text-[#0F172A]"
      style={{ fontFamily: FONT }}
    >
      {/* 1. THANH TIÊU ĐỀ TRÊN CÙNG (TOP HEADER) */}
      <header className="w-full border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 outline-none hover:opacity-90 transition-opacity">
              <Logo />
            </Link>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13.5px] font-medium text-slate-600 hover:text-[#0F172A] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Quay lại Trang chủ</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-[13px] text-slate-500">
            <span className="hidden sm:inline">
              Liên hệ hỗ trợ:{" "}
              <a
                href="mailto:lethanhhien414@gmail.com"
                className="font-medium text-slate-700 hover:text-[#0F172A]"
              >
                lethanhhien414@gmail.com
              </a>
            </span>
          </div>
        </div>
      </header>

      {/* 2. VÙNG NỘI DUNG ĐĂNG NHẬP Ở GIỮA (CENTERED CARD) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[440px]">
          {/* Nút quay lại trang chủ trên thiết bị di động */}
          <div className="sm:hidden mb-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 hover:text-[#0F172A]"
            >
              <ArrowLeft size={15} />
              <span>Quay lại Trang chủ</span>
            </Link>
          </div>

          {/* Khung thẻ đăng nhập chính (Card trắng bo tròn lớn nổi trên nền #F4F7F9) */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            {/* Tiêu đề & phụ đề */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                Đăng nhập hệ thống
              </h1>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">
                Cổng phân ca &amp; điều phối nhân sự thông minh Smart Scheduling
              </p>
            </div>

            {/* Thông báo hết hạn phiên đăng nhập */}
            {expired && (
              <Banner tone="info">
                Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
              </Banner>
            )}

            {/* Thông báo lỗi xác thực */}
            {error && (
              <Banner tone="error">
                {error}
              </Banner>
            )}

            {/* Form đăng nhập */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Ô 1: Email đăng nhập */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[13.5px] font-medium text-slate-700 mb-1.5"
                >
                  Email đăng nhập
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    ref={accountInputRef}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={account}
                    onChange={(e) => {
                      setAccount(e.target.value);
                      if (errors.account) setErrors((prev) => ({ ...prev, account: "" }));
                      if (error) setError("");
                    }}
                    className={`w-full h-11 rounded-xl border bg-white pl-10 pr-3.5 text-[14px] text-[#0F172A] placeholder:text-slate-400 outline-none transition-all ${
                      errors.account
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        : "border-slate-300 focus:border-[#0F172A] focus:ring-2 focus:ring-[#CBE3F0]"
                    }`}
                  />
                </div>
                {errors.account && (
                  <p id="account-error" role="alert" className="mt-1 text-xs text-rose-600">
                    {errors.account}
                  </p>
                )}
              </div>

              {/* Ô 2: Mật khẩu */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[13.5px] font-medium text-slate-700"
                  >
                    Mật khẩu
                  </label>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                      if (error) setError("");
                    }}
                    className={`w-full h-11 rounded-xl border bg-white pl-10 pr-10 text-[14px] text-[#0F172A] placeholder:text-slate-400 outline-none transition-all ${
                      errors.password
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        : "border-slate-300 focus:border-[#0F172A] focus:ring-2 focus:ring-[#CBE3F0]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="mt-1 text-xs text-rose-600">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Ghi nhớ đăng nhập / Lưu tài khoản */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#0F172A] focus:ring-[#CBE3F0] accent-[#0F172A]"
                  />
                  <span className="text-[13px] text-slate-600">
                    Lưu tài khoản trên thiết bị này
                  </span>
                </label>
              </div>

              {/* Nút bấm Đăng nhập */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 sm:h-12 rounded-xl bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium text-[14.5px] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>Đăng nhập</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Ghi chú chân form */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-1.5">
              <p className="text-[12.5px] text-slate-500">
                Quên mật khẩu? Liên hệ Quản lý để được cấp lại.
              </p>
              <p className="text-[12px] text-slate-400">
                Tài khoản nhân sự mới do Quản lý cấp trực tiếp trong hệ thống.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 3. CHÂN TRANG (PAGE FOOTER) */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Smart Scheduling • Đồ án C1SE_57</p>
          <p>
            Hỗ trợ kỹ thuật:{" "}
            <a
              href="mailto:lethanhhien414@gmail.com"
              className="font-medium text-slate-700 hover:text-[#0F172A]"
            >
              lethanhhien414@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
