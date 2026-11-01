import * as XLSX from "xlsx";
import { roleLabel } from "../../../components/PageKit";
import { pad, fmtDate } from "../../../lib/formatters";

import { STATUS_VI } from "../attendance/attendanceHelpers";

/**
 * Xuất file Excel Báo cáo Tổng quan Dashboard (US29)
 */
export function exportDashboardExcel({ data, shiftName, roleTag, user }) {
  if (!data || data.empty) return;

  const c = data.cards;
  const wb = XLSX.utils.book_new();
  const meta = [
    ["Smart Scheduling - Báo cáo Tổng quan"],
    [`Kỳ báo cáo: ${data.periodLabel}`],
    [
      `Bộ lọc: Ca - ${shiftName === "all" ? "Tất cả" : shiftName}; Vai trò - ${
        roleTag === "all" ? "Tất cả" : roleLabel(roleTag)
      }`,
    ],
    [`Ngày xuất: ${fmtDate(new Date())}`],
    [`Người xuất: ${user?.name ?? ""}`],
    [],
  ];

  const sheet = (rows, widths, numCols = []) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    if (widths) ws["!cols"] = widths.map((wch) => ({ wch }));
    numCols.forEach((cIdx) => {
      for (let r = 0; r < rows.length; r++) {
        const ref = XLSX.utils.encode_cell({ r, c: cIdx });
        if (ws[ref] && typeof ws[ref].v === "number") ws[ref].z = "#,##0";
      }
    });
    return ws;
  };

  const metrics = [
    ["Chỉ số", "Giá trị"],
    ["Giờ làm thực tế (giờ)", c.actualHours],
    ["Giờ theo lịch (giờ)", c.scheduledHours],
    ["Chi phí lương (VND)", c.payrollCost],
    ["Tỷ lệ đi trễ (%)", c.lateRate],
    ["Tỷ lệ vắng (%)", c.absentRate],
    ["Tỷ lệ lấp đầy ca (%)", c.fillRate],
  ];

  const ws1 = sheet([...meta, ...metrics], [34, 18]);
  ws1["!merges"] = [0, 1, 2, 3, 4].map((r) => ({ s: { r, c: 0 }, e: { r, c: 1 } }));
  XLSX.utils.book_append_sheet(wb, ws1, "Chi so");

  XLSX.utils.book_append_sheet(
    wb,
    sheet(
      [
        ["Nhân viên", "Giờ theo lịch", "Giờ thực tế"],
        ...data.hoursPerEmployee.map((r) => [r.name, r.scheduled, r.actual]),
      ],
      [26, 16, 16]
    ),
    "Gio theo nhan vien"
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheet([["Kỳ", "Chi phí lương (VND)"], ...data.costPerBucket.map((r) => [r.label, r.cost])], [18, 22], [1]),
    "Chi phi luong"
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheet(
      [["Trạng thái", "Số ca"], ...data.attendance.map((r) => [STATUS_VI[r.name] ?? r.name, r.value])],
      [20, 12]
    ),
    "Cham cong"
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheet(
      [
        ["Ca", "Vị trí cần", "Vị trí đã đủ", "Tỷ lệ lấp đầy (%)"],
        ...data.fillByShift.map((r) => [r.shift, r.required, r.filled, r.rate]),
      ],
      [12, 14, 14, 18]
    ),
    "Lap day ca"
  );

  const d = new Date();
  XLSX.writeFile(wb, `dashboard_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`);
}
