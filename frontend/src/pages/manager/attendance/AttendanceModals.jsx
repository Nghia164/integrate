// =============================================================================
// FILE NÀY LÀM GÌ: Toàn bộ hộp thoại chi tiết, điều chỉnh và lịch sử chấm công (Manager)
// Loại: Modals
// US: US25 (Đối soát chấm công), US26 (Điều chỉnh chấm công)
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Modal } from "../../../components/FormKit";
import { Button } from "../../../components/FormKit";
import { Loading } from "../../../components/FormKit";
import { Table } from "../../../components/TableKit";
import { Field, inputClass } from "../../../components/PageKit";
import { StatusPill } from "../../../components/TableKit";
import { initialsOf } from "../../../lib/formatters";

import { useAuth } from "../../../context/AuthContext";
import {
  getAttendanceHistory,
  listExplanationsForManager,
  approveExplanation,
  rejectExplanation,
  adjustMockAttendance,
  getAttendanceRecordHistory,
} from "../../../services/attendanceService";
import {
  STATUS_LIST,
  STATUS_VI,
  STATUS_HEX,
  toMin,
  fmtDuration,
  dateKey,
  roleVi,
  pct,
  schedParts,
  dayLabel,
} from "./attendanceHelpers";

// -----------------------------------------------------------------------------
// 1. THANH TRỰC QUAN CA LÀM VIỆC (DAYBAR & SEGMENT)
// -----------------------------------------------------------------------------
function Segment({ from, to, className = "", style }) {
  if (from == null || to == null || to <= from) return null;
  return (
    <div
      className={`absolute inset-y-0 ${className}`}
      style={{ left: `${pct(from)}%`, width: `${pct(to) - pct(from)}%`, ...style }}
    />
  );
}

function DayBar({ row }) {
  const [s, e] = schedParts(row);
  const inMin = toMin(row.checkIn);
  const outMin = toMin(row.checkOut);
  const color = STATUS_HEX[row.status] || "#94a3b8";
  const absent = row.status === "Absent";
  const missing = row.status === "Missing-Checkout";
  const upcoming = row.status === "Upcoming";
  const onLeave = row.status === "On-Leave";

  return (
    <div
      className="relative h-7 overflow-hidden rounded bg-slate-100"
      role="img"
      aria-label={`${STATUS_VI[row.status] ?? row.status}: ${row.checkIn || "—"} đến ${row.checkOut || "—"}`}
    >
      <Segment from={s} to={e} className="bg-slate-200" />
      {absent && (
        <>
          <Segment from={s} to={e} style={{ backgroundColor: color }} />
          <span className="absolute inset-0 grid place-items-center text-[13px] font-semibold text-white">Vắng mặt</span>
        </>
      )}
      {upcoming && (
        <span className="absolute inset-0 grid place-items-center text-[12px] font-medium text-slate-500">Chưa diễn ra</span>
      )}
      {onLeave && (
        <span className="absolute inset-0 grid place-items-center text-[12px] font-medium text-purple-700">Nghỉ phép</span>
      )}
      {!absent && !upcoming && !onLeave && inMin == null && (
        <span className="absolute inset-0 grid place-items-center text-[12px] font-medium text-amber-700">Chờ check-in</span>
      )}
      {!absent && inMin != null && (
        missing ? (
          <Segment from={inMin} to={e} style={{ background: `repeating-linear-gradient(45deg,${color},${color} 4px,#ddd6fe 4px,#ddd6fe 8px)` }} />
        ) : (
          <Segment from={inMin} to={outMin} style={{ backgroundColor: color }} />
        )
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. TỪNG DÒNG CA LÀM VIỆC TRONG CHI TIẾT
// -----------------------------------------------------------------------------
function AttendanceShiftItem({ row: r, onAdjust, onHistory }) {
  const [s, e] = schedParts(r);
  const a = toMin(r.checkIn);
  const b = toMin(r.checkOut);

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-slate-900">
          {dayLabel(r.date)}
          <span className="ml-2 text-[14px] font-normal text-slate-600">
            Ca {String(r.shiftName).toLowerCase()} • {r.scheduled}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[14px] text-slate-600">
            Thời lượng: <b className="font-semibold text-slate-900">{a != null && b != null ? fmtDuration(b - a) : "—"}</b>
          </span>
          <StatusPill hex={STATUS_HEX[r.status]}>{STATUS_VI[r.status] ?? r.status}</StatusPill>
          {r.hasExplanation && (
            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800 border border-sky-200">
              Có giải trình
            </span>
          )}
          {r.adjusted && <span title="Đã chỉnh sửa" className="text-[13px] font-medium text-slate-500">✎ Đã sửa</span>}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[64px_1fr_64px] items-center gap-3">
        <div>
          <p className="text-[12px] text-slate-500">Vào</p>
          <p className="text-[15px] font-semibold tabular-nums text-slate-900">{r.checkIn || "—"}</p>
        </div>
        <DayBar row={r} />
        <div className="text-right">
          <p className="text-[12px] text-slate-500">Ra</p>
          <p className="text-[15px] font-semibold tabular-nums text-slate-900">
            {r.checkOut || (r.status === "Missing-Checkout" ? "Chưa có" : "—")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] text-slate-700">
          {r.lateMin > 0 && <span className="mr-4 font-medium text-slate-900">Đi trễ {r.lateMin} phút</span>}
          {r.earlyMin > 0 && <span className="font-medium text-slate-900">Về sớm {r.earlyMin} phút</span>}
          {!(r.lateMin > 0) && !(r.earlyMin > 0) && s != null && e != null && <span className="text-slate-500">Đúng khung giờ của ca</span>}
        </p>
        <div className="flex items-center gap-2">
          {r.adjusted && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onHistory(r)}>
              Lịch sử
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAdjust(r)}
            disabled={r.locked}
            title={r.locked ? "Kỳ lương đã chốt, không thể điều chỉnh" : undefined}
          >
            Điều chỉnh
          </Button>
        </div>
      </div>
    </li>
  );
}

// -----------------------------------------------------------------------------
// 3. THỐNG KÊ CHI TIẾT & CHÚ GIẢI TRẠNG THÁI
// -----------------------------------------------------------------------------
function AttendanceDetailStats({ stats }) {
  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5">
          <span className="text-[15px] font-medium text-slate-800">Tổng giờ làm</span>
          <span className="text-[18px] font-semibold tabular-nums text-slate-900">
            {fmtDuration(stats.actualMin)}
          </span>
        </div>
        {STATUS_LIST.map((s) => (
          <div key={s} className="flex items-center justify-between rounded-lg border border-slate-300 px-4 py-2.5">
            <span className="flex items-center gap-2 text-[15px] text-slate-800">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_HEX[s] }} />
              {STATUS_VI[s]}
            </span>
            <span className="text-[18px] font-semibold tabular-nums text-slate-900">
              {stats.counts[s]}
              <span className="ml-1 text-[14px] font-normal text-slate-600">ca</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-5">
        <span className="flex items-center gap-2 text-[14px] text-slate-700">
          <span className="inline-block h-2.5 w-5 rounded-sm bg-slate-200" />
          Khung giờ của ca
        </span>
        {STATUS_LIST.map((s) => (
          <span key={s} className="flex items-center gap-2 text-[14px] text-slate-700">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_HEX[s] }} />
            {STATUS_VI[s]}
          </span>
        ))}
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// 4. HỘP THOẠI ĐIỀU CHỈNH CHẤM CÔNG (US26 & GIẢI TRÌNH)
// -----------------------------------------------------------------------------
export function AttendanceAdjustModal({ adjusting, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    checkIn: adjusting?.checkIn || "",
    checkOut: adjusting?.checkOut || "",
    reason: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Tìm giải trình đang chờ của ca này (nếu có)
  const pendingExp = useMemo(() => {
    if (!adjusting) return null;
    const list = listExplanationsForManager({ status: "pending" });
    return (
      list.find(
        (e) =>
          e.attendanceId === adjusting.id ||
          e.shiftId === adjusting.id ||
          (e.employeeId === adjusting.employeeId &&
            e.date === adjusting.date &&
            (e.shiftName === adjusting.shiftName || e.shiftName?.includes(adjusting.shiftName)))
      ) || null
    );
  }, [adjusting]);

  // Lấy lịch sử điều chỉnh của ca này
  const historyList = useMemo(() => {
    if (!adjusting?.id) return [];
    return getAttendanceRecordHistory(adjusting.id);
  }, [adjusting?.id, saving]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (adjusting) {
      setForm({
        checkIn: pendingExp?.proposedIn || adjusting.checkIn || "",
        checkOut: pendingExp?.proposedOut || adjusting.checkOut || "",
        reason: pendingExp ? `Duyệt theo giải trình: ${pendingExp.reason}` : "",
      });
      setShowRejectInput(false);
      setRejectReason("");
      setFormError("");
    }
  }, [adjusting, pendingExp]);

  if (!adjusting) return null;

  // Xử lý lưu điều chỉnh thông thường (US26)
  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      adjustMockAttendance(adjusting.id, {
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        reason: form.reason,
        modifier: user?.name || user?.id || "Quản lý",
      });
      onClose();
      onSaved?.("Đã lưu điều chỉnh chấm công. Số liệu tổng hợp giờ làm đã được cập nhật.");
    } catch (err) {
      setFormError(err?.message ?? "Không lưu được điều chỉnh. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // Quản lý duyệt giải trình
  const handleApprove = async () => {
    if (!pendingExp) return;
    setSaving(true);
    setFormError("");
    try {
      const res = approveExplanation(pendingExp.id, {
        inTime: form.checkIn,
        outTime: form.checkOut,
        note: form.reason || pendingExp.reason,
      });
      if (res && res.ok === false) {
        setFormError(res.message || "Không thể duyệt giải trình.");
        return;
      }
      onClose();
      onSaved?.("Đã duyệt giải trình và áp dụng giờ chấm công mới cho nhân viên.");
    } catch (err) {
      setFormError(err?.message ?? "Lỗi duyệt giải trình.");
    } finally {
      setSaving(false);
    }
  };

  // Quản lý từ chối giải trình
  const handleReject = async () => {
    if (!pendingExp) return;
    if (!rejectReason.trim()) {
      setFormError("Vui lòng nhập lý do từ chối giải trình.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = rejectExplanation(pendingExp.id, { reason: rejectReason.trim() });
      if (res && res.ok === false) {
        setFormError(res.message || "Không thể từ chối giải trình.");
        return;
      }
      onClose();
      onSaved?.("Đã từ chối đơn giải trình của nhân viên.");
    } catch (err) {
      setFormError(err?.message ?? "Lỗi từ chối giải trình.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!adjusting} title="Điều chỉnh chấm công" onClose={() => !saving && onClose()} maxWidth="max-w-lg">
      <div className="space-y-4 text-[14px]">
        {/* Banner nếu kỳ lương đã chốt */}
        {adjusting.locked && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[13px] font-medium text-rose-800">
            Kỳ lương đã chốt, không thể điều chỉnh.
          </div>
        )}

        {/* Thông tin nhân viên và ca */}
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
          <div>
            <p className="text-[13px] text-slate-600">Nhân viên</p>
            <p className="font-medium text-slate-900">{adjusting.employeeName} ({adjusting.employeeId})</p>
          </div>
          <div>
            <p className="text-[13px] text-slate-600">Ca làm việc</p>
            <p className="font-medium text-slate-900">{adjusting.shiftName} • {adjusting.date} • {adjusting.scheduled}</p>
          </div>
        </div>

        {/* Khối giải trình của nhân viên (nếu có giải trình chờ duyệt) */}
        {pendingExp && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sky-900 text-[13.5px] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Giải trình từ nhân viên ({pendingExp.issueType === "missing_checkin" ? "Quên check-in" : "Quên check-out"})
              </span>
              <span className="text-[11.5px] text-sky-700">
                {new Date(pendingExp.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-[13px] text-sky-950">
              Giờ đề nghị: <strong className="font-bold tabular-nums">{pendingExp.proposedIn} – {pendingExp.proposedOut}</strong>
            </p>
            <p className="text-[12.5px] text-slate-700 italic bg-white/70 rounded-md p-2 border border-sky-100">
              “{pendingExp.reason}”
            </p>
          </div>
        )}

        {/* Form nhập giờ vào / ra */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Giờ vào">
            <input
              type="time"
              value={form.checkIn}
              disabled={adjusting.locked || saving}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Giờ ra">
            <input
              type="time"
              value={form.checkOut}
              disabled={adjusting.locked || saving}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Lý do điều chỉnh */}
        <Field label="Lý do điều chỉnh (bắt buộc)">
          <textarea
            rows={2}
            value={form.reason}
            disabled={adjusting.locked || saving}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Ví dụ: nhân viên quên chấm công ra, đã xác nhận với quản lý ca"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-900 focus:border-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
          />
        </Field>

        {/* Form lý do từ chối nếu bấm từ chối giải trình */}
        {showRejectInput && pendingExp && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 space-y-2">
            <label className="block text-[13px] font-semibold text-rose-900">
              Lý do từ chối giải trình (bắt buộc):
            </label>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối để thông báo cho nhân viên..."
              className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-[13.5px] text-slate-900 focus:border-rose-600 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowRejectInput(false)}>
                Hủy từ chối
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={handleReject} loading={saving}>
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        )}

        {formError && <p className="text-[13px] text-rose-700">{formError}</p>}

        {/* Nút hành động */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={saving}>
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            {pendingExp ? (
              <>
                {!showRejectInput && (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setShowRejectInput(true)}
                    disabled={adjusting.locked || saving}
                    className="text-rose-700 hover:bg-rose-50"
                  >
                    Từ chối
                  </Button>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleApprove}
                  disabled={adjusting.locked || saving}
                  loading={saving}
                >
                  Duyệt và áp dụng
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={adjusting.locked || saving}
                loading={saving}
              >
                {saving ? "Đang lưu…" : "Lưu điều chỉnh"}
              </Button>
            )}
          </div>
        </div>

        {/* KHU LỊCH SỬ CHỈNH SỬA (US26 - DÒNG THỜI GIAN DỌC) */}
        <div className="pt-3 border-t border-slate-200">
          <h4 className="text-[14px] font-bold text-[#0F172A] mb-3">Lịch sử chỉnh sửa</h4>
          {historyList.length === 0 ? (
            <p className="py-3 text-center text-[13px] text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
              Chưa có chỉnh sửa.
            </p>
          ) : (
            <div className="space-y-3 relative pl-4 border-l-2 border-slate-200">
              {historyList.map((item, idx) => (
                <div key={idx} className="relative space-y-1 text-[13px]">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-400 border-2 border-white" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{item.by || "Quản lý"}</span>
                    <span className="text-[11.5px] text-slate-500 tabular-nums">{item.at}</span>
                  </div>
                  <div className="text-[12.5px] text-slate-700 font-medium">
                    <span>Giờ vào: {item.inBefore || "—"} → <strong>{item.inAfter || "—"}</strong></span> ·{" "}
                    <span>Giờ ra: {item.outBefore || "—"} → <strong>{item.outAfter || "—"}</strong></span>
                  </div>
                  <p className="text-[12px] text-slate-600">Lý do: <em>{item.reason}</em></p>
                  {(item.source === "explanation" || item.explanationId) && (
                    <span className="inline-block rounded bg-sky-50 px-1.5 py-0.5 text-[10.5px] font-medium text-sky-800 border border-sky-200">
                      Theo giải trình của nhân viên
                    </span>
                  )}
                </div>
              ))}
              {/* Giờ gốc ban đầu ở mục cuối cùng */}
              <div className="relative pt-2 text-[12.5px] text-slate-500 border-t border-slate-100">
                <span className="font-medium text-slate-700">Giờ gốc ghi nhận ban đầu:</span>{" "}
                Vào: {adjusting.originalCheckIn || adjusting.checkIn || "—"} – Ra: {adjusting.originalCheckOut || adjusting.checkOut || "—"}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// 5. HỘP THOẠI LỊCH SỬ ĐIỀU CHỈNH
// -----------------------------------------------------------------------------
const historyColumns = [
  { key: "at", label: "Thời điểm" },
  { key: "by", label: "Người sửa" },
  { key: "before", label: "Trước" },
  { key: "after", label: "Sau" },
  { key: "reason", label: "Lý do" },
];

export function AttendanceHistoryModal({ historyRow, onClose }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!historyRow?.id) return;
    let ignore = false;
    getAttendanceHistory(historyRow.id)
      .then((data) => {
        if (!ignore) setHistory(data);
      })
      .catch(() => {
        if (!ignore) setHistory([]);
      });
    return () => {
      ignore = true;
    };
  }, [historyRow?.id]);

  if (!historyRow) return null;

  return (
    <Modal
      open={!!historyRow}
      title={`Lịch sử điều chỉnh - ${historyRow?.employeeName ?? ""} (${historyRow?.date ?? ""})`}
      onClose={onClose}
    >
      {!history && <Loading text="Đang tải lịch sử..." />}
      {history && history.length === 0 && (
        <p className="py-6 text-center text-[14px] text-slate-500">Chưa có lần điều chỉnh nào.</p>
      )}
      {history && history.length > 0 && <Table columns={historyColumns} rows={history} />}
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// 6. HỘP THOẠI CHI TIẾT CHẤM CÔNG NHÂN VIÊN (US25 / US26)
// -----------------------------------------------------------------------------
export default function AttendanceDetailModal({
  open,
  employeeId,
  focusRowId,
  employees = [],
  rows = [],
  periodLabel,
  onClose,
  onNavigate,
  onSaved,
}) {
  const [adjusting, setAdjusting] = useState(null);
  const [historyRow, setHistoryRow] = useState(null);

  useEffect(() => {
    if (!open || !focusRowId) return;
    const r = rows.find((x) => x.id === focusRowId);
    if (r) queueMicrotask(() => setAdjusting(r));
  }, [open, focusRowId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && !adjusting && !historyRow && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, adjusting, historyRow, onClose]);

  const list = useMemo(
    () =>
      rows
        .filter((r) => r.employeeId === employeeId)
        .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)) || (schedParts(b)[0] ?? 0) - (schedParts(a)[0] ?? 0)),
    [rows, employeeId]
  );

  const stats = useMemo(() => {
    const counts = Object.fromEntries(STATUS_LIST.map((s) => [s, 0]));
    let actualMin = 0;
    list.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
      const a = toMin(r.checkIn);
      const b = toMin(r.checkOut);
      if (a != null && b != null && b > a) actualMin += b - a;
    });
    return { counts, actualMin };
  }, [list]);

  if (!open || !employeeId) return null;

  const emp = employees.find((e) => e.id === employeeId);
  const name = emp?.name ?? list[0]?.employeeName ?? employeeId;
  const idx = employees.findIndex((e) => e.id === employeeId);
  const go = (step) => {
    if (idx < 0 || employees.length === 0) return;
    onNavigate?.(employees[(idx + step + employees.length) % employees.length].id);
  };

  const navBtn = "grid h-9 w-9 place-items-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40";

  return (
    <>
      <div
        className="fixed inset-0 z-[45] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center"
        onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <div role="dialog" aria-modal="true" aria-label={`Chi tiết chấm công - ${name}`} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          {/* Tiêu đề & Điều hướng */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700">{initialsOf(name)}</span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[17px] font-semibold text-slate-900">
                  {name}
                  {emp?.roleTag && <span className="rounded border border-slate-300 px-2 py-0.5 text-[12px] font-medium text-slate-700">{roleVi(emp.roleTag)}</span>}
                </p>
                <p className="text-[14px] text-slate-600">{employeeId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Nhân viên trước" onClick={() => go(-1)} disabled={employees.length <= 1} className={navBtn}><ChevronLeft size={18} /></button>
              <button type="button" aria-label="Nhân viên tiếp theo" onClick={() => go(1)} disabled={employees.length <= 1} className={navBtn}><ChevronRight size={18} /></button>
              <button type="button" aria-label="Đóng" onClick={onClose} className="ml-2 grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
          </div>

          {/* Nội dung danh sách ca & thống kê */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-[14px] text-slate-600">
              Kỳ làm việc: <b className="font-semibold text-slate-900">{periodLabel || "Kỳ đang chọn"}</b>
            </p>
            <AttendanceDetailStats stats={stats} />

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h4 className="text-[16px] font-semibold text-slate-900">Danh sách ca làm việc ({list.length})</h4>
              {list.length === 0 ? (
                <p className="py-6 text-center text-[14px] text-slate-500">Nhân viên này không có ca làm việc nào trong khoảng thời gian đã chọn.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {list.map((r) => (
                    <AttendanceShiftItem key={r.id} row={r} onAdjust={setAdjusting} onHistory={setHistoryRow} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <AttendanceAdjustModal adjusting={adjusting} onClose={() => setAdjusting(null)} onSaved={onSaved} />
      <AttendanceHistoryModal historyRow={historyRow} onClose={() => setHistoryRow(null)} />
    </>
  );
}
