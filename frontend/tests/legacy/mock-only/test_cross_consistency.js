/* global process */
// =============================================================================
// File: tests/test_cross_consistency.js
// Tầng: Kiểm thử tự động (Unit Test) - Khớp số liệu 100% giữa 5 màn hình
// US: US12, US14, US25, US27, US28 (Requirement E & I)
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
  setDemoNow,
  clearDemoNow,
  getNow,
  listShifts,
  buildWorkHoursSummary,
  computePayroll,
  computeTotals,
  buildDashboard,
  hoursOf,
} from "../../src/mocks/db.js";

import { buildReport, buildOverview } from "../../src/mocks/reportMock.js";

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

console.log("=== BẮT ĐẦU KIỂM THỬ: KHỚP SỐ LIỆU 100% GIỮA 5 MÀN HÌNH (REQUIREMENT E & I) ===\n");

// Danh sách các mốc thời gian kiểm thử (Thứ 2, Thứ 4, Chủ nhật)
const testCheckpoints = [
  { name: "Thứ 2 (Đầu tuần)", iso: "2026-10-19T09:00:00" },
  { name: "Thứ 4 (Giữa tuần)", iso: "2026-10-21T14:00:00" },
  { name: "Chủ nhật (Cuối tuần)", iso: "2026-10-25T16:00:00" },
];

testCheckpoints.forEach(({ name, iso }) => {
  console.log(`\n--- KIỂM TRA MỐC: ${name} (${iso}) ---`);
  setDemoNow(iso);
  initDb(getNow());

  // ---------------------------------------------------------------------------
  // 1. Kiểm tra đối soát trong Tuần hiện tại (period = "week")
  // ---------------------------------------------------------------------------
  {
    // A. Chấm công (Attendance / listShifts)
    const shifts = listShifts({ period: "week" });
    const attShiftCount = shifts.length;
    const db = loadDb();
    const attActualHours = Math.round(
      db.employees.reduce((acc, emp) => {
        const empShifts = shifts.filter((s) => s.employeeId === emp.id);
        const min = empShifts.reduce((a, s) => a + s.actualMin, 0);
        return acc + hoursOf(min);
      }, 0) * 10
    ) / 10;

    // B. Giờ làm (Work Hours / buildWorkHoursSummary)
    const wh = buildWorkHoursSummary({ period: "week" });
    const whShiftCount = wh.rows.reduce((a, r) => a + r.shiftCount, 0);
    const whActualHours = Math.round(wh.rows.reduce((a, r) => a + r.actualHours, 0) * 10) / 10;

    // C. Bảng lương (Payroll / computePayroll)
    const payRows = computePayroll(shifts);
    const payTotals = computeTotals(payRows);
    const payShiftCount = payTotals.shiftCount;
    const payActualHours = payTotals.actualHours;

    // D. Báo cáo (Reports / buildReport)
    const repHours = buildReport("hours", { period: "week" });
    const repShiftCount = repHours.footer.shiftCount;
    const repActualHours = repHours.footer.actualHours;

    // E. Dashboard (buildDashboard)
    const dash = buildDashboard({ period: "week" });
    const dashShiftCount = dash.cards.totalShifts;
    const dashActualHours = dash.cards.actualHours;

    // F. Tổng quan Báo cáo (buildOverview)
    const overview = buildOverview({ period: "week" });
    const overviewActualHours = overview.cards.actualHours;

    // 1. Kiểm tra Tổng số ca theo lịch khớp 100% qua các màn hình
    assert(
      attShiftCount === whShiftCount &&
      whShiftCount === repShiftCount &&
      repShiftCount === dashShiftCount,
      `[Tuần này] Tổng số ca theo lịch khớp 100% (Chấm công=${attShiftCount}, Giờ làm=${whShiftCount}, Báo cáo=${repShiftCount}, Dashboard=${dashShiftCount})`
    );

    // 1b. Bảng lương chỉ tính số ca đã kết thúc (US24)
    const completedTotal = shifts.filter((s) => s.isCompleted).length;
    assert(
      payShiftCount === completedTotal,
      `[Tuần này] Số ca trên Bảng lương (${payShiftCount}) khớp chính xác số ca đã kết thúc completedTotal (${completedTotal})`
    );

    // 2. Kiểm tra Tổng giờ làm THỰC TẾ khớp 100%
    assert(
      attActualHours === whActualHours &&
      whActualHours === payActualHours &&
      payActualHours === repActualHours &&
      repActualHours === dashActualHours &&
      dashActualHours === overviewActualHours,
      `[Tuần này] Tổng giờ làm thực tế khớp 100% (${attActualHours}g trên cả 5 màn hình)`
    );

    // 3. Kiểm tra ca Vắng (Absent) không bị cộng vào giờ làm thực tế (Absent = 0h)
    const absentShifts = shifts.filter((s) => s.status === "Absent");
    const allAbsentZero = absentShifts.every((s) => s.actualMin === 0);
    assert(
      allAbsentZero,
      `[Tuần này] Mọi ca Vắng (Absent, có ${absentShifts.length} ca) đều có giờ làm thực tế = 0h`
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Kiểm tra đối soát trong Tuần trước (period = "prev" - đã hoàn thành 100%)
  // ---------------------------------------------------------------------------
  {
    const prevShifts = listShifts({ period: "prev" });
    const db = loadDb();
    const prevAttActualHours = Math.round(
      db.employees.reduce((acc, emp) => {
        const empShifts = prevShifts.filter((s) => s.employeeId === emp.id);
        const min = empShifts.reduce((a, s) => a + s.actualMin, 0);
        return acc + hoursOf(min);
      }, 0) * 10
    ) / 10;

    const prevWh = buildWorkHoursSummary({ period: "prev" });
    const prevWhActualHours = Math.round(prevWh.rows.reduce((a, r) => a + r.actualHours, 0) * 10) / 10;

    const prevPay = computeTotals(computePayroll(prevShifts));
    const prevDash = buildDashboard({ period: "prev" });

    assert(
      prevAttActualHours === prevWhActualHours &&
      prevWhActualHours === prevPay.actualHours &&
      prevPay.actualHours === prevDash.cards.actualHours,
      `[Tuần trước] Khớp hoàn hảo 100% giờ làm thực tế (${prevAttActualHours}g) qua 5 màn hình`
    );
  }
});

clearDemoNow();

console.log(`\n=== TỔNG KẾT: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
