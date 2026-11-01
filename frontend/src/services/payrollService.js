// =============================================================================
// File: src/services/payrollService.js
// Tầng: Dịch Vụ Tính Lương (US27, US28)
// =============================================================================

import {
  computePayroll as mockComputePayroll,
  computeTotals as mockComputeTotals,
  computeEmployeeDetail as mockComputeEmployeeDetail,
  getSavedWageRates as mockGetSavedWageRates,
  saveWageRates as mockSaveWageRates,
  PAYROLL_COLUMNS,
  getPayrollLocks as mockGetPayrollLocks,
  isPeriodLocked as mockIsPeriodLocked,
  lockPayrollPeriod as mockLockPayrollPeriod,
  unlockPayrollPeriod as mockUnlockPayrollPeriod,
} from "../mocks/payrollMock.js";
import { resolvePeriod, listShifts } from "../mocks/workHoursMock.js";

export const getSavedWageRates = () => mockGetSavedWageRates();

export const saveWageRates = (rates) => {
  // BACKEND: Cập nhật bảng đơn giá lương giờ theo vị trí trong bảng wage_rates
  return mockSaveWageRates(rates);
};

export const computeTotals = mockComputeTotals;
export { PAYROLL_COLUMNS };

export const getPayrollLocks = () => mockGetPayrollLocks();
export const isPeriodLocked = (periodKey) => mockIsPeriodLocked(periodKey);

export const subscribePayroll = () => () => {};

export const lockPayrollPeriod = async (periodKey) => {
  // BACKEND: Khóa kỳ lương trong bảng payroll_periods, chụp snapshot bảng lương cố định, ngăn chặn mọi thao tác sửa đổi chấm công hoặc duyệt đơn trong kỳ
  return mockLockPayrollPeriod(periodKey);
};

export const unlockPayrollPeriod = async (periodKey) => {
  // BACKEND: Mở khóa kỳ lương (chỉ Quản lý cấp cao), ghi log lý do mở khóa vào audit log
  return mockUnlockPayrollPeriod(periodKey);
};

export const lockPayroll = lockPayrollPeriod;
export const unlockPayroll = unlockPayrollPeriod;

export async function getPayrollSummary({ period = "month", from = "", to = "", label, periodType, monthKey } = {}) {
  const range = resolvePeriod({ period, from, to });
  const targetFrom = range.from || from || "2026-10-26";
  const targetTo = range.to || to || "2026-11-01";

  let periodKey;
  if (periodType === "month" || (period === "month" && !from)) {
    periodKey = monthKey || (range.from ? range.from.slice(0, 7) : "2026-10");
  } else if (range.from && range.to) {
    periodKey = `${range.from}_${range.to}`;
  } else {
    periodKey = range.from && range.to ? `${range.from}_${range.to}` : "2026-10";
  }

  const locks = getPayrollLocks();
  const isLocked = Boolean(periodKey && locks.includes(periodKey));

  // Xác định tuần tính lương dựa theo khoảng ngày truy vấn:
  // - Nếu kỳ bao gồm tuần mẫu 26/10/2026 - 01/11/2026 (hoặc Tháng 10/2026): lấy theo tuần 26/10
  // - Nếu kỳ là Tháng 11/2026 hoặc từ 02/11/2026: lấy theo tuần 02/11
  let targetMon = "2026-10-26";
  if (periodKey === "2026-11" || targetFrom >= "2026-11-02") {
    targetMon = "2026-11-02";
  } else if (targetFrom < "2026-10-26") {
    targetMon = "2026-10-19";
  }

  const result = mockComputePayroll({ from: targetMon, periodKey: isLocked ? periodKey : null });
  const allRows = result.rows || [];

  // Chỉ tính ca ĐÃ KẾT THÚC: nếu tuần chưa có ca nào kết thúc (như tuần 02/11 ở thời điểm hiện tại), bảng rỗng
  const hasEndedData = allRows.some((r) => r.actualHours > 0);
  const rows = hasEndedData ? allRows : [];
  const totals = hasEndedData ? result.totals : mockComputeTotals([]);

  const shifts = listShifts({ period, from: targetFrom, to: targetTo });
  const missingShifts = shifts
    .filter((s) => s.status === "Missing-Checkout")
    .map((s) => ({ id: s.id, employeeId: s.employeeId, iso: s.iso, shiftName: s.shiftName }));

  return {
    periodKey,
    periodLabel: label ?? range.label ?? "Tháng 10/2026",
    from: targetFrom,
    to: targetTo,
    rows,
    totals,
    isLocked,
    isEnded: hasEndedData,
    overlapError: "",
    issues: {
      missingCheckout: missingShifts.length,
      missingShifts,
    },
  };
}

export async function getEmployeePayslip(employeeId, { period = "month", from = "", to = "", label } = {}) {
  const range = resolvePeriod({ period, from, to });
  const d = mockComputeEmployeeDetail(listShifts({ period, from, to, employeeId }), employeeId);
  if (!d) throw new Error("Không tìm thấy nhân viên.");
  return {
    employee: d.employee,
    periodLabel: label ?? range.label,
    from: range.from,
    to: range.to,
    shifts: d.shifts,
    bonuses: d.bonuses,
    totalHours: d.summary?.actualHours ?? 0,
    totalSalary: d.shifts.reduce((a, s) => a + s.totalPay, 0),
    openShiftBonus: d.summary?.openShiftBonus ?? 0,
    netPay: d.summary?.total ?? 0,
  };
}

export default {
  getSavedWageRates,
  saveWageRates,
  computeTotals,
  PAYROLL_COLUMNS,
  getPayrollLocks,
  isPeriodLocked,
  subscribePayroll,
  lockPayrollPeriod,
  unlockPayrollPeriod,
  lockPayroll,
  unlockPayroll,
  getPayrollSummary,
  getEmployeePayslip,
};
