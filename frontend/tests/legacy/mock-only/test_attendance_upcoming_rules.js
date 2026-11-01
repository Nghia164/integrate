/* global process */
/**
 * Tầng: Kiểm thử tự động (Unit Test)
 * Chức năng: Kiểm tra quy tắc đối soát chấm công ca chưa diễn ra (Upcoming), ca đang diễn ra (In-Progress)
 *            và đối soát số liệu thống nhất giữa Chấm công, Báo cáo, Dashboard, Giờ làm, Bảng lương.
 * Liên quan: US25 (Đối soát chấm công), US26 (Điều chỉnh chấm công), US27 (Tính lương), US28 (Dashboard), US26 (Báo cáo)
 */

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

  import {
  initDb,
  setDemoNow,
  clearDemoNow,
  getNow,
  buildAttendance,
  buildDashboard,
  buildWorkHoursSummary,
  buildWorkHoursDetail,
  computePayroll,
  getCalculatedShifts,
  listShifts,
} from "../../src/mocks/db.js";

import { buildReport } from "../../src/mocks/reportMock.js";

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

console.log("=== BẮT ĐẦU KIỂM THỬ: QUY TẮC CHẤM CÔNG UPCOMING, IN-PROGRESS VÀ MẪU SỐ TỶ LỆ ===\n");

// -----------------------------------------------------------------------------
// MỐC 1: THỨ HAI 08:00 (ĐẦU TUẦN) - 2026-10-19T08:00:00
// -----------------------------------------------------------------------------
console.log("--- 1. MỐC THỨ HAI 08:00 (ĐẦU TUẦN) ---");
{
  setDemoNow("2026-10-19T08:00:00");
  initDb(getNow());

  const att = buildAttendance({ period: "week" });
  const dash = buildDashboard({ period: "week" });
  const shifts = getCalculatedShifts();

  // Ca thứ 2 từ 06:00 - 12:00 đang diễn ra (In-Progress)
  const mondayMorning = shifts.filter((s) => s.iso === "2026-10-19" && s.shiftName === "Sáng");
  assert(mondayMorning.length > 0, "Có ca sáng Thứ 2");
  mondayMorning.forEach((s) => {
    assert(s.status === "In-Progress", `Ca sáng Thứ 2 của ${s.employeeId} có trạng thái In-Progress, không phải Absent`);
    assert(s.absent === false, `Ca sáng Thứ 2 của ${s.employeeId} absent === false`);
  });

  // Toàn bộ các ca còn lại trong tuần (chiều, tối T2 và từ T3 đến CN) phải là Upcoming
  const futureShifts = shifts.filter((s) => s.iso > "2026-10-19" || (s.iso === "2026-10-19" && s.shiftName !== "Sáng"));
  assert(futureShifts.length > 0, "Có các ca tương lai trong tuần");
  const futureAbsentCount = futureShifts.filter((s) => s.status === "Absent").length;
  assert(futureAbsentCount === 0, `Không có bất kỳ ca tương lai nào bị đánh dấu Absent (thực tế: ${futureAbsentCount})`);

  // Tại 08:00 sáng Thứ 2 chưa có ca nào kết thúc -> completedTotal = 0
  assert(att.counts.completedTotal === 0, `completedTotal tại 08:00 T2 bằng 0 (thực tế: ${att.counts.completedTotal})`);
  assert(dash.cards.absentRate === 0, `Tỷ lệ vắng Dashboard = 0% khi chưa có ca kết thúc (thực tế: ${dash.cards.absentRate})`);
  assert(dash.cards.lateRate === 0, `Tỷ lệ trễ Dashboard = 0% khi chưa có ca kết thúc (thực tế: ${dash.cards.lateRate})`);

  // Giờ làm và Bảng lương không tính ca tương lai là vắng
  const workSummary = buildWorkHoursSummary({ period: "week" });
  assert(workSummary.rows.every((r) => r.shiftCount >= 0), "Tổng hợp giờ làm hoạt động bình thường");
  const payroll = computePayroll(listShifts({ period: "week" }));
  assert(payroll.length === 0, "Bảng lương trả về 0 dòng vì chưa có ca nào kết thúc trong tuần");
}

// -----------------------------------------------------------------------------
// MỐC 2: THỨ TƯ 16:00 (GIỮA TUẦN) - 2026-10-21T16:00:00
// -----------------------------------------------------------------------------
console.log("\n--- 2. MỐC THỨ TƯ 16:00 (GIỮA TUẦN) ---");
{
  setDemoNow("2026-10-21T16:00:00");
  initDb(getNow());

  const att = buildAttendance({ period: "week" });
  const dash = buildDashboard({ period: "week" });
  const shifts = getCalculatedShifts();

  // Ca thứ 5, 6, 7, CN tuyệt đối không được là Absent
  const upcomingDaysShifts = shifts.filter((s) => s.iso > "2026-10-21");
  const upcomingAbsent = upcomingDaysShifts.filter((s) => s.status === "Absent").length;
  assert(upcomingAbsent === 0, `Các ngày tương lai (22-25/10) không có ca nào Absent (thực tế: ${upcomingAbsent})`);
  assert(upcomingDaysShifts.every((s) => s.status === "Upcoming" || s.status === "On-Leave"), "Tất cả ca các ngày sau Thứ 4 đều có status = Upcoming hoặc On-Leave");

  // Ca chiều Thứ 4 (12:00 - 17:00) lúc 16:00 đang diễn ra -> In-Progress
  const wedAfternoon = shifts.filter((s) => s.iso === "2026-10-21" && s.shiftName === "Chiều");
  wedAfternoon.forEach((s) => {
    assert(s.status === "In-Progress", `Ca chiều Thứ 4 của ${s.employeeId} có status In-Progress`);
    assert(s.absent === false, `Ca chiều Thứ 4 của ${s.employeeId} absent === false`);
  });

  // Ca tối Thứ 4 (17:00 - 22:00) chưa diễn ra -> Upcoming
  const wedEvening = shifts.filter((s) => s.iso === "2026-10-21" && s.shiftName === "Tối");
  wedEvening.forEach((s) => {
    assert(s.status === "Upcoming", `Ca tối Thứ 4 của ${s.employeeId} có status Upcoming`);
    assert(s.absent === false, `Ca tối Thứ 4 của ${s.employeeId} absent === false`);
  });

  // Mẫu số tỷ lệ vắng và trễ phải là completedTotal (ca đã kết thúc)
  assert(att.counts.completedTotal > 0, `Có ca đã kết thúc: completedTotal = ${att.counts.completedTotal}`);
  assert(att.counts.completedTotal < att.counts.total, `completedTotal (${att.counts.completedTotal}) < total (${att.counts.total}) vì có ca Upcoming/In-Progress`);
  assert(dash.cards.completedShifts === att.counts.completedTotal, "Dashboard cards.completedShifts khớp với counts.completedTotal của Chấm công");

  // Kiểm tra công thức tỷ lệ vắng Dashboard: absentCount / completedTotal * 100
  const expectedAbsentRate = Math.round((dash.cards.absentCount / att.counts.completedTotal) * 1000) / 10;
  assert(dash.cards.absentRate === expectedAbsentRate, `Dashboard absentRate (${dash.cards.absentRate}%) tính đúng theo mẫu số completedTotal (${expectedAbsentRate}%)`);

  // Đối soát số liệu giữa Chấm công, Dashboard và Báo cáo
  const attReport = buildReport("attendance", { period: "week" });
  assert(att.counts.Absent === dash.cards.absentCount, `Số ca vắng ở Chấm công (${att.counts.Absent}) khớp Dashboard (${dash.cards.absentCount})`);
  const reportAbsentCount = attReport.rows.filter((r) => r.status === "Absent").length;
  assert(att.counts.Absent === reportAbsentCount, `Số ca vắng ở Chấm công khớp Báo cáo xuất Excel (${reportAbsentCount})`);

  // Bảng lương chỉ tính ca đã kết thúc
  const payroll = computePayroll(listShifts({ period: "week" }));
  const payrollShiftSum = payroll.reduce((acc, r) => acc + r.shiftCount, 0);
  assert(payrollShiftSum <= att.counts.completedTotal, `Tổng số ca trong Bảng lương (${payrollShiftSum}) <= completedTotal (${att.counts.completedTotal})`);

  // Chi tiết giờ làm của nhân viên
  const detail = buildWorkHoursDetail("NV001", { period: "week" });
  const futureDetailAbsent = detail.filter((r) => r.status === "Upcoming" && r.absent === true).length;
  assert(futureDetailAbsent === 0, "Chi tiết giờ làm không bao giờ đánh dấu ca Upcoming là absent = true");
}

// -----------------------------------------------------------------------------
// MỐC 3: CHỦ NHẬT 23:00 (CUỐI TUẦN) - 2026-10-25T23:00:00
// -----------------------------------------------------------------------------
console.log("\n--- 3. MỐC CHỦ NHẬT 23:00 (CUỐI TUẦN) ---");
{
  setDemoNow("2026-10-25T23:00:00");
  initDb(getNow());

  const att = buildAttendance({ period: "week" });
  const dash = buildDashboard({ period: "week" });
  const shifts = getCalculatedShifts();

  // Cuối tuần: mọi ca trong tuần đều đã kết thúc
  const upcomingCount = shifts.filter((s) => s.status === "Upcoming").length;
  const inProgressCount = shifts.filter((s) => s.status === "In-Progress").length;
  assert(upcomingCount === 0, `Đến 23:00 CN, số ca Upcoming = 0 (thực tế: ${upcomingCount})`);
  assert(inProgressCount === 0, `Đến 23:00 CN, số ca In-Progress = 0 (thực tế: ${inProgressCount})`);

  // Lúc này completedTotal === total
  assert(att.counts.completedTotal === att.counts.total, `completedTotal (${att.counts.completedTotal}) === total (${att.counts.total})`);

  // Kiểm tra ca vừa kết thúc không có check-in sẽ là Absent (hoặc On-Leave nếu có phép)
  const sundayEvening = shifts.filter((s) => s.iso === "2026-10-25" && s.shiftName === "Tối");
  sundayEvening.forEach((s) => {
    if (s.checkInMin == null && s.status !== "On-Leave") {
      assert(s.status === "Absent", `Ca tối CN không check-in của ${s.employeeId} là Absent`);
    }
  });

  // Số liệu Chấm công, Dashboard và Báo cáo hoàn toàn đồng nhất
  const attReport = buildReport("attendance", { period: "week" });
  assert(att.counts.total === dash.cards.totalShifts, "Tổng ca Chấm công khớp Dashboard");
  assert(att.counts.Absent === dash.cards.absentCount, "Số ca vắng Chấm công khớp Dashboard");
  assert(att.counts.total === attReport.rows.length, "Tổng ca Chấm công khớp Báo cáo");

  // Dọn dẹp
  clearDemoNow();
}

console.log(`\n=== TỔNG KẾT: ${passed} PASS, ${failed} FAIL ===`);
if (failed > 0) process.exit(1);
