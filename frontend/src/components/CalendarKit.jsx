/**
 * File: src/components/CalendarKit.jsx
 * Bộ thành phần Lịch & Phân ca: WeekGrid, WeekShiftGrid, ShiftBlock, ShiftModal, CalendarToolbar, ScheduleCell, AttendanceGrid
 */

import { useMemo } from "react";
import { Clock, Calendar, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { getNow, pad } from "../lib/dateUtils.js";
import { getShiftTheme, getShiftColors, TODAY_HIGHLIGHT, EMPTY_SHIFT_CELL } from "../lib/shiftColors.js";
import { STAFF_LAYOUT } from "../lib/layoutTokens.js";
import { buildWeekCells, normalizeShiftId } from "../lib/scheduleHelpers.js";
import { Modal, Button } from "./FormKit.jsx";
import { roleLabel } from "./PageKit.jsx";

// =============================================================================
// 1. SCHEDULE CELL COMPONENTS
// =============================================================================

export function DayHeaderCell({ label, date, isToday, isWeekend, className = "" }) {
  return (
    <th
      className={`sticky top-0 z-20 border-b border-slate-200 px-1 py-2 text-center ${
        isToday ? "bg-[#F0F6FB]" : "bg-white"
      } ${className}`}
    >
      <span className={`block text-[12px] font-semibold ${isWeekend ? "text-rose-500" : isToday ? "text-[#0F172A]" : "text-slate-700"}`}>
        {label}
      </span>
      {date && <span className={`block text-[11px] font-normal ${isToday ? "text-[#0F172A]/80" : "text-slate-500"}`}>{date}</span>}
    </th>
  );
}

export function EmployeeRoleTag({ name, roleTag, id }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-slate-200/80 bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs">
      <span>{name}</span>
      {(roleTag || id) && (
        <span className="text-[10px] text-slate-400">({roleTag || id})</span>
      )}
    </span>
  );
}

export function ScheduleShiftCard({
  shiftId = "morning",
  name,
  start,
  end,
  isUnderstaffed = false,
  missingCount = 0,
  onClick,
}) {
  if (isUnderstaffed) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg border border-dashed border-rose-300 bg-rose-50/60 p-2 text-left transition-colors hover:bg-rose-100/60"
      >
        <span className="block text-[12px] font-semibold text-rose-700">{name || "Ca làm"}</span>
        <span className="block text-[11px] text-rose-500">Thiếu {missingCount} người</span>
      </button>
    );
  }

  const theme = getShiftTheme(shiftId);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: theme.bg,
        borderLeftColor: theme.border,
        borderLeftWidth: "3px",
      }}
      className="w-full rounded-lg border border-slate-200/80 p-2 text-left shadow-2xs transition-all hover:brightness-95"
    >
      <span className="block text-[12px] font-semibold" style={{ color: theme.text }}>
        {name || theme.shiftName}
      </span>
      {(start || end) && (
        <span className="block text-[11px] text-slate-600 tabular-nums">
          {start} - {end}
        </span>
      )}
    </button>
  );
}

export function EmptyShiftCell() {
  return (
    <div className="flex h-11 w-full items-center justify-center rounded-lg border border-[#E5ECF1] bg-[#FAFBFC]" />
  );
}

const ATTENDANCE_CELL_THEMES = {
  "On-Time": "border-emerald-200 bg-emerald-50 text-emerald-800",
  Late: "border-amber-200 bg-amber-50 text-amber-800",
  "Early-Departure": "border-sky-200 bg-sky-50 text-sky-800",
  Absent: "border-rose-200 bg-rose-50 text-rose-700",
  "Missing-Checkout": "border-purple-200 bg-purple-50 text-purple-800",
  "On-Leave": "border-purple-200 bg-purple-50 text-purple-800",
  "In-Progress": "border-[#3F62C4]/30 bg-[#EEF2FB] text-[#314FA4]",
  Upcoming: "border-slate-200 bg-slate-50 text-slate-600",
};

export function AttendanceCellCard({ r, dim, onSelect, status, checkIn, checkOut, onClick }) {
  if (r) {
    const missing = r.status === "Missing-Checkout";
    const absent = r.status === "Absent";
    const upcoming = r.status === "Upcoming";
    const onLeave = r.status === "On-Leave";
    const inProgress = r.status === "In-Progress";

    const tip = [
      `Ca ${r.shiftName} (${r.scheduled})`,
      absent
        ? "Vắng mặt"
        : upcoming
        ? "Chưa diễn ra"
        : onLeave
        ? "Nghỉ phép"
        : `Vào ${r.checkIn || "—"} • Ra ${r.checkOut || "—"}`,
      r.status,
      r.adjusted ? "Đã chỉnh sửa" : null,
      r.locked ? "Bản ghi đã khóa" : "Bấm để điều chỉnh",
    ]
      .filter(Boolean)
      .join(" • ");

    const theme = ATTENDANCE_CELL_THEMES[r.status] || "border-slate-200 bg-slate-50 text-slate-700";

    return (
      <button
        type="button"
        onClick={() => onSelect?.(r)}
        disabled={r.locked}
        title={tip}
        className={`relative h-12 w-full rounded-lg border p-1 text-[10px] leading-tight transition ${theme} ${
          dim ? "opacity-25" : ""
        } ${r.locked ? "cursor-not-allowed opacity-60" : "hover:ring-2 hover:ring-[#3F62C4]/30"}`}
      >
        {absent ? (
          <span className="block text-[11px] font-semibold">Vắng</span>
        ) : upcoming ? (
          <span className="block text-[10px] font-medium text-slate-500">Chưa bắt đầu</span>
        ) : onLeave ? (
          <span className="block text-[11px] font-semibold text-purple-700">Nghỉ</span>
        ) : (
          <>
            <span className="block text-[11px] font-semibold">{r.checkIn || (inProgress ? "Chờ vào" : "--:--")}</span>
            <span className="block opacity-80">{r.checkOut || (inProgress ? "Đang làm" : missing ? "?" : "")}</span>
          </>
        )}
        {r.adjusted && <span className="absolute right-1 top-0.5 text-[9px] opacity-70">✎</span>}
      </button>
    );
  }

  const isAbsent = status === "Absent";
  const isLeave = status === "On-Leave";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-1.5 text-center text-[11px] transition-all hover:shadow-xs ${
        isAbsent
          ? "border-rose-300 bg-rose-50 text-rose-700"
          : isLeave
          ? "border-purple-300 bg-purple-50 text-purple-700"
          : "border-slate-200 bg-slate-50 text-slate-800"
      }`}
    >
      <span className="block font-semibold">{status}</span>
      {checkIn && <span className="block text-[10px] text-slate-500">{checkIn} - {checkOut || "—"}</span>}
    </button>
  );
}

// =============================================================================
// 2. SHIFT BLOCK & SHIFT MODAL
// =============================================================================

export function ShiftBlock({
  shift,
  onClick,
  className = "",
  compact = false,
}) {
  const colors = getShiftTheme(shift);
  const shiftName = shift?.shiftName || shift?.name || colors.shiftName;
  const startTime = shift?.startTime || shift?.start || "00:00";
  const endTime = shift?.endTime || shift?.end || "00:00";
  const role = shift?.roleTag || shift?.role || "";
  const isLeave = shift?.isLeave || shift?.type === "leave";

  if (isLeave) {
    return (
      <div
        onClick={onClick}
        className={`rounded-xl border border-purple-200 bg-purple-50/90 p-2.5 transition-all text-left ${
          onClick ? "cursor-pointer hover:bg-purple-100 hover:shadow-xs active:scale-[0.99]" : ""
        } ${className}`}
        style={{ borderLeftWidth: "4px", borderLeftColor: "#9333EA" }}
      >
        <div className="flex items-center gap-1.5 text-purple-900">
          <span className="text-[14px]">🏖️</span>
          <span className="font-semibold text-[15px]">Nghỉ phép</span>
        </div>
        {shift?.reason && (
          <p className="mt-1 text-[13px] text-purple-700 italic truncate">{shift.reason}</p>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={`rounded-xl border border-slate-200/80 ${
        compact ? "p-1.5 sm:p-2" : "p-2.5 sm:p-3"
      } transition-all text-left ${
        onClick
          ? "cursor-pointer hover:shadow-sm hover:brightness-[0.98] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#4A6FD0] focus-visible:outline-none"
          : ""
      } ${className}`}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[14.5px] font-semibold text-[#0F172A]">{shiftName}</span>
        {role && (
          <span className="rounded-md border border-slate-200/80 bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
            {role}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1 text-[13px] text-slate-600">
        <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span className="tabular-nums">{startTime} - {endTime}</span>
      </div>
    </div>
  );
}

export function ShiftModal({
  shift,
  onClose,
  onExchange,
  onLeave,
  isStaff = true,
}) {
  if (!shift) return null;

  const colors = getShiftTheme(shift);
  const isLeave = shift.isLeave || shift.type === "leave";

  return (
    <Modal
      open={Boolean(shift)}
      onClose={onClose}
      title={isLeave ? "Chi tiết ngày nghỉ phép" : "Chi tiết ca làm việc"}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-left py-1">
        {isLeave ? (
          <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-4 space-y-2.5">
            <p className="text-[17px] font-bold text-purple-900">
              🏖️ {shift.title || "Nghỉ phép"}
            </p>
            <p className="text-[14px] text-purple-800">
              Ngày nghỉ: <span className="font-semibold">{shift.isoDate || shift.date}</span>
            </p>
            <p className="text-[14px] text-purple-800">
              Loại nghỉ: <span className="font-semibold">{shift.leaveTypeName || "Nghỉ phép cá nhân"}</span>
            </p>
            {shift.reason && (
              <p className="text-[13.5px] text-purple-700 italic">
                Lý do: {shift.reason}
              </p>
            )}
          </div>
        ) : (
          <div
            className="rounded-xl border border-slate-200 p-4 space-y-3"
            style={{
              borderLeftWidth: "4px",
              borderLeftColor: colors.border,
              backgroundColor: colors.bg,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-bold text-slate-900">
                {shift.shiftName || shift.name}
              </span>
              {(shift.roleTag || shift.role) && (
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12px] font-medium text-slate-800">
                  {roleLabel(shift.roleTag || shift.role)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[14px] text-slate-700">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>{shift.dateFormatted || shift.isoDate || shift.date}</span>
            </div>

            <div className="flex items-center gap-2 text-[14px] text-slate-700">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="tabular-nums font-medium">
                {shift.startTime || shift.start} - {shift.endTime || shift.end}
              </span>
            </div>

            {shift.employeeName && (
              <div className="flex items-center gap-2 text-[14px] text-slate-700">
                <UserRound className="h-4 w-4 text-slate-500" />
                <span>Nhân viên: <span className="font-medium text-slate-900">{shift.employeeName}</span></span>
              </div>
            )}
          </div>
        )}

        {isStaff && !isLeave && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            {onExchange && (
              <Button variant="outline" size="sm" onClick={() => onExchange(shift)}>
                Đổi ca
              </Button>
            )}
            {onLeave && (
              <Button variant="outline" size="sm" onClick={() => onLeave(shift)}>
                Xin nghỉ phép
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

// =============================================================================
// 3. CALENDAR TOOLBAR
// =============================================================================

export function CalendarToolbar({
  periodLabel,
  onPrev,
  onNext,
  onToday,
  viewMode = "week",
  onViewChange,
  isMobile = false,
  className = "",
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3 ${className}`}>
      {/* CỤM ĐIỀU KHIỂN THỜI GIAN BÊN TRÁI */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Nút Hôm nay */}
        <button
          type="button"
          onClick={onToday}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-[14.5px] sm:text-[15px] font-medium text-[#0F172A] shadow-2xs transition-all hover:bg-slate-50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#0F172A] cursor-pointer shrink-0"
        >
          Hôm nay
        </button>

        {/* Khối hiển thị khoảng ngày kèm nút Chuyển tuần (‹ ›) */}
        <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white shadow-2xs shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 text-slate-800">
            <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="text-[14px] sm:text-[15px] font-medium tabular-nums text-slate-900 whitespace-nowrap">
              {periodLabel || "Tuần hiện tại"}
            </span>
          </div>

          <span className="h-5 w-px bg-slate-200" />

          {/* Nút lùi kỳ (‹) */}
          <button
            type="button"
            onClick={onPrev}
            title="Kỳ trước"
            aria-label="Kỳ trước"
            className="flex h-full w-8 sm:w-9 items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="h-5 w-px bg-slate-200" />

          {/* Nút tiến kỳ (›) */}
          <button
            type="button"
            onClick={onNext}
            title="Kỳ sau"
            aria-label="Kỳ sau"
            className="flex h-full w-8 sm:w-9 items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Nhóm nút Ngày / Tuần / Tháng (Chỉ hiển thị trên máy tính, điện thoại dùng danh sách theo ngày) */}
        {!isMobile && onViewChange && (
          <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 text-[14px] sm:text-[15px] font-medium shrink-0">
            <button
              type="button"
              onClick={() => onViewChange("day")}
              className={`h-full rounded-lg px-2.5 sm:px-3 transition-all cursor-pointer ${
                viewMode === "day"
                  ? "bg-[#CBE3F0] font-semibold text-[#0F172A] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Ngày
            </button>
            <button
              type="button"
              onClick={() => onViewChange("week")}
              className={`h-full rounded-lg px-2.5 sm:px-3 transition-all cursor-pointer ${
                viewMode === "week"
                  ? "bg-[#CBE3F0] font-semibold text-[#0F172A] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => onViewChange("month")}
              className={`h-full rounded-lg px-2.5 sm:px-3 transition-all cursor-pointer ${
                viewMode === "month"
                  ? "bg-[#CBE3F0] font-semibold text-[#0F172A] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tháng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// 4. WEEK GRID & WEEK SHIFT GRID
// =============================================================================

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function WeekGrid({
  days = [],
  employees = [],
  renderCell,
  summaryColumns = [],
  legend = null,
  emptyCell = "—",
  employeeWidth = 200,
  dayMinWidth = 64,
  maxHeight = null,
  onEmployeeClick = null,
  className = "",
}) {
  const today = useMemo(() => {
    const now = getNow();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  const normalizedDays = useMemo(() => {
    return days.map((d, index) => {
      if (typeof d === "string") {
        const dt = new Date(`${d}T00:00:00`);
        const wd = dt.getDay();
        return {
          iso: d,
          label: WEEKDAYS[wd],
          dateStr: `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}`,
          isToday: d === today,
          isWeekend: wd === 0 || wd === 6,
          dayIndex: index,
        };
      }
      return {
        ...d,
        iso: d.iso || d.dateIso || d.date,
        label: d.label || d.dayName,
        dateStr: d.dateStr || d.dateVn,
        isToday: d.isToday ?? (d.iso === today),
        isWeekend: d.isWeekend ?? (d.dayIndex === 6),
        dayIndex: d.dayIndex !== undefined ? d.dayIndex : index,
      };
    });
  }, [days, today]);

  const wrapStyle = maxHeight ? { maxHeight, overflowY: "auto" } : undefined;

  return (
    <div className={`overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs bg-white ${className}`} style={wrapStyle}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th style={{ width: employeeWidth }} className="sticky left-0 z-30 bg-slate-50/80 px-3 py-2 text-left text-[12px] font-semibold text-slate-700">
              Nhân viên
            </th>
            {normalizedDays.map((d) => (
              <DayHeaderCell
                key={d.iso || d.dayIndex}
                label={d.label}
                date={d.dateStr}
                isToday={d.isToday}
                isWeekend={d.isWeekend}
                style={{ minWidth: dayMinWidth }}
              />
            ))}
            {summaryColumns.map((col) => (
              <th key={col.key} className="px-2 py-2 text-center text-[12px] font-semibold text-slate-700">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
              <td
                style={{ width: employeeWidth }}
                className={`sticky left-0 z-10 bg-white px-3 py-2 border-r border-slate-100 ${
                  onEmployeeClick ? "cursor-pointer hover:bg-slate-50 text-blue-600 font-medium" : ""
                }`}
                onClick={onEmployeeClick ? () => onEmployeeClick(emp) : undefined}
              >
                <div className="font-semibold text-slate-900">{emp.name}</div>
                <div className="text-[11px] text-slate-500">{emp.id} {emp.roleTag ? `• ${emp.roleTag}` : ""}</div>
              </td>
              {normalizedDays.map((d) => (
                <td key={d.iso || d.dayIndex} className="p-1.5 align-middle text-center border-r border-slate-100 last:border-r-0">
                  {renderCell ? renderCell(emp, d) : emptyCell}
                </td>
              ))}
              {summaryColumns.map((col) => (
                <td key={col.key} className="p-1.5 align-middle text-center font-medium text-slate-700">
                  {col.render ? col.render(emp) : emp[col.key] ?? emptyCell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {legend && <div className="p-3 border-t border-slate-100 bg-slate-50/40">{legend}</div>}
    </div>
  );
}

export function WeekShiftGrid({
  days = [],
  shifts = [],
  myShifts = [],
  matrix = null,
  approvedLeaves = [],
  onShiftClick,
  renderCell,
  renderDayAction,
  showLegend,
  className = "",
}) {
  const weekMatrix = useMemo(() => {
    if (matrix) return matrix;
    return buildWeekCells(myShifts);
  }, [matrix, myShifts]);

  const shiftList =
    Array.isArray(shifts) && shifts.length > 0
      ? shifts
      : [
          { id: "morning", code: "morning", name: "Sáng", start: "06:00", end: "12:00", startTime: "06:00", endTime: "12:00" },
          { id: "afternoon", code: "afternoon", name: "Chiều", start: "12:00", end: "17:00", startTime: "12:00", endTime: "17:00" },
          { id: "evening", code: "evening", name: "Tối", start: "17:00", end: "22:00", startTime: "17:00", endTime: "22:00" },
        ];

  const shouldShowLegend = showLegend !== undefined ? showLegend : !renderCell;

  return (
    <div className={`${STAFF_LAYOUT.grid.container} ${className}`}>
      <table className={STAFF_LAYOUT.grid.table}>
        <thead>
          <tr className="border-b border-slate-200">
            <th
              style={{ width: STAFF_LAYOUT.grid.cornerWidth }}
              className={STAFF_LAYOUT.grid.cornerTh}
            >
              {STAFF_LAYOUT.grid.cornerLabel}
            </th>

            {days.map((day) => {
              const isToday = day.isToday || day.dateIso === day.todayIso;
              return (
                <th
                  key={day.id || day.dateIso || day.dayIndex}
                  className={`border-r border-slate-200 p-2 text-center last:border-r-0 transition-colors h-[76px] align-middle ${
                    isToday ? STAFF_LAYOUT.grid.todayBg : STAFF_LAYOUT.grid.defaultDayBg
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex-1 text-center">
                      <div className={`${STAFF_LAYOUT.grid.dayNameText} ${isToday ? "text-[#0F172A] font-medium" : "text-slate-600"}`}>
                        {day.dayName}
                      </div>
                      <div className={`${STAFF_LAYOUT.grid.dayDateText} ${isToday ? "text-[#0F172A] font-medium" : "text-slate-800"}`}>
                        {day.dateVn}
                      </div>
                    </div>
                    {renderDayAction && (
                      <div className="shrink-0">
                        {renderDayAction(day)}
                      </div>
                    )}
                  </div>
                  {isToday && !renderDayAction && (
                    <div className="mt-0.5">
                      <span className="inline-block rounded-full bg-[#0F172A] px-2 py-0.5 text-[10.5px] font-semibold text-white shadow-2xs">
                        Hôm nay
                      </span>
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200">
          {shiftList.map((sDef) => {
            const shiftColors = getShiftColors(sDef);
            const shiftNameLower = (sDef.name || "").toLowerCase();
            const cShiftId = normalizeShiftId(sDef);

            return (
              <tr key={sDef.id || sDef.name} className="transition-colors hover:bg-slate-50/30">
                <td
                  className="border-r border-slate-200 p-3 align-middle select-none"
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: shiftColors.border,
                    backgroundColor: shiftColors.rowHeaderBg || shiftColors.bg,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: shiftColors.dot }}
                    />
                    <span
                      className="text-[16px] font-medium leading-snug"
                      style={{ color: shiftColors.text }}
                    >
                      Ca {sDef.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[14px] font-normal text-slate-600 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      {sDef.start || sDef.startTime} – {sDef.end || sDef.endTime}
                    </span>
                  </div>
                </td>

                {days.map((day) => {
                  const isToday = day.isToday;

                  const matchedLeave = (approvedLeaves || []).find((l) => {
                    const dateMatch = l.isoDate === day.dateIso || l.date === day.dateIso || l.dayId === day.id;
                    if (!dateMatch) return false;
                    if (!l.shiftId && !l.shiftName) return true;
                    const lShiftId = normalizeShiftId(l);
                    return lShiftId === cShiftId;
                  });

                  // Tra cứu chính xác từ ma trận thuần ngày x ca (so theo shiftId chuẩn, không so substring)
                  const matchedShift = weekMatrix.getCell(day.dateIso || day.id, cShiftId);

                  return (
                    <td
                      key={day.id || day.dateIso || day.dayIndex}
                      className={`border-r border-slate-200 p-2 align-middle last:border-r-0 transition-colors ${
                        isToday ? "bg-[#F0F6FB]" : "bg-white"
                      }`}
                    >
                      {renderCell ? (
                        renderCell({ day, shift: sDef, shiftColors, isToday, shiftNameLower })
                      ) : matchedLeave ? (
                        <div
                          className="flex min-h-[88px] h-[88px] w-full flex-col justify-between rounded-lg border border-purple-200 bg-purple-50/90 p-2 text-left shadow-2xs"
                          style={{ borderLeftWidth: "4px", borderLeftColor: "#8B5CF6" }}
                        >
                          <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-purple-900">
                            <span>🏖️</span>
                            <span className="truncate">Nghỉ phép</span>
                          </div>
                          <div className="flex items-center justify-between text-[11.5px] font-normal text-purple-700">
                            <span className="truncate">{matchedLeave.leaveTypeName || "Nghỉ phép"}</span>
                            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-800 shrink-0">
                              Đã duyệt
                            </span>
                          </div>
                        </div>
                      ) : matchedShift ? (
                        <button
                          type="button"
                          onClick={() => onShiftClick && onShiftClick(matchedShift)}
                          className="group flex min-h-[88px] h-[88px] w-full flex-col justify-between rounded-lg p-2 text-left border cursor-pointer transition-all duration-150 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]"
                          style={{
                            borderLeftWidth: "4px",
                            borderLeftColor: shiftColors.border,
                            backgroundColor: shiftColors.bg,
                            borderColor: `${shiftColors.border}50`,
                          }}
                          title={`Bấm để xem chi tiết ca ${matchedShift.shiftName || sDef.name} (${matchedShift.startTime} - ${matchedShift.endTime})`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className="text-[14px] font-medium leading-tight truncate"
                                style={{ color: shiftColors.text }}
                              >
                                Ca {matchedShift.shiftName || sDef.name}
                              </span>
                              {matchedShift.status === "ongoing" && (
                                <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 leading-none">
                                  Đang làm
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1 text-[12.5px] font-normal text-slate-600 whitespace-nowrap tabular-nums">
                              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>
                                {matchedShift.startTime} – {matchedShift.endTime}
                              </span>
                            </div>
                          </div>

                          {matchedShift.roleTag && (
                            <div className="mt-1">
                              <span
                                className="inline-block rounded px-1.5 py-0.5 text-[11px] font-normal whitespace-nowrap leading-none"
                                style={{
                                  backgroundColor: shiftColors.badgeBg,
                                  color: shiftColors.badgeText,
                                }}
                              >
                                {matchedShift.roleTag}
                              </span>
                            </div>
                          )}
                        </button>
                      ) : (
                        <div
                          className="h-[88px] min-h-[88px] w-full rounded-lg border select-none"
                          style={{
                            backgroundColor: EMPTY_SHIFT_CELL.bg,
                            borderColor: EMPTY_SHIFT_CELL.border,
                          }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {shouldShowLegend && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] text-slate-600">
          <span className="font-medium text-slate-700">Chú thích:</span>
          {shiftList.map((s) => {
            const col = getShiftColors(s);
            return (
              <span key={s.id || s.name} className="inline-flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm border"
                  style={{ backgroundColor: col.bg, borderColor: col.border }}
                />
                <span>
                  Ca {s.name} ({s.start || s.startTime} – {s.end || s.endTime})
                </span>
              </span>
            );
          })}
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-purple-400 bg-purple-100" />
            <span>Nghỉ phép (Đã duyệt)</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm border border-[#0F172A]"
              style={{ backgroundColor: TODAY_HIGHLIGHT.bg }}
            />
            <span>Cột Hôm nay</span>
          </span>
        </div>
      )}
    </div>
  );
}

const MAX_ATTENDANCE_DAYS = 31;
const COL_NAME = 200;
const COL_SHIFTS = 72;
const COL_HOURS = 84;
const COL_DAY_MIN = 64;

const ATTENDANCE_CELL_THEMES_GRID = {
  "On-Time": "bg-emerald-100 text-emerald-800",
  Late: "bg-amber-100 text-amber-800",
  "Early-Departure": "bg-sky-100 text-sky-800",
  Absent: "bg-rose-100 text-rose-700",
  "Missing-Checkout": "bg-violet-100 text-violet-800",
  "On-Leave": "bg-purple-100 text-purple-800",
  "In-Progress": "bg-[#EEF2FB] text-[#314FA4]",
  Upcoming: "bg-slate-100 text-slate-600",
};

const ATTENDANCE_DOT = {
  "On-Time": "bg-emerald-400",
  Late: "bg-amber-400",
  "Early-Departure": "bg-sky-400",
  Absent: "bg-rose-400",
  "Missing-Checkout": "bg-violet-400",
  "On-Leave": "bg-purple-400",
  "In-Progress": "bg-[#3F62C4]",
  Upcoming: "bg-slate-400",
};

const ATTENDANCE_STATUS_NAMES = {
  "On-Time": "Đúng giờ",
  Late: "Đi trễ",
  "Early-Departure": "Về sớm",
  Absent: "Vắng mặt",
  "Missing-Checkout": "Thiếu giờ ra",
  "On-Leave": "Nghỉ phép",
  "In-Progress": "Đang diễn ra",
  Upcoming: "Chưa diễn ra",
};

function listAttendanceDays(from, to) {
  if (!from || !to) return [];
  const out = [];
  const padNum = (n) => String(n).padStart(2, "0");
  const end = new Date(`${to}T00:00:00`);
  for (let d = new Date(`${from}T00:00:00`); d <= end && out.length <= MAX_ATTENDANCE_DAYS; d.setDate(d.getDate() + 1)) {
    out.push(`${d.getFullYear()}-${padNum(d.getMonth() + 1)}-${padNum(d.getDate())}`);
  }
  return out;
}

export function AttendanceGrid({
  from,
  to,
  employees = [],
  rows = [],
  status = "all",
  onSelect,
  days = [],
  renderCell,
  maxHeight,
  className = "",
}) {
  const computedDays = useMemo(() => {
    if (days && days.length > 0) return days;
    return listAttendanceDays(from, to);
  }, [days, from, to]);

  const byKey = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => m.set(`${r.employeeId}_${r.iso}`, r));
    return m;
  }, [rows]);

  const totals = useMemo(() => {
    const t = {};
    rows.forEach((r) => {
      const cur = t[r.employeeId] ?? { shifts: 0, min: 0 };
      cur.shifts += 1;
      cur.min += r.actualMin ?? 0;
      t[r.employeeId] = cur;
    });
    return t;
  }, [rows]);

  const summaryColumns = useMemo(
    () => [
      {
        key: "shifts",
        label: "Số ca",
        width: COL_SHIFTS,
        render: (e) => totals[e.id]?.shifts ?? 0,
        cellClassName: "text-[#2e384a]",
      },
      {
        key: "hours",
        label: "Giờ làm",
        width: COL_HOURS,
        render: (e) => (Math.round((totals[e.id]?.min ?? 0) / 6) / 10).toLocaleString("vi-VN"),
        cellClassName: "font-semibold text-[#141f33]",
      },
    ],
    [totals]
  );

  const legend = useMemo(
    () => (
      <>
        {Object.keys(ATTENDANCE_CELL_THEMES_GRID).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${ATTENDANCE_DOT[s]}`} />
            {ATTENDANCE_STATUS_NAMES[s] || s}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
          Không có ca
        </span>
        <span className="ml-auto text-slate-400">✎ đã chỉnh sửa</span>
      </>
    ),
    []
  );

  if (renderCell && (!from || !to)) {
    return (
      <WeekGrid
        days={days}
        employees={employees}
        renderCell={renderCell}
        maxHeight={maxHeight}
        className={className}
      />
    );
  }

  if (computedDays.length > MAX_ATTENDANCE_DAYS) {
    return (
      <p className="px-4 py-10 text-center text-sm text-slate-400">
        Khoảng ngày dài hơn {MAX_ATTENDANCE_DAYS} ngày, dạng lưới chỉ hỗ trợ tối đa {MAX_ATTENDANCE_DAYS} ngày. Vui lòng chọn khoảng ngắn hơn hoặc
        chuyển sang dạng Danh sách.
      </p>
    );
  }

  return (
    <WeekGrid
      days={computedDays}
      employees={employees}
      employeeWidth={COL_NAME}
      dayMinWidth={COL_DAY_MIN}
      maxHeight={maxHeight || "min(60vh, 520px)"}
      legend={legend}
      summaryColumns={summaryColumns}
      className={className}
      renderCell={(e, d) => {
        if (renderCell) return renderCell(e, d);
        const r = byKey.get(`${e.id}_${d.iso}`);
        if (!r) return null;
        return <AttendanceCellCard r={r} dim={status !== "all" && r.status !== status} onSelect={onSelect} />;
      }}
    />
  );
}

export function CalendarView(props) {
  return <WeekGrid {...props} />;
}

export default {
  DayHeaderCell,
  EmployeeRoleTag,
  ScheduleShiftCard,
  EmptyShiftCell,
  AttendanceCellCard,
  ShiftBlock,
  ShiftModal,
  CalendarToolbar,
  WeekGrid,
  WeekShiftGrid,
  AttendanceGrid,
  CalendarView,
};
