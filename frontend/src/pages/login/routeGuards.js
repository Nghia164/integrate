// =============================================================================
// File: src/pages/login/routeGuards.js
// Tầng: Logic Định Tuyến & Phân Quyền (Pure JS - Không chứa JSX để chạy được trong cả Node test và React)
// =============================================================================
import { ROLES } from "../../lib/constants.js";


/**
 * Trả về trang chính mặc định theo vai trò.
 * Manager -> /manager/dashboard
 * Staff -> /employees/schedule
 */
export const homeOf = (role) =>
  role === ROLES.MANAGER || role === "manager"
    ? "/manager/dashboard"
    : "/employees/schedule";

/**
 * Kiểm tra một path có hợp lệ với vai trò hay không.
 */
export function isRouteAllowedForRole(pathname, role) {
  if (!pathname || typeof pathname !== "string") return false;
  const normalizedRole = role === "employee" ? "staff" : role;
  if (normalizedRole === "manager") {
    return pathname.startsWith("/manager");
  }
  if (normalizedRole === "staff") {
    return pathname.startsWith("/employees");
  }
  return false;
}

/**
 * Tính toán trang chuyển hướng sau khi đăng nhập thành công.
 * Ưu tiên quay lại route trước đó (locationState.from) nếu hợp lệ với vai trò.
 */
export function getDestinationPath(user, locationState) {
  const role = user?.role === "employee" ? "staff" : user?.role;
  const defaultHome = homeOf(user?.role);

  const from = locationState?.from;
  const fromPath = typeof from === "string" ? from : from?.pathname;
  const fromSearch = from?.search || "";

  if (!fromPath || fromPath === "/" || fromPath === "/login") {
    return defaultHome;
  }

  // Phân quyền cho route đích
  const isAllowed = isRouteAllowedForRole(fromPath, role);
  return isAllowed ? `${fromPath}${fromSearch}` : defaultHome;
}
