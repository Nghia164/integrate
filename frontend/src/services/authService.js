// =============================================================================
// File: src/services/authService.js
// Tầng: Dịch Vụ Xác Thực (Auth Service)
// Nhiệm vụ: Xử lý đăng nhập, đăng xuất, lưu phiên và kiểm tra phân quyền.
// =============================================================================

import { mockLogin, mockUsers, changeUserPassword } from "../mocks/authMock.js";
import { ERROR_CODES, AppError } from "./errors.js";
import { ROLES } from "../lib/constants.js";

let inMemorySession = null;

export function getSession() {
  try {
    if (typeof sessionStorage !== "undefined") {
      const sUser = sessionStorage.getItem("user");
      const sToken = sessionStorage.getItem("token");
      if (sUser && sToken) {
        const user = JSON.parse(sUser);
        if (user && typeof user === "object") {
          return { user, token: sToken };
        }
      }
    }

    if (typeof localStorage !== "undefined") {
      const lUser = localStorage.getItem("user");
      const lToken = localStorage.getItem("token");
      if (lUser && lToken) {
        const user = JSON.parse(lUser);
        if (user && typeof user === "object") {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("user", lUser);
            sessionStorage.setItem("token", lToken);
          }
          return { user, token: lToken };
        }
      }
    }

    if (inMemorySession) {
      return inMemorySession;
    }

    return null;
  } catch {
    return inMemorySession || null;
  }
}

export function saveSession(user, token, rememberMe = false) {
  inMemorySession = { user, token };

  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("token", token);
  }

  if (typeof localStorage !== "undefined") {
    if (rememberMe) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("rememberMe");
    }
  }
}

export function clearSession() {
  inMemorySession = null;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
  }

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("SMART_SCHEDULING_REMEMBERED_EMAIL");
  }
}

export function getCurrentUser() {
  const session = getSession();
  return session?.user || null;
}

export async function login(email, password, rememberMe = false) {
  // BACKEND: Xác thực email + password (so khớp bcrypt hash), tạo JWT token, cập nhật last_login_at
  const result = mockLogin(email, password);
  if (result?.user && result?.token) {
    saveSession(result.user, result.token, rememberMe);
  }
  return result;
}

export async function logout() {
  // BACKEND: Vô hiệu hóa JWT token / refresh token trên blacklist của backend
  clearSession();
  return { message: "Đã đăng xuất thành công." };
}

/**
 * Đổi mật khẩu cho người dùng hiện tại (US02)
 */
export async function changePassword(currentPassword, newPassword) {
  // BACKEND: Xác thực mật khẩu hiện tại bằng bcrypt, băm mật khẩu mới, cập nhật bảng users, đặt must_change_password = false, ghi audit log
  const session = getSession();
  const currentUser = session?.user;
  if (!currentUser) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Vui lòng đăng nhập để đổi mật khẩu.", 401);
  }

  const identifier = currentUser.email || currentUser.userId || currentUser.id;
  const result = changeUserPassword(identifier, currentPassword, newPassword);

  // Cập nhật lại phiên với mustChangePassword = false
  const updatedUser = { ...currentUser, mustChangePassword: false };
  saveSession(updatedUser, session.token, true);

  return { ...result, user: updatedUser };
}

export async function getSessionAsync() {
  const session = getSession();
  if (session) return session;
  // Trả về mặc định quản lý nếu chưa có session trong môi trường dev
  return { user: mockUsers[0], token: "mock-jwt-token-manager" };
}

export function hasRole(requiredRole) {
  const user = getCurrentUser();
  if (!user) return false;
  const currentRole = user.role === "employee" ? ROLES.STAFF : user.role;
  const targetRole = requiredRole === "employee" ? ROLES.STAFF : requiredRole;
  return currentRole === targetRole;
}

export function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Vui lòng đăng nhập để tiếp tục.", 401);
  }
  return user;
}

export function requireRole(requiredRole) {
  const user = requireAuth();
  const currentRole = user.role === "employee" ? ROLES.STAFF : user.role;
  const targetRole = requiredRole === "employee" ? ROLES.STAFF : requiredRole;
  if (currentRole !== targetRole) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.", 403);
  }
  return user;
}

export function requireManager() {
  return requireRole(ROLES.MANAGER);
}

export function resolveStaffIdentity() {
  const user = requireRole(ROLES.STAFF);
  const employeeId = user.employeeId || user.id;
  if (!employeeId) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "Không tìm thấy hồ sơ nhân sự liên kết với tài khoản này.", 403);
  }
  return { user, employeeId };
}

export { ERROR_CODES, AppError };

export default {
  login,
  logout,
  changePassword,
  getSession,
  getSessionAsync,
  saveSession,
  clearSession,
  getCurrentUser,
  hasRole,
  requireAuth,
  requireRole,
  requireManager,
  resolveStaffIdentity,
};
