import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Loading } from "../../../components/FormKit";
import { ErrorMessage } from "../../../components/FormKit";
import AssistantPanel from "../assistant/AssistantPanel";
import {
  PageCard,
  StatStrip,
  PeriodControl,
  DateRangeInputs,
  ExportButton,
  Toolbar,
  Alert,
  roleLabel,
  inputClass,
} from "../../../components/PageKit";
import { PERIODS, SHIFT_OPTIONS } from "./dashboardData";
import { exportDashboardExcel } from "./exportDashboardExcel";
import { useDashboardData } from "./hooks/useDashboardData";
import TodoBlock from "./components/TodoBlock";
import WorkHoursBarBlock from "./components/WorkHoursBarBlock";
import CostChartBlock from "./components/CostChartBlock";
import AttendanceChartBlock from "./components/AttendanceChartBlock";
import FillRateChartBlock from "./components/FillRateChartBlock";
import ScheduleWeekBlock from "./components/ScheduleWeekBlock";
import UnderstaffedBlock from "./components/UnderstaffedBlock";

/**
 * US28 - Dashboard quản lý (+ US29: Xuất Excel/Báo cáo)
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const {
    period,
    setPeriod,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    shiftName,
    setShiftName,
    roleTag,
    setRoleTag,
    roleTags,
    data,
    error,
    loading,
    canClear,
    resetFilters,
    rangeError,
    statItems,
    suggestions,
  } = useDashboardData();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const handleExportExcel = () => {
    if (!data || data.empty) return;
    setExporting(true);
    setExportError("");
    try {
      exportDashboardExcel({ data, shiftName, roleTag, user });
    } catch {
      setExportError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const exportDisabled = !data || data.empty || exporting || !!rangeError;

  return (
    <PageCard
      icon="home"
      breadcrumb={["Hệ thống", "Tổng quan"]}
      title="Tổng quan"
      subtitle="Theo dõi giờ làm, chi phí lương, chấm công và ca còn thiếu người."
      actions={
        <PeriodControl label="Khoảng ngày" options={PERIODS} value={period} onChange={setPeriod}>
          {period === "range" ? (
            <DateRangeInputs from={fromDate} to={toDate} onFrom={setFromDate} onTo={setToDate} />
          ) : (
            <span className="whitespace-nowrap tabular-nums">{data?.periodLabel ?? "—"}</span>
          )}
        </PeriodControl>
      }
      stats={statItems && <StatStrip items={statItems} />}
    >
      {/* THANH CÔNG CỤ (Toolbar chuẩn) */}
      <Toolbar
        filters={
          <>
            <select aria-label="Ca" value={shiftName} onChange={(e) => setShiftName(e.target.value)} className={`${inputClass} w-44`}>
              <option value="all">Tất cả ca</option>
              {SHIFT_OPTIONS.map((sn) => (
                <option key={sn} value={sn}>
                  {sn}
                </option>
              ))}
            </select>

            <select aria-label="Vai trò" value={roleTag} onChange={(e) => setRoleTag(e.target.value)} className={`${inputClass} w-44`}>
              <option value="all">Tất cả vai trò</option>
              {roleTags.map((t) => (
                <option key={t} value={t}>
                  {roleLabel(t)}
                </option>
              ))}
            </select>
          </>
        }
        onClear={resetFilters}
        canClear={canClear}
        actions={<ExportButton onClick={handleExportExcel} disabled={exportDisabled} loading={exporting} />}
      />

      {(rangeError || exportError) && <Alert tone="error">{rangeError || exportError}</Alert>}
      {error && <ErrorMessage message={error} />}
      {loading && !data && !error && <Loading />}

      {data && !error && (
        <div className={`space-y-5 pb-2 transition-opacity ${loading ? "pointer-events-none opacity-50" : ""}`} aria-busy={loading}>
          {/* Hỏi nhanh Trợ lý AI */}
          <AssistantPanel suggestions={suggestions} />

          {data.empty ? (
            <>
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <p className="text-[16px] font-semibold text-slate-900">Chưa có dữ liệu trong khoảng đã chọn</p>
                <p className="mt-1 text-[14px] text-slate-500">Thử chọn kỳ khác hoặc bỏ bớt bộ lọc ca / vai trò.</p>
              </div>
              <TodoBlock todo={data.todo} />
            </>
          ) : (
            <>
              {/* Hàng 1: hai biểu đồ giờ và tiền */}
              <div className="grid gap-5 lg:grid-cols-2">
                <WorkHoursBarBlock hoursPerEmployee={data.hoursPerEmployee} />
                <CostChartBlock costPerBucket={data.costPerBucket} />
              </div>

              {/* Hàng 2: chấm công, lấp đầy ca, cần xử lý */}
              <div className="grid gap-5 lg:grid-cols-3">
                <AttendanceChartBlock attendance={data.attendance} />
                <FillRateChartBlock fillByShift={data.fillByShift} />
                <TodoBlock todo={data.todo} />
              </div>
            </>
          )}

          {/* Lịch làm việc tuần này */}
          <ScheduleWeekBlock weekLabel={data.weekLabel} schedule={data.schedule} />

          {/* Ca thiếu người (14 ngày tới) */}
          <UnderstaffedBlock understaffed={data.understaffed} />
        </div>
      )}
    </PageCard>
  );
}