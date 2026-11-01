// =============================================================================
// File: tests/mock-only/test_phase_c1_flow1.js
// Tầng: Kiểm thử Tích Hợp Luồng 1 (Phase C1 - Flow 1 Availability & Realtime Sync)
// Mục tiêu:
// 1. Chuyển vai asStaff / asManager trên cùng kho mock SSOT.
// 2. Chặn truy cập trái quyền (FORBIDDEN).
// 3. Chặn nộp quá hạn chót hoặc sai trạng thái (DEADLINE_EXCEEDED / INVALID_STATE).
// 4. Chống ghi đè đồng thời bằng Optimistic Locking (CONFLICT khi lệch version).
// 5. Staff nộp lịch rảnh -> Manager thấy ngay số đếm và nội dung ma trận.
// 6. Tự động sinh thông báo gửi cho đúng Manager.
// 7. Mô phỏng đồng bộ tức thì đa tab (Tab 1 gửi -> Tab 2 cập nhật tự động).
// =============================================================================

import test from "node:test";
import assert from "node:assert/strict";

// Giả lập storage đa tab
const memoryStore = new Map();
const storageListeners = new Set();
globalThis.localStorage = {
  getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
  setItem: (key, value) => {
    memoryStore.set(key, String(value));
    storageListeners.forEach((fn) => fn({ key, newValue: String(value) }));
  },
  removeItem: (key) => {
    memoryStore.delete(key);
    storageListeners.forEach((fn) => fn({ key, newValue: null }));
  },
  clear: () => {
    memoryStore.clear();
    storageListeners.forEach((fn) => fn({ key: null, newValue: null }));
  },
};

const memorySessionStore = new Map();
globalThis.sessionStorage = {
  getItem: (key) => (memorySessionStore.has(key) ? memorySessionStore.get(key) : null),
  setItem: (key, value) => memorySessionStore.set(key, String(value)),
  removeItem: (key) => memorySessionStore.delete(key),
  clear: () => memorySessionStore.clear(),
};

import { initDb, getNow, startOfDay, mondayOf, addDays, toISO, loadDb } from "../../src/mocks/db.js";
import { login, getCurrentUser } from "../../src/services/authService.js";
import {
  getMyAvailability,
  saveMyAvailability,
  getWeeklyStaffAvailability,
  subscribeAvailability,
} from "../../src/services/availabilityService.js";
import { getNotifications, markAsRead } from "../../src/services/notificationService.js";
import { ERROR_CODES } from "../../src/services/adapters/errors.js";

// Khởi tạo DB sạch
initDb(getNow());

// Helpers chuyển vai kiểm thử
async function asStaff(email = "nguyenvanan@gmail.com") {
  // Tìm tài khoản staff mẫu
  const db = loadDb();
  const user = db.users.find((u) => u.email === email && u.role === "staff") || db.users.find((u) => u.role === "staff");
  assert.ok(user, `Không tìm thấy tài khoản staff với email: ${email}`);
  const res = await login(user.email, user.password);
  return res.user;
}

async function asManager() {
  const db = loadDb();
  const managerUser = db.users.find((u) => u.role === "manager");
  assert.ok(managerUser, "Không tìm thấy tài khoản manager");
  const res = await login(managerUser.email, managerUser.password);
  return res.user;
}

test("C1.4 - 1: Chuyển vai asStaff / asManager trên cùng một kho mock SSOT", async () => {
  const staff = await asStaff("nguyenvanan@gmail.com");
  assert.equal(staff.role, "staff");
  assert.equal(staff.employeeId, "NV001");
  assert.equal(getCurrentUser()?.id, staff.id);

  const manager = await asManager();
  assert.equal(manager.role, "manager");
  assert.equal(getCurrentUser()?.id, manager.id);
});

test("C1.4 - 2: Chặn sai quyền (FORBIDDEN) - Staff không được truy cập hoặc sửa lịch rảnh người khác", async () => {
  await asStaff("nguyenvanan@gmail.com"); // NV001

  // Staff NV001 cố đọc lịch của NV002
  await assert.rejects(
    async () => {
      await getMyAvailability({ employeeId: "NV002" });
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.FORBIDDEN);
      return true;
    }
  );

  // Staff NV001 cố ghi lịch cho NV002
  const nextMonday = toISO(addDays(mondayOf(startOfDay(getNow())), 7));
  await assert.rejects(
    async () => {
      await saveMyAvailability({
        employeeId: "NV002",
        weekMonday: nextMonday,
        slots: { "0_Sáng": "available" },
      });
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.FORBIDDEN);
      return true;
    }
  );
});

test("C1.4 - 3: Chặn nộp quá hạn chót đăng ký (DEADLINE_EXCEEDED)", async () => {
  await asStaff("nguyenvanan@gmail.com");
  // Tuần quá khứ (đã quá hạn chót Thứ Sáu tuần trước)
  const pastMonday = toISO(addDays(mondayOf(startOfDay(getNow())), -14));

  await assert.rejects(
    async () => {
      await saveMyAvailability({
        weekMonday: pastMonday,
        slots: { "0_Sáng": "available" },
      });
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.DEADLINE_EXCEEDED);
      return true;
    }
  );
});

test("C1.4 - 4: Chống ghi đè đồng thời (Optimistic Locking CONFLICT) khi version bị lệch", async () => {
  await asStaff("nguyenvanan@gmail.com");
  const nextMonday = toISO(addDays(mondayOf(startOfDay(getNow())), 7));

  // Lần 1: Lấy bản ghi hiện tại
  const current = await getMyAvailability({ weekMonday: nextMonday });
  const currentVersion = current.version || 1;

  // Lần 2: Một phiên khác lưu thành công -> version tăng lên
  await saveMyAvailability({
    weekMonday: nextMonday,
    slots: { "0_Sáng": "available", "0_Chiều": "busy" },
    expectedVersion: currentVersion,
  });

  // Lần 3: Phiên cũ nộp lại với version cũ -> Bị từ chối với CONFLICT
  await assert.rejects(
    async () => {
      await saveMyAvailability({
        weekMonday: nextMonday,
        slots: { "0_Sáng": "busy", "0_Chiều": "available" },
        expectedVersion: currentVersion, // Version cũ đã lỗi thời!
      });
    },
    (err) => {
      assert.equal(err.code, ERROR_CODES.CONFLICT);
      return true;
    }
  );
});

test("C1.4 - 5: Staff nộp lịch rảnh -> Manager thấy ngay số đếm và nội dung ma trận", async () => {
  const nextMonday = toISO(addDays(mondayOf(startOfDay(getNow())), 7));

  // Kiểm tra trước: Manager xem tình trạng tuần tới, NV004 chưa nộp
  await asManager();
  const prepBefore = getWeeklyStaffAvailability(nextMonday);
  const registeredBefore = prepBefore.summary.registeredCount;
  const unregisteredBefore = prepBefore.summary.unregisteredCount;
  const nv004Before = prepBefore.employees.find((e) => e.id === "NV004");
  assert.equal(nv004Before?.registered, false, "Ban đầu NV004 chưa đăng ký tuần tới");

  // Staff NV004 đăng nhập và nộp lịch rảnh
  const db = loadDb();
  const emp = (db.employees || []).find((e) => e.id === "NV004");
  const nv004User = (db.users || []).find((u) => u.id === emp?.userId || u.email === "phamthidung@gmail.com");
  assert.ok(nv004User, "Phải tìm thấy user cho NV004");
  await login(nv004User.email, nv004User.password);

  const mySlots = {
    "0_Sáng": "available",
    "0_Chiều": "available",
    "0_Tối": "busy",
    "1_Sáng": "available",
    "1_Chiều": "busy",
    "1_Tối": "busy",
  };
  const submitRes = await saveMyAvailability({
    weekMonday: nextMonday,
    slots: mySlots,
  });
  assert.ok(submitRes.ok, "Nộp lịch rảnh thành công");

  // Manager kiểm tra lại: số đếm tăng ngay lập tức, NV004 đã đăng ký và ma trận khớp
  await asManager();
  const prepAfter = getWeeklyStaffAvailability(nextMonday);
  assert.equal(
    prepAfter.summary.registeredCount,
    registeredBefore + 1,
    "registeredCount phải tăng thêm 1"
  );
  assert.equal(
    prepAfter.summary.unregisteredCount,
    unregisteredBefore - 1,
    "unregisteredCount phải giảm đi 1"
  );

  const nv004After = prepAfter.employees.find((e) => e.id === "NV004");
  assert.equal(nv004After?.registered, true, "NV004 nay đã có trạng thái registered = true");
  assert.equal(nv004After?.slots["0_Sáng"], "available");
  assert.equal(nv004After?.slots["0_Tối"], "busy");
});

test("C1.4 - 6: Tự động tạo thông báo gửi đúng người nhận (Manager nhận thông báo khi Staff nộp đơn)", async () => {
  const nextMonday = toISO(addDays(mondayOf(startOfDay(getNow())), 7));

  // Đăng nhập Staff NV001 và gửi lịch
  await asStaff("nguyenvanan@gmail.com");
  await saveMyAvailability({
    weekMonday: nextMonday,
    slots: { "0_Sáng": "available" },
  });

  // Chuyển sang Manager và đọc hộp thông báo
  await asManager();
  const notifs = await getNotifications();
  assert.ok(Array.isArray(notifs), "Thông báo phải là mảng");

  const latestNotif = notifs.find(
    (n) => n.type === "availability_submitted" && n.title?.includes("Đăng ký lịch rảnh")
  );
  assert.ok(latestNotif, "Manager phải nhận được thông báo nộp lịch rảnh từ nhân viên");
  assert.equal(latestNotif.read, false, "Thông báo ban đầu chưa đọc");

  // Đánh dấu đã đọc
  const updated = await markAsRead(latestNotif.id);
  assert.equal(updated.read, true, "Thông báo đã được đánh dấu là đọc");
});

test("C1.4 - 7: Mô phỏng đồng bộ tức thì 2 tab qua storage event / pub-sub", async () => {
  const nextMonday = toISO(addDays(mondayOf(startOfDay(getNow())), 7));

  // Giả lập Tab 2 (Manager) đăng ký lắng nghe cập nhật qua subscribeAvailability
  let tab2UpdateCount = 0;
  let tab2LatestData = null;

  const unsub = subscribeAvailability(() => {
    tab2UpdateCount++;
    tab2LatestData = getWeeklyStaffAvailability(nextMonday);
  });

  // Giả lập Tab 1 (Staff) đăng nhập và lưu lịch
  await asStaff("nguyenvanan@gmail.com");
  await saveMyAvailability({
    weekMonday: nextMonday,
    slots: { "2_Sáng": "available", "2_Chiều": "available" },
  });

  // Kiểm tra Tab 2 đã tự động nhận callback và đọc dữ liệu mới mà không cần reload
  assert.ok(tab2UpdateCount > 0, "Tab 2 phải nhận được tín hiệu đồng bộ");
  assert.ok(tab2LatestData, "Tab 2 đã đọc được dữ liệu mới");
  assert.ok(tab2LatestData.summary.registeredCount > 0);

  unsub();
});
