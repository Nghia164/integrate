// =============================================================================
// File: tests/contract/test_auth_contract.js
// Tầng: Kiểm thử Hợp Đồng API (API Contract Test - Tái sử dụng được với HTTP Backend)
// Mục tiêu: Kiểm tra toàn bộ kiến trúc 3 lớp, authService, employeeService,
// quy tắc Single Source of Truth và bảo mật mật khẩu không lộ ra UI.
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

const memorySessionStore = new Map();
globalThis.sessionStorage = {
  getItem: (key) => (memorySessionStore.has(key) ? memorySessionStore.get(key) : null),
  setItem: (key, value) => memorySessionStore.set(key, String(value)),
  removeItem: (key) => memorySessionStore.delete(key),
  clear: () => memorySessionStore.clear(),
};

import { initDb, getNow } from "../../src/mocks/db.js";
import { activeAdapter, mockAdapter, httpAdapter } from "../../src/services/adapters/index.js";
import { login, logout, getSession } from "../../src/services/authService.js";
import {
  list,
  getById,
  create,
  update,
  resetPassword,
} from "../../src/services/employeeService.js";
import { ERROR_CODES } from "../../src/services/adapters/errors.js";
import { getDestinationPath, isRouteAllowedForRole } from "../../src/pages/login/routeGuards.js";

// Khởi tạo DB sạch
initDb(getNow());

test("CONTRACT 1: Manager đăng nhập với tài khoản chính thức quanly@smartscheduling.vn / 12345678", async () => {
  const res = await login("quanly@smartscheduling.vn", "12345678");
  assert.equal(res.user.role, "manager");
  assert.equal(res.user.email, "quanly@smartscheduling.vn");
  assert.equal(res.user.id, "QL001");
  assert.ok(res.token);

  // Điều hướng đúng Tổng quan Manager
  const target = getDestinationPath(res.user, null);
  assert.equal(target, "/manager/dashboard");

  // Kiểm tra phiên lưu vào localStorage
  const session = getSession();
  assert.equal(session?.user?.email, "quanly@smartscheduling.vn");
});

test("CONTRACT 2: Staff đăng nhập với nguyenvanan@gmail.com / 12345678", async () => {
  const res = await login("nguyenvanan@gmail.com", "12345678");
  assert.equal(res.user.role, "staff");
  assert.equal(res.user.email, "nguyenvanan@gmail.com");
  assert.equal(res.user.id, "NV001");
  assert.ok(res.token);

  // Điều hướng đúng Lịch của tôi
  const target = getDestinationPath(res.user, null);
  assert.equal(target, "/employees/schedule");
});

test("CONTRACT 3: Manager tạo nhân viên mới -> Nhân viên đăng nhập được ngay", async () => {
  const newStaffEmail = "nhanvienmoi@smartscheduling.vn";
  const newStaffPass = "MatKhauMoi2026";

  const created = await create({
    name: "Trần Văn Mới",
    email: newStaffEmail,
    password: newStaffPass,
    phone: "0909111222",
    role: "Pha chế",
    contract: "Bán thời gian",
    hourlyWage: 32000,
    status: "Đang làm việc",
  });

  assert.ok(created.id);
  assert.equal(created.name, "Trần Văn Mới");
  assert.equal(created.email, newStaffEmail);
  assert.equal(created.password, undefined, "Không trả trường password khi tạo");

  // Đăng xuất phiên hiện tại
  await logout();
  assert.equal(getSession(), null);

  // Nhân viên mới đăng nhập ngay
  const loginRes = await login(newStaffEmail, newStaffPass);
  assert.equal(loginRes.user.email, newStaffEmail);
  assert.equal(loginRes.user.role, "staff");
  assert.equal(getDestinationPath(loginRes.user, null), "/employees/schedule");
});

test("CONTRACT 4: Trùng email khi tạo bị chặn với mã lỗi EMAIL_EXISTS", async () => {
  await assert.rejects(
    async () => {
      await create({
        name: "Nhân viên trùng",
        email: "NGUYENVANAN@gmail.com", // Kiểm tra không phân biệt hoa/thường
        password: "Password8KyTu",
      });
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.EMAIL_EXISTS);
      assert.equal(err.status, 409);
      assert.ok(err.message.includes("Email đã được sử dụng"));
      return true;
    }
  );
});

test("CONTRACT 5: Đổi mật khẩu nhân viên và đăng nhập bằng mật khẩu mới", async () => {
  // Đổi mật khẩu cho NV002 (tranthibich@gmail.com)
  await update("NV002", {
    password: "NewPassword888",
  });

  // Mật khẩu cũ 12345678 bị từ chối
  await assert.rejects(
    async () => {
      await login("tranthibich@gmail.com", "12345678");
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.INVALID_CREDENTIALS);
      return true;
    }
  );

  // Mật khẩu mới đăng nhập thành công
  const res = await login("tranthibich@gmail.com", "NewPassword888");
  assert.equal(res.user.id, "NV002");
});

test("CONTRACT 6: Sửa nhân viên với mật khẩu để trống thì mật khẩu cũ vẫn dùng được", async () => {
  // Sửa thông tin NV003, để password rỗng
  await update("NV003", {
    name: "Lê Minh Cường (Đã Sửa)",
    password: "", // Để trống
  });

  // Mật khẩu cũ 12345678 vẫn hoạt động bình thường
  const res = await login("leminhcuong@gmail.com", "12345678");
  assert.equal(res.user.id, "NV003");
  assert.equal(res.user.name, "Lê Minh Cường (Đã Sửa)");
});

test("CONTRACT 7: Nhân viên Nghỉ việc bị chặn đăng nhập với mã ACCOUNT_DISABLED", async () => {
  // NV006 (dokimngan@gmail.com) có status = "Nghỉ việc"
  await assert.rejects(
    async () => {
      await login("dokimngan@gmail.com", "12345678");
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.ACCOUNT_DISABLED);
      assert.equal(err.status, 403);
      assert.ok(err.message.includes("không còn hoạt động"));
      return true;
    }
  );
});

test("CONTRACT 8: Nhân viên Nghỉ phép vẫn đăng nhập được bình thường", async () => {
  // NV004 (phamthidung@gmail.com) có status = "Nghỉ phép"
  const res = await login("phamthidung@gmail.com", "12345678");
  assert.equal(res.user.id, "NV004");
  assert.equal(res.user.status, "Nghỉ phép");
  assert.equal(res.user.role, "staff");
});

test("CONTRACT 9: Sai mật khẩu hoặc email không tồn tại bị từ chối với INVALID_CREDENTIALS", async () => {
  // Sai mật khẩu
  await assert.rejects(
    async () => {
      await login("quanly@smartscheduling.vn", "SaiPassRoi123");
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.INVALID_CREDENTIALS);
      assert.equal(err.status, 401);
      assert.ok(err.message.includes("Tài khoản hoặc mật khẩu không đúng"));
      return true;
    }
  );

  // Email không tồn tại
  await assert.rejects(
    async () => {
      await login("khongtontai@smartscheduling.vn", "MatKhau12345");
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.INVALID_CREDENTIALS);
      assert.equal(err.status, 401);
      return true;
    }
  );

  // Đăng nhập bằng mã nhân viên NV001 bị chặn (Bắt buộc dùng email)
  await assert.rejects(
    async () => {
      await login("NV001", "12345678");
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.INVALID_CREDENTIALS);
      assert.equal(err.status, 401);
      return true;
    }
  );

  // Đăng nhập bằng mã quản lý QL001 bị chặn (Bắt buộc dùng email)
  await assert.rejects(
    async () => {
      await login("QL001", "12345678");
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.INVALID_CREDENTIALS);
      assert.equal(err.status, 401);
      return true;
    }
  );
});

test("CONTRACT 10: Route guard bảo vệ phân quyền (Staff không vào được Manager)", () => {
  assert.equal(isRouteAllowedForRole("/manager/dashboard", "staff"), false);
  assert.equal(isRouteAllowedForRole("/manager/employees", "staff"), false);
  assert.equal(isRouteAllowedForRole("/employees/schedule", "staff"), true);

  // Staff cố truy cập /manager/employees -> chuyển hướng về home Staff
  const redirected = getDestinationPath(
    { role: "staff", id: "NV001" },
    { from: { pathname: "/manager/employees" } }
  );
  assert.equal(redirected, "/employees/schedule");
});

test("CONTRACT 11: Bảo mật tuyệt đối - Không bao giờ để lộ trường password ra ngoài", async () => {
  const employees = await list();
  employees.forEach((e) => {
    assert.equal(e.password, undefined, `Nhân viên ${e.id} không có trường password`);
    assert.equal(e.password_hash, undefined, `Nhân viên ${e.id} không có trường password_hash`);
    if (e.account) {
      assert.equal(e.account.password, undefined, `Account của ${e.id} không có trường password`);
    }
  });

  const single = await getById("NV001");
  assert.equal(single.password, undefined);
  assert.equal(single.account?.password, undefined);

  const loginRes = await login("quanly@smartscheduling.vn", "12345678");
  assert.equal(loginRes.user.password, undefined);
  assert.equal(loginRes.user.password_hash, undefined);
});

test("CONTRACT 12: Mật khẩu tối thiểu 8 ký tự khi tạo mới hoặc đặt lại", async () => {
  // Tạo với mật khẩu 7 ký tự -> Lỗi VALIDATION_ERROR
  await assert.rejects(
    async () => {
      await create({
        name: "Test Pass Ngắn",
        email: "passngan@gmail.com",
        password: "1234567", // 7 ký tự
      });
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.VALIDATION_ERROR);
      assert.equal(err.status, 422);
      assert.ok(err.message.includes("8 ký tự"));
      return true;
    }
  );

  // Reset mật khẩu < 8 ký tự -> Lỗi VALIDATION_ERROR
  await assert.rejects(
    async () => {
      await resetPassword("NV001", "short");
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.VALIDATION_ERROR);
      return true;
    }
  );
});

test("CONTRACT 13: Contract compatibility giữa mockAdapter và httpAdapter", () => {
  // Cả hai adapter phải định nghĩa đầy đủ cùng bộ phương thức
  const requiredMethods = [
    "authLogin",
    "authLogout",
    "authGetSession",
    "employeesList",
    "employeeGetById",
    "employeeCreate",
    "employeeUpdate",
    "employeeSetStatus",
    "employeeResetPassword",
  ];

  assert.ok(activeAdapter, "Phải có activeAdapter đang hoạt động");
  requiredMethods.forEach((method) => {
    assert.equal(
      typeof mockAdapter[method],
      "function",
      `mockAdapter thiếu phương thức ${method}`
    );
    assert.equal(
      typeof httpAdapter[method],
      "function",
      `httpAdapter thiếu phương thức ${method}`
    );
  });
});
