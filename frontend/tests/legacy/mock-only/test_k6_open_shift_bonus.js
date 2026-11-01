/* global process */
// =============================================================================
// TEST SUITE: K6 - THƯỞNG OPEN SHIFT THẬT & NHẬN CA ĐỒNG BỘ ATTENDANCE
// =============================================================================

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

import {
  loadDb,
  getSavedSchedules,
  saveSchedules,
  saveOpenShifts,
  computePayroll,
  openShiftBonusOf,
  startOfDay,
  getNow,
  mondayOf,
  addDays,
  toISO,
  setDemoNow,
  clearDemoNow,
} from "../../src/mocks/db.js";

import {
  claimOpenShift,
} from "../../src/services/openShiftService.js";

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

console.log("=== BẮT ĐẦU KIỂM THỬ K6: THƯỞNG OPEN SHIFT THẬT & ĐỒNG BỘ CHẤM CÔNG ===");

setDemoNow("2026-10-21T08:00:00");

const today = startOfDay(getNow());
const monday = mondayOf(today);
const t4Iso = toISO(addDays(monday, 2)); // Thứ 4 tuần này

// -----------------------------------------------------------------------------
// Test 1: Bỏ hàm băm ngẫu nhiên - openShiftBonusOf đọc tiền thưởng Open Shift thật
// -----------------------------------------------------------------------------
console.log("\n1. Test: openShiftBonusOf đọc từ Open Shift thật thay vì hàm băm ngẫu nhiên");
{
  const openShiftBonusValue = 65000;
  const targetShiftId = "OS-K6-BONUS";

  // Tạo Open Shift với mức thưởng cụ thể 65,000đ
  const testOpenShift = {
    id: targetShiftId,
    date: t4Iso,
    shiftCode: "morning",
    shiftName: "Sáng",
    startTime: "06:00",
    endTime: "12:00",
    role: "Barista",
    needed: 1,
    bonus: openShiftBonusValue,
    cancelled: false,
    version: 1,
    claims: [
      {
        id: "C-TEST",
        employeeId: "NV002",
        name: "Trần Thị Bích",
        claimedAt: new Date().toISOString(),
      },
    ],
  };
  saveOpenShifts([testOpenShift]);

  // Ca làm việc của NV002 tại ngày đó
  const shiftNV002 = {
    id: `NV002_${t4Iso}`,
    employeeId: "NV002",
    iso: t4Iso,
    shiftName: "Sáng",
    absent: false,
    missing: false,
  };

  // Ca làm việc của NV001 (không claim ca mở nào)
  const shiftNV001 = {
    id: `NV001_${t4Iso}`,
    employeeId: "NV001",
    iso: t4Iso,
    shiftName: "Sáng",
    absent: false,
    missing: false,
  };

  const bonusNV002 = openShiftBonusOf(shiftNV002);
  const bonusNV001 = openShiftBonusOf(shiftNV001);

  assert(
    bonusNV002 === openShiftBonusValue,
    `NV002 nhận thưởng chính xác ${openShiftBonusValue}đ từ Open Shift thật (không còn là mã băm seed % 9)`
  );
  assert(
    bonusNV001 === 0,
    "NV001 không nhận Open Shift nào thì thưởng = 0đ (không bị sinh số ngẫu nhiên)"
  );
}

// -----------------------------------------------------------------------------
// Test 2: Nhân viên bấm nhận ca (claimOpenShift) đồng bộ vào schedules & attendance
// -----------------------------------------------------------------------------
console.log("\n2. Test: Nhân viên nhận ca (claimOpenShift) đồng bộ vào schedules và attendance");
{
  const testOpenShift2 = {
    id: "OS-CLAIM-TEST",
    date: t4Iso,
    shiftCode: "evening",
    shiftName: "Tối",
    startTime: "17:00",
    endTime: "22:00",
    role: "Cashier",
    needed: 1,
    bonus: 50000,
    cancelled: false,
    version: 1,
    claims: [],
  };

  // Chuẩn bị lịch tuần rỗng ca tối T4
  const sched = getSavedSchedules();
  sched["evening_T4"] = { shiftId: "evening", dayId: "T4", assigned: [] };
  saveSchedules(sched);

  saveOpenShifts([testOpenShift2]);

  // NV005 (Cashier) bấm nhận ca
  const result = await claimOpenShift("OS-CLAIM-TEST", {
    employeeId: "NV005",
    name: "Hoàng Văn Nam",
    phone: "0905123460",
    roleTags: ["Cashier"],
  }, 1);

  assert(result.filled === true, "Nhận ca thành công (filled = true)");
  assert(result.bonus === 50000, "Xác nhận tiền thưởng đi kèm ca là 50000đ");

  // Kiểm tra schedules: NV005 đã có trong ca tối T4
  const schedAfter = getSavedSchedules();
  const eveningT4Assigned = (schedAfter["evening_T4"]?.assigned || []).map((e) => e.id);
  assert(
    eveningT4Assigned.includes("NV005"),
    "Lịch tuần (schedules): NV005 đã được thêm vào ca tối T4"
  );

  // Kiểm tra attendance: NV005 đã có bản ghi chấm công ca tối kèm openShiftBonus
  const db = loadDb();
  const attRecord = db.attendance.find((a) => a.employeeId === "NV005" && a.iso === t4Iso && a.shiftName === "Tối");
  assert(
    attRecord !== undefined && attRecord.openShiftBonus === 50000,
    "Chấm công (attendance): NV005 có bản ghi chấm công ca tối với openShiftBonus = 50000đ"
  );

  // Kiểm tra Bảng lương (computePayroll): khi ca đã kết thúc, NV005 được cộng đúng 50000đ thưởng Open Shift
  setDemoNow(`${t4Iso}T23:00:00`);
  const payroll = computePayroll();
  const payrollNV005 = payroll.find((p) => p.employeeId === "NV005");



  assert(
    payrollNV005 && payrollNV005.openShiftBonus >= 50000,
    `Bảng lương (Payroll): NV005 được tính tổng thưởng Open Shift = ${payrollNV005?.openShiftBonus}đ`
  );
  clearDemoNow();
}

console.log(`\n=== TỔNG KẾT K6: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
