// =============================================================================
// File: src/pages/login/ProtectedRoute.jsx
// Tầng: Bộ định tuyến & Bảo vệ Route React (Route Guards)
// Nghiệp vụ:
// - Protected: Yêu cầu đăng nhập, đúng vai trò. Nếu chưa đăng nhập thì lưu location.state.from để redirect lại sau khi đăng nhập.
// - PublicOnly: Dành cho /login và / - nếu đã đăng nhập thì tự chuyển về homeOf(user.role).
// =============================================================================
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../lib/constants";
import MustChangePasswordScreen from "./MustChangePasswordScreen";

import { getDestinationPath, homeOf } from "./routeGuards";

/**
 * Guard bảo vệ các route yêu cầu xác thực và đúng vai trò.
 * Khi chưa đăng nhập, lưu lại location hiện tại vào state.from để redirect lại sau khi đăng nhập.
 * Khi mustChangePassword = true, chặn mọi truy cập khác và hiển thị màn hình đổi mật khẩu bắt buộc (US02).
 */
export function Protected({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // US02: Chặn chuyển trang khác khi chưa đổi mật khẩu tạm thời
  if (user.mustChangePassword) {
    return <MustChangePasswordScreen />;
  }

  const userRole = user.role === "employee" ? ROLES.STAFF : user.role;
  const targetRole = role === "employee" ? ROLES.STAFF : role;

  if (userRole !== targetRole) {
    return <Navigate to={homeOf(user.role)} replace />;
  }

  return children;
}

/**
 * Guard cho các trang công khai dành cho khách chưa đăng nhập (Landing, Login).
 * Nếu đã có phiên đăng nhập, tự động chuyển về trang đích hợp lệ hoặc trang chính theo vai trò.
 */
export function PublicOnly({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    const target = getDestinationPath(user, location.state);
    return <Navigate to={target} replace />;
  }

  return children;
}

export default Protected;
