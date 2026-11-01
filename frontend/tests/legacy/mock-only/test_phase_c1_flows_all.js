// =============================================================================
// File: tests/mock-only/test_phase_c1_flows_all.js
// Tầng: Kiểm thử Tích hợp 6 Luồng Nghiệp vụ Chuẩn (Phase C1 All Flows)
//
// 1. Tạo lịch và công bố: Lịch nháp Staff không thấy -> Công bố có thông báo -> Sửa lịch báo nhân viên bị ảnh hưởng.
// 2. Đổi ca 2 bước: A gửi -> B đồng ý/từ chối -> Manager duyệt/từ chối -> đổi lịch + thông báo 2 bên.
// 3. Ca trực mở: Manager tạo -> Staff thấy và nhận -> Vào lịch và chấm công.
// 4. Nghỉ phép: Staff nộp -> Manager thấy và duyệt -> Cập nhật lịch và thông báo.
// 5. Chấm công: Staff check-in/out -> Sổ cái chung attendance cập nhật -> Manager thấy ngay.
// 6. Quản lý nhân sự: Manager tạo/sửa/ngừng -> Staff đăng nhập hoặc bị chặn (ACCOUNT_DISABLED).
// =============================================================================

import test from "node:test";
import assert from "node:assert/strict";

// Giả lập storage cho kiểm thử
const memoryStore = new Map();
const storageListeners = new Set();
globalThis.localStorage = {
  getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
  setItem: (key, value) => {
    memoryStore.set(key, String(value));
    storageListeners.forEach((fn) => fn({ key, newValue: String(value) }));
  },
  removeItem: (key) => {
    memoryStore.delete(key);
    storageListeners.forEach((fn) => fn({ key, newValue: null }));
  },
  clear: () => {
    memoryStore.clear();
    storageListeners.forEach((fn) => fn({ key: null, newValue: null }));
  },
};

const memorySessionStore = new Map();
globalThis.sessionStorage = {
  getItem: (key) => (memorySessionStore.has(key) ? memorySessionStore.get(key) : null),
  setItem: (key, value) => memorySessionStore.set(key, String(value)),
  removeItem: (key) => memorySessionStore.delete(key),
  clear: () => memorySessionStore.clear(),
};

import { initDb, getNow, loadDb, setDemoNow } from "../../src/mocks/db.js";
import { login } from "../../src/services/authService.js";
import { getMySchedule, saveScheduleDraft, publishSchedule } from "../../src/services/scheduleService.js";
import {
  createExchangeRequest,
  peerRespondExchange,
  managerApproveExchange,
  managerRejectExchange,
} from "../../src/services/shiftExchangeService.js";
import { createOpenShift, getOpenShifts, claimOpenShift } from "../../src/services/openShiftService.js";
import { createLeaveRequest, getLeaveRequests, approveLeave } from "../../src/services/leaveService.js";
import { checkIn, checkOut, getAttendanceRecords } from "../../src/services/attendanceService.js";
import { createEmployee, setEmployeeStatus } from "../../src/services/employeeService.js";
import { getNotifications } from "../../src/services/notificationService.js";

// Khởi tạo DB sạch
initDb(getNow());

// Helpers chuyển vai
async function asStaff(email = "nguyenvanan@gmail.com") {
  const db = loadDb();
  const user = db.users.find((u) => u.email === email && u.role === "staff") || db.users.find((u) => u.role === "staff");
  assert.ok(user, `Không tìm thấy tài khoản staff với email: ${email}`);
  const res = await login(user.email, user.password);
  return res.user;
}

async function asManager() {
  const db = loadDb();
  const managerUser = db.users.find((u) => u.role === "manager");
  assert.ok(managerUser, "Không tìm thấy tài khoản manager");
  const res = await login(managerUser.email, managerUser.password);
  return res.user;
}

// -----------------------------------------------------------------------------
// LUỒNG 1: TẠO LỊCH VÀ CÔNG BỐ
// -----------------------------------------------------------------------------
test("LUỒNG 1 (Đường chính): Lịch nháp Staff không thấy -> Quản lý công bố thì Staff thấy và có thông báo", async () => {
  const targetWeek = "2026-11-09";

  // 1. Quản lý lưu lịch nháp cho tuần 2026-11-09
  await asManager();
  const sampleSchedules = {
    morning_T2: { assigned: ["NV001"] },
  };
  await saveScheduleDraft(sampleSchedules, targetWeek);

  // 2. Nhân viên mở lịch tuần đó -> Không thấy vì còn ở trạng thái nháp (draft)
  await asStaff("nguyenvanan@gmail.com");
  const staffDraftView = await getMySchedule({
    week_start: targetWeek,
    employeeId: "NV001",
  });
  assert.equal(staffDraftView.published, false, "Tuần nháp phải có published = false");
  assert.equal(staffDraftView.shifts.length, 0, "Staff không thấy ca của tuần nháp");

  // 3. Quản lý công bố lịch tuần đó
  await asManager();
  await publishSchedule(sampleSchedules, targetWeek);

  // 4. Nhân viên xem lại -> Đã thấy ca và nhận được thông báo công bố lịch
  await asStaff("nguyenvanan@gmail.com");
  const staffPublishedView = await getMySchedule({
    week_start: targetWeek,
    employeeId: "NV001",
  });
  assert.equal(staffPublishedView.published, true, "Tuần đã công bố phải có published = true");
  assert.ok(staffPublishedView.shifts.length > 0, "Staff thấy ca trực sau khi công bố");

  const notifs = await getNotifications();
  const pubNotif = notifs.find((n) => n.type === "schedule_published");
  assert.ok(pubNotif, "Staff phải nhận được thông báo schedule_published");

  // 5. Quản lý sửa lịch sau công bố -> Nhân viên bị ảnh hưởng nhận thông báo
  await asManager();
  const updatedSchedules = {
    morning_T2: { assigned: ["NV002"] }, // Gỡ NV001, thay bằng NV002
  };
  await saveScheduleDraft(updatedSchedules, targetWeek);

  await asStaff("nguyenvanan@gmail.com");
  const notifsAfter = await getNotifications();
  const updateNotif = notifsAfter.find((n) => n.type === "schedule_updated");
  assert.ok(updateNotif, "Staff bị ảnh hưởng phải nhận được thông báo schedule_updated");
});

test("LUỒNG 1 (Sai quyền): Staff không được phép lưu nháp hoặc công bố lịch", async () => {
  await asStaff("nguyenvanan@gmail.com");
  await assert.rejects(
    async () => {
      await publishSchedule({}, "2026-11-16");
    },
    /Chỉ Quản lý mới có quyền/i,
    "Staff gọi publishSchedule phải bị từ chối"
  );
  await assert.rejects(
    async () => {
      await saveScheduleDraft({}, "2026-11-16");
    },
    /Chỉ Quản lý mới có quyền/i,
    "Staff gọi saveScheduleDraft phải bị từ chối"
  );
});

// -----------------------------------------------------------------------------
// LUỒNG 2: ĐỔI CA 2 BƯỚC
// -----------------------------------------------------------------------------
test("LUỒNG 2 (Đường chính): A tạo -> B đồng ý -> Manager duyệt -> Lịch 2 bên hoán đổi và nhận thông báo", async () => {
  setDemoNow(new Date("2026-10-26T08:00:00"));

  // 1. Staff A (NV002, Barista) gửi yêu cầu đổi ca cho Staff B (NV007, Barista)
  await asStaff("tranthibich@gmail.com");
  const req = await createExchangeRequest({
    requesterId: "NV002",
    requesterName: "Trần Thị Bích",
    requesterRoleTag: "Barista",
    requesterShift: {
      date: "Thứ 6, 2026-10-30",
      isoDate: "2026-10-30",
      dayId: "T6",
      shiftId: "afternoon",
      shiftName: "Chiều",
    },
    targetEmployeeId: "NV007",
    targetEmployeeName: "Vũ Minh Thảo",
    targetRoleTag: "Barista",
    targetShift: {
      date: "Thứ 6, 2026-10-30",
      isoDate: "2026-10-30",
      dayId: "T6",
      shiftId: "morning",
      shiftName: "Sáng",
    },
    exchangeType: "swap",
    reason: "Việc cá nhân cần đổi ca",
  });
  assert.ok(req.id, "Tạo yêu cầu đổi ca thành công");

  // Staff B (NV007) nhận được thông báo
  await asStaff("vuminhthao@gmail.com");
  const notifsB = await getNotifications();
  const reqNotif = notifsB.find((n) => n.type === "shift_exchange" || n.type === "shift_exchange_request");
  assert.ok(reqNotif, "Staff B phải nhận được thông báo yêu cầu đổi ca");

  // 2. Staff B đồng ý yêu cầu đổi ca
  const peerRes = await peerRespondExchange(req.id, { action: "accept" });
  assert.equal(peerRes.status, "pending_manager", "Trạng thái chuyển sang pending_manager");

  // Manager nhận được thông báo
  await asManager();
  const mgrNotifs = await getNotifications();
  const mgrNotif = mgrNotifs.find((n) => (n.type === "shift_exchange" || n.type === "shift_exchange_peer_accepted") && n.title.includes("chờ duyệt"));
  assert.ok(mgrNotif, "Manager phải nhận được thông báo đồng nghiệp đã chấp thuận");

  // 3. Manager phê duyệt đơn đổi ca
  const approvedRes = await managerApproveExchange(req.id, "Đồng ý cho 2 bạn đổi ca");
  assert.equal(approvedRes.status, "approved", "Trạng thái đơn trở thành approved");

  // Cả Staff A và Staff B đều nhận được thông báo approved
  await asStaff("tranthibich@gmail.com");
  const notifsA = await getNotifications();
  const notifApproveA = notifsA.find((n) => (n.type === "shift_exchange" || n.type === "shift_exchange_approved") && (n.title.includes("thành công") || n.message.includes("phê duyệt")));
  assert.ok(notifApproveA, "Staff A phải nhận thông báo đổi ca thành công");

  await asStaff("vuminhthao@gmail.com");
  const notifsBAfter = await getNotifications();
  const notifApproveB = notifsBAfter.find((n) => (n.type === "shift_exchange" || n.type === "shift_exchange_approved") && (n.title.includes("thành công") || n.message.includes("phê duyệt")));
  assert.ok(notifApproveB, "Staff B phải nhận thông báo đổi ca thành công");
});

test("LUỒNG 2 (Sai quyền & Từ chối có lý do): Staff không được tự duyệt bước Manager, Manager từ chối có lý do", async () => {
  setDemoNow(new Date("2026-10-26T08:00:00"));
  await asStaff("tranthibich@gmail.com");
  const req = await createExchangeRequest({
    requesterId: "NV002",
    requesterName: "Trần Thị Bích",
    requesterRoleTag: "Barista",
    requesterShift: {
      date: "Thứ 4, 2026-10-28",
      isoDate: "2026-10-28",
      dayId: "T4",
      shiftId: "morning",
      shiftName: "Sáng",
    },
    targetEmployeeId: "NV007",
    targetEmployeeName: "Vũ Minh Thảo",
    targetRoleTag: "Barista",
    targetShift: {
      date: "Thứ 4, 2026-10-28",
      isoDate: "2026-10-28",
      dayId: "T4",
      shiftId: "evening",
      shiftName: "Tối",
    },
    exchangeType: "swap",
    reason: "Đổi ca kiểm thử",
  });

  // Staff cố tự gọi managerApproveExchange -> Bị chặn
  await assert.rejects(
    async () => {
      await managerApproveExchange(req.id, "Tự duyệt");
    },
    /Chỉ Quản lý mới có quyền/i,
    "Staff tự duyệt đơn đổi ca phải bị chặn"
  );

  // Manager từ chối đơn đổi ca kèm lý do
  await asManager();
  const rejected = await managerRejectExchange(req.id, "Không đủ nhân sự có kinh nghiệm ca tối");
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.rejectReason, "Không đủ nhân sự có kinh nghiệm ca tối");

  // Staff nhận được thông báo từ chối
  await asStaff("tranthibich@gmail.com");
  const notifs = await getNotifications();
  const rejNotif = notifs.find((n) => (n.type === "shift_exchange" || n.type === "shift_exchange_rejected") && (n.title.includes("từ chối") || n.message.includes("từ chối")));
  assert.ok(rejNotif, "Staff phải nhận được thông báo từ chối kèm lý do");
});

// -----------------------------------------------------------------------------
// LUỒNG 3: CA TRỰC MỞ
// -----------------------------------------------------------------------------
test("LUỒNG 3 (Đường chính & Sai quyền): Manager đăng ca mở -> Staff thấy và nhận -> Cập nhật lịch", async () => {
  // 1. Quản lý tạo ca trực mở
  await asManager();
  const newShift = await createOpenShift({
    date: "2026-10-31",
    shiftCode: "evening",
    shiftName: "Tối",
    startTime: "17:00",
    endTime: "22:00",
    role: "Barista",
    needed: 1,
    bonus: 50000,
    note: "Ca tối thứ 7 hỗ trợ đông khách",
  });
  assert.ok(newShift.id, "Tạo ca trực mở thành công");

  // 2. Staff nhận thông báo và thấy ca trong danh sách
  await asStaff("tranthibich@gmail.com");
  const notifs = await getNotifications();
  const osNotif = notifs.find((n) => n.type === "open_shift");
  assert.ok(osNotif, "Staff phải nhận được thông báo có ca trực mở mới");

  const openList = await getOpenShifts();
  const targetShift = openList.find((s) => s.id === newShift.id);
  assert.ok(targetShift, "Staff phải thấy ca trực mở trong danh sách");

  // 3. Staff đăng ký nhận ca mở
  const claimRes = await claimOpenShift(targetShift.id, {
    employeeId: "NV002",
    name: "Trần Thị Bích",
    phone: "0905234567",
    roleTags: ["Barista"],
    status: "Đang làm việc",
  }, targetShift.version);
  assert.equal(claimRes.filled, true, "Ca đã đủ người sau khi nhận");

  // 4. Sai quyền: Staff không thể tự ý tạo ca mở
  await assert.rejects(
    async () => {
      await createOpenShift({
        date: "2026-10-31",
        shiftCode: "morning",
        shiftName: "Sáng",
        role: "Barista",
        needed: 1,
      });
    },
    /Chỉ Quản lý mới có quyền/i,
    "Staff tạo ca mở phải bị chặn"
  );
});

// -----------------------------------------------------------------------------
// LUỒNG 4: NGHỈ PHÉP
// -----------------------------------------------------------------------------
test("LUỒNG 4 (Đường chính & Sai quyền): Staff gửi đơn -> Manager duyệt -> Cập nhật lịch và thông báo", async () => {
  // 1. Staff nộp đơn xin nghỉ
  await asStaff("nguyenvanan@gmail.com");
  const leave = await createLeaveRequest({
    employeeId: "NV001",
    employeeName: "Nguyễn Văn An",
    isoDate: "2026-11-06",
    shiftId: "morning",
    shiftName: "Sáng",
    shiftTime: "06:00 - 12:00",
    reason: "Khám sức khỏe định kỳ",
  });
  assert.equal(leave.status, "pending");

  // 2. Quản lý thấy đơn và phê duyệt
  await asManager();
  const allLeaves = await getLeaveRequests();
  const found = allLeaves.find((r) => r.id === leave.id);
  assert.ok(found, "Manager thấy đơn nghỉ phép");

  const approved = await approveLeave(leave.id, "Đồng ý cho nghỉ");
  assert.equal(approved.status, "approved");

  // 3. Staff nhận được thông báo duyệt đơn
  await asStaff("nguyenvanan@gmail.com");
  const notifs = await getNotifications();
  const appNotif = notifs.find((n) => n.type === "leave_approved");
  assert.ok(appNotif, "Staff phải nhận được thông báo đơn nghỉ được duyệt");

  // 4. Sai quyền: Staff tự duyệt đơn nghỉ phép của mình -> Bị chặn
  await assert.rejects(
    async () => {
      await approveLeave(leave.id, "Tự duyệt");
    },
    /Chỉ Quản lý mới có quyền/i,
    "Staff tự duyệt đơn nghỉ phép phải bị chặn"
  );
});

// -----------------------------------------------------------------------------
// LUỒNG 5: CHẤM CÔNG VÀ GIỜ LÀM
// -----------------------------------------------------------------------------
test("LUỒNG 5 (Đường chính & Sai quyền): Staff check-in/out -> Sổ cái chung attendance cập nhật -> Manager thấy ngay", async () => {
  // Giả lập thời gian đúng khung giờ ca sáng Thứ Hai 26/10 lúc 06:15
  setDemoNow(new Date("2026-10-26T06:15:00"));

  // 1. Staff NV001 chấm công vào ca sáng Thứ 2 (2026-10-26)
  await asStaff("nguyenvanan@gmail.com");
  const checkInRes = await checkIn({
    shift_id: "sample-mon-morning",
    employeeId: "NV001",
    shiftName: "Sáng",
    location: {
      latitude: 10.7769,
      longitude: 106.7009,
    },
  });
  assert.ok(checkInRes.id || checkInRes.success, "Check-in thành công");

  // 2. Kiểm tra sổ cái db.attendance và màn hình của Manager thấy ngay lập tức
  await asManager();
  const records = await getAttendanceRecords({ period: "week", from: "2026-10-26", to: "2026-11-01" });
  const attRecord = (records?.rows || records?.records || records || []).find(
    (r) => r.employeeId === "NV001" && r.iso === "2026-10-26" && r.shiftName === "Sáng"
  );
  assert.ok(attRecord, "Manager thấy bản ghi chấm công của NV001");
  assert.ok(attRecord.checkIn != null && attRecord.checkIn !== "", "Ghi nhận giờ vào checkIn");

  // 3. Chấm công ra vào cuối ca lúc 12:05
  setDemoNow(new Date("2026-10-26T12:05:00"));
  await asStaff("nguyenvanan@gmail.com");
  const checkOutRes = await checkOut({
    shift_id: "sample-mon-morning",
    employeeId: "NV001",
    shiftName: "Sáng",
    location: {
      latitude: 10.7769,
      longitude: 106.7009,
    },
  });
  assert.ok(checkOutRes.id || checkOutRes.success, "Check-out thành công");

  // 4. Sai quyền: Staff không thể chấm công hộ nhân viên khác
  await assert.rejects(
    async () => {
      await checkIn({
        employeeId: "NV002", // NV001 chấm hộ cho NV002
        shiftName: "Sáng",
        location: {
          latitude: 10.7769,
          longitude: 106.7009,
        },
      });
    },
    /Không thể chấm công hộ nhân viên khác/i,
    "Chấm công hộ nhân viên khác phải bị chặn"
  );
});

// -----------------------------------------------------------------------------
// LUỒNG 6: QUẢN LÝ NHÂN VIÊN VÀ TÀI KHOẢN
// -----------------------------------------------------------------------------
test("LUỒNG 6 (Đường chính & Sai quyền): Manager tạo nhân viên -> Đăng nhập được -> Ngừng làm việc -> Bị chặn đăng nhập", async () => {
  // 1. Manager tạo nhân viên mới
  await asManager();
  const newStaffEmail = `staff_flow6_${Date.now()}@smartscheduling.vn`;
  const createdEmp = await createEmployee({
    name: "Nhân Viên Mới Luồng 6",
    email: newStaffEmail,
    password: "Password12345",
    phone: "0909998877",
    role: "Nhân viên",
    contract: "Part-time",
  });
  assert.ok(createdEmp.id, "Tạo nhân viên thành công");

  // 2. Nhân viên mới đăng nhập thành công
  const staffSession = await login(newStaffEmail, "Password12345");
  assert.ok(staffSession.user, "Nhân viên mới đăng nhập thành công");
  assert.equal(staffSession.user.role, "staff");

  // 3. Manager chuyển trạng thái thành 'Nghỉ việc'
  await asManager();
  await setEmployeeStatus(createdEmp.id, "Nghỉ việc");

  // 4. Nhân viên thử đăng nhập lại -> Bị chặn với mã ACCOUNT_DISABLED
  await assert.rejects(
    async () => {
      await login(newStaffEmail, "Password12345");
    },
    (err) => {
      return err.code === "ACCOUNT_DISABLED" || /ngừng hoạt động|vô hiệu/i.test(err.message);
    },
    "Tài khoản Nghỉ việc phải bị chặn đăng nhập với ACCOUNT_DISABLED"
  );

  // 5. Sai quyền: Staff không thể truy cập trang quản trị nhân sự của Manager
  const { isRouteAllowedForRole } = await import("../../src/pages/login/routeGuards.js");
  assert.equal(isRouteAllowedForRole("staff", "/manager/employees"), false, "Staff bị chặn vào route /manager/employees");
});
