/* global process */
// =============================================================================
// TEST SUITE: GIAI ĐOẠN 1B - CHUẨN HÓA RANH GIỚI SHIFT.ASSIGNED & REQUESTS
// =============================================================================

// Mock localStorage in Node.js environment
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

import {
  loadDb,
  saveDb,
  getSavedSchedules,
  saveSchedules,
  getLeaveRequests,
  saveLeaveRequests,
  getExchangeRequests,
  saveExchangeRequests,
  startOfDay,
  mondayOf,
  addDays,
  toISO,
  setDemoNow,
  getNow,
} from "../../src/mocks/db.js";

import {
  managerApproveExchange,
} from "../../src/mocks/shiftExchangeMock.js";

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

console.log("=== BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 1B ===");

// -----------------------------------------------------------------------------
// TEST 1: Ghi lịch bằng object rồi đọc lại
// -----------------------------------------------------------------------------
console.log("\n1. Test: Ghi lịch bằng object rồi đọc lại");
{
  const inputSchedules = {
    morning_T2: {
      shiftId: "morning",
      dayId: "T2",
      assigned: [
        { id: "NV001", name: "An Cũ", role: "Phục vụ" },
        { id: "NV002", name: "Bích Cũ", role: "Pha chế" },
      ],
    },
  };

  saveSchedules(inputSchedules);

  // Kiểm tra lưu gốc trong db: chỉ lưu mảng ID
  const rawDb = loadDb();
  const rawAssigned = rawDb.schedules.morning_T2.assigned;
  assert(
    Array.isArray(rawAssigned) &&
      rawAssigned.length === 2 &&
      rawAssigned[0] === "NV001" &&
      rawAssigned[1] === "NV002",
    "db.schedules chỉ lưu mảng employeeId (['NV001', 'NV002'])"
  );

  // Kiểm tra đọc lại qua getSavedSchedules: đã resolve đầy đủ object
  const readBack = getSavedSchedules();
  const slot = readBack.morning_T2;
  assert(
    slot.assigned.length === 2 &&
      slot.assigned[0].id === "NV001" &&
      slot.assigned[0].name === "Nguyễn Văn An" &&
      slot.assigned[0].role === "Phục vụ" &&
      slot.assigned[0].roleTag === "Shift_Leader",
    "getSavedSchedules resolve đầy đủ thông tin nhân viên từ db.employees (NV001)"
  );
  assert(
    slot.assigned[1].id === "NV002" &&
      slot.assigned[1].name === "Trần Thị Bích" &&
      slot.assigned[1].role === "Pha chế" &&
      slot.assigned[1].roleTag === "Barista",
    "getSavedSchedules resolve đầy đủ thông tin nhân viên từ db.employees (NV002)"
  );
}

// -----------------------------------------------------------------------------
// TEST 2: Ghi bằng ID rồi đọc lại
// -----------------------------------------------------------------------------
console.log("\n2. Test: Ghi lịch bằng string ID rồi đọc lại");
{
  const inputSchedules = {
    afternoon_T3: {
      shiftId: "afternoon",
      dayId: "T3",
      assigned: ["NV003", "NV004"],
    },
  };

  saveSchedules(inputSchedules);

  const rawDb = loadDb();
  assert(
    JSON.stringify(rawDb.schedules.afternoon_T3.assigned) === JSON.stringify(["NV003", "NV004"]),
    "db.schedules lưu đúng mảng ['NV003', 'NV004']"
  );

  const readBack = getSavedSchedules();
  const assigned = readBack.afternoon_T3.assigned;
  assert(
    assigned[0].id === "NV003" && assigned[0].name === "Lê Minh Cường" && assigned[0].role === "Thu ngân",
    "Đọc lại từ ID chuỗi: resolve thành công NV003"
  );
  assert(
    assigned[1].id === "NV004" && assigned[1].name === "Phạm Thị Dung" && assigned[1].role === "Pha chế",
    "Đọc lại từ ID chuỗi: resolve thành công NV004"
  );
}

// -----------------------------------------------------------------------------
// TEST 3: Dữ liệu cũ dạng object trong localStorage
// -----------------------------------------------------------------------------
console.log("\n3. Test: Dữ liệu cũ dạng object trong localStorage (backward compatibility)");
{
  const db = loadDb();
  // Giả lập trực tiếp cấu trúc cũ trong db.schedules
  db.schedules.evening_T4 = {
    shiftId: "evening",
    dayId: "T4",
    assigned: [
      { id: "NV005", name: "Hoàng Văn Nam Cũ", role: "Thu ngân" },
    ],
  };
  saveDb();

  const readBack = getSavedSchedules();
  const emp = readBack.evening_T4.assigned[0];
  assert(
    emp.id === "NV005" && emp.name === "Hoàng Văn Nam",
    "Đọc dữ liệu cũ có object: tự động nhận diện ID và resolve theo db.employees"
  );

  // Lưu tiếp một lần -> tự động chuẩn hóa về ID
  saveSchedules(readBack);
  const rawAfterSave = loadDb();
  assert(
    rawAfterSave.schedules.evening_T4.assigned[0] === "NV005",
    "Lần lưu kế tiếp tự động chuẩn hóa dữ liệu cũ thành string ID"
  );
}

// -----------------------------------------------------------------------------
// TEST 4: Nhân viên đã nghỉ việc
// -----------------------------------------------------------------------------
console.log("\n4. Test: Nhân viên đã nghỉ việc (status = 'Nghỉ việc')");
{
  const db = loadDb();
  // Thêm nhân viên đã nghỉ việc vào db.employees
  db.employees.push({
    id: "NV_TERMINATED",
    name: "Nguyễn Đã Nghỉ",
    role: "Phục vụ",
    roleTag: "Staff",
    status: "Nghỉ việc",
    hourlyWage: 25000,
  });
  db.schedules.morning_T5 = {
    shiftId: "morning",
    dayId: "T5",
    assigned: ["NV_TERMINATED"],
  };
  saveDb();

  const readBack = getSavedSchedules();
  const emp = readBack.morning_T5.assigned[0];
  assert(
    emp.id === "NV_TERMINATED" &&
      emp.name === "Nguyễn Đã Nghỉ" &&
      emp.status === "Nghỉ việc",
    "Nhân viên đã nghỉ việc vẫn resolve chính xác giữ nguyên lịch sử"
  );
}

// -----------------------------------------------------------------------------
// TEST 5: ID không tồn tại
// -----------------------------------------------------------------------------
console.log("\n5. Test: ID không tồn tại trong danh sách nhân viên");
{
  const db = loadDb();
  db.schedules.night_CN = {
    shiftId: "night",
    dayId: "CN",
    assigned: ["NV999_UNKNOWN"],
  };
  saveDb();

  let readBack = null;
  let didCrash = false;
  try {
    readBack = getSavedSchedules();
  } catch {
    didCrash = true;
  }

  assert(!didCrash, "Không bị crash khi gặp ID không tồn tại");
  const fallback = readBack.night_CN.assigned[0];
  assert(
    fallback.id === "NV999_UNKNOWN" && fallback.name === "(không rõ)",
    "Trả về object tối thiểu { id, name: '(không rõ)' } an toàn"
  );
}

// -----------------------------------------------------------------------------
// TEST 6: Bỏ tên/role khi lưu request đổi ca & nghỉ phép, tự ghép khi đọc
// -----------------------------------------------------------------------------
console.log("\n6. Test: Request đổi ca và nghỉ phép loại bỏ lưu cứng tên/role khi lưu, tự ghép khi đọc");
{
  // Test Leave Requests
  const leaveInput = [
    {
      id: "LV-TEST-001",
      employeeId: "NV001",
      employeeName: "Tên Lưu Cứng Sẽ Bị Xóa",
      employeeRole: "Role Lưu Cứng Sẽ Bị Xóa",
      roleTag: "Tag Lưu Cứng",
      shiftDate: "Thứ 2, 2026-10-19",
      isoDate: "2026-10-19",
      status: "pending",
      replacementId: "NV002",
      replacementName: "Tên Thay Thế Cứng",
      replacementRole: "Role Thay Thế Cứng",
    },
  ];

  saveLeaveRequests(leaveInput);

  const rawDb = loadDb();
  const savedLeave = rawDb.leaveRequests.find((r) => r.id === "LV-TEST-001");
  assert(
    savedLeave.employeeName === undefined &&
      savedLeave.employeeRole === undefined &&
      savedLeave.replacementName === undefined,
    "db.leaveRequests đã loại bỏ các trường tên/role lưu cứng trong storage"
  );

  const readLeave = getLeaveRequests().find((r) => r.id === "LV-TEST-001");
  assert(
    readLeave.employeeName === "Nguyễn Văn An" &&
      readLeave.employeeRole === "Phục vụ" &&
      readLeave.roleTag === "Shift_Leader" &&
      readLeave.replacementName === "Trần Thị Bích" &&
      readLeave.replacementRole === "Pha chế",
    "getLeaveRequests tự ghép lại chính xác tên, vai trò từ db.employees"
  );

  // Test Exchange Requests
  const exchangeInput = [
    {
      id: "EX-TEST-001",
      requesterId: "NV002",
      requesterName: "Bích Cứng",
      requesterRole: "Pha chế Cứng",
      requesterRoleTag: "Barista Cứng",
      targetEmployeeId: "NV004",
      targetEmployeeName: "Dung Cứng",
      targetEmployeeRole: "Pha chế Cứng",
      targetEmployeeRoleTag: "Barista Cứng",
      exchangeType: "swap",
      status: "pending_peer",
    },
  ];

  saveExchangeRequests(exchangeInput);

  const savedExchange = rawDb.shiftExchanges.find((r) => r.id === "EX-TEST-001");
  assert(
    savedExchange.requesterName === undefined &&
      savedExchange.targetEmployeeName === undefined,
    "db.shiftExchanges đã loại bỏ các trường tên/role lưu cứng trong storage"
  );

  const readExchange = getExchangeRequests().find((r) => r.id === "EX-TEST-001");
  assert(
    readExchange.requesterName === "Trần Thị Bích" &&
      readExchange.targetEmployeeName === "Phạm Thị Dung" &&
      readExchange.requesterRoleTag === "Barista" &&
      readExchange.targetEmployeeRoleTag === "Barista",
    "getExchangeRequests tự ghép lại chính xác thông tin từ db.employees"
  );
}

// -----------------------------------------------------------------------------
// TEST 7: Duyệt đổi ca với kiểm tra ngày trong tuần áp dụng
// -----------------------------------------------------------------------------
console.log("\n7. Test: Duyệt đổi ca kiểm tra ngày trong tuần áp dụng");
{
  setDemoNow("2026-10-21T08:00:00");
  const today = startOfDay(getNow());
  const monday = mondayOf(today);
  const outOfRangeDate = toISO(addDays(monday, -10)); // 10 ngày trước (ngoài tuần)
  const inRangeDate = toISO(addDays(monday, 4)); // Thứ 6 trong tuần

  // 7a. Đơn ngoài tuần áp dụng -> phải ném lỗi "Ngày này không thuộc lịch đang áp dụng"
  const outReq = {
    id: "EX-OUT-WEEK",
    requesterId: "NV003",
    requesterShift: {
      dayId: "T6",
      shiftId: "afternoon",
      date: `Thứ 6, ${outOfRangeDate}`,
      isoDate: outOfRangeDate,
    },
    targetEmployeeId: "NV005",
    targetShift: {
      dayId: "T6",
      shiftId: "morning",
      date: `Thứ 6, ${outOfRangeDate}`,
      isoDate: outOfRangeDate,
    },
    exchangeType: "swap",
    status: "pending_manager",
  };

  const listWithOut = [outReq, ...getExchangeRequests()];
  saveExchangeRequests(listWithOut);

  let outError = null;
  try {
    managerApproveExchange("EX-OUT-WEEK");
  } catch (err) {
    outError = err.message;
  }

  assert(
    outError === "Ngày này không thuộc lịch đang áp dụng",
    `Ca ngoài tuần áp dụng bị từ chối với lỗi: "${outError}"`
  );

  // 7b. Đơn trong tuần áp dụng -> duyệt thành công, hoán đổi ca trong lịch
  const currentSched = getSavedSchedules();
  currentSched["afternoon_T6"] = {
    shiftId: "afternoon",
    dayId: "T6",
    assigned: ["NV003"],
  };
  currentSched["morning_T6"] = {
    shiftId: "morning",
    dayId: "T6",
    assigned: ["NV005"],
  };
  saveSchedules(currentSched);

  const inReq = {
    id: "EX-IN-WEEK",
    requesterId: "NV003",
    requesterShift: {
      dayId: "T6",
      shiftId: "afternoon",
      date: `Thứ 6, ${inRangeDate}`,
      isoDate: inRangeDate,
    },
    targetEmployeeId: "NV005",
    targetShift: {
      dayId: "T6",
      shiftId: "morning",
      date: `Thứ 6, ${inRangeDate}`,
      isoDate: inRangeDate,
    },
    exchangeType: "swap",
    status: "pending_manager",
  };

  saveExchangeRequests([inReq, ...getExchangeRequests()]);

  let inApproved = false;
  try {
    managerApproveExchange("EX-IN-WEEK");
    inApproved = true;
  } catch (err) {
    console.error("Lỗi duyệt:", err);
  }

  assert(inApproved, "Duyệt đơn trong tuần áp dụng thành công không bị lỗi");

  const schedAfterApprove = getSavedSchedules();
  const afternoonAssigned = schedAfterApprove["afternoon_T6"].assigned.map((e) => e.id);
  const morningAssigned = schedAfterApprove["morning_T6"].assigned.map((e) => e.id);

  assert(
    afternoonAssigned.includes("NV005") && !afternoonAssigned.includes("NV003"),
    "Ca chiều T6 đã được hoán đổi sang cho NV005"
  );
  assert(
    morningAssigned.includes("NV003") && !morningAssigned.includes("NV005"),
    "Ca sáng T6 đã được hoán đổi sang cho NV003"
  );
}

console.log(`\n=== TỔNG KẾT: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("Tất cả bài kiểm tra 1b đều THÀNH CÔNG RỰC RỠ!");
}
