// =============================================================================
// FILE NÀY LÀM GÌ: Màn hình Quản lý Khả năng làm việc của nhân viên theo tuần
// Loại: Page
// US: US09 (Quản lý Khả năng làm việc của nhân viên)
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  PageHeader,
  PageCard,
  SearchInput,
  Toolbar,
  Pagination,
  inputClass,
} from "../../../components/PageKit";
import { StatusTabs } from "../../../components/PageKit";
import { usePagination, useLiveData } from "../../../lib/hooks";
import { getNow, mondayOf, startOfDay, addDays, toISO, toVN } from "../../../lib/dateUtils.js";
import { getWeeklyStaffAvailability, subscribeAvailability } from "../../../services/availabilityService.js";
import { getShiftConfig } from "../../../services/shiftConfigService.js";
import { useNavigate } from "react-router-dom";
import { Sparkles, CalendarDays, Check, X, Clock } from "lucide-react";
import { Button } from "../../../components/FormKit";
import { Avatar } from "../../../components/TableKit";
import {
  ROLE_OPTIONS,
  STATUS_TABS,
  calculateShiftShortages,
  getSlotStatus,
  countAvailabilitySlots,
} from "./availabilityHelpers.js";
import { EmployeeDetailModal } from "./AvailabilityModals.jsx";
import { NoticeBar } from "../../../components/NoticeKit";
import { stripAccents } from "../../../lib/formatters.js";


/**
 * Cụm nút hành động trên PageHeader của trang Khả năng làm việc Manager
 */
function AvailabilityHeaderActions({ weekMonday }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        icon={<CalendarDays size={15} />}
        onClick={() => navigate(`/manager/schedule/created?week=${weekMonday}`)}
      >
        Xem lịch
      </Button>

      <Button
        type="button"
        variant="primary"
        size="sm"
        icon={<Sparkles size={15} />}
        onClick={() => navigate(`/manager/schedule?week=${weekMonday}`)}
      >
        Tạo lịch tự động
      </Button>
    </div>
  );
}

/**
 * Bảng hiển thị ma trận khả năng làm việc theo tuần chuẩn
 */
function AvailabilityTable({
  days = [],
  shifts = [],
  employees = [],
  onSelectEmployee,
}) {
  const todayIso = useMemo(() => {
    const now = getNow();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  if (employees.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-[14px] text-slate-500">
        Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[580px] rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
      <table className="w-full table-fixed border-separate border-spacing-0 text-xs min-w-[960px]">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-slate-50/95 backdrop-blur-xs px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 min-w-[210px] w-[210px]"
            >
              Nhân viên
            </th>

            {days.map((d) => {
              const isToday = d.isToday ?? (d.dateIso === todayIso);
              const isSunday = d.dayIndex === 6;
              return (
                <th
                  key={d.dateIso || d.dayIndex}
                  className={`sticky top-0 z-20 border-b border-slate-200 px-2 pt-2.5 pb-1 text-center min-w-[104px] ${
                    isToday ? "bg-[#D9E8F5]" : isSunday ? "bg-rose-50/40 text-rose-700" : "bg-slate-50/95"
                  }`}
                >
                  <span className={`block text-[13px] font-semibold leading-tight ${isSunday ? "text-rose-600" : "text-slate-800"}`}>
                    {d.dayName}
                  </span>
                  <span className="block text-[11.5px] font-normal text-slate-500 tabular-nums">
                    {d.dateVn}
                  </span>
                </th>
              );
            })}

            <th
              rowSpan={2}
              className="sticky top-0 z-20 border-b border-l border-slate-200 bg-slate-50/95 backdrop-blur-xs px-2 py-2 text-center text-[13px] font-semibold text-emerald-800 w-20"
            >
              Ca rảnh
            </th>
            <th
              rowSpan={2}
              className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs px-2 py-2 text-center text-[13px] font-semibold text-rose-800 w-20"
            >
              Ca bận
            </th>
          </tr>

          <tr>
            {days.map((d) => {
              const isToday = d.isToday ?? (d.dateIso === todayIso);
              return (
                <th
                  key={`sub-${d.dateIso || d.dayIndex}`}
                  className={`sticky top-[47px] z-20 border-b border-slate-200 px-2 py-1 text-center ${
                    isToday ? "bg-[#D9E8F5]/90" : "bg-slate-50/95"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {shifts.map((s) => (
                      <span
                        key={s.name}
                        className="flex-1 text-center text-[11px] font-semibold text-slate-400"
                        title={`Ca ${s.name}`}
                      >
                        {s.name.charAt(0)}
                      </span>
                    ))}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => {
            const isRegistered = Boolean(emp.registered);
            const { available: availableCount, busy: busyCount } = isRegistered
              ? countAvailabilitySlots(emp.slots)
              : { available: 0, busy: 0 };

            return (
              <tr key={emp.id} className="transition-colors hover:bg-slate-50/60">
                <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-3.5 py-2.5 text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={emp.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onSelectEmployee?.(emp)}
                        className="block text-left text-[13.5px] font-semibold text-slate-900 truncate hover:text-[#3F62C4] hover:underline cursor-pointer"
                        title={emp.name}
                      >
                        {emp.name}
                      </button>
                      <span className="block text-[11.5px] text-slate-500 font-normal truncate">
                        {emp.id} • {emp.roleTag || emp.role}
                      </span>
                    </div>
                  </div>
                </td>

                {!isRegistered ? (
                  <td colSpan={days.length} className="border-b border-slate-100 px-3 py-2 bg-slate-50/40">
                    <div className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-100/70 text-[12.5px] font-medium text-slate-500">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Chưa gửi lịch tuần này</span>
                    </div>
                  </td>
                ) : (
                  days.map((d) => {
                    const isToday = d.isToday ?? (d.dateIso === todayIso);
                    const isSunday = d.dayIndex === 6;
                    return (
                      <td
                        key={d.dateIso || d.dayIndex}
                        className={`border-b border-slate-100 p-1.5 ${
                          isToday ? "bg-[#D9E8F5]/30" : isSunday ? "bg-rose-50/20" : ""
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {shifts.map((s) => {
                            const status = getSlotStatus(emp, d.dayIndex, s.name);
                            const isAvail = status === "available";
                            const ariaLabel = `${d.dayName} · Ca ${s.name} · ${isAvail ? "Rảnh" : "Bận"}`;

                            return (
                              <div
                                key={s.name}
                                title={ariaLabel}
                                aria-label={ariaLabel}
                                className={`flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-lg border text-[12px] font-bold transition-all shadow-2xs ${
                                  isAvail
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-rose-200 bg-rose-50 text-rose-600"
                                }`}
                              >
                                {isAvail ? (
                                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                ) : (
                                  <X className="h-3.5 w-3.5 stroke-[2.5]" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })
                )}

                <td
                  className={`border-b border-l border-slate-100 px-2 py-2 text-center text-[13px] tabular-nums ${
                    isRegistered
                      ? "font-semibold text-emerald-700 bg-emerald-50/20"
                      : "font-normal text-slate-400"
                  }`}
                >
                  {availableCount}
                </td>

                <td
                  className={`border-b border-slate-100 px-2 py-2 text-center text-[13px] tabular-nums ${
                    isRegistered
                      ? "font-semibold text-rose-700 bg-rose-50/20"
                      : "font-normal text-slate-400"
                  }`}
                >
                  {busyCount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AvailabilityPage() {
  // Mặc định xem tuần kế tiếp (Next Week)
  const [weekMonday, setWeekMonday] = useState(() => {
    const now = getNow();
    const currentMonday = mondayOf(startOfDay(now));
    return toISO(addDays(currentMonday, 7));
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Lắng nghe thay đổi dữ liệu từ Sổ cái SSOT (db.js) và sự kiện đồng bộ đa tab
  useEffect(() => {
    const unsub = subscribeAvailability(() => {
      setRefreshKey((k) => k + 1);
    });
    return unsub;
  }, []);

  useLiveData(() => {
    setRefreshKey((k) => k + 1);
  });

  // Đọc trực tiếp dữ liệu theo tuần đang chọn từ Service SSOT
  const data = useMemo(() => {
    void refreshKey;
    return getWeeklyStaffAvailability(weekMonday);
  }, [weekMonday, refreshKey]);
  const weekLabel = data?.weekLabel || "";
  const days = useMemo(() => data?.days || [], [data]);
  const shifts = useMemo(() => data?.shifts || [], [data]);

  const formattedWeekLabel = useMemo(() => {
    if (weekLabel) return weekLabel;
    if (!weekMonday) return "";
    const [y, m, d] = weekMonday.split("-").map(Number);
    const mon = new Date(y, m - 1, d);
    const sun = addDays(mon, 6);
    return `Tuần ${toVN(weekMonday)} – ${toVN(toISO(sun))}`;
  }, [weekLabel, weekMonday]);

  /** Điều hướng xem tuần trước */
  const handlePrevWeek = () => {
    const prev = addDays(new Date(weekMonday), -7);
    setWeekMonday(toISO(prev));
  };

  /** Điều hướng xem tuần kế tiếp */
  const handleNextWeek = () => {
    const next = addDays(new Date(weekMonday), 7);
    setWeekMonday(toISO(next));
  };

  // Lọc danh sách nhân viên theo trạng thái đăng ký, ô tìm kiếm và Role_Tag
  const filteredEmployees = useMemo(() => {
    if (!data?.employees) return [];
    return data.employees.filter((emp) => {
      if (statusFilter === "registered" && !emp.registered) return false;
      if (statusFilter === "unregistered" && emp.registered) return false;
      if (roleFilter !== "all") {
        const empRoles = emp.roles || [emp.roleTag || emp.role];
        if (!empRoles.includes(roleFilter)) return false;
      }

      if (search.trim()) {
        const q = stripAccents(search);
        const matchName = stripAccents(emp.name).includes(q);
        const matchId = String(emp.id || "").toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [data, search, roleFilter, statusFilter]);

  const canClear = search.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";

  /** Khôi phục bộ lọc về mặc định */
  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems: pageEmployees,
    resetPage,
  } = usePagination(filteredEmployees, 8);

  useEffect(() => {
    resetPage();
  }, [search, roleFilter, statusFilter, weekMonday]); // eslint-disable-line react-hooks/exhaustive-deps

  // Số lượng đếm cho từng tab trạng thái đăng ký (SSOT)
  const statusCounts = useMemo(
    () => ({
      all: data?.summary?.totalEmployees ?? 0,
      registered: data?.summary?.registeredCount ?? 0,
      unregistered: data?.summary?.unregisteredCount ?? 0,
    }),
    [data?.summary]
  );

  // Danh sách nhân viên chưa gửi lịch
  const unregisteredEmployees = useMemo(() => {
    return (data?.employees || []).filter((e) => !e.registered);
  }, [data?.employees]);

  // Cấu hình ca mẫu & kiểm tra thiếu người
  const shiftConfig = useMemo(() => {
    try {
      return getShiftConfig();
    } catch {
      return null;
    }
  }, []);

  const shortages = useMemo(() => {
    return calculateShiftShortages(data?.employees, days, shifts, shiftConfig?.templates || []);
  }, [data?.employees, days, shifts, shiftConfig]);

  // Thông báo 1: Nhân viên chưa gửi lịch tuần này (tối đa 3 tên, dư thì +M người)
  const unregisteredNotice = useMemo(() => {
    const count = unregisteredEmployees.length;
    if (count === 0) return null;
    const names = unregisteredEmployees.map((e) => e.name || e.employeeName).filter(Boolean);
    const namesText =
      count <= 3
        ? names.join(", ")
        : `${names.slice(0, 3).join(", ")} +${count - 3} người`;
    return `Còn ${count} nhân viên chưa gửi lịch tuần này: ${namesText}`;
  }, [unregisteredEmployees]);

  // Thông báo 2: Ca thiếu người rảnh so với nhu cầu đã cấu hình (tối đa 2 ca, dư thì +M ca)
  const shortageNotice = useMemo(() => {
    const shortageList = shortages.filter((s) => s.level === "shortage");
    const count = shortageList.length;
    if (count === 0) return null;
    const items = shortageList.map(
      (s) => `${s.dayName} · Ca ${s.shiftName}: ${s.availCount} rảnh / cần ${s.required}`
    );
    const text =
      count <= 2
        ? items.join("; ")
        : `${items.slice(0, 2).join("; ")} +${count - 2} ca`;
    return text;
  }, [shortages]);

  // Chú giải ca làm việc đọc động từ shifts (không hard-code)
  const shiftTimeSummary = useMemo(() => {
    return shifts
      .map((s) => {
        const code = s.name.charAt(0);
        const t =
          s.start && s.end
            ? `${s.start}–${s.end}`
            : s.startTime && s.endTime
            ? `${s.startTime}–${s.endTime}`
            : "";
        return t ? `${code} = ${s.name} (${t})` : `${code} = ${s.name}`;
      })
      .join(" · ");
  }, [shifts]);

  return (
    <div className="space-y-4 min-w-0">
      {/* ===== VÙNG 1: PAGE HEADER & NÚT THAO TÁC ===== */}
      <PageHeader
        breadcrumb={["Lịch làm việc", "Khả năng làm việc"]}
        icon="calendarClock"
        title="Khả năng làm việc"
        description="Xem tổng hợp lịch rảnh đã đăng ký của nhân viên theo tuần phục vụ xếp lịch tự động."
        actions={<AvailabilityHeaderActions weekMonday={weekMonday} />}
      />

      {/* ===== VÙNG 2: THANH THÔNG BÁO CẢNH BÁO ===== */}
      {unregisteredNotice && (
        <NoticeBar
          label="Thông báo"
          message={unregisteredNotice}
          badge="Chờ nộp"
          badgeTone="warning"
        />
      )}
      {shortageNotice && (
        <NoticeBar
          label="Thông báo"
          message={shortageNotice}
          badge="Thiếu người"
          badgeTone="danger"
        />
      )}

      {/* ===== VÙNG 3: BẢNG MA TRẬN KHẢ NĂNG LÀM VIỆC & PHÂN TRANG ===== */}
      <PageCard className="min-w-0">
        {/* HÀNG 1: StatusTabs gạch chân sát đỉnh card */}
        <StatusTabs
          tabs={STATUS_TABS}
          value={statusFilter}
          onChange={setStatusFilter}
          counts={statusCounts}
        />

        {/* HÀNG 2: Toolbar chuẩn (cách hàng tab 16px mt-4, các ô cao 40px) */}
        <Toolbar
          className="mt-4"
          search={
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm nhân viên theo tên, mã NV..."
            />
          }
          filters={
            <select
              aria-label="Lọc theo vai trò"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`${inputClass} w-44`}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          }
          onClear={resetFilters}
          canClear={canClear}
          clearText="Xóa lọc"
          actions={
            <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white shadow-2xs shrink-0">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="flex h-full w-8 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-l-xl cursor-pointer transition-colors"
                title="Tuần trước"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="h-5 w-px bg-slate-200" />
              <span className="flex items-center gap-1.5 px-3 text-[13px] font-medium text-slate-800 tabular-nums">
                <Calendar size={14} className="text-slate-500" />
                <span>{formattedWeekLabel}</span>
              </span>
              <span className="h-5 w-px bg-slate-200" />
              <button
                type="button"
                onClick={handleNextWeek}
                className="flex h-full w-8 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-r-xl cursor-pointer transition-colors"
                title="Tuần sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          }
        />

        {/* CHÚ GIẢI TRẠNG THÁI & GIỜ CA TRÊN BẢNG */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-600 px-1 py-1">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-[11px] font-bold text-emerald-700">
                ✓
              </span>
              Rảnh
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-[11px] font-bold text-rose-600">
                ✕
              </span>
              Bận
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <span className="inline-flex h-5 px-1.5 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-100 text-[10.5px] font-medium text-slate-500">
                Chưa gửi
              </span>
              Chưa gửi lịch tuần này
            </span>
          </div>

          {shiftTimeSummary && (
            <div className="text-[12px] text-slate-500 font-normal">
              {shiftTimeSummary}
            </div>
          )}
        </div>

        {/* BẢNG MA TRẬN KHẢ NĂNG LÀM VIỆC (BIỂU TƯỢNG ✓ / ✕, CHƯA GỬI BĂNG NGANG) */}
        <AvailabilityTable
          days={days}
          shifts={shifts}
          employees={pageEmployees}
          onSelectEmployee={setSelectedEmp}
        />

        {/* PHÂN TRANG */}
        {filteredEmployees.length > 0 && (
          <div className="pt-2">
            <Pagination
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              total={filteredEmployees.length}
              onPage={setPage}
              onPageSize={setPageSize}
              unit="nhân viên"
            />
          </div>
        )}


      </PageCard>

      {/* ===== VÙNG 4: HỘP THOẠI CHI TIẾT NHÂN VIÊN ===== */}
      <EmployeeDetailModal
        employee={selectedEmp}
        onClose={() => setSelectedEmp(null)}
      />
    </div>
  );
}
