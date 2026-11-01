/**
 * Tầng: Trang quản lý (Manager / Leave)
 * Chức năng: Quản lý đơn xin nghỉ của nhân viên (US20, US21)
 * Quy tắc: Dùng chung PageCard theo UI_RULES
 */

import { Plus } from "lucide-react";
import { employeeRoster } from "../../../services/scheduleService";
import { Button } from "../../../components/FormKit";
import { PageCard, Pagination } from "../../../components/PageKit";
import { EmptyState } from "../../../components/TableKit";
import LeaveDetailModal from "./components/LeaveDetailModal";
import RejectLeaveModal from "./components/RejectLeaveModal";
import CreateLeaveModal from "./components/CreateLeaveModal";
import LeaveToolbar from "./LeaveToolbar";
import LeaveTable from "./LeaveTable";
import { NOTICE_STYLE, PAGE_SIZES } from "./leaveShared";
import { useLeaveRequests } from "./hooks/useLeaveRequests";

export default function LeavePage() {
  const {
    filters,
    page,
    pageSize,
    selected,
    setSelected,
    candidates,
    loadingCands,
    rejecting,
    setRejecting,
    creating,
    setCreating,
    notice,
    counts,
    coverageRate,
    pageRows,
    rows,
    pageCount,
    setPage,
    handlePageSizeChange,
    handleFilterChange,
    openDetail,
    approve,
    reject,
    pickReplacement,
    answerReplacement,
    cancelRequest,
    openShift,
    createLeave,
    resetData,
  } = useLeaveRequests();

  return (
    <PageCard
      icon="fileText"
      breadcrumb={["Duyệt yêu cầu", "Đơn xin nghỉ"]}
      title="Đơn xin nghỉ"
      subtitle={
        <>
          Theo dõi, phê duyệt đơn xin nghỉ và để AI gợi ý người thay ca phù hợp. Tỷ lệ lấp ca bằng AI:{" "}
          <b className="font-semibold tabular-nums text-slate-700">{coverageRate}%</b>
        </>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="md" onClick={resetData}>
            Đặt lại dữ liệu mẫu
          </Button>
          <Button type="button" size="md" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
            Tạo đơn xin nghỉ
          </Button>
        </div>
      }
    >
      <div>
        {notice && (
          <div
            role={notice.type === "error" ? "alert" : "status"}
            className={`mb-4 rounded-lg border px-4 py-3 text-[14px] ${NOTICE_STYLE[notice.type] ?? NOTICE_STYLE.success}`}
          >
            {notice.message}
          </div>
        )}

        {/* TAB TRẠNG THÁI + BỘ LỌC */}
        <LeaveToolbar filters={filters} onChange={handleFilterChange} counts={counts} />

        {/* BẢNG */}
        {rows.length === 0 ? (
          <EmptyState
            title="Không tìm thấy kết quả phù hợp"
            description="Thử thay đổi từ khóa hoặc bộ lọc"
            onClear={() => handleFilterChange({ status: "all", role: "all", type: "all", q: "" })}
            canClear={filters.status !== "all" || filters.role !== "all" || filters.type !== "all" || Boolean(filters.q)}
          />
        ) : (
          <LeaveTable rows={pageRows} onOpen={openDetail} onApprove={approve} onReject={setRejecting} />
        )}

        {/* PHÂN TRANG */}
        {rows.length > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={rows.length}
            unit="đơn"
            sizes={PAGE_SIZES}
            onPage={setPage}
            onPageSize={handlePageSizeChange}
          />
        )}
      </div>

      <LeaveDetailModal
        req={selected}
        candidates={candidates}
        loading={loadingCands}
        onClose={() => setSelected(null)}
        onApprove={approve}
        onReject={setRejecting}
        onPick={pickReplacement}
        onRespond={answerReplacement}
        onCancelRequest={cancelRequest}
        onOpenShift={openShift}
      />
      <RejectLeaveModal
        key={rejecting?.id}
        item={rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={reject}
      />
      {creating && (
        <CreateLeaveModal
          employees={employeeRoster}
          onClose={() => setCreating(false)}
          onSubmit={createLeave}
        />
      )}
    </PageCard>
  );
}
