import * as XLSX from "xlsx";
import { roleLabel } from "../../../components/PageKit";
import { pad, fmtDate } from "../../../lib/formatters";


/**
 * Xuất file Excel báo cáo Tổng hợp giờ làm (US29)
 */
export function exportWorkHoursExcel({ summary, rows, totals, employeeId, roleTag, employeeMap, user }) {
  if (!summary || rows.length === 0) return;

  const empName = employeeId === "all" ? "Tất cả" : employeeMap[employeeId]?.name ?? employeeId;
  const meta = [
    ["Smart Scheduling - Báo cáo Tổng hợp giờ làm"],
    [`Kỳ báo cáo: ${summary.periodLabel}`],
    [`Bộ lọc: Nhân viên - ${empName}; Vai trò - ${roleTag === "all" ? "Tất cả" : roleLabel(roleTag)}`],
    [`Ngày xuất: ${fmtDate(new Date())}`],
    [`Người xuất: ${user?.name ?? ""}`],
    [],
  ];

  const header = [
    "Mã NV",
    "Họ và tên",
    "Vai trò",
    "Số ca",
    "Giờ theo lịch",
    "Giờ thực tế",
    "Chênh lệch",
    "Giờ ca đêm",
    "Giờ ngày lễ",
  ];

  const body = rows.map((r) => [
    r.employeeId,
    r.name,
    roleLabel(r.roleTag),
    r.shiftCount,
    r.scheduledHours,
    r.actualHours,
    r.diff,
    r.nightHours,
    r.holidayHours,
  ]);

  const totalRow = [
    "Tổng cộng",
    "",
    "",
    totals.shiftCount,
    totals.scheduledHours,
    totals.actualHours,
    totals.diff,
    totals.nightHours,
    totals.holidayHours,
  ];

  const ws = XLSX.utils.aoa_to_sheet([...meta, header, ...body, totalRow]);
  ws["!cols"] = [10, 22, 14, 8, 14, 14, 12, 12, 12].map((wch) => ({ wch }));
  ws["!merges"] = [0, 1, 2, 3, 4].map((r) => ({ s: { r, c: 0 }, e: { r, c: 8 } }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tong hop gio lam");

  const d = new Date();
  XLSX.writeFile(wb, `tong-hop-gio-lam_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`);
}
