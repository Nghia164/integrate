import { useNavigate } from "react-router-dom";
import Block from "./Block";
import { Table } from "../../../../components/TableKit";
import { StatusPill, RowActions } from "../../../../components/TableKit";
import { roleLabel } from "../../../../components/PageKit";
import { STATUS_HEX } from "../../attendance/attendanceHelpers";

export default function UnderstaffedBlock({ understaffed = [] }) {
  const navigate = useNavigate();

  const understaffedColumns = [
    { key: "date", label: "Ngày", className: "whitespace-nowrap", render: (r) => r.date },
    { key: "shift", label: "Ca", className: "whitespace-nowrap", render: (r) => r.shift },
    { key: "roleTag", label: "Vai trò", className: "whitespace-nowrap", render: (r) => roleLabel(r.roleTag) },
    { key: "required", label: "Cần", align: "right", className: "tabular-nums", render: (r) => r.required },
    { key: "assigned", label: "Đã xếp", align: "right", className: "tabular-nums", render: (r) => r.assigned },
    { key: "missing", label: "Thiếu", render: (r) => <StatusPill hex={STATUS_HEX.Absent}>Thiếu {r.missing}</StatusPill> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: () => (
        <RowActions
          label="Thao tác với ca thiếu người"
          items={[{ label: "Tạo ca trực mở", onClick: () => navigate("/manager/open-shifts") }]}
        />
      ),
    },
  ];

  return (
    <Block title="Ca còn thiếu người" subtitle="14 ngày tới, không phụ thuộc kỳ đang lọc">
      {understaffed.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-slate-500">Các ca trong 14 ngày tới đều đã đủ người.</p>
      ) : (
        <Table variant="clean" minWidth={640} maxHeight={360} columns={understaffedColumns} rows={understaffed} />
      )}
    </Block>
  );
}
