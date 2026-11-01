import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getEmployeeShiftDetail } from "../../../services/workHoursService";
import { Loading } from "../../../components/FormKit";
import { ErrorMessage } from "../../../components/FormKit";
import { Button } from "../../../components/FormKit";
import { Table } from "../../../components/TableKit";
import { Avatar, StatusPill } from "../../../components/TableKit";

// Hộp thoại chi tiết giờ làm từng ca của một nhân viên (tách ra từ WorkHoursPage).
// Đặt file cạnh WorkHoursPage.jsx.
//
// Cách dùng:
//   {detailEmployee && (
//     <WorkHoursDetailModal
//       employee={detailEmployee}            // dòng nhân viên đã tính sẵn: name, employeeId, roleTag, contract, shiftCount, scheduledHours, actualHours, diff
//       period={period} from={fromDate} to={toDate}
//       roleLabel={roleLabel}                // hàm đổi mã vai trò -> tên tiếng Việt
//       onClose={() => setDetailEmployee(null)}
//     />
//   )}

const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

// Trạng thái từng ca
const SHIFT_STATUS_MAP = {
  "On-Time": { label: "Đúng giờ", hex: "#10b981" },
  Late: { label: "Đi trễ", hex: "#f59e0b" },
  "Early-Departure": { label: "Về sớm", hex: "#0ea5e9" },
  Absent: { label: "Vắng mặt", hex: "#f43f5e" },
  "Missing-Checkout": { label: "Thiếu giờ ra", hex: "#8b5cf6" },
};


// Cột của bảng chi tiết ca (dùng components/Table.jsx)
const shiftColumns = [
  { key: "date", label: "Ngày", className: "whitespace-nowrap font-medium", render: (s) => s.date },
  { key: "shiftName", label: "Ca", render: (s) => s.shiftName },
  { key: "scheduled", label: "Lịch xếp", className: "whitespace-nowrap text-slate-600", render: (s) => s.scheduled },
  {
    key: "actual",
    label: "Chấm công",
    className: "whitespace-nowrap",
    render: (s) => (s.absent ? "Vắng mặt" : s.missing ? `${s.actual} (chưa có giờ ra)` : s.actual),
  },
  {
    key: "status",
    label: "Trạng thái",
    render: (s) => {
      const meta =
        SHIFT_STATUS_MAP[s.status] ||
        (s.absent ? SHIFT_STATUS_MAP.Absent : s.missing ? SHIFT_STATUS_MAP["Missing-Checkout"] : SHIFT_STATUS_MAP["On-Time"]);
      return <StatusPill hex={meta.hex}>{meta.label}</StatusPill>;
    },
  },
  { key: "coefficient", label: "Hệ số", align: "right", className: "tabular-nums", render: (s) => `x${s.coefficient}` },
];

export default function WorkHoursDetailModal({ employee, period, from, to, roleLabel = (t) => t, onClose }) {
  const [shifts, setShifts] = useState(null);
  const [error, setError] = useState("");

  // Tải danh sách ca mỗi khi đổi nhân viên hoặc kỳ xem
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setShifts(null);
        setError("");
      }
    });
    getEmployeeShiftDetail(employee.employeeId, { period, from, to })
      .then((d) => !cancelled && setShifts(d))
      .catch(() => !cancelled && setError("Không tải được chi tiết ca làm"));
    return () => {
      cancelled = true;
    };
  }, [employee.employeeId, period, from, to]);

  // Esc để đóng
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const summary = [
    ["Số ca", `${employee.shiftCount} ca`],
    ["Theo lịch", `${employee.scheduledHours}h`],
    ["Thực tế", `${employee.actualHours}h`],
    ["Chênh lệch", `${signed(employee.diff)}h`],
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết giờ làm - ${employee.name}`}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* Đầu thẻ */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={employee.name} size="lg" />
            <div>
              <p className="text-[16px] font-semibold text-slate-900">{employee.name}</p>
              <p className="text-[13px] text-slate-500">
                {employee.employeeId} • {roleLabel(employee.roleTag)} • {employee.contract}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {/* Số liệu tóm tắt */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {summary.map(([label, val]) => (
              <div key={label} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5">
                <span className="text-[14px] text-slate-700">{label}</span>
                <span className="text-[16px] font-semibold tabular-nums text-slate-900">{val}</span>
              </div>
            ))}
          </div>

          <ErrorMessage message={error} />
          {!shifts && !error && <Loading text="Đang tải chi tiết ca..." />}
          {shifts && shifts.length === 0 && <p className="py-8 text-center text-[15px] text-slate-500">Không có ca làm việc nào trong kỳ này.</p>}

          {shifts && shifts.length > 0 && (
            <div className="mt-5">
              <Table variant="clean" maxHeight={360} columns={shiftColumns} rows={shifts} />
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-3">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}