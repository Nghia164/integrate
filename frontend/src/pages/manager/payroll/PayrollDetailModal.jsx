import { useEffect, useState } from "react";
import { getEmployeePayslip } from "../../../services/payrollService";
import { Loading } from "../../../components/FormKit";
import { ErrorMessage } from "../../../components/FormKit";
import { Modal } from "../../../components/FormKit";
import { formatMoney, fmtHours } from "../../../lib/formatters";

import { PAY_COLORS } from "./payrollData";

// Chi tiết lương một nhân viên (US27): từng ca (ngày, ca, giờ vào/ra, giờ tính lương, hệ số, thành tiền)
// và từng khoản thưởng Open Shift.

const STATUS_VI = {
  "On-Time": "Đúng giờ",
  Late: "Đi trễ",
  "Early-Departure": "Về sớm",
  Absent: "Vắng mặt",
  "Missing-Checkout": "Thiếu giờ ra",
};
const STATUS_HEX = {
  "On-Time": "#10b981",
  Late: "#f59e0b",
  "Early-Departure": "#0ea5e9",
  Absent: "#ef4444",
  "Missing-Checkout": "#8b5cf6",
};

const th = "px-4 py-2.5 text-left text-[13px] font-semibold text-slate-600";

function Tile({ label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-[13px] text-slate-500">
        {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
        {label}
      </div>
      <div className="mt-0.5 text-[18px] font-semibold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}

export default function PayrollDetailModal({ open, employeeId, query, periodLabel, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !employeeId) return undefined;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
        setDetail(null);
      }
    });
    getEmployeePayslip(employeeId, query)
      .then((d) => !cancelled && setDetail(d))
      .catch(() => !cancelled && setError("Không tải được chi tiết lương"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, employeeId, query]);

  const emp = detail?.employee;
  // Các số tổng của phiếu lương (tính từ chính các dòng ca nên luôn khớp)
  const baseSum = detail ? detail.shifts.reduce((a, r) => a + r.basePay, 0) : 0;
  const s = detail && {
    actualHours: detail.totalHours,
    basePay: baseSum,
    surcharge: detail.totalSalary - baseSum, // phần tăng theo hệ số
    openShiftBonus: detail.openShiftBonus,
    total: detail.netPay,
  };

  return (
    <Modal open={open} title={emp?.name ?? "Chi tiết lương"} onClose={onClose}>
      {emp && (
        <p className="-mt-2 mb-4 text-[14px] text-slate-500">
          {emp.id} • {emp.roleTag} • {emp.contract} • {formatMoney(emp.hourlyWage)}/giờ{periodLabel ? ` • ${periodLabel}` : ""}
        </p>
      )}
        {error && <ErrorMessage message={error} />}
        {loading && <Loading text="Đang tải chi tiết..." />}

        {!loading && !error && detail && s && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Tile label="Giờ thực tế" value={`${fmtHours(s.actualHours)} giờ`} />
              <Tile label="Lương cơ bản" value={formatMoney(s.basePay)} color={PAY_COLORS.base} />
              <Tile label="Tăng theo hệ số + thưởng ca trực mở" value={formatMoney(s.surcharge + s.openShiftBonus)} color={PAY_COLORS.surcharge} />
              <Tile label="Tổng lương" value={formatMoney(s.total)} />
            </div>

            <h3 className="mb-2 mt-6 text-[15px] font-semibold text-slate-900">Lương từng ca</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] text-[14px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className={th}>Ngày</th>
                    <th className={th}>Ca</th>
                    <th className={th}>Giờ vào – ra</th>
                    <th className={`${th} text-right`}>Giờ tính lương</th>
                    <th className={`${th} text-right`}>Hệ số</th>
                    <th className={`${th} text-right`}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.shifts.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 text-slate-900">
                      <td className="whitespace-nowrap px-4 py-2.5">{r.date}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        {r.shiftName}
                        <span className="block text-[12px] text-slate-500">{r.scheduled}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                        {r.checkIn} - {r.checkOut}
                        {(r.status === "Absent" || r.status === "Missing-Checkout") && (
                          <span
                            className="ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] text-slate-800"
                            style={{ backgroundColor: `${STATUS_HEX[r.status]}1f` }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_HEX[r.status] }} />
                            {STATUS_VI[r.status]}
                          </span>
                        )}
                        {r.adjusted && <span className="ml-2 text-[12px] text-slate-500">✎ Đã sửa</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{fmtHours(r.hours)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">× {r.coefficient.toLocaleString("vi-VN", { minimumFractionDigits: 1 })}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">{formatMoney(r.totalPay)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                    <td className="px-4 py-2.5" colSpan={3}>Cộng lương theo ca</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtHours(s.actualHours)}</td>
                    <td />
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(s.basePay + s.surcharge)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="mb-2 mt-6 text-[15px] font-semibold text-slate-900">Thưởng ca trực mở</h3>
            {detail.bonuses.length === 0 ? (
              <p className="rounded-xl border border-slate-200 px-4 py-4 text-[14px] text-slate-500">Không có thưởng ca trực mở trong kỳ này.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className={th}>Ngày</th>
                      <th className={th}>Ca</th>
                      <th className={`${th} text-right`}>Tiền thưởng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.bonuses.map((b) => (
                      <tr key={b.id} className="border-t border-slate-100 text-slate-900">
                        <td className="px-4 py-2.5">{b.date}</td>
                        <td className="px-4 py-2.5">{b.shiftName}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">{formatMoney(b.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                      <td className="px-4 py-2.5" colSpan={2}>Cộng thưởng</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(s.openShiftBonus)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-900 px-5 py-4 text-white">
              <span className="text-[14px]">Tổng lương = lương theo ca + thưởng ca trực mở</span>
              <b className="text-[20px] font-semibold tabular-nums">{formatMoney(s.total)}</b>
            </div>
          </>
        )}
    </Modal>
  );
}