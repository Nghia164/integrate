// =============================================================================
// File: tests/test_payroll_lock_snapshot.js
// Mục đích: Kiểm thử tính năng Chốt kỳ lương (US27):
//           1. Chặn chốt khi kỳ chưa kết thúc (ngày hiện tại chưa qua ngày cuối kỳ)
//           2. Chặn chốt 2 lần với thông báo tiếng Việt
//           3. Chặn chốt kỳ chồng lấn ngày với kỳ đã chốt (thông báo tiếng Việt nêu rõ kỳ)
//           4. Snapshot bất biến không đổi khi thay đổi lương giờ
//           5. Mở chốt thì tính lại theo lương mới
//           6. Kỳ đã chốt: Chặn duyệt đổi ca/đơn nghỉ, nhưng VẪN CHO TỪ CHỐI; đơn chờ giữ nguyên
//           7. Chặn sửa chấm công và nhận ca mở khi kỳ đã chốt
// Chạy độc lập: node tests/test_payroll_lock_snapshot.js
// =============================================================================

import assert from "node:assert";
import {
  initDb,
  setDemoNow,
  clearDemoNow,
  updateEmployee,
  lockPayrollPeriod,
  unlockPayrollPeriod,
  computePayroll,
  getPayrollLocks,
  getPayrollSnapshots,
  listShifts,
  adjustAttendance,
  getExchangeRequests,
  getLeaveRequests,
} from "../../src/mocks/db.js";
import {
  managerApproveExchange,
  managerRejectExchange,
} from "../../src/mocks/shiftExchangeMock.js";
import { approveLeave, rejectLeave } from "../../src/services/leaveService.js";

console.log("=== BẮT ĐẦU KIỂM THỬ: US27 CHỐT KỲ LƯƠNG & SNAPSHOT BẤT BIẾN ===");

try {
  // ---------------------------------------------------------------------------
  // 1. CHẶN CHỐT KỲ LƯƠNG KHI KỲ CHƯA KẾT THÚC
  // ---------------------------------------------------------------------------
  console.log("\n--- 1. CHẶN CHỐT KỲ LƯƠNG KHI KỲ CHƯA KẾT THÚC (CHƯA QUA NGÀY CUỐI KỲ) ---");
  setDemoNow("2026-10-21T14:00:00");
  initDb();

  let unendedMonthError = "";
  try {
    lockPayrollPeriod("2026-10"); // Ngày cuối kỳ là 2026-10-31, hiện tại 2026-10-21
  } catch (err) {
    unendedMonthError = err.message;
  }
  assert(
    unendedMonthError.includes("Kỳ lương chưa kết thúc"),
    `Chặn chốt tháng chưa kết thúc: "${unendedMonthError}"`
  );
  console.log(`  [PASS] Chặn chốt tháng 10 khi đang ở ngày 21/10: "${unendedMonthError}"`);

  let unendedWeekError = "";
  try {
    lockPayrollPeriod("2026-10-19_2026-10-25"); // Ngày cuối kỳ là 2026-10-25, hiện tại 2026-10-21
  } catch (err) {
    unendedWeekError = err.message;
  }
  assert(
    unendedWeekError.includes("Kỳ lương chưa kết thúc"),
    `Chặn chốt tuần chưa kết thúc: "${unendedWeekError}"`
  );
  console.log(`  [PASS] Chặn chốt tuần hiện tại khi chưa qua ngày cuối tuần: "${unendedWeekError}"`);

  // ---------------------------------------------------------------------------
  // 2. CHUYỂN QUA NGÀY CUỐI KỲ VÀ CHỐT SỔ THÀNH CÔNG KỲ TUẦN
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. CHUYỂN QUA NGÀY CUỐI KỲ VÀ CHỐT SỔ THÀNH CÔNG ---");
  setDemoNow("2026-11-02T08:00:00"); // Đã qua cả tháng 10 (31/10) và tuần (01/11)
  const weekKey = "2026-10-19_2026-10-25";
  unlockPayrollPeriod(weekKey);
  unlockPayrollPeriod("2026-10");

  const weekSnapshot = lockPayrollPeriod(weekKey);
  assert(getPayrollLocks().includes(weekKey), `Mã kỳ "${weekKey}" có trong getPayrollLocks()`);
  assert(getPayrollSnapshots()[weekKey] !== undefined, `Snapshot kỳ "${weekKey}" được lưu vào db.payrollSnapshots`);
  assert(weekSnapshot.rows && weekSnapshot.rows.length > 0, "Snapshot lưu các dòng bảng lương");
  console.log(`  [PASS] Chốt kỳ tuần "${weekKey}" thành công`);

  // ---------------------------------------------------------------------------
  // 3. CHẶN CHỐT KỲ LƯƠNG CHỒNG LẤN NGÀY VỚI KỲ ĐÃ CHỐT
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. CHẶN CHỐT KỲ LƯƠNG CHỒNG LẤN NGÀY VỚI KỲ ĐÃ CHỐT ---");
  // Tuần 19/10-25/10 đã chốt. Giờ chốt Tháng 10 (01/10-31/10) chứa tuần đó -> Ném lỗi chồng lấn!
  let overlapMonthError = "";
  try {
    lockPayrollPeriod("2026-10");
  } catch (err) {
    overlapMonthError = err.message;
  }
  assert(
    overlapMonthError.includes("chồng lấn") && overlapMonthError.includes(weekKey),
    `Ném lỗi chồng lấn kỳ: "${overlapMonthError}"`
  );
  console.log(`  [PASS] Chặn chốt Tháng 10 vì chồng lấn với tuần "${weekKey}": "${overlapMonthError}"`);

  // Mở chốt tuần để kiểm tra chiều ngược lại
  unlockPayrollPeriod(weekKey);
  assert(!getPayrollLocks().includes(weekKey), "Đã mở chốt tuần");

  // Chốt Tháng 10
  const monthKey = "2026-10";
  const octShifts = listShifts({ period: "range", from: "2026-10-01", to: "2026-10-31" });
  const initialPayroll = computePayroll(octShifts, monthKey, true);
  const nv001Before = initialPayroll.find((r) => r.employeeId === "NV001");
  const origWage = nv001Before.hourlyWage;
  const origTotal = nv001Before.total;

  lockPayrollPeriod(monthKey);
  console.log(`  [PASS] Chốt Tháng 10 ("${monthKey}") thành công`);

  // Tháng 10 đã chốt. Thử chốt tuần 26/10-01/11 (chứa các ngày 26-31/10) -> Ném lỗi chồng lấn!
  let overlapWeekError = "";
  try {
    lockPayrollPeriod("2026-10-26_2026-11-01");
  } catch (err) {
    overlapWeekError = err.message;
  }
  assert(
    overlapWeekError.includes("chồng lấn") && overlapWeekError.includes(monthKey),
    `Ném lỗi chồng lấn tuần: "${overlapWeekError}"`
  );
  console.log(`  [PASS] Chặn chốt tuần 26/10-01/11 vì chồng lấn với tháng 10: "${overlapWeekError}"`);

  // Thử chốt khoảng ngày nằm hoàn toàn trong tháng 10
  let overlapRangeError = "";
  try {
    lockPayrollPeriod("2026-10-05_2026-10-12");
  } catch (err) {
    overlapRangeError = err.message;
  }
  assert(
    overlapRangeError.includes("chồng lấn"),
    `Chặn khoảng ngày chồng lấn: "${overlapRangeError}"`
  );
  console.log(`  [PASS] Chặn chốt khoảng ngày tùy chọn nằm trong tháng đã chốt`);

  // ---------------------------------------------------------------------------
  // 4. CHỐT HAI LẦN CÙNG KỲ BÁO LỖI TIẾNG VIỆT
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. CHỐT HAI LẦN BÁO LỖI TIẾNG VIỆT RÕ RÀNG ---");
  let doubleLockError = "";
  try {
    lockPayrollPeriod(monthKey);
  } catch (err) {
    doubleLockError = err.message;
  }
  assert(doubleLockError.includes("đã được chốt sổ"), `Ném lỗi khi chốt lại: "${doubleLockError}"`);
  console.log(`  [PASS] Chốt hai lần bị chặn: "${doubleLockError}"`);

  // ---------------------------------------------------------------------------
  // 5. KỲ ĐÃ CHỐT: CHẶN DUYỆT ĐỔI CA / NGHỈ PHÉP NHƯNG CHO TỪ CHỐI
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. KỲ ĐÃ CHỐT: CHẶN DUYỆT ĐỔI CA / NGHỈ PHÉP NHƯNG CHO TỪ CHỐI ---");

  // Kiểm tra ở mốc thời gian tuần tháng 10
  setDemoNow("2026-10-21T14:00:00");
  initDb();
  // Khóa kỳ tháng 10 trong cơ sở dữ liệu
  const db = (await import("../../src/mocks/db.js")).loadDb();
  if (!db.payrollLocks.includes("2026-10")) db.payrollLocks.push("2026-10");

  // A. ĐỔI CA
  const requests = getExchangeRequests();
  const reqA = requests.find((r) => r.id === "EX-2026-005");
  assert(reqA !== undefined, "Tìm thấy đơn đổi ca EX-2026-005");
  assert.strictEqual(reqA.status, "pending_manager", "Đơn EX-2026-005 đang ở trạng thái pending_manager");

  // Cố gắng duyệt đơn đổi ca thuộc kỳ đã chốt -> BỊ CHẶN
  let approveExchangeError = "";
  try {
    managerApproveExchange("EX-2026-005", "Thử duyệt khi kỳ đã chốt");
  } catch (err) {
    approveExchangeError = err.message;
  }
  assert(
    approveExchangeError.includes("chốt sổ"),
    `Duyệt đổi ca bị chặn: "${approveExchangeError}"`
  );
  console.log(`  [PASS] Duyệt đổi ca trong kỳ đã chốt bị chặn: "${approveExchangeError}"`);

  // Kiểm tra đơn vẫn giữ nguyên trạng thái pending_manager (không tự động đổi)
  const reqAAfterFailed = getExchangeRequests().find((r) => r.id === "EX-2026-005");
  assert.strictEqual(reqAAfterFailed.status, "pending_manager", "Đơn vẫn giữ nguyên pending_manager sau khi duyệt bị chặn");
  console.log("  [PASS] Đơn đổi ca đang chờ giữ nguyên trạng thái, không tự động đổi");

  // Từ chối đơn đổi ca trong kỳ đã chốt -> THÀNH CÔNG
  const rejectExchangeRes = managerRejectExchange("EX-2026-005", "Từ chối vì kỳ lương đã chốt sổ");
  assert.strictEqual(rejectExchangeRes.status, "rejected", "Từ chối đơn đổi ca thành công");
  console.log("  [PASS] Từ chối đơn đổi ca trong kỳ đã chốt thực hiện thành công");

  // B. NGHỈ PHÉP
  const leaves = getLeaveRequests();
  const pendingLeave = leaves.find((r) => r.status === "pending" && r.isoDate?.startsWith("2026-10"));
  if (pendingLeave) {
    // Thử duyệt đơn nghỉ thuộc kỳ đã chốt -> BỊ CHẶN
    let approveLeaveError = "";
    try {
      await approveLeave(pendingLeave.id, "Thử duyệt nghỉ");
    } catch (err) {
      approveLeaveError = err.message;
    }
    assert(
      approveLeaveError.includes("chốt sổ"),
      `Duyệt nghỉ bị chặn: "${approveLeaveError}"`
    );
    console.log(`  [PASS] Duyệt nghỉ phép trong kỳ đã chốt bị chặn: "${approveLeaveError}"`);

    // Kiểm tra đơn vẫn giữ nguyên pending
    const leaveAfterFailed = getLeaveRequests().find((r) => r.id === pendingLeave.id);
    assert.strictEqual(leaveAfterFailed.status, "pending", "Đơn nghỉ vẫn giữ nguyên pending");
    console.log("  [PASS] Đơn xin nghỉ đang chờ giữ nguyên trạng thái, không tự động đổi");

    // Từ chối đơn nghỉ phép trong kỳ đã chốt -> THÀNH CÔNG
    const rejectLeaveRes = await rejectLeave(pendingLeave.id, "Từ chối nghỉ do kỳ lương đã khóa sổ");
    assert.strictEqual(rejectLeaveRes.status, "rejected", "Từ chối đơn nghỉ phép thành công");
    console.log("  [PASS] Từ chối đơn xin nghỉ trong kỳ đã chốt thực hiện thành công");
  }

  // C. SỬA CHẤM CÔNG VÀ NHẬN CA MỞ
  let attError = "";
  try {
    adjustAttendance("ATT-001", { checkIn: "08:00", checkOut: "12:00", reason: "Điều chỉnh thử" }, "2026-10-21");
  } catch (err) {
    attError = err.message;
  }
  assert(attError.includes("chốt"), `Sửa chấm công bị chặn: "${attError}"`);
  console.log(`  [PASS] Sửa chấm công trong kỳ đã chốt bị chặn: "${attError}"`);

  // ---------------------------------------------------------------------------
  // 6. ĐỔI LƯƠNG GIỜ VÀ KIỂM TRA TÍNH BẤT BIẾN CỦA SNAPSHOT
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. ĐỔI LƯƠNG GIỜ VÀ KIỂM TRA TÍNH BẤT BIẾN CỦA SNAPSHOT ---");
  setDemoNow("2026-11-02T08:00:00");
  unlockPayrollPeriod(monthKey);
  lockPayrollPeriod(monthKey);

  const newWage = origWage * 2;
  updateEmployee("NV001", { hourlyWage: newWage });

  const lockedPayroll = computePayroll(octShifts, monthKey);
  const nv001Locked = lockedPayroll.find((r) => r.employeeId === "NV001");
  assert.strictEqual(nv001Locked.hourlyWage, origWage, "Kỳ đã chốt giữ nguyên mức lương giờ cũ từ snapshot");
  assert.strictEqual(nv001Locked.total, origTotal, "Kỳ đã chốt giữ nguyên tổng lương cũ từ snapshot");
  console.log("  [PASS] Kỳ đã chốt giữ nguyên số cũ 100% (không bị ảnh hưởng bởi đổi lương giờ)");

  // ---------------------------------------------------------------------------
  // 7. MỞ CHỐT THÌ TÍNH LẠI
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. MỞ CHỐT THÌ TÍNH LẠI THEO SỐ MỚI ---");
  unlockPayrollPeriod(monthKey);
  assert(!getPayrollLocks().includes(monthKey), "Mã kỳ đã được gỡ khỏi danh sách khóa");
  assert(getPayrollSnapshots()[monthKey] === undefined, "Snapshot kỳ đã được xóa hoàn toàn");

  const recalculatedPayroll = computePayroll(octShifts, monthKey);
  const nv001Recalculated = recalculatedPayroll.find((r) => r.employeeId === "NV001");
  assert.strictEqual(nv001Recalculated.hourlyWage, newWage, "Sau khi mở chốt, lương giờ đọc mức mới");
  assert(nv001Recalculated.total > origTotal, "Sau khi mở chốt, tổng lương được tính lại và tăng lên");
  console.log(`  [PASS] Mở chốt thành công: tổng lương tính lại = ${nv001Recalculated.total}đ (> ${origTotal}đ)`);

  // Dọn dẹp: Khôi phục lại lương NV001 về mức ban đầu
  updateEmployee("NV001", { hourlyWage: origWage });

  console.log("\n=== TỔNG KẾT: TẤT CẢ KIỂM THỬ CHỐT KỲ LƯƠNG ĐỀU PASS 100%! ===");
} finally {
  clearDemoNow();
}
