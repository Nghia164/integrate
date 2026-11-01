/* global process */
// =============================================================================
// File: tests/test_auto_schedule_availability.js
// US11: Xếp lịch tự động phải tôn trọng lịch rảnh (US08/US09)
// (a) Nhân viên Bận không xuất hiện; (b) Chưa đăng ký không xếp; (c) Đánh dấu thiếu người
// =============================================================================

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

import {
  initDb, loadDb, getNow, setDemoNow, clearDemoNow, mondayOf, startOfDay,
  addDays, toISO, isEmployeeAvailable, generateInitialScheduleDict,
  saveStaffAvailability, liveEmployeeRoster as employeeRoster,
} from "../../src/mocks/db.js";
import { autoScheduleORTools } from "../../src/pages/manager/schedule/scheduleSolver.js";

let passed = 0;
let failed = 0;
const assert = (cond, msg) => {
  if (cond) { console.log(`  [PASS] ${msg}`); passed++; }
  else { console.error(`  [FAIL] ${msg}`); failed++; }
};

console.log("=== BẮT ĐẦU KIỂM THỬ: US11 XẾP LỊCH TỰ ĐỘNG TÔN TRỌNG LỊCH RẢNH US08/US09 ===\n");
setDemoNow("2026-10-26T08:00:00");
initDb(getNow());

const curMonIso = toISO(mondayOf(startOfDay(getNow()))); // 2026-10-26
const nextMonIso = toISO(addDays(mondayOf(startOfDay(getNow())), 7)); // 2026-11-02
const shiftDemands = [
  { id: "morning", name: "Sáng", phucVu: 1, phaChe: 1, thuNgan: 0, total: 2 },
  { id: "afternoon", name: "Chiều", phucVu: 0, phaChe: 1, thuNgan: 1, total: 2 },
  { id: "evening", name: "Tối", phucVu: 1, phaChe: 0, thuNgan: 1, total: 2 },
];

// 1. Kiểm tra hàm isEmployeeAvailable
console.log("1. Kiểm tra hàm isEmployeeAvailable:");
assert(isEmployeeAvailable("NV001", curMonIso, 0, "Sáng") === true, "NV001 rảnh sáng T2 -> true");
assert(isEmployeeAvailable("NV002", curMonIso, 0, "Sáng") === false, "NV002 bận sáng T2 -> false");
assert(isEmployeeAvailable("NV004", nextMonIso, 0, "Sáng") === false, "NV004 chưa đăng ký -> false");
assert(isEmployeeAvailable("NV006", curMonIso, 0, "Sáng") === false, "NV006 đã nghỉ việc -> false");

// 2. Yêu cầu (a): Nhân viên Bận ca X không bao giờ xuất hiện ở ca X
console.log("\n2. Yêu cầu (a): Nhân viên Bận ca X không bao giờ xuất hiện ở ca X sau khi xếp lịch:");
const initSched = generateInitialScheduleDict(loadDb().employees, curMonIso);
assert(!(initSched.morning_T2?.assigned || []).includes("NV002"), "generateInitialScheduleDict: NV002 bận sáng T2 không có trong morning_T2");

const autoCur = autoScheduleORTools({ currentSchedules: {}, shiftDemands, employeeRoster, weekKey: curMonIso });
assert(!(autoCur.morning_T2?.assigned || []).some(e => e.id === "NV002"), "autoScheduleORTools: NV002 bận sáng T2 không bị xếp vào morning_T2");

const autoNext = autoScheduleORTools({ currentSchedules: {}, shiftDemands, employeeRoster, weekKey: nextMonIso });
assert(!(autoNext.evening_T2?.assigned || []).some(e => e.id === "NV001"), "autoScheduleORTools: NV001 bận tối T2 tuần sau không bị xếp vào evening_T2");

// 3. Yêu cầu (b): Nhân viên Chưa đăng ký không được xếp
console.log("\n3. Yêu cầu (b): Nhân viên Chưa đăng ký không được xếp:");
let nv004AutoCount = 0;
Object.values(autoNext).forEach(s => (s.assigned || []).forEach(e => { if (e.id === "NV004") nv004AutoCount++; }));
assert(nv004AutoCount === 0, `autoScheduleORTools: NV004 chưa đăng ký không được xếp ca nào (thực tế: ${nv004AutoCount})`);

const initNext = generateInitialScheduleDict(loadDb().employees, nextMonIso);
let nv004InitCount = 0;
Object.values(initNext).forEach(s => (s.assigned || []).forEach(id => { if (id === "NV004") nv004InitCount++; }));
assert(nv004InitCount === 0, "generateInitialScheduleDict: NV004 chưa đăng ký không có ca nào");

// 4. Yêu cầu (c): Ca không ai rảnh được đánh dấu thiếu người
console.log("\n4. Yêu cầu (c): Ca không ai rảnh được đánh dấu thiếu người:");
saveStaffAvailability("NV001", curMonIso, { "1_Tối": "busy" });
saveStaffAvailability("NV002", curMonIso, { "1_Tối": "busy" });
saveStaffAvailability("NV003", curMonIso, { "1_Tối": "busy" });
saveStaffAvailability("NV005", curMonIso, { "1_Tối": "busy" });

const schedMissing = autoScheduleORTools({ currentSchedules: {}, shiftDemands, employeeRoster, weekKey: curMonIso });
const eveT3 = schedMissing.evening_T3;
const demandTotal = shiftDemands.find(d => d.id === "evening").total;
const missing = demandTotal - (eveT3?.assigned?.length || 0);

assert((eveT3?.assigned?.length || 0) === 0, "Khi tất cả bận, ca tối T3 để trống hoàn toàn (assigned.length === 0)");
assert(missing === demandTotal && missing > 0, `Ca tối T3 đánh dấu thiếu ${missing}/${demandTotal} NV (không gán bừa)`);

// 5. Loại trừ nhân viên "Nghỉ việc"
console.log("\n5. Kiểm tra loại trừ nhân viên Nghỉ việc:");
let resignedCount = 0;
Object.values(autoCur).forEach(s => (s.assigned || []).forEach(e => { if (e.id === "NV006" || e.status === "Nghỉ việc") resignedCount++; }));
assert(resignedCount === 0, "Nhân viên Nghỉ việc (NV006) không bao giờ bị xếp vào lịch");

clearDemoNow();
console.log(`\n=== TỔNG KẾT: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
