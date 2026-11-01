import * as XLSX from "xlsx";
import { WEEK_LABEL } from "./scheduleShared";

/**
 * Xuất dữ liệu Lịch làm việc tuần ra file Excel
 */
export function exportScheduleExcel({ filteredAssignments = [], search = "", roleFilter = "all" }) {
  const meta = [
    ["Smart Scheduling - Lịch làm việc tuần chi tiết"],
    [`Kỳ lịch: ${WEEK_LABEL}`],
    [`Bộ lọc: Nhân viên - ${search.trim() || "Tất cả"}; Vai trò - ${roleFilter === "all" ? "Tất cả" : roleFilter}`],
    [`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`],
    [],
  ];

  const header = [
    "Nhân viên",
    "Mã NV",
    "Vai trò",
    "Ngày",
    "Thứ",
    "Ca",
    "Khung giờ",
    "Số giờ",
    "Trạng thái",
  ];

  const body = filteredAssignments.map((r) => [
    r.employeeName,
    r.employeeId,
    r.role,
    r.date,
    r.dayName,
    r.shiftName,
    r.scheduled,
    r.hours,
    r.status,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...meta, header, ...body]);
  ws["!cols"] = [24, 10, 14, 14, 12, 10, 16, 10, 16].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lich lam viec");
  XLSX.writeFile(wb, `lich-lam-viec_${WEEK_LABEL.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`);
}
