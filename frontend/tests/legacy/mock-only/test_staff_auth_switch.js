// =============================================================================
// File: tests/test_staff_auth_switch.js
// Mục đích: Kiểm thử đăng nhập nhân viên thật, bảo mật tài khoản và chuyển vai (VIỆC A)
// =============================================================================
import test from "node:test";
import assert from "node:assert/strict";
import { mockLogin } from "../../src/mocks/authMock.js";
import { addEmployee } from "../../src/mocks/db.js";

test("VIỆC A - Đăng nhập tài khoản Staff gắn nhân viên thật", () => {
  // 1. Đăng nhập NV001
  const loginAn = mockLogin("nguyenvanan@gmail.com", "123456");
  assert.equal(loginAn.user.employeeId, "NV001");
  assert.equal(loginAn.user.name, "Nguyễn Văn An");
  assert.equal(loginAn.user.role, "staff");

  // 2. Đăng nhập NV002
  const loginBich = mockLogin("tranthibich@gmail.com", "123456");
  assert.equal(loginBich.user.employeeId, "NV002");
  assert.equal(loginBich.user.name, "Trần Thị Bích");

  // 3. Đăng nhập NV003
  const loginCuong = mockLogin("leminhcuong@gmail.com", "123456");
  assert.equal(loginCuong.user.employeeId, "NV003");
  assert.equal(loginCuong.user.name, "Lê Minh Cường");

  // 4. Sai mật khẩu -> ném lỗi
  assert.throws(
    () => mockLogin("nguyenvanan@gmail.com", "sai_mat_khau"),
    /(?:Tài khoản|Email) hoặc mật khẩu không đúng/
  );

  // 5. Nhân viên Nghỉ việc -> bị chặn
  assert.throws(
    () => mockLogin("dokimngan@gmail.com", "123456"),
    /Tài khoản không còn hoạt động/
  );

  // 6. Quản lý đăng nhập
  const loginMgr = mockLogin("quanly@smartscheduling.vn", "12345678");
  assert.equal(loginMgr.user.role, "manager");

  // 7. Dang nhap bang ma NV001 hoac QL001 bi chan (Bat buoc dung Email)
  assert.throws(() => mockLogin("NV001", "12345678"), /(?:Tài khoản|Email) hoặc mật khẩu không đúng/);
  assert.throws(() => mockLogin("QL001", "12345678"), /(?:Tài khoản|Email) hoặc mật khẩu không đúng/);
});

test("VIỆC A - Nhân viên mới tạo bên Manager đăng nhập được ngay", () => {
  const newEmp = addEmployee({
    name: "Trần Minh Quân",
    phone: "0909999888",
    role: "Pha chế",
    hourlyWage: 32000,
    email: "tranminhquan@gmail.com",
    password: "123456",
  });

  assert.ok(newEmp.id.startsWith("NV"), "Phải sinh mã nhân viên");

  const loginNew = mockLogin("tranminhquan@gmail.com", "123456");
  assert.equal(loginNew.user.employeeId, newEmp.id);
  assert.equal(loginNew.user.name, "Trần Minh Quân");
  assert.equal(loginNew.user.role, "staff");
});

test("VIỆC B - Staff US13: Gọi dữ liệu lịch nhân viên khác thì bị từ chối ('Không đủ quyền')", async () => {
  const { getMySchedule } = await import("../../src/services/scheduleService.js");
  await assert.rejects(
    async () => {
      await getMySchedule({
        week_start: "2026-10-26",
        employeeId: "NV002",
        currentUserId: "NV001", // NV001 cố đọc lịch của NV002
      });
    },
    /Không đủ quyền truy cập lịch của nhân viên khác/
  );

  // Quản lý hoặc chính nhân viên đọc lịch của mình thì thành công
  const mySched = await getMySchedule({
    week_start: "2026-10-26",
    employeeId: "NV001",
    currentUserId: "NV001",
  });
  assert.ok(mySched.shifts.length > 0, "Chính nhân viên phải đọc được lịch của mình");
});
