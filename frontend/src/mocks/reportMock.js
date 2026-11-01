// MOCK-ONLY: xóa khi có backend.
// Dữ liệu cho US29 - Báo cáo (xuất Excel).
// Mọi báo cáo đều tính từ cùng nguồn với các màn hình tương ứng nên số liệu luôn khớp.
// Mỗi báo cáo trả về dạng bảng chung: { title, sheetName, fileBase, periodLabel, columns, rows, footer?, extraSheets? }
// columns: [{ key, label, align?: "right", format?: "money" | "hours" | "number" | "signed", width? }]
import {
  SHIFT_DEFS,
  SHIFT_NAMES,
  WEEKLY_PATTERN,
  addDays,
  buildSummary,
  mockEmployees,
  resolvePeriod,
  startOfDay,
  toISO,
  toVN,
} from "./workHoursMock.js";
import { buildAttendance } from "./attendanceMock.js";
import { buildDashboard } from "./dashboardMock.js";
import { computePayroll, computeTotals, PAYROLL_COLUMNS } from "./payrollMock.js";

export const REPORT_TYPES = [
  { value: "roster", label: "Lịch làm việc" },
  { value: "hours", label: "Tổng hợp giờ làm" },
  { value: "attendance", label: "Đối soát chấm công" },
  { value: "payroll", label: "Bảng lương" },
  { value: "dashboard", label: "Dashboard" },
];

const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const round1 = (n) => Math.round(n * 10) / 10;
const sumBy = (rows, k) => rows.reduce((a, r) => a + r[k], 0);

// ---- Lịch làm việc (theo lịch cố định, gồm cả ngày chưa diễn ra) ----
function rosterReport({ period, from, to, employeeId, roleTag }) {
  const range = resolvePeriod({ period, from, to });
  const rows = [];
  if (range.from && range.to) {
    const end = startOfDay(new Date(range.to));
    for (let d = startOfDay(new Date(range.from)), n = 0; d <= end && n < 93; d = addDays(d, 1), n++) {
      const di = (d.getDay() + 6) % 7;
      for (const e of mockEmployees) {
        if (employeeId !== "all" && e.id !== employeeId) continue;
        if (roleTag !== "all" && e.roleTag !== roleTag) continue;
        const shift = WEEKLY_PATTERN[e.id]?.[di];
        if (!shift) continue;
        rows.push({
          id: `${toISO(d)}_${e.id}`,
          iso: toISO(d),
          date: toVN(toISO(d)),
          weekday: DAY_LABELS[di],
          shift,
          time: `${SHIFT_DEFS[shift].start} - ${SHIFT_DEFS[shift].end}`,
          name: e.name,
          roleTag: e.roleTag,
        });
      }
    }
    rows.sort(
      (a, b) =>
        a.iso.localeCompare(b.iso) || SHIFT_NAMES.indexOf(a.shift) - SHIFT_NAMES.indexOf(b.shift) || a.name.localeCompare(b.name)
    );
  }
  return {
    title: "Lịch làm việc",
    sheetName: "Lich lam viec",
    fileBase: "lich-lam-viec",
    periodLabel: range.label,
    columns: [
      { key: "date", label: "Ngày", width: 14 },
      { key: "weekday", label: "Thứ", width: 10 },
      { key: "shift", label: "Ca", width: 10 },
      { key: "time", label: "Giờ làm", width: 16 },
      { key: "name", label: "Nhân viên", width: 26 },
      { key: "roleTag", label: "Role_Tag", width: 16 },
    ],
    rows,
  };
}

// ---- Tổng hợp giờ làm (US14) ----
function hoursReport({ period, from, to, employeeId, roleTag }) {
  const s = buildSummary({ period, from, to, employeeId, roleTag });
  const byId = Object.fromEntries(mockEmployees.map((e) => [e.id, e]));
  const rows = s.rows
    .filter((r) => r.shiftCount > 0) // kỳ không có ca thì không đưa nhân viên vào báo cáo
    .map((r) => ({
    id: r.employeeId || r.id,
    name: byId[r.employeeId || r.id]?.name || r.name || "Nhân viên",
    roleTag: byId[r.employeeId || r.id]?.roleTag || r.roleTag || "Nhân viên",
    shiftCount: r.shiftCount || 0,
    scheduledHours: r.scheduledHours || 0,
    actualHours: r.actualHours || 0,
    diff: round1((r.actualHours || 0) - (r.scheduledHours || 0)),
    nightHours: r.nightHours || 0,
    holidayHours: r.holidayHours || 0,
  }));
  const footer = rows.length
    ? {
        name: "Tổng cộng",
        shiftCount: sumBy(rows, "shiftCount"),
        scheduledHours: round1(sumBy(rows, "scheduledHours")),
        actualHours: round1(sumBy(rows, "actualHours")),
        diff: round1(sumBy(rows, "actualHours") - sumBy(rows, "scheduledHours")),
        nightHours: round1(sumBy(rows, "nightHours")),
        holidayHours: round1(sumBy(rows, "holidayHours")),
      }
    : null;
  return {
    title: "Tổng hợp giờ làm",
    sheetName: "Tong hop gio lam",
    fileBase: "tong-hop-gio-lam",
    periodLabel: s.periodLabel,
    columns: [
      { key: "name", label: "Nhân viên", width: 26 },
      { key: "roleTag", label: "Role_Tag", width: 16 },
      { key: "shiftCount", label: "Số ca", align: "right", format: "number", width: 10 },
      { key: "scheduledHours", label: "Giờ theo lịch", align: "right", format: "hours", width: 16 },
      { key: "actualHours", label: "Giờ thực tế", align: "right", format: "hours", width: 16 },
      { key: "diff", label: "Chênh lệch", align: "right", format: "signed", width: 14 },
      { key: "nightHours", label: "Giờ ca đêm", align: "right", format: "hours", width: 14 },
      { key: "holidayHours", label: "Giờ ngày lễ", align: "right", format: "hours", width: 14 },
    ],
    rows,
    footer,
  };
}

// ---- Đối soát chấm công (US22-22) ----
function attendanceReport({ period, from, to, employeeId, roleTag }) {
  const a = buildAttendance({ period, from, to, employeeId, roleTag, status: "all" });
  const rows = a.rows.map((r) => ({
    id: r.id,
    name: r.employeeName,
    code: r.employeeId,
    date: r.date,
    shift: r.shiftName,
    scheduled: r.scheduled,
    checkIn: r.checkIn || "",
    checkOut: r.checkOut || "",
    lateMin: r.lateMin,
    earlyMin: r.earlyMin,
    status: r.status,
    adjusted: r.adjusted ? "Có" : "",
  }));
  return {
    title: "Đối soát chấm công",
    sheetName: "Doi soat cham cong",
    fileBase: "doi-soat-cham-cong",
    periodLabel: a.periodLabel,
    columns: [
      { key: "name", label: "Nhân viên", width: 26 },
      { key: "code", label: "Mã NV", width: 10 },
      { key: "date", label: "Ngày", width: 12 },
      { key: "shift", label: "Ca", width: 10 },
      { key: "scheduled", label: "Giờ theo lịch", width: 16 },
      { key: "checkIn", label: "Giờ vào", width: 10 },
      { key: "checkOut", label: "Giờ ra", width: 10 },
      { key: "lateMin", label: "Phút trễ", align: "right", format: "number", width: 10 },
      { key: "earlyMin", label: "Phút về sớm", align: "right", format: "number", width: 12 },
      { key: "status", label: "Trạng thái", width: 18 },
      { key: "adjusted", label: "Đã chỉnh sửa", width: 14 },
    ],
    rows,
  };
}

// ---- Bảng lương (US27) ----
// Cùng hàm tính (computePayroll), cùng dòng tổng (computeTotals) và cùng danh sách cột (PAYROLL_COLUMNS)
// với trang Bảng lương, nên số liệu và tiêu đề cột ở hai nơi luôn giống nhau.
function payrollReport({ period, from, to, employeeId, roleTag }) {
  const range = resolvePeriod({ period, from, to });
  const payrollData = computePayroll({ from: range.from || from || "2026-10-26" });
  let rows = payrollData.map((r) => ({ id: r.employeeId, ...r }));
  if (employeeId && employeeId !== "all") {
    rows = rows.filter((r) => r.employeeId === employeeId);
  }
  if (roleTag && roleTag !== "all") {
    rows = rows.filter((r) => r.roles?.includes(roleTag) || r.roleTag === roleTag);
  }
  const footer = rows.length ? { name: "Tổng cộng", ...computeTotals(rows) } : null;
  return {
    title: "Bảng lương",
    sheetName: "Bang luong",
    fileBase: "bang-luong",
    periodLabel: range.label,
    columns: PAYROLL_COLUMNS,
    rows,
    footer,
  };
}

// ---- Dashboard (US28): số liệu các thẻ + dữ liệu đằng sau biểu đồ (không chứa hình) ----
function dashboardReport({ period, from, to, roleTag }) {
  const d = buildDashboard({ period, from, to, roleTag });
  const c = d.cards || {
    scheduledHours: d.sumHoursScheduled || 0,
    actualHours: d.sumHoursActual || 0,
    payrollCost: d.payrollCost || 0,
    lateRate: 0,
    absentRate: 0,
    fillRate: 0,
  };
  const metrics = [
    { id: "m1", metric: "Tổng giờ theo lịch", value: c.scheduledHours, unit: "giờ" },
    { id: "m2", metric: "Tổng giờ thực tế", value: c.actualHours, unit: "giờ" },
    { id: "m3", metric: "Tổng chi phí lương", value: c.payrollCost, unit: "VND" },
    { id: "m4", metric: "Tỷ lệ đi trễ", value: c.lateRate, unit: "%" },
    { id: "m5", metric: "Tỷ lệ vắng", value: c.absentRate, unit: "%" },
    { id: "m6", metric: "Tỷ lệ lấp đầy ca", value: c.fillRate, unit: "%" },
  ];
  return {
    title: "Dashboard",
    sheetName: "Chi so",
    fileBase: "dashboard",
    periodLabel: d.periodLabel,
    columns: [
      { key: "metric", label: "Chỉ số", width: 28 },
      { key: "value", label: "Giá trị", align: "right", format: "number", width: 18 },
      { key: "unit", label: "Đơn vị", width: 10 },
    ],
    rows: d.empty ? [] : metrics,
    extraSheets: d.empty
      ? []
      : [
          {
            name: "Gio theo nhan vien",
            columns: [
              { key: "name", label: "Nhân viên", width: 26 },
              { key: "scheduled", label: "Giờ theo lịch", width: 16 },
              { key: "actual", label: "Giờ thực tế", width: 16 },
            ],
            rows: d.hoursPerEmployee,
          },
          {
            name: "Chi phi luong",
            columns: [
              { key: "label", label: "Kỳ", width: 18 },
              { key: "cost", label: "Chi phí lương (VND)", format: "money", width: 22 },
            ],
            rows: d.costPerBucket,
          },
          {
            name: "Cham cong",
            columns: [
              { key: "name", label: "Trạng thái", width: 20 },
              { key: "value", label: "Số ca", width: 12 },
            ],
            rows: d.attendance,
          },
          {
            name: "Lap day ca",
            columns: [
              { key: "shift", label: "Ca", width: 12 },
              { key: "required", label: "Vị trí cần", width: 14 },
              { key: "filled", label: "Vị trí đã đủ", width: 14 },
              { key: "rate", label: "Tỷ lệ lấp đầy (%)", width: 18 },
            ],
            rows: d.fillByShift,
          },
        ],
  };
}

// type: "roster" | "hours" | "attendance" | "payroll" | "dashboard"
// params: { period, from, to, employeeId = "all", roleTag = "all" }
export function buildReport(typeOrParams, maybeParams = {}) {
  const type = typeof typeOrParams === "string" ? typeOrParams : (typeOrParams?.type || "hours");
  const params = typeof typeOrParams === "object" ? typeOrParams : maybeParams;
  const p = { period: "week", from: "", to: "", employeeId: "all", roleTag: "all", ...params };
  switch (type) {
    case "roster":
      return rosterReport(p);
    case "attendance":
      return attendanceReport(p);
    case "payroll":
      return payrollReport(p);
    case "dashboard":
      return dashboardReport(p);
    default:
      return hoursReport(p);
  }
}

// ---- Báo cáo tổng hợp theo kỳ (màn "Báo cáo"): chỉ số + biểu đồ + bảng lương + bảng giờ làm ----
// Một lần xuất Excel ra đủ các sheet: Tổng quan, Bảng lương, Tổng hợp giờ làm, Đối soát chấm công, Lịch làm việc.
// params: { period, from, to, roleTag }
export function buildOverview({ period = "week", from = "", to = "", roleTag = "all" } = {}) {
  const p = { period, from, to, employeeId: "all", roleTag };
  const dash = buildDashboard({ period, from, to, roleTag });
  const c = dash.cards;
  const payroll = payrollReport(p);
  const hours = hoursReport(p);
  const attendance = attendanceReport(p);
  const roster = rosterReport(p);
  const metrics = dashboardReport(p).rows;
  const asSheet = (name, r) => ({ name, columns: r.columns, rows: r.rows, footer: r.footer });
  return {
    title: "Tổng hợp theo kỳ",
    sheetName: "Tong quan",
    fileBase: "bao-cao",
    periodLabel: dash.periodLabel,
    empty: dash.empty,
    cards: c,
    charts: {
      payrollPerEmployee: payroll.rows.map((r) => ({ name: r.name, total: r.total })),
      hoursPerEmployee: dash.hoursPerEmployee,
      attendance: dash.attendance,
    },
    tables: { payroll, hours },
    // sheet đầu: các chỉ số chính
    columns: [
      { key: "metric", label: "Chỉ số", width: 28 },
      { key: "value", label: "Giá trị", align: "right", format: "number", width: 18 },
      { key: "unit", label: "Đơn vị", width: 10 },
    ],
    rows: dash.empty ? [] : metrics,
    extraSheets: dash.empty
      ? []
      : [
          asSheet("Bang luong", payroll),
          asSheet("Tong hop gio lam", hours),
          asSheet("Doi soat cham cong", attendance),
          asSheet("Lich lam viec", roster),
        ],
  };
}