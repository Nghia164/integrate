/**
 * File: src/lib/exportExcel.js
 * Tiện ích xuất file Excel dạng bảng dùng chung cho các trang
 */

import * as XLSX from "xlsx";
import { pad } from "./dateUtils.js";

export const fmtDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

function applyMoneyFormat(ws, columns, firstRow, lastRow) {
  columns.forEach((c, ci) => {
    if (c.format !== "money") return;
    for (let r = firstRow; r <= lastRow; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c: ci })];
      if (cell && cell.t === "n") cell.z = "#,##0";
    }
  });
}

function makeSheet({ columns, rows, footer, meta = [] }) {
  const header = columns.map((c) => c.label);
  const body = rows.map((r) => columns.map((c) => r[c.key] ?? ""));
  const foot = footer ? [columns.map((c) => footer[c.key] ?? "")] : [];
  const aoa = [...meta, header, ...body, ...foot];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = columns.map((c, i) => ({ wch: c.width ?? (i === 0 ? 26 : 16) }));
  if (meta.length > 0) {
    const lastCol = Math.max(columns.length - 1, 1);
    ws["!merges"] = meta.map((_, r) => ({ s: { r, c: 0 }, e: { r, c: lastCol } })).filter((_, r) => meta[r].length > 0);
  }
  applyMoneyFormat(ws, columns, meta.length + 1, aoa.length - 1);
  return ws;
}

export function exportReportExcel({ report, filterText = "", userName = "" }) {
  const meta = [
    [`Smart Scheduling - Báo cáo ${report.title}`],
    [`Kỳ báo cáo: ${report.periodLabel}`],
    [`Bộ lọc: ${filterText}`],
    [`Ngày xuất: ${fmtDate(new Date())}`],
    [`Người xuất: ${userName}`],
    [],
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet({ columns: report.columns, rows: report.rows, footer: report.footer, meta }), report.sheetName);
  (report.extraSheets ?? []).forEach((s) => {
    XLSX.utils.book_append_sheet(wb, makeSheet({ columns: s.columns, rows: s.rows, footer: s.footer }), s.name);
  });
  const d = new Date();
  const fileName = `${report.fileBase}_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName, workbook: wb };
}

export default {
  exportReportExcel,
  fmtDate,
};

