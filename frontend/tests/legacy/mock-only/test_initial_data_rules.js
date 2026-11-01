/* global process */
// =============================================================================
// File: tests/test_initial_data_rules.js
// Tầng: Kiểm thử tự động (Unit Test) - Quy tắc dữ liệu mẫu & Ràng buộc nghiệp vụ
// Liên quan: US11, US14, US15, US17, US17-19
// =============================================================================

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

import {
  initDb,
  loadDb,
  getSavedSchedules,
  getExchangeRequests,
  setDemoNow,
  clearDemoNow,
  getNow,
  WEEKLY_PATTERN,
} from "../../src/mocks/db.js";

import {
  buildInitialExchangeRequests,
  buildInitialLeaveRequests,
  buildInitialOpenShifts,
} from "../../src/mocks/initialData.js";

import { managerApproveExchange } from "../../src/mocks/shiftExchangeMock.js";

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

console.log("=== BẮT ĐẦU KIỂM THỬ: QUY TẮC DỮ LIỆU MẪU & RÀNG BUỘC NGHIỆP VỤ ===\n");

// -----------------------------------------------------------------------------
// PHẦN 1: KIỂM THỬ 3 ĐƠN ĐỔI CA MẪU (LOẠI A, LOẠI B, LOẠI C)
// -----------------------------------------------------------------------------
console.log("--- 1. KIỂM THỬ 3 ĐƠN ĐỔI CA MẪU ---");

// Thiết lập mốc demo cố định vào Thứ 4 (2026-10-21) để kiểm thử tương lai / quá khứ
setDemoNow("2026-10-21T08:00:00");
initDb(getNow());

// 1.1 Đơn Loại A (EX-2026-005): Cặp cùng Cashier, Đang làm việc, ngày tương lai trong tuần
{
  const requests = getExchangeRequests();
  const reqA = requests.find((r) => r.id === "EX-2026-005");
  assert(reqA !== undefined, "Tìm thấy đơn mẫu Loại A: EX-2026-005");
  assert(reqA?.status === "pending_manager", "Trạng thái đơn mẫu Loại A là pending_manager");

  // Quản lý phê duyệt thành công
  let approveSuccess = false;
  try {
    const res = managerApproveExchange("EX-2026-005", "Duyệt đơn Loại A mẫu");
    approveSuccess = res.status === "approved";
  } catch (err) {
    console.error("Lỗi duyệt Loại A:", err.message);
  }
  assert(approveSuccess, "Loại A: Duyệt thành công không bị ném lỗi");

  // Kiểm tra lịch tuần: đã hoán đổi ca chiều T6 cho NV005 và ca sáng T7 cho NV003
  const sched = getSavedSchedules();
  const t6Assigned = sched["afternoon_T6"]?.assigned?.map((e) => (typeof e === "string" ? e : e.id)) || [];
  const t7Assigned = sched["morning_T7"]?.assigned?.map((e) => (typeof e === "string" ? e : e.id)) || [];

  assert(t6Assigned.includes("NV005"), "Loại A: Lịch tuần chiều T6 đã đổi sang NV005");
  assert(t7Assigned.includes("NV003"), "Loại A: Lịch tuần sáng T7 đã đổi sang NV003");

  // Kiểm tra sổ cái chấm công (attendance): cập nhật bản ghi cho cả 2 nhân viên
  const db = loadDb();
  const attNV005 = db.attendance.find((a) => a.employeeId === "NV005" && a.shiftName === "Chiều" && a.iso === reqA.requesterShift.isoDate);
  const attNV003 = db.attendance.find((a) => a.employeeId === "NV003" && a.shiftName === "Sáng" && a.iso === reqA.targetShift.isoDate);
  assert(attNV005 !== undefined, "Loại A: Chấm công chiều T6 đã đổi sang NV005");
  assert(attNV003 !== undefined, "Loại A: Chấm công sáng T7 đã đổi sang NV003");
}

// 1.2 Đơn Loại B (EX-2026-006): NV002 (Barista) nhờ NV004 (Barista, đang 'Nghỉ phép')
{
  const requests = getExchangeRequests();
  const reqB = requests.find((r) => r.id === "EX-2026-006");
  assert(reqB !== undefined, "Tìm thấy đơn mẫu Loại B: EX-2026-006");

  let errorMsg = "";
  try {
    managerApproveExchange("EX-2026-006", "Duyệt đơn Loại B");
  } catch (err) {
    errorMsg = err.message;
  }

  assert(
    errorMsg.includes("không còn ở trạng thái \"Đang làm việc\" (hiện tại: Nghỉ phép)"),
    `Loại B: Bị từ chối với đúng thông báo nhân viên đang Nghỉ phép (thực tế: "${errorMsg}")`
  );
}

// 1.3 Đơn Loại C (EX-2026-001): Ngày nằm ngoài tuần áp dụng (tuần trước)
{
  const requests = getExchangeRequests();
  const reqC = requests.find((r) => r.id === "EX-2026-001");
  assert(reqC !== undefined, "Tìm thấy đơn mẫu Loại C: EX-2026-001");

  let errorMsg = "";
  try {
    managerApproveExchange("EX-2026-001", "Duyệt đơn Loại C");
  } catch (err) {
    errorMsg = err.message;
  }

  assert(
    errorMsg.includes("Ngày này không thuộc lịch đang áp dụng"),
    `Loại C: Bị từ chối với đúng thông báo ngoài tuần áp dụng (thực tế: "${errorMsg}")`
  );
}

// -----------------------------------------------------------------------------
// PHẦN 2: KIỂM THỬ KHỚP LỊCH THỰC TẾ (REQUIREMENT H)
// -----------------------------------------------------------------------------
console.log("\n--- 2. KIỂM THỬ KHỚP LỊCH THỰC TẾ (REQUIREMENT H) ---");

// 2.1 Mọi đơn xin nghỉ phép mẫu phải trỏ đúng ca nhân viên có trong lịch
{
  const leaves = buildInitialLeaveRequests(getNow());
  assert(leaves.length >= 6, `Đủ số lượng đơn xin nghỉ mẫu (hiện có: ${leaves.length})`);

  let allLeavesMatch = true;
  leaves.forEach((lv) => {
    // Với các đơn trong tuần hoặc tuần trước có dayId xác định
    const d = new Date(lv.isoDate);
    const di = (d.getDay() + 6) % 7;
    const expectedShift = WEEKLY_PATTERN[lv.employeeId]?.[di];
    // Ca trong đơn (Sáng / Chiều / Tối)
    const leaveShiftName = lv.shiftName.replace("Ca ", "").trim().toLowerCase();
    if (expectedShift?.toLowerCase() !== leaveShiftName) {
      allLeavesMatch = false;
      console.error(`  [MISMATCH LEAVE] Đơn ${lv.id}: ${lv.employeeId} xin nghỉ ca ${leaveShiftName} ngày thứ ${di}, nhưng WEEKLY_PATTERN xếp ca ${expectedShift}`);
    }
  });

  assert(allLeavesMatch, "Tất cả đơn xin nghỉ mẫu đều trỏ đúng ca nhân viên có trong lịch làm việc");
}

// 2.2 Mọi đơn đổi ca mẫu phải trỏ đúng ca nhân viên có trong lịch
{
  const exchanges = buildInitialExchangeRequests(getNow());
  assert(exchanges.length >= 6, `Đủ số lượng đơn đổi ca mẫu (hiện có: ${exchanges.length})`);

  let allExchangesMatch = true;
  exchanges.forEach((ex) => {
    // Kiểm tra ca của người yêu cầu
    const d1 = new Date(ex.requesterShift.isoDate);
    const di1 = (d1.getDay() + 6) % 7;
    const exp1 = WEEKLY_PATTERN[ex.requesterId]?.[di1];
    const s1 = ex.requesterShift.shiftName.replace("Ca ", "").trim().toLowerCase();
    if (exp1?.toLowerCase() !== s1) {
      allExchangesMatch = false;
      console.error(`  [MISMATCH EX REQ] Đơn ${ex.id}: ${ex.requesterId} xin đổi ca ${s1} thứ ${di1}, nhưng pattern là ${exp1}`);
    }

    // Nếu có targetShift (dạng swap)
    if (ex.targetShift) {
      const d2 = new Date(ex.targetShift.isoDate);
      const di2 = (d2.getDay() + 6) % 7;
      const exp2 = WEEKLY_PATTERN[ex.targetEmployeeId]?.[di2];
      const s2 = ex.targetShift.shiftName.replace("Ca ", "").trim().toLowerCase();
      if (exp2?.toLowerCase() !== s2) {
        allExchangesMatch = false;
        console.error(`  [MISMATCH EX TARGET] Đơn ${ex.id}: ${ex.targetEmployeeId} đối ứng ca ${s2} thứ ${di2}, nhưng pattern là ${exp2}`);
      }
    }
  });

  assert(allExchangesMatch, "Tất cả đơn đổi ca mẫu đều trỏ đúng ca nhân viên có trong lịch làm việc");
}

// 2.3 Mọi ca trực mở (Open Shift) mẫu trỏ đúng ca thiếu định biên hoặc sinh từ đơn nghỉ
{
  const openShifts = buildInitialOpenShifts(getNow());
  assert(openShifts.length >= 5, `Đủ số lượng ca trực mở mẫu (hiện có: ${openShifts.length})`);

  // OS001: Chiều T6 sinh từ đơn nghỉ LV-2026-004 của NV002 (Barista)
  const os001 = openShifts.find((os) => os.id === "OS001");
  assert(os001 && os001.role === "Barista" && os001.shiftCode === "afternoon", "OS001 trỏ đúng ca chiều T6 của Barista (khớp đơn nghỉ LV-2026-004)");

  // OS002: Chiều T3 - trong WEEKLY_PATTERN chỉ có NV005 (Cashier), hoàn toàn không có Barista (thiếu định biên)
  const os002 = openShifts.find((os) => os.id === "OS002");
  assert(os002 && os002.role === "Barista" && os002.shiftCode === "afternoon", "OS002 trỏ đúng ca chiều T3 thiếu Barista");

  // OS003: Tối T6 - trong WEEKLY_PATTERN không có Shift_Leader làm việc (thiếu trưởng ca)
  const os003 = openShifts.find((os) => os.id === "OS003");
  assert(os003 && os003.role === "Shift_Leader" && os003.shiftCode === "evening", "OS003 trỏ đúng ca tối T6 thiếu Shift_Leader");
}

clearDemoNow();

console.log(`\n=== TỔNG KẾT: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
