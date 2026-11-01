/**
 * scripts/audit/cross_check.js
 * Script đối chiếu toàn diện dữ liệu giữa các module, mock và service (Chỉ đọc)
 */

import { mockEmployees } from '../../src/mocks/employeeMock.js';
import { getMockWeeklyAvailability } from '../../src/mocks/availabilityMock.js';
import { buildWorkHoursSummary } from '../../src/mocks/workHoursMock.js';
import { buildAttendance } from '../../src/mocks/attendanceMock.js';
import { computePayroll } from '../../src/mocks/payrollMock.js';
import { getSavedSchedules } from '../../src/mocks/scheduleMock.js';
import { buildDashboard } from '../../src/mocks/dashboardMock.js';
import { getExchangeRequests } from '../../src/services/shiftExchangeService.js';
import { getOpenShifts } from '../../src/services/openShiftService.js';
import { buildReport } from '../../src/mocks/reportMock.js';
import { getLeaveRequests } from '../../src/mocks/leaveMock.js';

console.log('=== 1. NHÂN VIÊN & SỐ LƯỢNG TỪNG NGUỒN ===');
console.log('employeeMock.js count:', mockEmployees.length);
mockEmployees.forEach(e => console.log(`  ${e.id} | ${e.name} | ${e.role} | Tag: ${e.roleTag} | Status: ${e.status}`));

// Availability
const availWeek26 = getMockWeeklyAvailability('2026-10-26');
console.log('\nAvailability (2026-10-26) employees:', availWeek26.employees.map(e => `${e.id} (${e.name})`));

// WorkHours
const mockWorkHours = buildWorkHoursSummary().rows;
console.log('\nWorkHoursMock employees:', mockWorkHours.map(w => `${w.employeeId || w.id} (${w.name})`));

// Attendance
const mockAttendanceRecords = buildAttendance().rows;
const attendanceEmps = [...new Set(mockAttendanceRecords.map(a => `${a.employeeId} (${a.employeeName})`))];
console.log('\nAttendance records employees:', attendanceEmps);

// Payroll
const payrollData = computePayroll();
console.log('\nPayrollSummary employees:', payrollData.rows.map(p => `${p.employeeId} (${p.name})`));

// SavedSchedules week 26/10
const schedMap = getSavedSchedules('2026-10-26');
const schedEmpsMap = {};
Object.entries(schedMap).forEach(([k, slot]) => {
  (slot.assigned || []).forEach(emp => {
    if (!schedEmpsMap[emp.id]) {
      schedEmpsMap[emp.id] = { id: emp.id, name: emp.name, role: emp.role, shifts: [] };
    }
    const [shiftId, dayId] = k.split('_');
    const hours = shiftId === 'morning' ? 6 : 5;
    schedEmpsMap[emp.id].shifts.push({ shiftKey: k, shiftId, dayId, hours });
  });
});
const schedRows = Object.values(schedEmpsMap);
console.log('\nSavedSchedules (2026-10-26) employees with assigned shifts:', schedRows.map(s => `${s.id} (${s.name}): ${s.shifts.length} ca, ${s.shifts.reduce((sum, x) => sum + x.hours, 0)}h`));

// Dashboard
const dashData = buildDashboard({ from: '2026-10-26', to: '2026-11-01' });
console.log('\nDashboard week schedule employees:', (dashData.schedule || []).map(s => `${s.employeeId} (${s.employeeName})`));

// Report
const reportData = buildReport('payroll', { from: '2026-10-26', to: '2026-11-01' });
console.log('\nReportData employees (payroll):', (reportData.payrollSummary?.employees || []).map(p => `${p.employeeId} (${p.name})`));

console.log('\n=== 2. KIỂM TRA ĐỖ KIM NGÂN (NV006) ===');
['employeeMock', 'availability', 'workHours', 'attendance', 'payroll', 'schedule', 'dashboard'].forEach(source => {
  let found = false;
  if (source === 'employeeMock') found = mockEmployees.some(e => e.id === 'NV006');
  if (source === 'availability') found = availWeek26.employees.some(e => e.id === 'NV006');
  if (source === 'workHours') found = mockWorkHours.some(e => e.employeeId === 'NV006');
  if (source === 'attendance') found = mockAttendanceRecords.some(e => e.employeeId === 'NV006');
  if (source === 'payroll') found = payrollData.rows.some(e => e.employeeId === 'NV006');
  if (source === 'schedule') found = schedRows.some(e => e.id === 'NV006');
  if (source === 'dashboard') found = (dashData.schedule || []).some(e => e.employeeId === 'NV006');
  console.log(`NV006 in ${source}:`, found);
});

console.log('\n=== 3. SO SÁNH VAI TRÒ CÁC TRANG ===');
mockEmployees.forEach(e => {
  const wh = mockWorkHours.find(w => w.employeeId === e.id);
  const att = mockAttendanceRecords.find(a => a.employeeId === e.id);
  const sc = schedRows.find(s => s.id === e.id);
  console.log(`${e.id} ${e.name}:`);
  console.log(`  - employeeMock: role="${e.role}", roleTag="${e.roleTag}"`);
  console.log(`  - workHours: role="${wh?.role}"`);
  console.log(`  - attendance: role="${att?.role}"`);
  console.log(`  - schedule: role="${sc?.role}"`);
});

console.log('\n=== 4. CA VÀ GIỜ LÀM TUẦN 26/10 - 01/11 ===');
mockEmployees.forEach(e => {
  const schedShifts = schedRows.find(s => s.id === e.id)?.shifts || [];
  const wh = mockWorkHours.find(w => w.employeeId === e.id);
  const attShifts = mockAttendanceRecords.filter(a => a.employeeId === e.id);
  const dashShifts = (dashData.schedule || []).find(s => s.employeeId === e.id)?.shifts || [];

  const schedHours = schedShifts.reduce((sum, s) => sum + (s.hours || 0), 0);
  console.log(`${e.id} ${e.name}:`);
  console.log(`  - Schedule: ${schedShifts.length} ca, ${schedHours} giờ (${schedShifts.map(s => s.dayId + ':' + s.shiftId).join(', ')})`);
  console.log(`  - Dashboard: ${dashShifts.filter(Boolean).length} ca`);
  console.log(`  - WorkHours: scheduled=${wh?.scheduledHours}, actual=${wh?.actualHours}`);
  console.log(`  - Attendance: ${attShifts.length} ca (${attShifts.map(a => a.date + ':' + a.shiftName + ':' + a.status).join(', ')})`);
});

console.log('\n=== 5. CHẤM CÔNG VS LỊCH XẾP TUẦN 26/10 ===');
mockAttendanceRecords.forEach(att => {
  const empSched = schedRows.find(s => s.id === att.employeeId);
  console.log(`Att: ${att.employeeId} ${att.date} ${att.shiftName} (${att.status}) -> Has emp in sched? ${!!empSched}`);
});
