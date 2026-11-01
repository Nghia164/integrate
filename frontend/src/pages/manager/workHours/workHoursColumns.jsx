import { Person, StatusPill, RowActions } from "../../../components/TableKit";
import { roleLabel } from "../../../components/PageKit";
import { fmtHours, signed, ratioHex } from "./workHoursData";

/**
 * Định nghĩa các cột cho bảng Tổng hợp giờ làm (Table)
 */
export function getWorkHoursColumns({ onOpenDetail }) {
  const num = "whitespace-nowrap tabular-nums";
  const hoursOrZero = (h) =>
    h > 0 ? <span className="font-semibold">{fmtHours(h)}</span> : <span className="text-slate-400">0h</span>;

  return [
    {
      key: "employee",
      label: "Nhân viên",
      render: (r) => <Person name={r.name} sub={`${r.employeeId} • ${roleLabel(r.roleTag)}`} />,
    },
    { key: "shifts", label: "Số ca", align: "right", className: num, render: (r) => `${r.shiftCount} ca` },
    { key: "scheduled", label: "Theo lịch", align: "right", className: num, render: (r) => fmtHours(r.scheduledHours) },
    { key: "actual", label: "Thực tế", align: "right", className: `${num} font-semibold`, render: (r) => fmtHours(r.actualHours) },
    {
      key: "diff",
      label: "Chênh lệch",
      align: "right",
      className: num,
      render: (r) =>
        r.diff === 0 ? (
          <span className="text-slate-500">0h</span>
        ) : (
          <span className={`font-semibold ${r.diff > 0 ? "text-emerald-700" : "text-rose-700"}`}>{signed(r.diff)}h</span>
        ),
    },
    { key: "night", label: "Ca đêm (x1.2)", align: "right", className: num, render: (r) => hoursOrZero(r.nightHours) },
    { key: "holiday", label: "Ngày lễ (x1.5)", align: "right", className: num, render: (r) => hoursOrZero(r.holidayHours) },
    {
      key: "ratio",
      label: "Hoàn thành",
      render: (r) =>
        r.shiftCount === 0 ? <span className="text-slate-400">Không có ca</span> : <StatusPill hex={ratioHex(r.ratio)}>{r.ratio}%</StatusPill>,
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => <RowActions label={`Thao tác với ${r.name}`} items={[{ label: "Xem chi tiết", onClick: () => onOpenDetail(r) }]} />,
    },
  ];
}

/**
 * Định nghĩa dòng tổng cộng cuối bảng
 */
export function getWorkHoursFooter({ rows, totals, overallRatio }) {
  return {
    employee: `Tổng cộng (${rows.length} nhân viên)`,
    shifts: `${totals.shiftCount} ca`,
    scheduled: fmtHours(totals.scheduledHours),
    actual: fmtHours(totals.actualHours),
    diff: `${signed(totals.diff)}h`,
    night: fmtHours(totals.nightHours),
    holiday: fmtHours(totals.holidayHours),
    ratio: `${overallRatio}%`,
  };
}
