/**
 * File: src/mocks/payrollMock.js
 * Dữ liệu tính lương mẫu (Static Mock Data)
 */

import { mockEmployees } from "./employeeMock.js";
import { calculateSystemMetrics } from "../lib/calcPayroll.js";

export const PAYROLL_COLUMNS = [
  { key: "name", label: "Nhân viên", width: 26 },
  { key: "employeeId", label: "Mã NV", width: 10 },
  { key: "contract", label: "Loại hợp đồng", width: 16 },
  { key: "actualHours", label: "Tổng giờ thực tế", align: "right", format: "hours", width: 18 },
  { key: "nightHours", label: "Giờ ca đêm", align: "right", format: "hours", width: 14 },
  { key: "holidayHours", label: "Giờ ngày lễ", align: "right", format: "hours", width: 14 },
  { key: "basePay", label: "Lương cơ bản", align: "right", format: "money", width: 18 },
  { key: "surcharge", label: "Phần tăng theo hệ số", align: "right", format: "money", width: 22 },
  { key: "openShiftBonus", label: "Thưởng ca trực mở", align: "right", format: "money", width: 20 },
  { key: "total", label: "Tổng lương", align: "right", format: "money", width: 18 },
];

export function computePayroll(params = {}) {
  const from = params?.from || "2026-10-26";
  const { rows, totals } = calculateSystemMetrics(from);

  // Tương thích đa năng: vừa là mảng vừa có thuộc tính rows/totals
  const result = [...rows];
  result.rows = result;
  result.totals = totals;
  result.isLocked = false;
  return result;
}

export function computeTotals(rows = []) {
  const rowList = Array.isArray(rows) ? rows : (rows?.rows || []);
  return {
    actualHours: Math.round(rowList.reduce((s, r) => s + (r.actualHours || 0), 0) * 10) / 10,
    nightHours: Math.round(rowList.reduce((s, r) => s + (r.nightHours || 0), 0) * 10) / 10,
    holidayHours: Math.round(rowList.reduce((s, r) => s + (r.holidayHours || 0), 0) * 10) / 10,
    basePay: rowList.reduce((s, r) => s + (r.basePay || 0), 0),
    surcharge: rowList.reduce((s, r) => s + (r.surcharge || 0), 0),
    openShiftBonus: rowList.reduce((s, r) => s + (r.openShiftBonus || 0), 0),
    total: rowList.reduce((s, r) => s + (r.total || 0), 0),
    payrollCost: rowList.reduce((s, r) => s + (r.total || 0), 0),
    employeeCount: rowList.length,
    shiftCount: rowList.reduce((s, r) => s + (r.shiftCount || 4), 0),
  };
}

export function computeEmployeeDetail(shifts, employeeId) {
  const emp = mockEmployees.find((e) => e.id === employeeId) || mockEmployees[0];
  return {
    employee: emp,
    rows: [],
    totals: { actualHours: 35, basePay: 1225000, total: 1275000 },
  };
}

export function getSavedWageRates() {
  const rates = {};
  mockEmployees.forEach((e) => {
    rates[e.id] = e.hourlyWage || 28000;
  });
  return rates;
}

export function saveWageRates(rates) {
  // BACKEND: Lưu mức lương giờ nhân viên vào bảng employees
  return { success: true, rates };
}

export const mockPayrollRows = computePayroll().rows;

const mockPayrollLocks = ["2026-09"];

export function getPayrollLocks() {
  return [...mockPayrollLocks];
}

export function isPeriodLocked(periodKey) {
  return mockPayrollLocks.includes(periodKey);
}

export function lockPayrollPeriod(periodKey) {
  if (periodKey && !mockPayrollLocks.includes(periodKey)) {
    mockPayrollLocks.push(periodKey);
  }
  return { success: true, periodKey, locked: true };
}

export function unlockPayrollPeriod(periodKey) {
  const idx = mockPayrollLocks.indexOf(periodKey);
  if (idx !== -1) {
    mockPayrollLocks.splice(idx, 1);
  }
  return { success: true, periodKey, locked: false };
}

export const lockPayrollMock = lockPayrollPeriod;
export const unlockPayrollMock = unlockPayrollPeriod;

export const payrollTotal = () => 7850000;
export const countMissingCheckout = () => 0;


export default {
  PAYROLL_COLUMNS,
  computePayroll,
  computeTotals,
  computeEmployeeDetail,
  getSavedWageRates,
  saveWageRates,
  lockPayrollMock,
  unlockPayrollMock,
  getPayrollLocks,
  isPeriodLocked,
  lockPayrollPeriod,
  unlockPayrollPeriod,
  mockPayrollRows,
  payrollTotal,
  countMissingCheckout,
};