import { useNavigate } from "react-router-dom";
import { Table } from "../../../../components/TableKit";
import { Person, StatusPill, RowActions } from "../../../../components/TableKit";

// Bảng danh sách phân công ca làm việc chi tiết (List View)

export default function CreatedScheduleListView({
  filteredAssignments,
  pageListRows,
  onOpenShiftModal,
}) {
  const navigate = useNavigate();

  const columns = [
    {
      key: "employee",
      label: "Nhân viên",
      render: (r) => <Person name={r.employeeName} sub={`${r.employeeId} • ${r.role}`} />,
    },
    {
      key: "date",
      label: "Ngày",
      className: "whitespace-nowrap",
      render: (r) => (
        <div>
          <span className="font-medium text-slate-800">{r.date}</span>
          <span className="block text-[12px] text-slate-500">{r.dayName}</span>
        </div>
      ),
    },
    {
      key: "shift",
      label: "Ca",
      className: "whitespace-nowrap",
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-900">{r.shiftName}</span>
          <span className="block text-[12px] text-slate-500">{r.scheduled}</span>
        </div>
      ),
    },
    {
      key: "hours",
      label: "Thời lượng",
      className: "whitespace-nowrap",
      render: (r) => <span className="font-medium tabular-nums text-slate-800">{r.hours}g00</span>,
    },
    {
      key: "role",
      label: "Vai trò",
      className: "whitespace-nowrap",
      render: (r) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            r.role === "Phục vụ"
              ? "bg-[#E8EEFB] text-[#3452A8]"
              : r.role === "Pha chế"
              ? "bg-amber-50 text-amber-700"
              : "bg-purple-50 text-purple-700"
          }`}
        >
          {r.role}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: () => <StatusPill hex="#10b981">Đã xếp ca</StatusPill>,
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => (
        <RowActions
          label={`Thao tác với ca của ${r.employeeName}`}
          items={[
            { label: "Xem chi tiết ca", onClick: () => onOpenShiftModal(r.shiftKey) },
            { label: "Xem hồ sơ nhân viên", onClick: () => navigate("/manager/employees") },
            { label: "Xem đối soát chấm công", onClick: () => navigate("/manager/attendance") },
          ]}
        />
      ),
    },
  ];

  if (filteredAssignments.length === 0) {
    return (
      <p className="py-10 text-center text-[15px] text-slate-500">
        Không có phân công nào phù hợp với bộ lọc hiện tại.
      </p>
    );
  }

  return (
    <Table
      variant="clean"
      minWidth={900}
      columns={columns}
      rows={pageListRows}
      onRowClick={(r) => onOpenShiftModal(r.shiftKey)}
    />
  );
}
