import { mockEmployees } from '../../src/mocks/employeeMock.js';
import { getMockWeeklyAvailability, getMockAvailability } from '../../src/mocks/availabilityMock.js';
import { buildWorkHoursSummary } from '../../src/mocks/workHoursMock.js';
import { buildAttendance } from '../../src/mocks/attendanceMock.js';
import { computePayroll, computeTotals } from '../../src/mocks/payrollMock.js';
import { getSavedSchedules } from '../../src/mocks/scheduleMock.js';
import { buildDashboard } from '../../src/mocks/dashboardMock.js';
import { getExchangeRequests } from '../../src/services/shiftExchangeService.js';
import { getOpenShifts } from '../../src/services/openShiftService.js';
import { buildReport } from '../../src/mocks/reportMock.js';
import { getLeaveRequests } from '../../src/mocks/leaveMock.js';
import { mockShiftConfigs } from '../../src/mocks/shiftConfigMock.js';

console.log('===============================================================');
console.log('AUDIT CHUẨN XÁC DỮ LIỆU SMART SCHEDULING (PHẦN A)');
console.log('===============================================================\n');

// A1: DANH SÁCH NHÂN VIÊN QUA CÁC TRANG
const allEmps = mockEmployees;
const availEmps = getMockWeeklyAvailability('2026-10-26').employees;
const whEmps = buildWorkHoursSummary().rows;
const attRecords = buildAttendance().rows;
const attEmpIds = [...new Set(attRecords.map(r => r.employeeId))];
const payrollRows = computePayroll().rows;
const schedRows = getSavedSchedules('2026-10-26');
const dashSched = buildDashboard({ from: '2026-10-26', to: '2026-11-01' }).schedule || [];
const exchRequests = getExchangeRequests();
const openShifts = getOpenShifts();

console.log('--- 1. DANH SÁCH & SỐ LƯỢNG NHÂN VIÊN TẠI CÁC TRANG ---');
console.log(`- Quản lý NV (employeeMock): ${allEmps.length} người:`, allEmps.map(e => e.id).join(', '));
console.log(`- Khả năng làm việc: ${availEmps.length} người:`, availEmps.map(e => e.id).join(', '));
console.log(`- Giờ làm: ${whEmps.length} người:`, whEmps.map(e => e.employeeId).join(', '));
console.log(`- Chấm công: ${attEmpIds.length} người xuất hiện trong records:`, attEmpIds.join(', '));
console.log(`- Tính lương: ${payrollRows.length} người:`, payrollRows.map(e => e.employeeId).join(', '));
console.log(`- Lịch đã tạo: ${schedRows.length} người được xếp ca:`, schedRows.map(e => e.employeeId).join(', '));
console.log(`- Dashboard lịch tuần: ${dashSched.length} người:`, dashSched.map(e => e.employeeId).join(', '));

console.log('\n--- ĐẶC BIỆT: NV006 (Đỗ Kim Ngân) & NV004 (Phạm Thị Dung) ---');
allEmps.forEach(e => {
  const inAvail = availEmps.some(x => x.id === e.id);
  const inWh = whEmps.some(x => x.employeeId === e.id);
  const inAtt = attEmpIds.includes(e.id);
  const inPay = payrollRows.some(x => x.employeeId === e.id);
  const inSched = schedRows.some(x => x.employeeId === e.id);
  const inDash = dashSched.some(x => x.employeeId === e.id);
  console.log(`${e.id} (${e.name}, ${e.status}): Avail=${inAvail}, WH=${inWh}, Att=${inAtt}, Pay=${inPay}, Sched=${inSched}, Dash=${inDash}`);
});

console.log('\n--- 2. ĐỐI CHIẾU VAI TRÒ VÀ ROLE_TAG ---');
allEmps.forEach(e => {
  const pay = payrollRows.find(p => p.employeeId === e.id);
  const wh = whEmps.find(w => w.employeeId === e.id);
  const sc = schedRows.find(s => s.employeeId === e.id);
  const att = attRecords.find(a => a.employeeId === e.id);
  console.log(`${e.id} ${e.name}:`);
  console.log(`   EmpMock: role="${e.role}", roleTag="${e.roleTag}"`);
  console.log(`   Payroll: role="${pay?.role}", roleTag="${pay?.roleTag}"`);
  console.log(`   WorkHours: roleTag="${wh?.roleTag}"`);
  console.log(`   Schedule: role="${sc?.role}"`);
  console.log(`   Attendance: role="${att?.role}"`);
});

console.log('\n--- 3. CA VÀ GIỜ LÀM TUẦN 26/10 - 01/11 ---');
allEmps.forEach(e => {
  const sc = schedRows.find(s => s.employeeId === e.id);
  const scShifts = sc ? sc.shifts : [];
  const scHours = scShifts.reduce((sum, s) => sum + (s.hours || 0), 0);
  const wh = whEmps.find(w => w.employeeId === e.id);
  const attEmpShifts = attRecords.filter(a => a.employeeId === e.id);
  const pay = payrollRows.find(p => p.employeeId === e.id);

  console.log(`${e.id} ${e.name}:`);
  console.log(`   Schedule: ${scShifts.length} ca, ${scHours}h -> [${scShifts.map(s => s.dayLabel + ' ' + s.name + ' (' + s.hours + 'h)').join(', ')}]`);
  console.log(`   WorkHours: scheduled=${wh?.scheduledHours}h, actual=${wh?.actualHours}h, shiftCount=${wh?.shiftCount}`);
  console.log(`   Attendance: ${attEmpShifts.length} bản ghi`);
  console.log(`   Payroll: totalHours=${pay?.totalHours}h, netPay=${pay?.netPay}`);
});

console.log('\n--- 4. ĐĂNG KÝ RẢNH/BẬN: TUẦN 26/10, 02/11, 09/11 ---');
['2026-10-26', '2026-11-02', '2026-11-09'].forEach(w => {
  const av = getMockWeeklyAvailability(w);
  console.log(`Tuần ${w}:`);
  console.log(`   Summary: registered=${av.summary.registeredCount}, unregistered=${av.summary.unregisteredCount}, totalAvailable=${av.summary.totalAvailable}, totalBusy=${av.summary.totalBusy}`);
  av.employees.forEach(emp => {
    const slotKeys = Object.keys(emp.slots || {});
    const availCount = slotKeys.filter(k => emp.slots[k] === 'available').length;
    const busyCount = slotKeys.filter(k => emp.slots[k] === 'busy').length;
    console.log(`     ${emp.id} ${emp.name}: registered=${emp.registered}, avail=${availCount}, busy=${busyCount}, totalSlots=${slotKeys.length}`);
  });
});

console.log('\n--- 5. LƯƠNG: SO SÁNH GIỮA CÁC NƠI ---');
const payTotals = computeTotals(payrollRows);
const dashOverview = buildDashboard({ from: '2026-10-26', to: '2026-11-01' });
const repPayroll = buildReport('payroll', { from: '2026-10-26', to: '2026-11-01' });
const repOverview = buildReport('overview', { period: 'week', from: '2026-10-26', to: '2026-11-01' });

console.log('Payroll page total netPay:', payTotals.netPay);
console.log('Dashboard laborCost:', dashOverview.laborCost);
console.log('Report payroll total netPay:', repPayroll.totals?.netPay);
console.log('Report overview laborCost:', repOverview.laborCost);

console.log('\n--- 6. CHẤM CÔNG VS LỊCH TUẦN 26/10 ---');
attRecords.forEach(att => {
  const empSched = schedRows.find(s => s.employeeId === att.employeeId);
  const matched = empSched?.shifts?.find(s => {
    // att.date format is DD/MM/YYYY or YYYY-MM-DD?
    return att.shiftName?.includes(s.name) || s.name?.includes(att.shiftName);
  });
  console.log(`Record ${att.id}: ${att.employeeId} (${att.employeeName}) | Ngày: ${att.date} | Ca: ${att.shiftName} | TT: ${att.status} | Khớp lịch? ${matched ? 'CÓ (' + matched.dayLabel + ')' : 'KHÔNG KHỚP'}`);
});
