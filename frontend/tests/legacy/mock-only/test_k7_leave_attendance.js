/* global process */
// =============================================================================
// TEST SUITE: K7 - DUYỆT ĐƠN NGHỈ, KHÔNG TÍNH ABSENT, TẠO OPEN SHIFT THẬT
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
  saveLeaveRequests,
  getCalculatedShifts,
  getOpenShifts,
  startOfDay,
  mondayOf,
  addDays,
  toISO,
  getNow,
  setDemoNow,
} from "../../src/mocks/db.js";

import {
  approveLeave,
  respondReplacement,
  createOpenShiftFromLeave,
} from "../../src/services/leaveService.js";

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

console.log("=== BẮT ĐẦU KIỂM THỬ K7: DUYỆT NGHỈ PHÉP, ABSENT & OPEN SHIFT ===");

setDemoNow("2026-10-21T08:00:00");

const today = startOfDay(getNow());
const monday = mondayOf(today);
const tFutureIso = toISO(addDays(monday, 5)); // Thứ 7 tuần này (chưa diễn ra)

// -----------------------------------------------------------------------------
// Test 1: Duyệt nghỉ phép gỡ khỏi schedules, cập nhật attendance, không tính Absent
// -----------------------------------------------------------------------------
console.log("\n1. Test: Duyệt đơn xin nghỉ (approveLeave) & kiểm tra không tính Absent");
{
  // Xếp NV002 ca Chiều Thứ 7
  const sched = getSavedSchedules();
  sched["afternoon_T7"] = { shiftId: "afternoon", dayId: "T7", assigned: ["NV002", "NV004"] };
  saveSchedules(sched);

  // Tạo bản ghi chấm công ban đầu cho ca tương lai này của NV002 (chưa check-in)
  const db = loadDb();
  db.attendance.push({
    id: `NV002_${tFutureIso}_Chiều`,
    employeeId: "NV002",
    iso: tFutureIso,
    shiftName: "Chiều",
    sMin: 720,
    eMin: 1020,
    checkInMin: null,
    checkOutMin: null,
    adjusted: false,
    adjustmentHistory: [],
  });

  // Tạo đơn nghỉ phép pending cho NV002
  const leaveReq = {
    id: "LV-K7-001",
    employeeId: "NV002",
    shiftDate: `Thứ 7, ${tFutureIso}`,
    isoDate: tFutureIso,
    shiftId: "afternoon",
    shiftName: "Ca chiều",
    leaveType: "emergency",
    leaveTypeName: "Nghỉ ốm đột xuất",
    status: "pending",
    openShiftCreated: false,
    replacementId: null,
  };
  saveLeaveRequests([leaveReq]);

  // Quản lý duyệt đơn
  await approveLeave("LV-K7-001", "Duyệt nghỉ ốm");

  // Kiểm tra 1: NV002 đã được gỡ khỏi ca chiều T7 trong schedules
  const schedAfter = getSavedSchedules();
  const assignedT7 = schedAfter["afternoon_T7"].assigned.map((e) => e.id);
  assert(!assignedT7.includes("NV002"), "Lịch tuần (schedules): Đã gỡ NV002 khỏi ca chiều T7");

  // Kiểm tra 2: Sổ cái chấm công đã đánh dấu onLeave = true
  const dbAfter = loadDb();
  const attRecord = dbAfter.attendance.find((a) => a.employeeId === "NV002" && a.iso === tFutureIso && a.shiftName === "Chiều");
  assert(attRecord && attRecord.onLeave === true, "Chấm công (attendance): Đã cập nhật onLeave: true");

  // Kiểm tra 3: Tính toán chấm công dẫn xuất (deriveShift): status = On-Leave, absent = false
  const calculated = getCalculatedShifts();
  const shiftRecord = calculated.find((s) => s.employeeId === "NV002" && s.iso === tFutureIso && s.shiftName === "Chiều");
  assert(
    shiftRecord && shiftRecord.status === "On-Leave" && shiftRecord.absent === false,
    "Trạng thái chấm công là 'On-Leave', absent = false (KHÔNG bị tính là vắng không phép)"
  );
}

// -----------------------------------------------------------------------------
// Test 2: Người nhận ca thay (respondReplacement) được thêm vào schedules và attendance
// -----------------------------------------------------------------------------
console.log("\n2. Test: Người thay thế nhận ca (respondReplacement)");
{
  const leaveReqWithRep = {
    id: "LV-K7-002",
    employeeId: "NV001",
    shiftDate: `Thứ 7, ${tFutureIso}`,
    isoDate: tFutureIso,
    shiftId: "morning",
    shiftName: "Ca sáng",
    status: "replacement_pending",
    replacementId: "NV005",
    openShiftCreated: false,
  };
  saveLeaveRequests([leaveReqWithRep]);

  // NV005 đồng ý nhận ca
  await respondReplacement("LV-K7-002", true);

  // Kiểm tra schedules: NV005 đã được thêm vào ca sáng T7
  const sched = getSavedSchedules();
  const morningT7Assigned = (sched["morning_T7"]?.assigned || []).map((e) => e.id);
  assert(morningT7Assigned.includes("NV005"), "Lịch tuần (schedules): NV005 đã được thêm vào ca sáng T7");

  // Kiểm tra attendance: NV005 có bản ghi ca sáng T7
  const db = loadDb();
  const attRep = db.attendance.find((a) => a.employeeId === "NV005" && a.iso === tFutureIso && a.shiftName === "Sáng");
  assert(attRep !== undefined, "Chấm công (attendance): NV005 có bản ghi chấm công ca làm thay");
}

// -----------------------------------------------------------------------------
// Test 3: Nút 'Tạo Open Shift' từ đơn nghỉ tạo bản ghi thật trong db.openShifts
// -----------------------------------------------------------------------------
console.log("\n3. Test: Nút 'Tạo Open Shift' (createOpenShiftFromLeave) tạo ca mở thật");
{
  const approvedLeave = {
    id: "LV-K7-003",
    employeeId: "NV003",
    shiftDate: `Thứ 7, ${tFutureIso}`,
    isoDate: tFutureIso,
    shiftId: "afternoon",
    shiftName: "Ca chiều",
    roleTag: "Cashier",
    status: "approved",
    openShiftCreated: false,
    replacementId: null,
  };
  saveLeaveRequests([approvedLeave]);

  // Quản lý bấm Tạo Open Shift từ đơn nghỉ
  const updatedLeave = await createOpenShiftFromLeave("LV-K7-003");

  // Kiểm tra cờ openShiftCreated trên đơn nghỉ
  assert(
    updatedLeave.openShiftCreated === true && Boolean(updatedLeave.openShiftId),
    "Đơn nghỉ phép đã cập nhật openShiftCreated = true và lưu mã openShiftId"
  );

  // Kiểm tra trong kho db.openShifts thật
  const openShifts = getOpenShifts();
  const createdOpenShift = openShifts.find((os) => os.sourceLeaveId === "LV-K7-003");

  assert(createdOpenShift !== undefined, "Kho db.openShifts: Đã tạo bản ghi Ca trực mở thật liên kết với đơn nghỉ");
  assert(
    createdOpenShift &&
      createdOpenShift.date === tFutureIso &&
      createdOpenShift.shiftCode === "afternoon" &&
      createdOpenShift.bonus > 0,
    `Ca mở mới tạo có đầy đủ thông tin: ngày ${createdOpenShift?.date}, ca ${createdOpenShift?.shiftName}, thưởng ${createdOpenShift?.bonus}đ`
  );
}

console.log(`\n=== TỔNG KẾT K7: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
