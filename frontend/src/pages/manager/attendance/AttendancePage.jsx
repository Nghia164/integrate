// =============================================================================
// FILE NÀY LÀM GÌ: Màn hình Đối soát và Điều chỉnh Chấm công (Manager)
// Loại: Page
// US: US25 (Đối soát chấm công), US26 (Điều chỉnh chấm công)
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, UserX } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { Loading } from "../../../components/FormKit";
import { ErrorMessage } from "../../../components/FormKit";
import { AttendanceGrid } from "../../../components/CalendarKit";

import { Table } from "../../../components/TableKit";
import { Button } from "../../../components/FormKit";
import { StatusTabs } from "../../../components/PageKit";
import {
  PageCard,
  StatStrip,
  PeriodControl,
  DateRangeInputs,
  SearchInput,
  ExportButton,
  Toolbar,
  Alert,
  NoticeBar,
  Pagination,
  StatusBadge,
  ATTENDANCE_TABS,
  inputClass,
} from "../../../components/PageKit";
import { usePagination } from "../../../lib/hooks";

import { getNow } from "../../../lib/dateUtils";
import { stripAccents } from "../../../lib/formatters";

import { getEmployeeOptions } from "../../../services/workHoursService";
import {
  getAttendanceRecords,
  subscribeAttendance,
  listExplanationsForManager,
} from "../../../services/attendanceService";
import AttendanceDetailModal from "./AttendanceModals";
import {
  PERIOD_OPTIONS,
  fmtDate,
  pad,
  todayISO,
  matchStatusFilter,
  getAttendanceColumns,
} from "./attendanceHelpers";
import { exportAttendanceExcel } from "./exportAttendanceExcel";
import { STANDARD_ROLES } from "../../../services/shiftConfigService";

const ATTENDANCE_ROLES = STANDARD_ROLES;

export default function AttendancePage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(() => getNow());

  // Trạng thái bộ lọc thời gian
  const [period, setPeriod] = useState(() => {
    try { return sessionStorage.getItem("SMART_SCHEDULING_HR_PERIOD") || "week"; } catch { return "week"; }
  });
  const [fromDate, setFromDate] = useState(() => {
    try { return sessionStorage.getItem("SMART_SCHEDULING_HR_FROM") || ""; } catch { return ""; }
  });
  const [toDate, setToDate] = useState(() => {
    try { return sessionStorage.getItem("SMART_SCHEDULING_HR_TO") || ""; } catch { return ""; }
  });

  const [activeTab, setActiveTab] = useState("all"); // "all" | "explanations"
  const [expStatusFilter, setExpStatusFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const [roleTag, setRoleTag] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list"); // "list" | "grid"

  const [employees, setEmployees] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [detail, setDetail] = useState(null);

  // Cập nhật đồng hồ mỗi phút
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getNow()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Lắng nghe thay đổi dữ liệu từ Sổ cái SSOT
  useEffect(() => {
    const fetchEmps = () => {
      getEmployeeOptions().then((o) => setEmployees(o.employees ?? o ?? [])).catch(() => setEmployees([]));
    };
    fetchEmps();
    return subscribeAttendance(() => {
      fetchEmps();
      setRefreshKey((k) => k + 1);
    });
  }, []);

  const rangeError = useMemo(() => {
    if (period !== "range") return "";
    if (!fromDate || !toDate) return "Vui lòng chọn đủ Từ ngày và Đến ngày.";
    if (fromDate > toDate) return "“Từ ngày” không được lớn hơn “Đến ngày”.";
    return "";
  }, [period, fromDate, toDate]);

  const query = useMemo(() => {
    if (period === "today") return { period: "range", from: todayISO(), to: todayISO() };
    return { period, from: fromDate, to: toDate };
  }, [period, fromDate, toDate]);

  // Tải dữ liệu đối soát chấm công
  useEffect(() => {
    if (rangeError) return undefined;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) { setLoading(true); setError(""); }
    });
    getAttendanceRecords({ ...query, employeeId: "all" })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError("Không tải được dữ liệu đối soát chấm công"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [query, rangeError, refreshKey]);

  // Nhãn tuần hiển thị
  const weekLabel = useMemo(() => {
    const start = new Date(currentTime);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${pad(start.getDate())}/${pad(start.getMonth() + 1)} – ${fmtDate(end)}`;
  }, [currentTime]);

  const counts = data?.counts ?? null;
  const allRows = useMemo(() => data?.rows ?? [], [data]);

  // Danh sách toàn bộ giải trình cho Manager
  const allExplanations = useMemo(
    () => listExplanationsForManager(),
    [refreshKey, data] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const pendingCount = useMemo(
    () => allExplanations.filter((e) => e.status === "pending").length,
    [allExplanations]
  );

  // Gắn cờ hasExplanation cho các ca có giải trình chờ duyệt
  const rowsWithExplanation = useMemo(() => {
    return allRows.map((r) => {
      const hasExp = allExplanations.some(
        (e) =>
          e.status === "pending" &&
          (e.attendanceId === r.id ||
            e.shiftId === r.id ||
            (e.employeeId === r.employeeId &&
              e.date === r.date &&
              (e.shiftName === r.shiftName || e.shiftName?.includes(r.shiftName))))
      );
      return { ...r, hasExplanation: hasExp };
    });
  }, [allRows, allExplanations]);

  const keyword = stripAccents(search);
  const matchSearch = (name, id) =>
    !keyword ||
    stripAccents(name).includes(keyword) ||
    String(id || "").toLowerCase().includes(keyword);

  const rows = useMemo(
    () =>
      rowsWithExplanation.filter((r) => {
        const matchesRole =
          roleTag === "all" ||
          (r.roles ? r.roles.includes(roleTag) : (r.roleTag === roleTag || r.role === roleTag));
        if (status === "has_explanation") {
          return r.hasExplanation && matchesRole && matchSearch(r.employeeName, r.employeeId);
        }
        return (
          matchStatusFilter(r.status, status) &&
          matchesRole &&
          matchSearch(r.employeeName, r.employeeId)
        );
      }),
    [rowsWithExplanation, status, roleTag, keyword] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Lọc giải trình theo trạng thái và tìm kiếm
  const filteredExplanations = useMemo(() => {
    return allExplanations.filter((exp) => {
      if (expStatusFilter === "pending" && exp.status !== "pending") return false;
      if (expStatusFilter === "handled" && exp.status === "pending") return false;
      if (
        expStatusFilter !== "all" &&
        expStatusFilter !== "pending" &&
        expStatusFilter !== "handled" &&
        exp.status !== expStatusFilter
      ) {
        return false;
      }
      if (!keyword) return true;
      const text = `${exp.employeeName || ""} ${exp.employeeId || ""} ${exp.shiftName || ""} ${exp.reason || ""}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [allExplanations, expStatusFilter, keyword]);

  const gridEmployees = employees.filter((e) => matchSearch(e.name, e.id));
  const navEmployees = employees.filter((e) => allRows.some((r) => r.employeeId === e.id));
  const missingCount = counts?.["Missing-Checkout"] ?? 0;
  const canClear = period !== "week" || fromDate !== "" || toDate !== "" || status !== "all" || roleTag !== "all" || search !== "";

  const resetFilters = () => {
    setPeriod("week");
    setFromDate("");
    setToDate("");
    setStatus("all");
    setRoleTag("all");
    setSearch("");
  };

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems: pageRows,
    resetPage,
  } = usePagination(rows, 7);

  const {
    page: expPage,
    setPage: setExpPage,
    pageSize: expPageSize,
    setPageSize: setExpPageSize,
    pageCount: expPageCount,
    pagedItems: pageExplanations,
    resetPage: resetExpPage,
  } = usePagination(filteredExplanations, 7);

  useEffect(() => {
    resetPage();
  }, [period, fromDate, toDate, status, roleTag, search, view, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    resetExpPage();
  }, [expStatusFilter, keyword, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const compTotal = counts?.completedTotal ?? 0;
  const onTimePct = compTotal > 0 ? Math.round(((counts?.["On-Time"] ?? 0) / compTotal) * 100) : 0;
  const latePct = compTotal > 0 ? Math.round(((counts?.Late ?? 0) / compTotal) * 100) : 0;
  const absentPct = compTotal > 0 ? Math.round(((counts?.Absent ?? 0) / compTotal) * 100) : 0;

  const statItems = rangeError || !counts ? null : [
    {
      key: "total",
      icon: <Clock size={16} strokeWidth={1.8} className="text-[#0F172A]" />,
      dot: "#2B9FCF",
      label: "Tổng ca",
      value: `${counts.total} ca`,
      note: `Đã kết thúc ${compTotal} ca`,
      footer: (
        <>
          <span>Chưa diễn ra:</span>
          <span className="font-semibold text-[#0F172A] tabular-nums">
            {Math.max(0, counts.total - compTotal)} ca
          </span>
        </>
      ),
    },
    {
      key: "ontime",
      icon: <CheckCircle2 size={16} strokeWidth={1.8} className="text-[#0F172A]" />,
      dot: "#2A9D8F",
      label: "Đúng giờ",
      value: `${counts["On-Time"] ?? 0} ca`,
      note: `Tỷ lệ ${onTimePct}%`,
      footer: (
        <>
          <span>Trên ca đã kết thúc:</span>
          <span className="font-semibold text-emerald-700 tabular-nums">
            {counts["On-Time"] ?? 0}/{compTotal} ca
          </span>
        </>
      ),
    },
    {
      key: "late",
      icon: <AlertTriangle size={16} strokeWidth={1.8} className="text-[#0F172A]" />,
      dot: "#F4A261",
      label: "Đi trễ",
      value: `${counts.Late ?? 0} ca`,
      note: `Tỷ lệ ${latePct}%`,
      footer: (
        <>
          <span>Trên ca đã kết thúc:</span>
          <span className="font-semibold text-amber-700 tabular-nums">
            {counts.Late ?? 0}/{compTotal} ca
          </span>
        </>
      ),
    },
    {
      key: "absent",
      icon: <UserX size={16} strokeWidth={1.8} className="text-[#0F172A]" />,
      dot: "#E76F51",
      label: "Vắng",
      value: `${counts.Absent ?? 0} ca`,
      note: `Tỷ lệ ${absentPct}%`,
      footer: (
        <>
          <span>Trên ca đã kết thúc:</span>
          <span className="font-semibold text-rose-700 tabular-nums">
            {counts.Absent ?? 0}/{compTotal} ca
          </span>
        </>
      ),
    },
  ];

  const baseColumns = useMemo(() => getAttendanceColumns({ onOpenDetail: setDetail }), []);
  const columns = useMemo(() => {
    return baseColumns.map((col) => {
      if (col.key === "status") {
        return {
          ...col,
          render: (r) => (
            <span className="inline-flex items-center gap-1.5 flex-nowrap">
              {col.render(r)}
              {r.hasExplanation && (
                <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800 border border-sky-200 whitespace-nowrap">
                  Có giải trình
                </span>
              )}
            </span>
          ),
        };
      }
      return col;
    });
  }, [baseColumns]);

  const explanationColumns = useMemo(
    () => [
      {
        key: "employee",
        title: "Nhân viên",
        render: (r) => (
          <div>
            <div className="font-semibold text-slate-900">{r.employeeName || r.employeeId}</div>
            <div className="text-[12px] text-slate-500 font-medium">{r.employeeId}</div>
          </div>
        ),
      },
      {
        key: "shift",
        title: "Ca làm việc",
        render: (r) => (
          <div>
            <div className="font-semibold text-slate-900">{r.date}</div>
            <div className="text-[12px] text-slate-500 font-medium">
              {r.shiftName} {r.scheduled || r.shiftTime ? `(${r.scheduled || r.shiftTime})` : ""}
            </div>
          </div>
        ),
      },
      {
        key: "issue",
        title: "Sự cố",
        render: (r) => (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
            {r.issueType === "missing_checkin" ? "Quên check-in" : "Quên check-out"}
          </span>
        ),
      },
      {
        key: "proposed",
        title: "Giờ đề nghị",
        render: (r) => (
          <span className="font-bold tabular-nums text-slate-800 whitespace-nowrap">
            {r.proposedIn} – {r.proposedOut}
          </span>
        ),
      },
      {
        key: "reason",
        title: "Lý do",
        render: (r) => (
          <p className="text-[12.5px] text-slate-600 line-clamp-2 max-w-xs" title={r.reason}>
            {r.reason}
          </p>
        ),
      },
      {
        key: "time",
        title: "Thời gian gửi",
        render: (r) => (
          <span className="text-[12px] text-slate-500 tabular-nums whitespace-nowrap">
            {new Date(r.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
          </span>
        ),
      },
      {
        key: "status",
        title: "Trạng thái",
        render: (r) => {
          const map = {
            pending: { label: "Chờ duyệt", tone: "warning" },
            approved: { label: "Đã duyệt", tone: "success" },
            rejected: { label: "Bị từ chối", tone: "danger" },
            cancelled: { label: "Đã hủy", tone: "neutral" },
          };
          const st = map[r.status] || { label: r.status, tone: "neutral" };
          return (
            <div>
              <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
              {r.status === "rejected" && r.rejectReason && (
                <p className="mt-1 text-[11px] text-rose-600 line-clamp-2 max-w-[160px]" title={r.rejectReason}>
                  {r.rejectReason}
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        title: "Thao tác",
        align: "right",
        render: (r) => (
          <Button
            size="sm"
            variant={r.status === "pending" ? "primary" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              setDetail({ employeeId: r.employeeId, rowId: r.attendanceId || r.shiftId });
            }}
          >
            {r.status === "pending" ? "Xử lý" : "Xem"}
          </Button>
        ),
      },
    ],
    []
  );

  const handleExportExcel = () => {
    if (!data || rows.length === 0) return;
    setExporting(true);
    setExportError("");
    try {
      exportAttendanceExcel({ data, rows, search, status, user });
    } catch {
      setExportError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const isLoading = loading && !rangeError;
  const exportDisabled = !data || rows.length === 0 || exporting || !!rangeError;

  return (
    <PageCard
      icon="clipboardCheck"
      breadcrumb={["Chấm công & Giờ làm", "Chấm công"]}
      title="Chấm công"
      subtitle="Đối soát dữ liệu chấm công thực tế theo ca làm việc"
      tabs={ATTENDANCE_TABS}
      actions={
        <PeriodControl label="Khoảng ngày" options={PERIOD_OPTIONS} value={period} onChange={setPeriod}>
          {period === "range" ? (
            <DateRangeInputs from={fromDate} to={toDate} onFrom={setFromDate} onTo={setToDate} />
          ) : (
            <span className="whitespace-nowrap tabular-nums">{data?.periodLabel ?? (period === "today" ? fmtDate(currentTime) : weekLabel)}</span>
          )}
        </PeriodControl>
      }
      stats={statItems && <StatStrip items={statItems} />}
      notices={
        <>
          {pendingCount > 0 && (
            <NoticeBar
              label="Giải trình"
              message={`Có ${pendingCount} giải trình chờ duyệt từ nhân viên.`}
              badgeTone="info"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("explanations");
                    setExpStatusFilter("pending");
                  }}
                  className="font-semibold text-[#0F172A] underline underline-offset-2 hover:text-slate-600 cursor-pointer"
                >
                  Xem giải trình
                </button>
              }
            />
          )}
          {missingCount > 0 && status !== "Missing-Checkout" && !rangeError && (
            <NoticeBar
              label="Cảnh báo"
              message={`Có ${missingCount} ca thiếu giờ ra chưa được tính giờ làm. Mở chi tiết nhân viên và chọn “Điều chỉnh” để nhập giờ ra.`}
              badgeTone="warning"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("all");
                    setStatus("Missing-Checkout");
                  }}
                  className="font-semibold text-[#0F172A] underline underline-offset-2 hover:text-slate-600 cursor-pointer"
                >
                  Xem các ca này
                </button>
              }
            />
          )}
        </>
      }
    >
      {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}

      {/* ===== TAB CHUYỂN ĐỔI: TẤT CẢ CA | CÓ GIẢI TRÌNH (N) ===== */}
      <div className="mb-4">
        <StatusTabs
          tabs={[
            ["all", "Tất cả ca"],
            ["explanations", "Có giải trình"],
          ]}
          value={activeTab}
          onChange={(t) => {
            setActiveTab(t);
            resetPage();
            resetExpPage();
          }}
          counts={{
            all: counts?.total ?? 0,
            explanations: pendingCount,
          }}
        />
      </div>

      {activeTab === "all" ? (
        <>
          {/* ===== CỤM BỘ LỌC VÀ TÌM KIẾM (Toolbar chuẩn 1 hàng) ===== */}
          <Toolbar
            search={<SearchInput value={search} onChange={setSearch} placeholder="Tìm nhân viên, mã NV..." />}
            filters={
              <>
                <select
                  aria-label="Trạng thái"
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); resetPage(); }}
                  className={`${inputClass} w-48`}
                >
                  {[
                    { value: "all", label: "Tất cả", count: counts?.total ?? 0 },
                    { value: "has_explanation", label: "Có giải trình", count: pendingCount },
                    { value: "On-Time", label: "Đúng giờ", count: counts?.["On-Time"] ?? 0 },
                    { value: "late_early", label: "Đi trễ / Về sớm", count: (counts?.Late ?? 0) + (counts?.["Early-Departure"] ?? 0) },
                    { value: "absent_missing", label: "Vắng / Thiếu giờ ra (cần xử lý)", count: (counts?.Absent ?? 0) + (counts?.["Missing-Checkout"] ?? 0) },
                    { value: "On-Leave", label: "Nghỉ phép", count: counts?.["On-Leave"] ?? 0 },
                    { value: "incomplete", label: "Chưa hoàn tất", count: (counts?.Upcoming ?? 0) + (counts?.["In-Progress"] ?? 0) },
                  ]
                    .filter((opt) => opt.value === "all" || opt.count > 0 || opt.value === status)
                    .map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label} ({opt.count})</option>
                    ))}
                </select>

                <select
                  aria-label="Vai trò"
                  value={roleTag}
                  onChange={(e) => { setRoleTag(e.target.value); resetPage(); }}
                  className={`${inputClass} w-40`}
                >
                  <option value="all">Tất cả vai trò</option>
                  {ATTENDANCE_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </>
            }
            onClear={resetFilters}
            canClear={canClear}
            viewToggle={
              <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[13.5px]">
                {[["list", "Danh sách"], ["grid", "Bảng chấm công"]].map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={`h-full flex items-center rounded-lg px-3 font-medium transition-colors cursor-pointer ${
                      view === v ? "bg-white text-[#0F172A] shadow-xs font-semibold" : "text-slate-600 hover:text-[#0F172A]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            actions={<ExportButton onClick={handleExportExcel} disabled={exportDisabled} loading={exporting} />}
            legend={
              <p className="text-[13px] text-slate-500">
                Kỳ làm việc: <span className="font-medium text-slate-800">{data?.periodLabel ?? weekLabel}</span> • Bấm vào dòng để xem chi tiết • Bản ghi thuộc kỳ lương đã chốt không thể điều chỉnh
              </p>
            }
          />

          {(rangeError || exportError) && <Alert tone="error">{rangeError || exportError}</Alert>}

          {/* ===== BẢNG DỮ LIỆU CHẤM CÔNG ===== */}
          <div>
            {error && <ErrorMessage message={error} />}
            {isLoading && !error && <Loading text="Đang tải dữ liệu..." />}
            {!isLoading && !error && rangeError && <p className="py-10 text-center text-[15px] text-slate-500">{rangeError}</p>}

            {!isLoading && !error && !rangeError && data && (
              <>
                {counts.total === 0 ? (
                  <p className="py-10 text-center text-[15px] text-slate-500">Chưa có dữ liệu chấm công trong khoảng đã chọn.</p>
                ) : view === "grid" ? (
                  <>
                    {(period === "today" || (data?.from && data?.to && data.from === data.to)) && (
                      <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-[13px] text-amber-800">
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-amber-600">ℹ</span>
                          <span>Đang xem 1 ngày. Chọn <strong>'Tuần này'</strong> để xem cả tuần.</span>
                        </span>
                      </div>
                    )}
                    <AttendanceGrid
                      from={data.from}
                      to={data.to}
                      employees={gridEmployees}
                      rows={allRows}
                      status={status}
                      onSelect={(row) => setDetail({ employeeId: row.employeeId, rowId: row.id })}
                    />
                  </>
                ) : rows.length === 0 ? (
                  <p className="py-10 text-center text-[15px] text-slate-500">Không có bản ghi phù hợp với bộ lọc hiện tại.</p>
                ) : (
                  <Table variant="clean" minWidth={900} columns={columns} rows={pageRows} onRowClick={(r) => setDetail({ employeeId: r.employeeId })} />
                )}
              </>
            )}
          </div>

          {/* ===== PHÂN TRANG CHO TẤT CẢ CA ===== */}
          {view === "list" && !isLoading && !error && !rangeError && rows.length > 0 && (
            <Pagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
          )}
        </>
      ) : (
        <>
          {/* ===== THANH CÔNG CỤ TAB GIẢI TRÌNH ===== */}
          <Toolbar
            search={
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Tìm nhân viên, mã NV, ca, lý do..."
              />
            }
            filters={
              <select
                aria-label="Lọc trạng thái giải trình"
                value={expStatusFilter}
                onChange={(e) => {
                  setExpStatusFilter(e.target.value);
                  resetExpPage();
                }}
                className={`${inputClass} w-48`}
              >
                <option value="all">Tất cả trạng thái ({allExplanations.length})</option>
                <option value="pending">Chờ duyệt ({pendingCount})</option>
                <option value="approved">Đã duyệt ({allExplanations.filter((e) => e.status === "approved").length})</option>
                <option value="rejected">Bị từ chối ({allExplanations.filter((e) => e.status === "rejected").length})</option>
                <option value="cancelled">Đã hủy ({allExplanations.filter((e) => e.status === "cancelled").length})</option>
              </select>
            }
            onClear={() => {
              setSearch("");
              setExpStatusFilter("all");
            }}
            canClear={search !== "" || expStatusFilter !== "all"}
            legend={
              <p className="text-[13px] text-slate-500">
                Hiển thị giải trình do nhân viên gửi khi quên Check-in hoặc Check-out • Bấm vào dòng hoặc nút “Xử lý” để xem xét và duyệt
              </p>
            }
          />

          {/* ===== BẢNG DANH SÁCH GIẢI TRÌNH ===== */}
          <div>
            {filteredExplanations.length === 0 ? (
              <p className="py-10 text-center text-[15px] text-slate-500">Chưa có giải trình nào.</p>
            ) : (
              <Table
                variant="clean"
                minWidth={950}
                columns={explanationColumns}
                rows={pageExplanations}
                onRowClick={(r) => setDetail({ employeeId: r.employeeId, rowId: r.attendanceId || r.shiftId })}
              />
            )}
          </div>

          {/* ===== PHÂN TRANG CHO GIẢI TRÌNH ===== */}
          {filteredExplanations.length > 0 && (
            <Pagination
              page={expPage}
              pageCount={expPageCount}
              total={filteredExplanations.length}
              pageSize={expPageSize}
              onPage={setExpPage}
              onPageSize={setExpPageSize}
            />
          )}
        </>
      )}

      {/* ===== HỘP THOẠI CHI TIẾT & ĐIỀU CHỈNH ===== */}
      <AttendanceDetailModal
        open={!!detail}
        employeeId={detail?.employeeId}
        focusRowId={detail?.rowId}
        employees={navEmployees}
        rows={allRows}
        periodLabel={data?.periodLabel}
        onClose={() => setDetail(null)}
        onNavigate={(id) => setDetail({ employeeId: id })}
        onSaved={(msg) => {
          setNotice(msg);
          setRefreshKey((k) => k + 1);
        }}
      />
    </PageCard>
  );
}
