import { useState, useEffect } from "react";
import { Clock, CheckCircle2, TrendingUp, Moon, Users } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { Loading } from "../../../components/FormKit";
import { ErrorMessage } from "../../../components/FormKit";
import { PERIOD_OPTIONS } from "../../../components/PageKit";
import { Table, EmptyState } from "../../../components/TableKit";
import {
  PageCard,
  StatStrip,
  PeriodControl,
  DateRangeInputs,
  SearchInput,
  ExportButton,
  Toolbar,
  Alert,
  Pagination,
  HR_TABS,
  roleLabel,
  inputClass,
} from "../../../components/PageKit";
import WorkHoursDetailModal from "./WorkHoursDetailModal";
import { round1, signed } from "./workHoursData";
import { getWorkHoursColumns, getWorkHoursFooter } from "./workHoursColumns";
import { exportWorkHoursExcel } from "./exportWorkHoursExcel";
import { useWorkHoursData } from "./hooks/useWorkHoursData";
import { usePagination } from "../../../lib/hooks";


/**
 * US14 - Tổng hợp giờ làm (Manager) + US26 - Xuất Excel
 */
export default function WorkHoursPage() {
  const { user } = useAuth();
  const {
    period,
    setPeriod,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    employeeId,
    setEmployeeId,
    roleTag,
    setRoleTag,
    searchTerm,
    setSearchTerm,
    canClear,
    resetFilters,
    rangeError,
    options,
    summary,
    employeeMap,
    rows,
    totals,
    overallRatio,
    loading,
    error,
  } = useWorkHoursData();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [notice, setNotice] = useState("");
  const [detailEmployee, setDetailEmployee] = useState(null);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems: pageRows,
    resetPage,
  } = usePagination(rows, 7);

  // Về trang 1 khi đổi bộ lọc
  useEffect(() => {
    resetPage();
  }, [period, fromDate, toDate, employeeId, roleTag, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleExportExcel = () => {
    if (!summary || rows.length === 0) return;
    setExporting(true);
    setExportError("");
    try {
      exportWorkHoursExcel({ summary, rows, totals, employeeId, roleTag, employeeMap, user });
      setNotice("Đã tải xuống báo cáo Excel thành công");
    } catch {
      setExportError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const statItems = rangeError
    ? null
    : [
        {
          key: "employees",
          icon: <Users size={16} strokeWidth={1.8} className="text-[#0F172A]" />,
          dot: "#0F172A",
          label: "Số nhân viên",
          value: `${rows.length} người`,
          note: "Đang làm việc",
          footer: (
            <>
              <span>Tạm nghỉ:</span>
              <span className="font-semibold text-slate-500 tabular-nums">0 công</span>
            </>
          ),
        },
        {
          key: "sched",
          icon: <Clock size={16} strokeWidth={1.8} className="text-[#0F172A]" />,
          dot: "#2B9FCF",
          label: "Giờ theo lịch",
          value: `${totals.scheduledHours}h`,
          note: `${totals.shiftCount} ca phân công`,
          footer: (
            <>
              <span>Tổng số ca:</span>
              <span className="font-semibold text-[#0F172A] tabular-nums">{totals.shiftCount} ca</span>
            </>
          ),
        },
        {
          key: "actual",
          icon: <CheckCircle2 size={16} strokeWidth={1.8} className="text-[#0F172A]" />,
          dot: "#2A9D8F",
          label: "Giờ thực tế",
          value: `${totals.actualHours}h`,
          note: "Thực hiện so với lịch",
          footer: (
            <>
              <span>Tỷ lệ hoàn thành:</span>
              <span className="font-semibold text-emerald-700 tabular-nums">{overallRatio}%</span>
            </>
          ),
        },
        {
          key: "diff",
          icon: <TrendingUp size={16} strokeWidth={1.8} className="text-[#0F172A]" />,
          dot: totals.diff >= 0 ? "#2A9D8F" : "#E76F51",
          label: "Chênh lệch",
          value: `${signed(totals.diff)}h`,
          note: totals.diff === 0 ? "Khớp kế hoạch" : totals.diff > 0 ? "Tăng ca" : "Thiếu giờ làm",
          footer: (
            <>
              <span>Trạng thái:</span>
              <span className="font-semibold text-[#0F172A] tabular-nums">
                {totals.diff === 0 ? "Khớp KH" : totals.diff > 0 ? "Vượt KH" : "Thiếu giờ"}
              </span>
            </>
          ),
        },
        {
          key: "night",
          icon: <Moon size={16} strokeWidth={1.8} className="text-[#0F172A]" />,
          dot: "#8B5CF6",
          label: "Ca đêm và ngày lễ",
          value: `${round1(totals.nightHours + totals.holidayHours)}h`,
          note: "Phụ cấp ngoài giờ chuẩn",
          footer: (
            <>
              <span>Đêm / Lễ:</span>
              <span className="font-semibold text-[#0F172A] tabular-nums">
                {totals.nightHours}h / {totals.holidayHours}h
              </span>
            </>
          ),
        },
      ];

  const columns = getWorkHoursColumns({ onOpenDetail: setDetailEmployee });
  const footer = getWorkHoursFooter({ rows, totals, overallRatio });
  const exportDisabled = !summary || rows.length === 0 || exporting || !!rangeError;

  return (
    <PageCard
      icon="clock"
      breadcrumb={["Chấm công & Giờ làm", "Giờ làm"]}
      title="Giờ làm"
      subtitle="Tổng hợp giờ làm theo lịch so với thực tế, chênh lệch và phụ cấp tính lương."
      tabs={HR_TABS}
      actions={
        <PeriodControl label="Khoảng ngày" options={PERIOD_OPTIONS} value={period} onChange={setPeriod}>
          {period === "range" ? (
            <DateRangeInputs from={fromDate} to={toDate} onFrom={setFromDate} onTo={setToDate} />
          ) : (
            <span className="whitespace-nowrap tabular-nums">{summary?.periodLabel ?? "—"}</span>
          )}
        </PeriodControl>
      }
      stats={statItems && <StatStrip items={statItems} />}
    >
      {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}

      {/* THANH CÔNG CỤ (Toolbar chuẩn) */}
      <Toolbar
        search={<SearchInput value={searchTerm} onChange={setSearchTerm} />}
        filters={
          <>
            <select aria-label="Vai trò" value={roleTag} onChange={(e) => setRoleTag(e.target.value)} className={`${inputClass} w-44`}>
              <option value="all">Tất cả vai trò</option>
              {options.roleTags.map((tag) => (
                <option key={tag} value={tag}>{roleLabel(tag)}</option>
              ))}
            </select>

            <select aria-label="Nhân viên" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={`${inputClass} w-44`}>
              <option value="all">Tất cả nhân viên</option>
              {options.employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </>
        }
        onClear={resetFilters}
        canClear={canClear}
        actions={<ExportButton onClick={handleExportExcel} disabled={exportDisabled} loading={exporting} />}
        legend={
          <p className="text-[13px] text-slate-500">
            Kỳ làm việc: <span className="font-medium text-slate-800">{summary?.periodLabel ?? "—"}</span> • Bấm vào dòng để xem chi tiết
          </p>
        }
      />

      {(rangeError || exportError) && <Alert tone="error">{rangeError || exportError}</Alert>}

      {error && <ErrorMessage message={error} />}
      {loading && !error && <Loading text="Đang đồng bộ dữ liệu giờ làm..." />}
      {!loading && !error && rangeError && <p className="py-10 text-center text-[15px] text-slate-500">{rangeError}</p>}

      {!loading && !error && !rangeError &&
        (rows.length === 0 ? (
          <EmptyState
            title="Không tìm thấy kết quả phù hợp"
            description="Thử thay đổi từ khóa hoặc bộ lọc"
            onClear={resetFilters}
            canClear={Boolean(canClear)}
          />
        ) : (
          <>
            <Table variant="clean" minWidth={960} columns={columns} rows={pageRows} footer={footer} onRowClick={setDetailEmployee} />
            <Pagination
              page={page}
              pageCount={pageCount}
              total={rows.length}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={setPageSize}
              unit="nhân viên"
            />
          </>
        ))}

      {/* HỘP THOẠI CHI TIẾT TỪNG CA */}
      {detailEmployee && (
        <WorkHoursDetailModal
          employee={detailEmployee}
          period={period}
          from={fromDate}
          to={toDate}
          roleLabel={roleLabel}
          onClose={() => setDetailEmployee(null)}
        />
      )}
    </PageCard>
  );
}