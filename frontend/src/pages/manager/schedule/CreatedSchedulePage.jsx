import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu } from "lucide-react";
import {
  PageCard,
  StatStrip,
  PeriodControl,
  SearchInput,
  ExportButton,
  Toolbar,
  Alert,
  NoticeBar,
  Pagination,
  SCHEDULE_TABS,
  inputClass,
} from "../../../components/PageKit";
import { Button } from "../../../components/FormKit";
import {
  employeeRoster,
  isScheduleConfirmed,
} from "./scheduleShared";
import CreatedScheduleGridView from "./components/CreatedScheduleGridView";
import CreatedScheduleListView from "./components/CreatedScheduleListView";
import ShiftAssignmentModal from "./components/ShiftAssignmentModal";
import { exportScheduleExcel } from "./exportScheduleExcel";
import { useCreatedScheduleData } from "./hooks/useCreatedScheduleData.js";
import { usePagination } from "../../../lib/hooks";


const PERIOD_OPTIONS = [
  { value: "week", label: "Tuần này" },
  { value: "prev", label: "Tuần trước" },
  { value: "next", label: "Tuần sau" },
];

export default function CreatedSchedulePage() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const showToast = (msg) => setNotice(msg);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const {
    days,
    weekLabel,
    schedules,
    period,
    setPeriod,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    shiftFilter,
    setShiftFilter,
    view,
    setView,
    activeModalShiftKey,
    canClear,
    resetFilters,
    handleOpenShiftModal,
    handleCloseModal,
    handleSaveModal,
    handleGoToOpenShift,
    stats,
    statItems,
    filteredAssignments,
    filteredEmployees,
    modalData,
  } = useCreatedScheduleData({ showToast });

  const activeItems = view === "list" ? filteredAssignments : filteredEmployees;
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems,
    resetPage,
  } = usePagination(activeItems, 7);

  // Về trang 1 khi đổi bộ lọc hoặc đổi kiểu xem
  useEffect(() => {
    resetPage();
  }, [period, roleFilter, shiftFilter, search, view]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = () => {
    try {
      exportScheduleExcel({ filteredAssignments, search, roleFilter });
      showToast("Xuất Excel lịch làm việc thành công!");
    } catch {
      showToast("Có lỗi khi tạo tệp Excel. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <PageCard
        icon="calendar"
        breadcrumb={["Lịch làm việc", "Lịch đã tạo"]}
        title="Lịch đã tạo"
        subtitle="Xem và quản lý chi tiết toàn bộ lịch phân công ca làm việc theo tuần đã được hệ thống tạo hoặc chỉnh sửa."
        tabs={SCHEDULE_TABS}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <PeriodControl label="Khoảng ngày" options={PERIOD_OPTIONS} value={period} onChange={setPeriod}>
              <span className="whitespace-nowrap tabular-nums">{weekLabel}</span>
            </PeriodControl>
            <Button onClick={() => navigate("/manager/schedule")}>
              <Cpu size={16} />
              <span>Xếp lịch tự động</span>
            </Button>
          </div>
        }
        stats={<StatStrip items={statItems} />}
        notices={
          stats.deficientShiftsCount > 0 && (
            <NoticeBar
              label="Cảnh báo"
              message={`Có ${stats.deficientShiftsCount} ca chưa đủ định biên nhân sự theo quy định. Mở chi tiết ca để phân công thêm hoặc tạo ca mở.`}
              badgeTone="danger"
              action={
                <button
                  type="button"
                  onClick={() => {
                    const defKey = Object.keys(schedules).find((k) => (schedules[k]?.assigned?.length || 0) < 4);
                    if (defKey) handleOpenShiftModal(defKey);
                  }}
                  className="font-semibold text-[#0F172A] underline underline-offset-2 hover:text-slate-600 cursor-pointer"
                >
                  Xem ca thiếu người
                </button>
              }
            />
          )
        }
      >
        {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}

        {/* THANH CÔNG CỤ (Toolbar chuẩn) */}
        <Toolbar
          search={<SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc mã NV..." />}
          filters={
            <>
              <select
                aria-label="Vai trò"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`${inputClass} w-44`}
              >
                <option value="all">Tất cả vai trò</option>
                <option value="Phục vụ">Phục vụ</option>
                <option value="Pha chế">Pha chế</option>
                <option value="Thu ngân">Thu ngân</option>
              </select>

              <select
                aria-label="Ca làm việc"
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className={`${inputClass} w-44`}
              >
                <option value="all">Tất cả các ca</option>
                <option value="morning">Ca sáng (06:00 - 12:00)</option>
                <option value="afternoon">Ca chiều (12:00 - 17:00)</option>
                <option value="evening">Ca tối (17:00 - 22:00)</option>
              </select>
            </>
          }
          onClear={resetFilters}
          canClear={canClear}
          viewToggle={
            <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[13.5px]">
              {[["grid", "Bảng lịch tuần"], ["list", "Danh sách"]].map(([v, label]) => (
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
          actions={<ExportButton onClick={handleExport} disabled={filteredAssignments.length === 0} />}
          legend={
            <p className="text-[13px] text-slate-500 font-normal">
              <span className="font-medium text-slate-800">{weekLabel}</span>
              <span className="ml-2 hidden lg:inline">
                • {view === "grid" ? "Bấm vào ô để điều chỉnh phân công ca • " : "Bấm vào dòng để xem chi tiết ca • "}Lịch làm việc chính thức đã được kích hoạt
              </span>
            </p>
          }
        />

        {/* NỘI DUNG CHÍNH */}
        <div>
          {view === "list" ? (
            <CreatedScheduleListView
              filteredAssignments={filteredAssignments}
              pageListRows={pagedItems}
              onOpenShiftModal={handleOpenShiftModal}
            />
          ) : (
            <CreatedScheduleGridView
              days={days}
              pageGridEmployees={pagedItems}
              schedules={schedules}
              onOpenShiftModal={handleOpenShiftModal}
            />
          )}
        </div>

        {/* PHÂN TRANG */}
        {activeItems.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            pageCount={pageCount}
            total={activeItems.length}
            unit={view === "list" ? "lượt phân công" : "nhân viên"}
            onPage={setPage}
            onPageSize={setPageSize}
            sizes={[7, 10, 20]}
          />
        )}

        {/* MODAL CHI TIẾT CA & ĐIỀU CHỈNH PHÂN CÔNG */}
        <ShiftAssignmentModal
          key={activeModalShiftKey || "none"}
          modalData={modalData}
          employeeRoster={employeeRoster}
          isConfirmed={isScheduleConfirmed()}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
          onGoToOpenShift={handleGoToOpenShift}
        />
      </PageCard>
    </>
  );
}
