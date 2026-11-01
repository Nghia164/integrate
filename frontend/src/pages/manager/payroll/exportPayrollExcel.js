import { exportReportExcel } from "../../../lib/exportExcel";

import { PAYROLL_COLUMNS } from "../../../services/payrollService";
import { contractLabel } from "../../../components/PageKit";

/**
 * Xuất dữ liệu Bảng lương ra file Excel (US27)
 */
export function exportPayrollExcel({
  data,
  rows,
  totals,
  partial,
  search,
  contract,
  user,
}) {
  if (!data || rows.length === 0) return;

  exportReportExcel({
    report: {
      title: "Bảng lương",
      sheetName: "Bang luong",
      fileBase: "bang-luong",
      periodLabel: partial ? `${data.periodLabel} (tạm tính)` : data.periodLabel,
      columns: PAYROLL_COLUMNS,
      rows,
      footer: { name: "Tổng cộng", ...totals },
    },
    filterText: `Nhân viên - ${search.trim() || "Tất cả"}; Hợp đồng - ${
      contract === "all" ? "Tất cả" : contractLabel(contract)
    }`,
    userName: user?.name ?? "",
  });
}
