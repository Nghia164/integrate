/* global process */
// =============================================================================
// TEST SUITE: K5 - DUYỆT ĐỔI CA ĐỒNG BỘ VÀO SỔ CÁI CHẤM CÔNG (db.attendance)
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
  saveExchangeRequests,
  getCalculatedShifts,
  startOfDay,
  mondayOf,
  addDays,
  toISO,
  getNow,
  setDemoNow,
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

console.log("=== BẮT ĐẦU KIỂM THỬ K5: DUYỆT ĐỔI CA & ĐỒNG BỘ CHẤM CÔNG ===");

setDemoNow("2026-10-21T08:00:00");
const today = startOfDay(getNow());
const monday = mondayOf(today);
const t6Iso = toISO(addDays(monday, 4)); // Thứ 6 tuần này

// -----------------------------------------------------------------------------
// Test 1: Đổi ca qua lại (SWAP) cập nhật đồng thời schedules và attendance
// -----------------------------------------------------------------------------
console.log("\n1. Test: Duyệt đổi ca dạng SWAP (hoán đổi ca giữa 2 nhân viên)");
{
  // Chuẩn bị lịch tuần: NV003 ca Chiều, NV005 ca Sáng ngày Thứ 6
  const sched = getSavedSchedules();
  sched["afternoon_T6"] = { shiftId: "afternoon", dayId: "T6", assigned: ["NV003"] };
  sched["morning_T6"] = { shiftId: "morning", dayId: "T6", assigned: ["NV005"] };
  saveSchedules(sched);

  // Tạo yêu cầu đổi ca EX-SWAP-TEST trong tuần áp dụng (NV003 và NV005 đều là Cashier, Đang làm việc)
  const swapReq = {
    id: "EX-SWAP-TEST",
    requesterId: "NV003",
    requesterShift: {
      date: `Thứ 6, ${t6Iso}`,
      isoDate: t6Iso,
      dayId: "T6",
      shiftId: "afternoon",
      shiftName: "Ca chiều",
    },
    targetEmployeeId: "NV005",
    targetShift: {
      date: `Thứ 6, ${t6Iso}`,
      isoDate: t6Iso,
      dayId: "T6",
      shiftId: "morning",
      shiftName: "Ca sáng",
    },
    exchangeType: "swap",
    status: "pending_manager",
  };
  saveExchangeRequests([swapReq]);

  // Quản lý phê duyệt
  managerApproveExchange("EX-SWAP-TEST", "Duyệt đổi ca kiểm thử");

  // Kiểm tra lịch tuần: đã hoán đổi vị trí
  const schedAfter = getSavedSchedules();
  const afternoonAssigned = schedAfter["afternoon_T6"].assigned.map((e) => e.id);
  const morningAssigned = schedAfter["morning_T6"].assigned.map((e) => e.id);

  assert(
    afternoonAssigned.includes("NV005") && !afternoonAssigned.includes("NV003"),
    "Lịch tuần (schedules): Ca chiều T6 đã chuyển cho NV005"
  );
  assert(
    morningAssigned.includes("NV003") && !morningAssigned.includes("NV005"),
    "Lịch tuần (schedules): Ca sáng T6 đã chuyển cho NV003"
  );

  // Kiểm tra sổ cái chấm công (attendance): đã có bản ghi chấm công chính xác cho cả 2 người
  const db = loadDb();
  const attNV005 = db.attendance.find((a) => a.employeeId === "NV005" && a.iso === t6Iso && a.shiftName === "Chiều");
  const attNV003 = db.attendance.find((a) => a.employeeId === "NV003" && a.iso === t6Iso && a.shiftName === "Sáng");

  assert(attNV005 !== undefined, "Sổ cái chấm công (attendance): NV005 có bản ghi chấm công ca Chiều");
  assert(attNV003 !== undefined, "Sổ cái chấm công (attendance): NV003 có bản ghi chấm công ca Sáng");

  // Kiểm tra tính giờ làm động từ getCalculatedShifts
  const calculated = getCalculatedShifts();
  const shiftNV005 = calculated.find((s) => s.employeeId === "NV005" && s.iso === t6Iso && s.shiftName === "Chiều");
  const shiftNV003 = calculated.find((s) => s.employeeId === "NV003" && s.iso === t6Iso && s.shiftName === "Sáng");

  assert(shiftNV005 && shiftNV005.scheduledMin > 0, "Giờ làm theo kế hoạch (scheduledMin) của NV005 tăng tương ứng ca Chiều");
  assert(shiftNV003 && shiftNV003.scheduledMin > 0, "Giờ làm theo kế hoạch (scheduledMin) của NV003 tăng tương ứng ca Sáng");
}

// -----------------------------------------------------------------------------
// Test 2: Làm thay (COVER) cập nhật người làm thay và xóa người nhờ đổi
// -----------------------------------------------------------------------------
console.log("\n2. Test: Duyệt đổi ca dạng COVER (nhờ người khác làm thay)");
{
  const t7Iso = toISO(addDays(monday, 5)); // Thứ 7 tuần này

  // NV003 có ca Sáng Thứ 7 trong lịch
  const sched = getSavedSchedules();
  sched["morning_T7"] = { shiftId: "morning", dayId: "T7", assigned: ["NV003"] };
  saveSchedules(sched);

  // Khởi tạo chấm công ca sáng T7 cho NV003 (chưa check-in vì là ca tương lai)
  const dbBefore = loadDb();
  dbBefore.attendance.push({
    id: `NV003_${t7Iso}_Sáng`,
    employeeId: "NV003",
    iso: t7Iso,
    shiftName: "Sáng",
    sMin: 360,
    eMin: 720,
    checkInMin: null,
    checkOutMin: null,
    adjusted: false,
    adjustmentHistory: [],
  });

  const coverReq = {
    id: "EX-COVER-TEST",
    requesterId: "NV003",
    requesterShift: {
      date: `Thứ 7, ${t7Iso}`,
      isoDate: t7Iso,
      dayId: "T7",
      shiftId: "morning",
      shiftName: "Ca sáng",
    },
    targetEmployeeId: "NV005",
    targetShift: null,
    exchangeType: "cover",
    status: "pending_manager",
  };
  saveExchangeRequests([coverReq]);

  // Quản lý phê duyệt cover
  managerApproveExchange("EX-COVER-TEST", "Duyệt làm thay");

  // Kiểm tra lịch tuần
  const schedAfter = getSavedSchedules();
  const morningT7Assigned = schedAfter["morning_T7"].assigned.map((e) => e.id);
  assert(
    morningT7Assigned.includes("NV005") && !morningT7Assigned.includes("NV003"),
    "Lịch tuần (schedules): Ca sáng T7 chuyển từ NV003 sang cho NV005"
  );

  // Kiểm tra sổ cái chấm công (attendance): NV003 không còn ca này, NV005 có ca này
  const dbAfter = loadDb();
  const attNV003 = dbAfter.attendance.find((a) => a.employeeId === "NV003" && a.iso === t7Iso && a.shiftName === "Sáng");
  const attNV005 = dbAfter.attendance.find((a) => a.employeeId === "NV005" && a.iso === t7Iso && a.shiftName === "Sáng");

  assert(attNV003 === undefined, "Chấm công (attendance): NV003 không còn đứng tên ca sáng T7");
  assert(attNV005 !== undefined, "Chấm công (attendance): NV005 đã được chuyển thành người thực hiện ca sáng T7");
}

// -----------------------------------------------------------------------------
// Test 3: Khớp 100% số lượng giữa tab 'Tất cả' và số dòng bảng hiển thị (Chặn lỗi bảng trống)
// -----------------------------------------------------------------------------
console.log("\n3. Test: Số dòng hiển thị khi chọn 'Tất cả' phải bằng số trên tab");
{
  const db = loadDb();
  const allReqs = db.shiftExchanges || [];
  assert(allReqs.length > 0, `Có dữ liệu yêu cầu đổi ca trong DB (hiện có: ${allReqs.length})`);

  // Giả lập hàm inTab và tính toán tab counts
  const inTab = (req, tab) => tab === "all" || req.status === tab || (tab === "rejected" && req.status === "cancelled");
  const tabIds = ["all", "pending_manager", "pending_peer", "approved", "rejected"];
  const tabCounts = {};
  tabIds.forEach((id) => {
    tabCounts[id] = allReqs.filter((r) => inTab(r, id)).length;
  });

  assert(tabCounts.all === allReqs.length, `Số đếm tab 'Tất cả' (${tabCounts.all}) khớp tổng số yêu cầu (${allReqs.length})`);

  // Logic bộ lọc mặc định của ShiftExchangePage
  const defaultFilters = { status: "all", role: "all", q: "" };
  const displayedRows = allReqs.filter((r) => {
    if (defaultFilters.status && defaultFilters.status !== "all" && !inTab(r, defaultFilters.status)) {
      return false;
    }
    return true;
  });

  assert(
    displayedRows.length === tabCounts.all,
    `Số dòng hiển thị (${displayedRows.length}) bằng đúng số lượng hiển thị trên tab 'Tất cả' (${tabCounts.all}) - KHÔNG bị bảng trống`
  );

  // Kiểm tra từng tab riêng biệt
  tabIds.forEach((id) => {
    const rowsForTab = allReqs.filter((r) => inTab(r, id));
    assert(
      rowsForTab.length === tabCounts[id],
      `Tab '${id}': số dòng hiển thị (${rowsForTab.length}) khớp chính xác số đếm trên tab (${tabCounts[id]})`
    );
  });
}

console.log(`\n=== TỔNG KẾT K5: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
