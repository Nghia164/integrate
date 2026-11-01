/* eslint-disable react-refresh/only-export-components */
import { Person, RowActions } from "../../../components/TableKit";
import { roleLabel, contractLabel } from "../../../components/PageKit";
import { formatMoney, fmtHours } from "../../../lib/formatters";


export function ContractPill({ value }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[12px] font-medium text-slate-700">
      {contractLabel(value)}
    </span>
  );
}

/**
 * Định nghĩa các cột cho bảng Bảng lương (Table)
 */
export function getPayrollColumns({ onOpenDetail }) {
  const num = "whitespace-nowrap tabular-nums";

  return [
    {
      key: "employee",
      label: "Nhân viên",
      className: "min-w-[210px]",
      render: (r) => <Person name={r.name} sub={`${r.employeeId} • ${roleLabel(r.roleTag)}`} />,
    },
    { key: "contract", label: "Hợp đồng", render: (r) => <ContractPill value={r.contract} /> },
    { key: "actual", label: "Giờ thực tế", align: "right", className: num, render: (r) => fmtHours(r.actualHours) },
    { key: "night", label: "Giờ ca đêm", align: "right", className: num, render: (r) => fmtHours(r.nightHours) },
    { key: "holiday", label: "Giờ ngày lễ", align: "right", className: num, render: (r) => fmtHours(r.holidayHours) },
    { key: "base", label: "Lương cơ bản", align: "right", className: num, render: (r) => formatMoney(r.basePay) },
    { key: "sur", label: "Tăng theo hệ số", align: "right", className: num, render: (r) => formatMoney(r.surcharge) },
    { key: "bonus", label: "Thưởng ca trực mở", align: "right", className: num, render: (r) => formatMoney(r.openShiftBonus) },
    { key: "total", label: "Tổng lương", align: "right", className: `${num} font-semibold`, render: (r) => formatMoney(r.total) },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => (
        <RowActions
          label={`Thao tác với ${r.name}`}
          items={[{ label: "Xem chi tiết", onClick: () => onOpenDetail(r.employeeId) }]}
        />
      ),
    },
  ];
}

/**
 * Định nghĩa dòng tổng cộng ở chân bảng
 */
export function getPayrollFooter(totals) {
  return {
    employee: `Tổng cộng (${totals.employeeCount} nhân viên)`,
    actual: fmtHours(totals.actualHours),
    night: fmtHours(totals.nightHours),
    holiday: fmtHours(totals.holidayHours),
    base: formatMoney(totals.basePay),
    sur: formatMoney(totals.surcharge),
    bonus: formatMoney(totals.openShiftBonus),
    total: formatMoney(totals.total),
  };
}
