// =============================================================================
// FILE NÀY LÀM GÌ: Xuất file Excel Đối soát chấm công
// Loại: Helpers
// US: US29 (Xuất báo cáo chấm công)
// =============================================================================

import * as XLSX from "xlsx";
import { STATUS_VI, pad, fmtDate } from "./attendanceHelpers";

/**
 * Xuất file Excel Đối soát chấm công (US29)
 */
export function exportAttendanceExcel({ data, rows, search, status, user }) {
  if (!data || rows.length === 0) return;

  const statusLabel =
    status === "all"
      ? "Tất cả"
      : status === "late_early"
      ? "Đi trễ / Về sớm"
      : status === "absent_missing"
      ? "Vắng / Thiếu giờ ra (cần xử lý)"
      : status === "incomplete"
      ? "Chưa hoàn tất"
      : STATUS_VI[status] ?? status;

  const meta = [
    ["Smart Scheduling - Báo cáo Đối soát chấm công"],
    [`Kỳ báo cáo: ${data.periodLabel}`],
    [`Bộ lọc: Nhân viên - ${search.trim() || "Tất cả"}; Trạng thái - ${statusLabel}`],
    [`Ngày xuất: ${fmtDate(new Date())}`],
    [`Người xuất: ${user?.name ?? ""}`],
    [],
  ];

  const header = [
    "Nhân viên",
    "Mã NV",
    "Ngày",
    "Ca",
    "Giờ theo lịch",
    "Giờ vào",
    "Giờ ra",
    "Phút trễ",
    "Phút về sớm",
    "Trạng thái",
    "Đã chỉnh sửa",
  ];

  const body = rows.map((r) => [
    r.employeeName,
    r.employeeId,
    r.date,
    r.shiftName,
    r.scheduled,
    r.checkIn || "",
    r.checkOut || "",
    r.lateMin,
    r.earlyMin,
    STATUS_VI[r.status] ?? r.status,
    r.adjusted ? "Có" : "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...meta, header, ...body]);
  ws["!cols"] = [26, 10, 12, 10, 16, 10, 10, 10, 12, 18, 14].map((wch) => ({ wch }));
  ws["!merges"] = [0, 1, 2, 3, 4].map((r) => ({ s: { r, c: 0 }, e: { r, c: 10 } }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Doi soat cham cong");

  const d = new Date();
  XLSX.writeFile(wb, `doi-soat-cham-cong_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`);
}
