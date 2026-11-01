/* global process */
/**
 * Tầng: Kiểm thử tự động (Unit Test)
 * Chức năng: Kiểm tra cơ chế phiên bản dữ liệu mẫu (SEED_VERSION) và tự động nạp lại khi đổi tuần
 * Liên quan: US25 (Đối soát chấm công), US27 (Bảng lương), US28 (Dashboard)
 */

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

import {
  SEED_VERSION,
  initDb,
  loadDb,
  getNow,
  setDemoNow,
  clearDemoNow,
  DB_STORAGE_KEY,
} from "../../src/mocks/db.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log("=== BẮT ĐẦU KIỂM THỬ: SEED_VERSION & CƠ CHẾ NẠP DỮ LIỆU TUẦN MỚI ===\n");

// -----------------------------------------------------------------------------
// PHẦN 1: SEED_VERSION = 3 ĐƯỢC LƯU TRONG DB VÀ NHẬN DIỆN KHI KHỞI TẠO
// -----------------------------------------------------------------------------
console.log("--- 1. KIỂM THỬ SEED_VERSION VÀ SEED_WEEK_MONDAY ---");
setDemoNow("2026-10-21T10:00:00"); // Thứ 4, tuần 19/10/2026
initDb(getNow());

{
  const db = loadDb();
  assert(SEED_VERSION === 3, "Hằng số SEED_VERSION xuất khẩu bằng 3");
  assert(db.seedVersion === 3, "db.seedVersion được lưu trong state bằng 3");
  assert(db.seedWeekMonday === "2026-10-19", "db.seedWeekMonday lưu đúng ngày Thứ 2 của tuần hiện tại: 2026-10-19");
}

// -----------------------------------------------------------------------------
// PHẦN 2: TỰ ĐỘNG RE-SEED KHI SEED_VERSION KHÁC NHAU
// -----------------------------------------------------------------------------
console.log("\n--- 2. KIỂM THỬ TỰ ĐỘNG RE-SEED KHI VERSION CŨ ---");
{
  // Giả lập dữ liệu cũ từ phiên bản trước (seedVersion = 2 hoặc không có)
  const raw = JSON.parse(store.get(DB_STORAGE_KEY));
  raw.seedVersion = 2;
  raw.customTestField = "old_data_marker";
  store.set(DB_STORAGE_KEY, JSON.stringify(raw));

  // Khi loadDb() phát hiện phiên bản cũ, phải tự động chạy initDb(getNow())
  const reloaded = loadDb();
  assert(reloaded.seedVersion === 3, "loadDb tự động nâng cấp dữ liệu lên seedVersion = 3");
  assert(reloaded.customTestField === undefined, "Dữ liệu cũ được nạp lại sạch sẽ theo phiên bản mới");
}

// -----------------------------------------------------------------------------
// PHẦN 3: GIỮ NGUYÊN PHIÊN ĐĂNG NHẬP (USER, TOKEN) KHI RE-SEED
// -----------------------------------------------------------------------------
console.log("\n--- 3. KIỂM THỬ BẢO TOÀN PHIÊN ĐĂNG NHẬP (USER, TOKEN) ---");
{
  store.set("user", JSON.stringify({ id: "QL001", name: "Nguyễn Văn Quản Lý", role: "Manager" }));
  store.set("token", "fake-jwt-token-xyz");

  // Giả lập phiên bản cũ buộc re-seed
  const raw = JSON.parse(store.get(DB_STORAGE_KEY));
  raw.seedVersion = 1;
  store.set(DB_STORAGE_KEY, JSON.stringify(raw));

  loadDb();

  assert(localStorage.getItem("token") === "fake-jwt-token-xyz", "Token đăng nhập được giữ nguyên khi re-seed");
  const user = JSON.parse(localStorage.getItem("user"));
  assert(user?.id === "QL001" && user?.role === "Manager", "Thông tin user đăng nhập được giữ nguyên");
}

// -----------------------------------------------------------------------------
// PHẦN 4: TỰ ĐỘNG NẠP LẠI DỮ LIỆU KHI ĐỔI SANG TUẦN MỚI
// -----------------------------------------------------------------------------
console.log("\n--- 4. KIỂM THỬ TỰ ĐỘNG NẠP LẠI KHI SANG TUẦN MỚI (WEEK CHANGE) ---");
{
  // Đang ở tuần 19/10/2026 - 25/10/2026
  assert(loadDb().seedWeekMonday === "2026-10-19", "Đang ở tuần 2026-10-19");

  // Đổi demo sang tuần sau: Thứ 3 ngày 27/10/2026 (tuần bắt đầu từ 26/10/2026)
  setDemoNow("2026-10-27T09:00:00");
  const newDb = loadDb();

  assert(newDb.seedWeekMonday === "2026-10-26", "Sau khi setDemoNow sang tuần mới, seedWeekMonday tự cập nhật sang 2026-10-26");

  // Kiểm tra đơn mẫu đổi ca / nghỉ phép tự động sinh theo tuần mới
  const exShifts = newDb.shiftExchanges;
  const leaveReqs = newDb.leaveRequests;
  assert(exShifts.length > 0, "Dữ liệu đổi ca được sinh cho tuần mới");
  assert(leaveReqs.length > 0, "Dữ liệu nghỉ phép được sinh cho tuần mới");

  // Dọn dẹp
  clearDemoNow();
}

console.log(`\n=== TỔNG KẾT: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
