/* global process */
/**
 * Test Suite: Loại bỏ hoàn toàn nhân viên "Nghỉ việc" khỏi 4 màn hình
 * 1. Khả năng làm việc (US09)
 * 2. Tạo lịch tự động (US11)
 * 3. Đổi ca (US15-US17)
 * 4. Ca trực mở (US18-US19)
 */

import {
  initDb,
  loadDb,
  getNow,
  getWeeklyAvailability,
  generateInitialScheduleDict,
  getExchangeRequests,
  getOpenShifts,
} from "../../src/mocks/db.js";
import { getScheduleBoard } from "../../src/services/scheduleService.js";
import { createExchangeRequest } from "../../src/mocks/shiftExchangeMock.js";
import { claimOpenShift } from "../../src/services/openShiftService.js";
import { isEligible } from "../../src/mocks/openShiftRulesMock.js";

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

console.log("=== BẮT ĐẦU KIỂM THỬ: LOẠI BỎ NHÂN VIÊN 'NGHỈ VIỆC' KHỎI 4 MÀN HÌNH ===\n");
initDb(getNow());

// 1. Màn hình Khả năng làm việc (US09)
console.log("--- 1. Khả năng làm việc (US09) ---");
{
  const data = getWeeklyAvailability();
  const resigned = data.employees.filter((e) => e.status === "Nghỉ việc");
  assert(resigned.length === 0, "Không có nhân viên Nghỉ việc trong danh sách (thực tế: 0)");
  assert(data.employees.find((e) => e.id === "NV006") === undefined, "NV006 (Nghỉ việc) bị loại khỏi Khả năng làm việc");
}

// 2. Màn hình Tạo lịch tự động (US11)
console.log("\n--- 2. Tạo lịch tự động (US11) ---");
{
  const board = await getScheduleBoard();
  const resignedBoard = board.employees.filter((e) => e.status === "Nghỉ việc");
  assert(resignedBoard.length === 0, "Danh sách nhân sự xếp lịch board.employees không có NV Nghỉ việc");
  assert(board.employees.find((e) => e.id === "NV006") === undefined, "NV006 không xuất hiện trong bảng xếp lịch");

  const db = loadDb();
  const initialDict = generateInitialScheduleDict(db.employees);
  let initialHasResigned = false;
  Object.values(initialDict).forEach((slot) => {
    if ((slot.assigned || []).includes("NV006")) {
      initialHasResigned = true;
    }
  });
  assert(!initialHasResigned, "generateInitialScheduleDict không phân ca cho nhân viên Nghỉ việc");
}

// 3. Màn hình Đổi ca (US15 - US17)
console.log("\n--- 3. Màn hình Đổi ca (US15 - US17) ---");
{
  const requests = getExchangeRequests();
  const hasResignedInRequests = requests.some(
    (r) => r.requesterId === "NV006" || r.targetEmployeeId === "NV006"
  );
  assert(!hasResignedInRequests, "Danh sách yêu cầu đổi ca không chứa nhân viên Nghỉ việc");

  let threwOnCreate = false;
  try {
    createExchangeRequest({
      requesterId: "NV006",
      requesterShift: { dayId: "T2", shiftId: "morning" },
      targetEmployeeId: "NV001",
    });
  } catch (err) {
    threwOnCreate = err.message.includes("nghỉ việc");
  }
  assert(threwOnCreate, "Chặn nhân viên Nghỉ việc tạo yêu cầu đổi ca (ném lỗi chuẩn)");
}

// 4. Màn hình Ca trực mở (US18 - US19)
console.log("\n--- 4. Màn hình Ca trực mở (US18 - US19) ---");
{
  const openShifts = getOpenShifts();
  let hasResignedClaim = false;
  openShifts.forEach((s) => {
    (s.claims || []).forEach((c) => {
      if (c.employeeId === "NV006") hasResignedClaim = true;
    });
  });
  assert(!hasResignedClaim, "Danh sách claims ca trực mở không chứa nhân viên Nghỉ việc");

  let threwOnClaim = false;
  try {
    await claimOpenShift("OS001", { employeeId: "NV006", status: "Nghỉ việc" });
  } catch (err) {
    threwOnClaim = err.message.includes("nghỉ việc");
  }
  assert(threwOnClaim, "Chặn nhân viên Nghỉ việc bấm nhận Open Shift (ném lỗi chuẩn)");

  const eligible = isEligible(
    { role: "Barista", needed: 1, claims: [], date: "2026-10-30" },
    { employeeId: "NV006", status: "Nghỉ việc", roleTags: ["Barista"] },
    []
  );
  assert(!eligible, "isEligible trả về false cho nhân viên trạng thái Nghỉ việc");
}

console.log(`\n=== TỔNG KẾT: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
