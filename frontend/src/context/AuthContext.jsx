// =============================================================================
// File: src/context/AuthContext.jsx
// Tầng: Ngữ cảnh Xác thực React (Auth Context)
// Nghiệm vụ: Quản lý trạng thái phiên đăng nhập theo tab, cung cấp user, login, logout
// Tự động kiểm tra tính hợp lệ của tài khoản khi F5 nạp lại trang
// =============================================================================
import { createContext, useContext, useState, useEffect } from "react";
import {
  getSession,
  saveSession,
  clearSession,
  login as serviceLogin,
  logout as serviceLogout,
} from "../services/authService";

const AuthContext = createContext(null);

/**
 * Xác thực phiên đăng nhập lưu trong sessionStorage / localStorage.
 * Nếu tài khoản bị vô hiệu hóa hoặc không hợp lệ -> tự động xóa phiên.
 */
export function validateStoredUser() {
  try {
    const session = getSession();
    if (!session || !session.user) return null;
    const user = session.user;

    // Kiểm tra trạng thái hoạt động của tài khoản
    if (user.status === "inactive" || user.status === "Nghỉ việc") {
      console.warn("Tài khoản không còn hoạt động. Đang tự động đăng xuất.");
      clearSession();
      return null;
    }

    return user;
  } catch (err) {
    console.error("Lỗi khi đọc phiên đăng nhập:", err);
    clearSession();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => validateStoredUser());

  useEffect(() => {
    const valid = validateStoredUser();
    if (!valid && user) {
      setUser(null);
    }
  }, [user]);

  // Lưu phiên sau khi đăng nhập thành công
  const saveLogin = ({ user: newUser, token }, rememberMe = false) => {
    saveSession(newUser, token, rememberMe);
    setUser(newUser);
  };

  // Đăng nhập trực tiếp thông qua authService và lưu phiên
  const login = async (email, password, rememberMe = false) => {
    const data = await serviceLogin(email, password, rememberMe);
    saveLogin(data, rememberMe);
    return data;
  };

  // Đăng xuất: xóa toàn bộ phiên khỏi tab hiện tại và dọn sạch dữ liệu form
  const logout = () => {
    serviceLogout();
    setUser(null);
    try {
      localStorage.removeItem("SMART_SCHEDULING_REMEMBERED_EMAIL");
    } catch {
      // Bỏ qua lỗi trình duyệt nếu có
    }
  };

  // Cập nhật trạng thái sau khi đổi mật khẩu bắt buộc thành công (US02)
  const completePasswordChange = () => {
    setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
  };

  return (
    <AuthContext.Provider value={{ user, saveLogin, login, logout, completePasswordChange }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
