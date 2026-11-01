// =============================================================================
// File: src/services/employeeService.js
// Tầng: Dịch Vụ Nhân Sự (Employee Service)
// Nhiệm vụ: Xử lý quản lý hồ sơ nhân sự, phân quyền và tài khoản (chỉ dữ liệu mẫu tại frontend)
// =============================================================================

import {
  mockEmployees,
  getEmployeeById as mockGetEmployeeById,
  getMockMyProfile,
} from "../mocks/employeeMock.js";
import { freeFutureShiftsForEmployee } from "./scheduleService.js";
import { createNotification } from "./notificationService.js";
import { resetUserPassword, createUserAccount } from "../mocks/authMock.js";


let localEmployees = [...mockEmployees];

export { mockEmployees };

/**
 * Lắng nghe thay đổi dữ liệu nhân sự (No-op sau khi gỡ db.js)
 */
export const subscribeEmployees = () => {
  return () => {};
};

/**
 * Lấy danh sách nhân viên có bộ lọc
 */
export async function list(params = {}) {
  let result = [...localEmployees];
  if (params.status && params.status !== "all") {
    result = result.filter((e) => e.status === params.status);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    result = result.filter(
      (e) => e.name?.toLowerCase().includes(q) || e.id?.toLowerCase().includes(q) || e.phone?.includes(q)
    );
  }
  return result;
}
export const getEmployees = list;

/**
 * Lấy chi tiết nhân viên theo ID
 */
export async function getById(id) {
  const emp = localEmployees.find((e) => e.id === id);
  return emp || mockGetEmployeeById(id) || null;
}
export const getEmployeeById = getById;

/**
 * Tạo mới nhân viên và cấp tài khoản ban đầu
 */
export async function create(data) {
  // BACKEND: Thêm nhân viên vào DB bảng employees, phân vai trò bảng employee_roles, tạo mã NV tự động (NV00x), tạo tài khoản bảng users, gửi mật khẩu tạm
  const roles = Array.isArray(data.roles) && data.roles.length > 0
    ? data.roles
    : [data.roleTag || data.role || "Phục vụ"];
  const newEmp = {
    id: `NV${String(localEmployees.length + 1).padStart(3, "0")}`,
    name: data.name,
    email: data.email || (data.account ? data.account.email : ""),
    phone: data.phone || "",
    roles,
    role: roles[0],
    roleTag: roles[0],
    status: data.status || "Đang làm việc",
    joinDate: data.joinDate || new Date().toISOString().slice(0, 10),
    contractType: data.contractType || data.contract || "Toàn thời gian",
    contract: data.contract || data.contractType || "Toàn thời gian",
    hourlyRate: Number(data.hourlyRate || data.hourlyWage) || 25000,
    hourlyWage: Number(data.hourlyWage || data.hourlyRate) || 25000,
    avatar: data.avatar || "",
    account: data.account || null,
  };

  if (data.account) {
    try {
      createUserAccount({
        email: data.account.email,
        password: data.account.password,
        name: data.name,
        roles,
        employeeId: newEmp.id,
        mustChangePassword: true,
      });
    } catch {
      /* ignore */
    }
  }

  localEmployees = [newEmp, ...localEmployees];
  return newEmp;
}
export const createEmployee = create;

/**
 * Cập nhật thông tin nhân viên
 */
export async function update(id, data) {
  // BACKEND: Cập nhật thông tin nhân viên vào bảng employees, cập nhật vai trò vào employee_roles
  localEmployees = localEmployees.map((e) => {
    if (e.id === id) {
      const roles = Array.isArray(data.roles) && data.roles.length > 0
        ? data.roles
        : (data.roles ? [data.roles] : e.roles || [e.role || "Phục vụ"]);
      return {
        ...e,
        ...data,
        roles,
        role: roles[0],
        roleTag: roles[0],
      };
    }
    return e;
  });

  if (data.account) {
    try {
      createUserAccount({
        email: data.account.email,
        password: data.account.password,
        name: data.name || localEmployees.find((e) => e.id === id)?.name,
        roles: data.roles || ["Phục vụ"],
        employeeId: id,
        mustChangePassword: true,
      });
    } catch {
      /* ignore */
    }
  }

  return localEmployees.find((e) => e.id === id) || { id, ...data };
}
export const updateEmployee = update;

/**
 * Cập nhật trạng thái nhân viên ("Đang làm việc", "Nghỉ phép", "Nghỉ việc")
 */
export async function setStatus(id, status) {
  // BACKEND: Cập nhật trạng thái nhân viên (active/on_leave/resigned), nếu Nghỉ việc thì vô hiệu hóa tài khoản và gỡ khỏi lịch tương lai
  localEmployees = localEmployees.map((e) => (e.id === id ? { ...e, status } : e));
  return { id, status };
}
export const setEmployeeStatus = setStatus;

/**
 * Đặt lại mật khẩu nhân viên (US02)
 */
export async function resetPassword(id, newPassword) {
  // BACKEND: Đặt lại mật khẩu tạm thời ngẫu nhiên cho nhân viên (US02): Băm mật khẩu bằng bcrypt, lưu vào bảng users, gắn cờ must_change_password = true, thu hồi token cũ, gửi email thông báo
  const emp = localEmployees.find((e) => e.id === id);
  if (emp) {
    emp.account = {
      ...(emp.account || {}),
      email: emp.account?.email || emp.email,
      password: newPassword,
      status: "active",
      mustChangePassword: true,
    };
  }
  try {
    resetUserPassword(emp?.account?.email || emp?.email || id, newPassword);
  } catch {
    /* ignore if user not in mockUsers */
  }
  return { success: true, message: "Đặt lại mật khẩu thành công", id, newPassword };
}

/**
 * Khóa / Mở khóa tài khoản nhân viên
 */
export async function terminateEmployee(id) {
  // BACKEND: Cho nhân viên thôi việc (US06): Cập nhật employees.status = 'Nghỉ việc', khóa tài khoản users.status = 'inactive', thu hồi token; tự động gỡ nhân viên khỏi các ca chính thức tương lai trong schedules (chuyển sang Chưa có người / unfilled), gửi thông báo cho Manager: "[Tên NV] đã nghỉ việc. Cần phân công lại N ca tương lai."
  const emp = localEmployees.find((e) => e.id === id);
  if (!emp) throw new Error("Không tìm thấy nhân viên.");

  const freedShifts = freeFutureShiftsForEmployee(id);

  localEmployees = localEmployees.map((e) =>
    e.id === id
      ? {
          ...e,
          status: "Nghỉ việc",
          account: e.account ? { ...e.account, status: "locked" } : null,
        }
      : e
  );

  const shiftCount = freedShifts.length;
  const content =
    shiftCount > 0
      ? `${emp.name} đã nghỉ việc. Cần phân công lại ${shiftCount} ca tương lai.`
      : `${emp.name} đã nghỉ việc.`;

  await createNotification({
    title: "Nhân viên nghỉ việc",
    content,
    type: "employee",
    link: "/manager/schedule",
    recipientRole: "manager",
  });

  return { success: true, freedShifts };
}

export async function reactivateEmployee(id) {
  // BACKEND: Kích hoạt lại nhân viên (US06): Cập nhật employees.status = 'Đang làm việc', users.status = 'active'; KHÔNG tự gán lại các ca cũ
  localEmployees = localEmployees.map((e) =>
    e.id === id
      ? {
          ...e,
          status: "Đang làm việc",
          account: e.account ? { ...e.account, status: "active" } : null,
        }
      : e
  );
  return { success: true };
}

/**
 * Thống kê số lượng nhân viên toàn hệ thống: { total, active, onLeave, resigned }
 */
export async function getEmployeeCounts() {
  const total = localEmployees.length;
  const active = localEmployees.filter((e) => e.status === "Đang làm việc").length;
  const onLeave = localEmployees.filter((e) => e.status === "Nghỉ phép").length;
  const resigned = localEmployees.filter((e) => e.status === "Nghỉ việc").length;
  return { total, active, onLeave, resigned };
}

/**
 * Lấy hồ sơ cá nhân của nhân viên đang đăng nhập
 */
export async function getMyProfile(userOrParams) {
  return getMockMyProfile(userOrParams) || localEmployees[0];
}

/**
 * Cập nhật hồ sơ cá nhân
 */
export async function updateMyProfile(data, user) {
  // BACKEND: Cập nhật thông tin hồ sơ cá nhân của nhân viên vào DB (chỉ các trường cho phép như số điện thoại, ảnh đại diện, địa chỉ)
  const id = user?.employeeId || user?.id || localEmployees[0]?.id;
  localEmployees = localEmployees.map((e) => (e.id === id ? { ...e, ...data } : e));
  return { id, ...data };
}

export default {
  list,
  getEmployees,
  getById,
  getEmployeeById,
  create,
  createEmployee,
  update,
  updateEmployee,
  setStatus,
  setEmployeeStatus,
  terminateEmployee,
  reactivateEmployee,
  resetPassword,
  getEmployeeCounts,
  getMyProfile,
  updateMyProfile,
  subscribeEmployees,
};
