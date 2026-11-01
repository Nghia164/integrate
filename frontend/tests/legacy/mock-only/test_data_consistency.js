// =============================================================================
// File: tests/test_data_consistency.js
// Tầng: Kiểm thử tự động (Unit Test)
// Nghiệp vụ: Đảm bảo thống nhất định nghĩa số liệu (Việc 1) và tính nhất quán
//            luồng nghiệp vụ xuyên suốt các màn hình (Việc 2)
// Chạy độc lập: node tests/test_data_consistency.js
// =============================================================================

import assert from "node:assert";
import {
  initDb,
  setDemoNow,
  clearDemoNow,
  getNow,
  getEmployeeCounts,
  buildDashboard,
  getWeeklyAvailability,
  listShifts,
  buildWorkHoursSummary,
  computePayroll,
  getOpenShifts,
  getExchangeRequests,
  getLeaveRequests,
  getSavedSchedules,
} from "../../src/mocks/db.js";
import { getScheduleBoard } from "../../src/services/scheduleService.js";
import { managerApproveExchange } from "../../src/mocks/shiftExchangeMock.js";
import { approveLeave } from "../../src/services/leaveService.js";

console.log("=== BẮT ĐẦU KIỂM THỬ: NHẤT QUÁN ĐỊNH NGHĨA SỐ LIỆU & LUỒNG NGHIỆP VỤ ===\n");

const testMilestones = [
  { name: "Đầu tuần (Thứ 2 09:00)", iso: "2026-10-19T09:00:00" },
  { name: "Giữa tuần (Thứ 4 14:00)", iso: "2026-10-21T14:00:00" },
  { name: "Cuối tuần (Chủ nhật 20:00)", iso: "2026-10-25T20:00:00" },
];

for (const { name, iso } of testMilestones) {
  console.log(`\n--- KIỂM TRA MỐC: ${name} (${iso}) ---`);
  setDemoNow(iso);
  initDb(getNow());

  // ---------------------------------------------------------------------------
  // PHẦN 1: ĐỊNH NGHĨA CHUNG VỀ SỐ LƯỢNG NHÂN VIÊN (VIỆC 1)
  // ---------------------------------------------------------------------------
  const counts = getEmployeeCounts();
  assert.strictEqual(counts.total, 7, "Tổng nhân viên = 7 (Tất cả trừ 'Nghỉ việc')");
  assert.strictEqual(counts.active, 6, "Đang làm việc = 6");
  assert.strictEqual(counts.onLeave, 1, "Nghỉ phép = 1");
  assert.strictEqual(counts.resigned, 1, "Nghỉ việc = 1");
  assert.strictEqual(counts.total, counts.active + counts.onLeave, "total === active + onLeave");
  console.log(`  [PASS] getEmployeeCounts() trả về đúng định nghĩa: total=${counts.total}, active=${counts.active}, onLeave=${counts.onLeave}, resigned=${counts.resigned}`);

  // Kiểm tra NV006 (Nghỉ việc) KHÔNG xuất hiện ở các màn hình:
  const dash = buildDashboard({ period: "week" });
  assert.strictEqual(dash.totalEmployees, 7, "Dashboard totalEmployees = 7 (khớp định nghĩa)");
  assert.strictEqual(dash.schedule.length, 7, "Dashboard weekSchedule hiển thị đúng 7 nhân viên");
  assert(!dash.schedule.some((r) => r.employee.includes("Kim Ngân")), "Dashboard không chứa NV006 (Đỗ Kim Ngân)");
  assert(!dash.hoursPerEmployee.some((r) => r.name.includes("Kim Ngân")), "Dashboard hoursPerEmployee không chứa NV006");
  console.log("  [PASS] Dashboard: Khớp định nghĩa 7 nhân viên, không xuất hiện nhân viên Nghỉ việc");

  // Khả năng làm việc
  const avail = getWeeklyAvailability();
  assert.strictEqual(avail.employees.length, 7, "Khả năng làm việc chỉ gồm 7 nhân viên");
  assert(!avail.employees.some((e) => e.status === "Nghỉ việc"), "Khả năng làm việc loại bỏ nhân viên Nghỉ việc");
  console.log("  [PASS] Khả năng làm việc: Loại bỏ hoàn toàn nhân viên Nghỉ việc");

  // Bảng xếp lịch
  const board = await getScheduleBoard();
  assert.strictEqual(board.employees.length, 7, "Bảng xếp lịch gồm 7 nhân viên đang công tác");
  assert(!board.employees.some((e) => e.status === "Nghỉ việc"), "Bảng xếp lịch không chứa nhân viên Nghỉ việc");
  console.log("  [PASS] Xếp lịch: Danh sách nhân sự chỉ gồm nhân viên còn làm việc");

  // Tổng hợp giờ làm
  const whSummary = buildWorkHoursSummary({ period: "week" });
  assert(!whSummary.rows.some((r) => r.employeeId === "NV006"), "Tổng hợp giờ làm không có dòng của NV006");
  console.log("  [PASS] Giờ làm việc: Loại trừ nhân viên Nghỉ việc");

  // Tính lương
  const payroll = computePayroll(listShifts({ period: "week" }));
  assert(!payroll.some((r) => r.employeeId === "NV006"), "Bảng lương không bao giờ tính lương cho NV006");
  console.log("  [PASS] Bảng lương: Không chứa nhân viên Nghỉ việc");

  // Đổi ca & Ca mở & Đơn nghỉ
  const exchanges = getExchangeRequests();
  assert(!exchanges.some((r) => r.requesterId === "NV006" || r.targetEmployeeId === "NV006"), "Danh sách đổi ca không chứa NV006");
  const openShifts = getOpenShifts();
  assert(!openShifts.flatMap((s) => s.claims || []).some((c) => c.employeeId === "NV006"), "Danh sách claims ca mở không chứa NV006");
  const leaves = getLeaveRequests();
  assert(!leaves.some((r) => r.employeeId === "NV006"), "Danh sách đơn nghỉ không chứa NV006");
  console.log("  [PASS] Đổi ca, Ca mở, Đơn nghỉ: Đều loại trừ nhân viên Nghỉ việc");

  // ---------------------------------------------------------------------------
  // PHẦN 2: KIỂM TRA LUỒNG NGHIỆP VỤ XUYÊN SUỐT (VIỆC 2)
  // ---------------------------------------------------------------------------
  // A. Cùng một ca của cùng nhân viên ra cùng số giờ giữa Chấm công, Giờ làm, Lương
  const weekShifts = listShifts({ period: "week" });
  const completedShifts = weekShifts.filter((s) => s.isCompleted);
  assert.strictEqual(dash.cards.completedShifts, completedShifts.length, "Dashboard completedShifts khớp chính xác ca đã kết thúc");

  for (const emp of board.employees) {
    const empCompleted = completedShifts.filter((s) => s.employeeId === emp.id);
    const empAttHours = Math.round(empCompleted.reduce((a, s) => a + s.actualMin, 0) / 60 * 10) / 10;
    const whRow = whSummary.rows.find((r) => r.employeeId === emp.id);
    const payrollRow = payroll.find((r) => r.employeeId === emp.id);

    if (whRow) {
      assert.strictEqual(whRow.actualHours, empAttHours, `Giờ làm của ${emp.id} khớp chấm công`);
    }
    if (payrollRow) {
      assert.strictEqual(payrollRow.actualHours, empAttHours, `Giờ tính lương của ${emp.id} khớp chấm công`);
      assert.strictEqual(payrollRow.shiftCount, empCompleted.length, `Số ca tính lương của ${emp.id} khớp số ca hoàn thành`);
    }
  }
  console.log("  [PASS] Đối soát giờ làm: Chấm công, Giờ làm và Bảng lương đồng nhất 100%");

  // B. Đồng bộ Đổi ca đã duyệt (Approved exchange)
  if (name.includes("Đầu tuần")) {
    const reqA = exchanges.find((r) => r.id === "EX-2026-005");
    if (reqA && reqA.status === "pending_manager") {
      const approveRes = managerApproveExchange("EX-2026-005", "Quản lý duyệt demo");
      assert.strictEqual(approveRes.status, "approved", "Duyệt đơn đổi ca EX-2026-005 thành công");

      const sched = getSavedSchedules();
      const t6Assigned = sched["afternoon_T6"]?.assigned?.map((e) => (typeof e === "string" ? e : e.id)) || [];
      const t7Assigned = sched["morning_T7"]?.assigned?.map((e) => (typeof e === "string" ? e : e.id)) || [];
      assert(t6Assigned.includes("NV005"), "Lịch chiều T6 đã chuyển giao cho NV005");
      assert(t7Assigned.includes("NV003"), "Lịch sáng T7 đã chuyển giao cho NV003");
      console.log("  [PASS] Đổi ca đã duyệt phản ánh tức thì vào Lịch phân công và Chấm công");
    }
  }

  // C. Đồng bộ Đơn xin nghỉ đã duyệt (Approved leave)
  if (name.includes("Đầu tuần")) {
    const pendingLeave = leaves.find((r) => r.id === "LV-2026-001" || (r.status === "pending" && !r.openShiftCreated));
    if (pendingLeave) {
      await approveLeave(pendingLeave.id, "Đồng ý cho nghỉ phép");
      const updatedShifts = listShifts({ period: "week" });
      const leaveShift = updatedShifts.find(
        (s) => s.employeeId === pendingLeave.employeeId && s.iso === pendingLeave.isoDate
      );
      if (leaveShift) {
        assert.strictEqual(leaveShift.status, "On-Leave", "Ca xin nghỉ đổi trạng thái thành On-Leave");
        assert.strictEqual(leaveShift.actualMin, 0, "Ca xin nghỉ có 0 giờ làm thực tế");
        console.log("  [PASS] Đơn nghỉ đã duyệt đồng bộ đúng ca On-Leave vào Chấm công");
      }
    }
  }
}

clearDemoNow();
console.log("\n=== TỔNG KẾT: TẤT CẢ KIỂM THỬ DATA CONSISTENCY ĐỀU PASS 100%! ===");
