/**
 * File: src/mocks/authMock.js
 * Dữ liệu mẫu xác thực tài khoản & đăng nhập (Static Mock Data)
 */

import { mockEmployees } from "./employeeMock.js";

export const mockUsers = [
  {
    id: "USR-MGR-001",
    email: "quanly@smartscheduling.vn",
    password: "12345678",
    role: "manager",
    status: "active",
    name: "Quản lý Cửa Hàng",
    mustChangePassword: false,
  },
  {
    id: "USR-STF-001",
    employeeId: "NV001",
    email: "nguyenvanan@gmail.com",
    password: "12345678",
    role: "staff",
    status: "active",
    name: "Nguyễn Văn An",
    roles: ["Phục vụ", "Thu ngân"],
    roleTag: "Phục vụ",
    mustChangePassword: false,
  },
  {
    id: "USR-STF-002",
    employeeId: "NV002",
    email: "tranthibich@gmail.com",
    password: "12345678",
    role: "staff",
    status: "active",
    name: "Trần Thị Bích",
    roles: ["Pha chế"],
    roleTag: "Pha chế",
    mustChangePassword: false,
  },
  {
    id: "USR-STF-003",
    employeeId: "NV003",
    email: "leminhcuong@gmail.com",
    password: "12345678",
    role: "staff",
    status: "active",
    name: "Lê Minh Cường",
    roles: ["Thu ngân"],
    roleTag: "Thu ngân",
    mustChangePassword: false,
  },
  {
    id: "USR-STF-004",
    employeeId: "NV004",
    email: "phamthidung@gmail.com",
    password: "12345678",
    role: "staff",
    status: "active",
    name: "Phạm Thị Dung",
    roles: ["Phục vụ"],
    roleTag: "Phục vụ",
    mustChangePassword: false,
  },
  {
    id: "USR-STF-005",
    employeeId: "NV005",
    email: "hoangvannam@gmail.com",
    password: "12345678",
    role: "staff",
    status: "active",
    name: "Hoàng Văn Nam",
    roles: ["Pha chế", "Phục vụ"],
    roleTag: "Pha chế",
    mustChangePassword: false,
  },
  {
    id: "USR-STF-006",
    employeeId: "NV006",
    email: "dokimngan@gmail.com",
    password: "12345678",
    role: "staff",
    status: "inactive",
    name: "Đỗ Kim Ngân",
    roles: ["Thu ngân"],
    roleTag: "Thu ngân",
    mustChangePassword: false,
  },
  {
    id: "USR-STF-007",
    employeeId: "NV007",
    email: "vuminhthao@gmail.com",
    password: "12345678",
    role: "staff",
    status: "active",
    name: "Vũ Minh Thảo",
    roles: ["Phục vụ"],
    roleTag: "Phục vụ",
    mustChangePassword: false,
  },
  {
    id: "USR-STF-008",
    employeeId: "NV008",
    email: "danghoangyen@gmail.com",
    password: "12345678",
    role: "staff",
    status: "active",
    name: "Đặng Hoàng Yến",
    roles: ["Pha chế"],
    roleTag: "Pha chế",
    mustChangePassword: true,
  },
];

export function mockLogin(accountIdentifier = "", password = "") {
  const cleanId = String(accountIdentifier || "").trim().toLowerCase();
  const cleanPass = String(password || "").trim();

  if (!cleanId || !cleanPass) {
    const err = new Error("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
    err.code = "VALIDATION_ERROR";
    err.status = 422;
    throw err;
  }

  const user = mockUsers.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.employeeId && u.employeeId.toLowerCase() === cleanId) ||
      (u.id && u.id.toLowerCase() === cleanId)
  );

  if (!user) {
    const err = new Error("Tài khoản hoặc mật khẩu không đúng.");
    err.code = "INVALID_CREDENTIALS";
    err.status = 401;
    throw err;
  }

  if (user.status === "inactive" || user.status === "locked") {
    const err = new Error("Tài khoản không còn hoạt động.");
    err.code = "ACCOUNT_DISABLED";
    err.status = 403;
    throw err;
  }

  const passMatches = cleanPass === user.password || cleanPass === "12345678" || cleanPass === "123456";
  if (!passMatches) {
    const err = new Error("Tài khoản hoặc mật khẩu không đúng.");
    err.code = "INVALID_CREDENTIALS";
    err.status = 401;
    throw err;
  }

  let sessionUser;
  if (user.role === "manager") {
    sessionUser = {
      id: "QL001",
      userId: user.id,
      employeeId: "QL001",
      name: user.name,
      email: user.email,
      role: "manager",
      roles: ["Manager"],
      roleTag: "Manager",
      roleTags: ["Manager"],
      status: "Đang làm việc",
      mustChangePassword: Boolean(user.mustChangePassword),
    };
  } else {
    const empData = mockEmployees.find((e) => e.id === (user.employeeId || user.id));
    const userRoles = empData?.roles || user.roles || [user.roleTag || "Phục vụ"];
    sessionUser = {
      id: user.employeeId || user.id,
      userId: user.id,
      employeeId: user.employeeId || user.id,
      employeeCode: user.employeeId || user.id,
      name: user.name,
      email: user.email,
      role: "staff",
      roles: userRoles,
      roleTag: userRoles[0] || "Phục vụ",
      roleTags: userRoles,
      status: empData?.status || "Đang làm việc",
      mustChangePassword: Boolean(user.mustChangePassword),
    };
  }

  const token = `mock-jwt-token-${sessionUser.id}`;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("user", JSON.stringify(sessionUser));
      localStorage.setItem("token", token);
    } catch {
      /* ignore */
    }
  }

  return { user: sessionUser, token };
}

/**
 * Đặt lại mật khẩu tài khoản người dùng và gắn cờ mustChangePassword
 */
export function resetUserPassword(identifier, newPassword) {
  const clean = String(identifier || "").trim().toLowerCase();
  const user = mockUsers.find(
    (u) =>
      u.email.toLowerCase() === clean ||
      (u.employeeId && u.employeeId.toLowerCase() === clean) ||
      u.id.toLowerCase() === clean
  );
  if (!user) {
    throw new Error("Không tìm thấy tài khoản người dùng.");
  }
  user.password = newPassword;
  user.mustChangePassword = true;
  return user;
}

/**
 * Đổi mật khẩu tài khoản (tự đổi hoặc bắt buộc đổi lần đầu)
 */
export function changeUserPassword(identifier, currentPassword, newPassword) {
  const clean = String(identifier || "").trim().toLowerCase();
  const user = mockUsers.find(
    (u) =>
      u.email.toLowerCase() === clean ||
      (u.employeeId && u.employeeId.toLowerCase() === clean) ||
      u.id.toLowerCase() === clean
  );
  if (!user) {
    throw new Error("Không tìm thấy tài khoản người dùng.");
  }

  const cleanCurrent = String(currentPassword || "").trim();
  const passMatches = cleanCurrent === user.password || cleanCurrent === "12345678" || cleanCurrent === "123456";
  if (!passMatches) {
    const err = new Error("Mật khẩu hiện tại không đúng.");
    err.code = "INVALID_CREDENTIALS";
    err.field = "currentPassword";
    throw err;
  }

  const cleanNew = String(newPassword || "").trim();
  if (cleanNew.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(cleanNew)) {
    const err = new Error("Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ và số.");
    err.code = "WEAK_PASSWORD";
    err.field = "newPassword";
    throw err;
  }

  if (cleanNew === cleanCurrent) {
    const err = new Error("Mật khẩu mới phải khác mật khẩu hiện tại.");
    err.code = "PASSWORD_SAME";
    err.field = "newPassword";
    throw err;
  }

  user.password = cleanNew;
  user.mustChangePassword = false;
  return { success: true, message: "Đổi mật khẩu thành công" };
}

/**
 * Tạo mới tài khoản người dùng
 */
export function createUserAccount({ email, password, name, roles = ["Phục vụ"], employeeId, mustChangePassword = true }) {
  const existing = mockUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    existing.password = password;
    existing.mustChangePassword = mustChangePassword;
    existing.name = name || existing.name;
    existing.roles = roles;
    return existing;
  }

  const newUser = {
    id: `USR-STF-${String(mockUsers.length + 1).padStart(3, "0")}`,
    employeeId: employeeId || `NV${String(mockUsers.length + 1).padStart(3, "0")}`,
    email: email.trim(),
    password,
    role: "staff",
    status: "active",
    name: name || "Nhân viên mới",
    roles,
    roleTag: roles[0] || "Phục vụ",
    mustChangePassword,
  };
  mockUsers.push(newUser);
  return newUser;
}

export default {
  mockUsers,
  mockLogin,
  resetUserPassword,
  changeUserPassword,
  createUserAccount,
};
