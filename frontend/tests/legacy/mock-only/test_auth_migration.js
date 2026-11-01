// =============================================================================
// File: tests/mock-only/test_auth_migration.js
// Tầng: Kiểm thử Mock-Only (Mock-Dependent Test)
// Mục tiêu: Kiểm tra cơ chế di chuyển dữ liệu (DATA_VERSION migration)
// từ cấu trúc localStorage cũ lên phiên bản tách biệt users và employees.
// =============================================================================

import test from "node:test";
import assert from "node:assert/strict";

const memoryStore = new Map();
globalThis.localStorage = {
  getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
  setItem: (key, value) => memoryStore.set(key, String(value)),
  removeItem: (key) => memoryStore.delete(key),
  clear: () => memoryStore.clear(),
};

import { loadDb, getNow, resetDbCache, mondayOf, startOfDay, toISO, DATA_VERSION } from "../../src/mocks/db.js";
import { login } from "../../src/services/authService.js";
import { list } from "../../src/services/employeeService.js";

test("MOCK MIGRATION: Nâng cấp dữ liệu localStorage cũ (seed cũ không có users, pass 6 số)", async () => {
  const currentMonday = toISO(mondayOf(startOfDay(getNow())));
  // Giả lập localStorage của người dùng thật từng chạy app trước Phase A
  const legacySeedData = {
    seedVersion: 3,
    // Chưa có dataVersion (hoặc dataVersion < 4)
    seedWeekMonday: currentMonday,
    // Chưa có mảng users
    employees: [
      {
        id: "QL001",
        name: "Hoàng Lan",
        role: "Quản lý",
        roleTag: "Manager",
        email: "quanly@nexusshift.vn",
        account: {
          email: "quanly@nexusshift.vn",
          password: "123456", // Mật khẩu 6 số cũ
          role: "manager",
          status: "active",
        },
      },
      {
        id: "NV001",
        name: "Nguyễn Văn An",
        role: "Pha chế",
        roleTag: "Barista",
        email: "nguyenvanan@gmail.com",
        account: {
          email: "nguyenvanan@gmail.com",
          password: "123456", // Mật khẩu 6 số cũ
          role: "staff",
          status: "active",
        },
      },
      {
        id: "NV_CUSTOM_01",
        name: "Nhân viên cũ do Quản lý thêm tay",
        role: "Phục vụ",
        roleTag: "Waiter",
        email: "nhanviencu@gmail.com",
        account: {
          email: "nhanviencu@gmail.com",
          password: "123456",
          role: "staff",
          status: "active",
        },
      },
    ],
    shiftConfig: { templates: [], shifts: [], constraints: [] },
    schedules: {},
    attendance: [],
    availabilities: {},
    shiftExchanges: [],
    leaveRequests: [],
    openShifts: [],
    notifications: [],
  };

  // Ghi đè vào localStorage giả lập
  globalThis.localStorage.setItem("SMART_SCHEDULING_DB_V1", JSON.stringify(legacySeedData));

  // Reset bộ nhớ cache trong module để ép loadDb đọc lại từ localStorage
  resetDbCache();

  // Tải lại DB -> kích hoạt runDataMigration
  const migratedDb = loadDb();

  // Kiểm tra migration thành công
  assert.equal(migratedDb.dataVersion, DATA_VERSION, `dataVersion phải được nâng cấp lên ${DATA_VERSION}`);
  assert.ok(Array.isArray(migratedDb.users), "Bảng users phải được tạo");

  // Manager phải có trong users, nhưng không có trong employees
  const managerUser = migratedDb.users.find(
    (u) => u.email === "quanly@smartscheduling.vn" || u.role === "manager"
  );
  assert.ok(managerUser, "Phải có Manager trong users");
  assert.equal(managerUser.password, "12345678", "Mật khẩu Manager phải nâng cấp lên 12345678");

  const managerInEmployees = migratedDb.employees.find(
    (e) => e.id === "QL001" || e.role === "Quản lý"
  );
  assert.equal(managerInEmployees, undefined, "Manager không được tồn tại trong danh sách employees");

  // Nhân viên do Quản lý tạo trước đó phải được bảo toàn
  const customEmp = migratedDb.employees.find((e) => e.id === "NV_CUSTOM_01");
  assert.ok(customEmp, "Nhân viên tự tạo NV_CUSTOM_01 không bị mất");
  assert.equal(customEmp.email, "nhanviencu@gmail.com");

  // Đăng nhập thử với Manager mật khẩu mới
  const mgrLogin = await login("quanly@smartscheduling.vn", "12345678");
  assert.equal(mgrLogin.user.role, "manager");

  // Đăng nhập thử với Staff mật khẩu mới
  const staffLogin = await login("nguyenvanan@gmail.com", "12345678");
  assert.equal(staffLogin.user.role, "staff");

  // Đăng nhập thử với nhân viên cũ tự tạo
  const customLogin = await login("nhanviencu@gmail.com", "12345678");
  assert.equal(customLogin.user.role, "staff");

  // Danh sách nhân viên không chứa Manager
  const empList = await list();
  assert.ok(empList.every((e) => e.role !== "manager" && e.role !== "Quản lý" && e.id !== "QL001"));
});

test("PHASE A - 4: Nhân viên mới tạo vẫn tồn tại sau khi nạp lại trang (reload DB)", async () => {
  const { create } = await import("../../src/services/employeeService.js");
  const newStaff = await create({
    name: "Phan Văn Trì",
    email: "phanvantri@gmail.com",
    password: "Password999",
    phone: "0911223344",
    role: "Phục vụ",
    roleTag: "Server",
    hourlyWage: 28000,
  });

  assert.ok(newStaff.id);
  assert.equal(newStaff.email, "phanvantri@gmail.com");

  // Giả lập nạp lại DB (reload trang)
  resetDbCache();
  const reloadedDb = loadDb();
  const foundUser = reloadedDb.users.find((u) => u.email === "phanvantri@gmail.com");
  const foundEmp = reloadedDb.employees.find((e) => e.email === "phanvantri@gmail.com");

  assert.ok(foundUser, "User mới tạo phải lưu vĩnh viễn trong localStorage users");
  assert.ok(foundEmp, "Employee mới tạo phải lưu vĩnh viễn trong localStorage employees");

  // Đăng nhập thành công sau khi reload trang
  const authRes = await login("phanvantri@gmail.com", "Password999");
  assert.equal(authRes.user.role, "staff");
  assert.equal(authRes.user.email, "phanvantri@gmail.com");
});
