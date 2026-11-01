/* global process */
/**
 * Test Suite: US09 - Xem khả năng làm việc của nhân viên (View Staff Availability)
 * Các trường hợp kiểm thử:
 * 1. Nhân viên chưa đăng ký không tính Rảnh (registered = false, ô xám, không cộng vào tổng ca rảnh)
 * 2. Nhân viên trạng thái "Nghỉ việc" bị loại bỏ hoàn toàn khỏi danh sách
 * 3. Tổng số ca Rảnh + Bận khớp chính xác 100% số ô của các nhân viên đã đăng ký
 * 4. Đổi tuần hiển thị ra đúng dữ liệu và khoảng ngày của tuần đó
 * 5. Đọc trạng thái từng ca: ca rảnh ra "Rảnh", ca bận ra "Bận"
 */

import {
  initDb,
  loadDb,
  getNow,
  mondayOf,
  startOfDay,
  addDays,
  toISO,
  getWeeklyAvailability,
} from "../../src/mocks/db.js";
import { getSlotStatus, getSlotLabel } from "../../src/pages/manager/availability/availabilityHelpers.js";

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

console.log("=== BẮT ĐẦU KIỂM THỬ US09: KHẢ NĂNG LÀM VIỆC CỦA NHÂN VIÊN ===\n");
initDb(getNow());

const currentMonday = mondayOf(startOfDay(getNow()));
const nextMonday = addDays(currentMonday, 7);
const currentMondayIso = toISO(currentMonday);
const nextMondayIso = toISO(nextMonday);

// 1. KIỂM THỬ: Nhân viên chưa đăng ký không tính Rảnh
console.log("--- 1. KIỂM THỬ: Nhân viên chưa đăng ký không tính Rảnh ---");
{
  const dataNextWeek = getWeeklyAvailability(nextMondayIso);
  const activeCount = dataNextWeek.employees.length;
  const nv004 = dataNextWeek.employees.find((e) => e.id === "NV004");
  assert(nv004 !== undefined, "Tìm thấy nhân viên NV004 trong danh sách nhân viên");
  assert(nv004 && nv004.registered === false, "NV004 có registered === false (Chưa đăng ký)");
  assert(nv004 && nv004.submittedAt === null, "NV004 có submittedAt === null");
  assert(dataNextWeek.summary.registeredCount === 6, `Đã đăng ký = 6 (thực tế: ${dataNextWeek.summary.registeredCount})`);
  assert(dataNextWeek.summary.unregisteredCount === 1, `Chưa đăng ký = 1 (thực tế: ${dataNextWeek.summary.unregisteredCount})`);
  assert(dataNextWeek.summary.registeredCount + dataNextWeek.summary.unregisteredCount === activeCount, "Tổng đăng ký khớp tổng nhân viên");

  let nv004AvailableCount = 0;
  dataNextWeek.days.forEach((day) => {
    dataNextWeek.shifts.forEach((shift) => {
      if (nv004?.slots?.[`${day.dayIndex}_${shift.name}`] === "available") nv004AvailableCount++;
    });
  });
  assert(nv004AvailableCount === 0, "NV004 chưa đăng ký nên không có ca nào tính là Rảnh");
}

// 2. KIỂM THỬ: Nhân viên 'Nghỉ việc' bị loại bỏ
console.log("\n--- 2. KIỂM THỬ: Nhân viên 'Nghỉ việc' bị loại bỏ hoàn toàn ---");
{
  const data = getWeeklyAvailability(nextMondayIso);
  assert(data.employees.filter((e) => e.status === "Nghỉ việc").length === 0, "Không có NV 'Nghỉ việc'");
  assert(data.employees.find((e) => e.id === "NV006") === undefined, "NV006 'Nghỉ việc' đã bị loại bỏ");

  const db = loadDb();
  db.employees.push({ id: "NV_TEST_RESIGNED", name: "Nhân Viên Thôi Việc", roleTag: "Barista", status: "Nghỉ việc" });
  assert(getWeeklyAvailability(nextMondayIso).employees.find((e) => e.id === "NV_TEST_RESIGNED") === undefined, "NV vừa nghỉ việc bị loại trừ");
  db.employees = db.employees.filter((e) => e.id !== "NV_TEST_RESIGNED");
}

// 3. KIỂM THỬ: Tổng Rảnh + Bận khớp số ô
console.log("\n--- 3. KIỂM THỬ: Tổng Rảnh + Bận khớp số ô ---");
{
  const data = getWeeklyAvailability(nextMondayIso);
  const { totalAvailable, totalBusy, registeredCount } = data.summary;
  const shiftCount = data.shifts.length;
  const expectedTotalSlots = registeredCount * 7 * shiftCount;

  assert(shiftCount > 0, `Số ca làm việc cấu hình = ${shiftCount}`);
  assert(totalAvailable + totalBusy === expectedTotalSlots, `Tổng Rảnh (${totalAvailable}) + Bận (${totalBusy}) = ${expectedTotalSlots}`);

  const regEmps = data.employees.filter((e) => e.registered);
  let allMatch = true;
  regEmps.forEach((emp) => {
    let empAvail = 0;
    let empBusy = 0;
    data.days.forEach((day) => {
      data.shifts.forEach((shift) => {
        const val = emp.slots?.[`${day.dayIndex}_${shift.name}`];
        if (val === "available") empAvail++;
        if (val === "busy") empBusy++;
      });
    });
    if (empAvail + empBusy !== 7 * shiftCount) allMatch = false;
  });
  assert(allMatch, "Mỗi nhân viên đã nộp đơn đều có tổng Rảnh + Bận đúng bằng 21 ô");
}

// 4. KIỂM THỬ: Đổi tuần ra đúng dữ liệu
console.log("\n--- 4. KIỂM THỬ: Đổi tuần ra đúng dữ liệu ---");
{
  const dataNext = getWeeklyAvailability(nextMondayIso);
  assert(dataNext.weekMonday === nextMondayIso, `Tuần kế tiếp có weekMonday = ${nextMondayIso}`);
  assert(dataNext.summary.registeredCount === 6, "Tuần kế tiếp có 6 người đã gửi, 1 người chưa gửi");

  const dataCurrent = getWeeklyAvailability(currentMondayIso);
  assert(dataCurrent.weekMonday === currentMondayIso, `Tuần hiện tại có weekMonday = ${currentMondayIso}`);
  assert(dataCurrent.weekMonday !== dataNext.weekMonday, "Hai tuần có mốc Thứ 2 khác nhau");
  assert(dataCurrent.days[0].dateIso === currentMondayIso, `Ngày Thứ 2 hiện tại khớp ${currentMondayIso}`);
  assert(dataNext.days[0].dateIso === nextMondayIso, `Ngày Thứ 2 kế tiếp khớp ${nextMondayIso}`);
  assert(dataCurrent.summary.registeredCount === 7, "Tuần hiện tại đã đủ 7 nhân viên đăng ký");
  assert(dataCurrent.summary.unregisteredCount === 0, "Tuần hiện tại có 0 nhân viên chưa đăng ký");

  const futureMondayIso = toISO(addDays(currentMonday, 21));
  const dataFuture = getWeeklyAvailability(futureMondayIso);
  assert(dataFuture.summary.registeredCount === 0, "Tuần tương lai chưa ai nộp: registeredCount === 0");
  assert(dataFuture.summary.unregisteredCount === dataFuture.summary.totalEmployees, "Tuần tương lai: 100% chưa đăng ký");
}

// 5. KIỂM THỬ: Đọc trạng thái từng ca (ca rảnh ra "Rảnh", ca bận ra "Bận")
console.log("\n--- 5. KIỂM THỬ: Đọc trạng thái từng ca (ca rảnh ra 'Rảnh', ca bận ra 'Bận') ---");
{
  const data = getWeeklyAvailability(nextMondayIso);
  const nv001 = data.employees.find((e) => e.id === "NV001");
  assert(nv001 && nv001.registered, "NV001 đã đăng ký khả năng làm việc");

  // Kiểm tra NV001 ca Sáng Thứ 2 (đã đăng ký available)
  const statusAvail = getSlotStatus(nv001, 0, "Sáng");
  const labelAvail = getSlotLabel(statusAvail);
  assert(statusAvail === "available", "NV001 ca Sáng Thứ 2 có status = 'available'");
  assert(labelAvail === "Rảnh", `Ca rảnh đọc ra đúng nhãn 'Rảnh' (thực tế: '${labelAvail}')`);

  // Kiểm tra NV001 ca Tối Thứ 2 (đã đăng ký busy)
  const statusBusy = getSlotStatus(nv001, 0, "Tối");
  const labelBusy = getSlotLabel(statusBusy);
  assert(statusBusy === "busy", "NV001 ca Tối Thứ 2 có status = 'busy'");
  assert(labelBusy === "Bận", `Ca bận đọc ra đúng nhãn 'Bận' (thực tế: '${labelBusy}')`);

  // Kiểm tra NV004 (chưa đăng ký)
  const nv004 = data.employees.find((e) => e.id === "NV004");
  const statusUnreg = getSlotStatus(nv004, 0, "Sáng");
  assert(statusUnreg === "unregistered", "NV004 chưa đăng ký có status = 'unregistered'");
  assert(getSlotLabel(statusUnreg) === "Chưa đăng ký", "NV004 chưa đăng ký có label = 'Chưa đăng ký'");

  // Duyệt toàn bộ các ô của tất cả nhân viên đã đăng ký: số nhãn 'Rảnh' và 'Bận' khớp 100% summary
  let countRan = 0;
  let countBan = 0;
  data.employees.filter((e) => e.registered).forEach((emp) => {
    data.days.forEach((day) => {
      data.shifts.forEach((shift) => {
        const lb = getSlotLabel(getSlotStatus(emp, day.dayIndex, shift.name));
        if (lb === "Rảnh") countRan++;
        if (lb === "Bận") countBan++;
      });
    });
  });
  assert(countRan === data.summary.totalAvailable, `Tổng nhãn 'Rảnh' (${countRan}) khớp 100% summary.totalAvailable (${data.summary.totalAvailable})`);
  assert(countBan === data.summary.totalBusy, `Tổng nhãn 'Bận' (${countBan}) khớp 100% summary.totalBusy (${data.summary.totalBusy})`);
}

console.log(`\n=== TỔNG KẾT US09: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
