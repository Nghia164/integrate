/**
 * FILE NÀY LÀM GÌ: Quản lý và nộp đơn xin nghỉ phép của nhân viên | Loại: Giao diện Staff | US: US20, US21, US23
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { getMySchedule } from "../../../services/scheduleService.js";
import { getOpenShifts } from "../../../services/openShiftService.js";
import {
  cancelLeaveRequest,
  getLeaveRequests,
  submitLeave,
  subscribeLeave,
} from "../../../services/leaveService.js";
import { PageHeader, PageCard, SearchInput } from "../../../components/PageKit.jsx";
import { StatusTabs } from "../../../components/PageKit";
import { Table, StatusBadge, EmptyState } from "../../../components/TableKit";
import { Button } from "../../../components/FormKit";
import { getShiftColors } from "../../../lib/shiftColors.js";
import STAFF_LAYOUT from "../../../lib/layoutTokens.js";
import { getNow } from "../../../lib/dateUtils.js";
import { matchesSearch } from "../../../lib/searchUtils.js";
import { validateLeaveReason, validateNote } from "../../../lib/validators.js";

import {
  STATUS_LABELS,
  STATUS_TONES,
  statusOf,
  isoDate,
  mondayOf,
  normalizeShifts,
  listFrom,
  formatDate,
  formatShiftName,
  formatTimeRange,
  shiftFromRequest,
  formatSubmittedAt,
  getCancelEligibility,
  errorText,
} from "./leaveHelpers";
import {
  CreateLeaveModal,
  LeaveDetailModal,
  CancelLeaveModal,
} from "./LeaveModals";

export default function LeavePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryShiftId = searchParams.get("shiftId");

  const [shifts, setShifts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedShiftId, setSelectedShiftId] = useState(queryShiftId ?? "");
  const [leaveType, setLeaveType] = useState("unpaid");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [formOpen, setFormOpen] = useState(Boolean(queryShiftId));
  const [detailRequest, setDetailRequest] = useState(null);
  const [openShifts, setOpenShifts] = useState([]);
  const [confirmCancelRequest, setConfirmCancelRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState("");

  const selectedShift = shifts.find((shift) => String(shift.id) === String(selectedShiftId));
  const unavailableShiftIds = useMemo(() => new Set(requests
    .filter((request) => ["pending", "pending_approval", "approved", "replacement_confirmed"].includes(statusOf(request)))
    .map((request) => String(request.shift_id ?? request.shiftId ?? request.shift?.id))), [requests]);

  // Đồng bộ thông tin đơn đang xem chi tiết khi dữ liệu cập nhật
  useEffect(() => {
    if (!detailRequest) return;
    const current = requests.find((r) => String(r.id) === String(detailRequest.id));
    if (!current && requests.length > 0) {
      setDetailRequest(null);
      setFeedback({ type: "error", text: "Không còn thông tin đơn nghỉ này." });
    } else if (current) {
      setDetailRequest(current);
    }
  }, [requests, detailRequest]);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setLoadError("");
    try {
      const monday = mondayOf(getNow());
      const weekStarts = Array.from({ length: 5 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(date.getDate() + index * 7);
        return isoDate(date);
      });
      const currentUid = user?.employeeId || user?.id;
      const [scheduleResponses, leaveResponse, openShiftsRes] = await Promise.all([
        Promise.all(weekStarts.map((weekStart) => getMySchedule({
          week_start: weekStart,
          view: "official",
          employeeId: currentUid,
          currentUserId: currentUid,
        }))),
        getLeaveRequests(),
        getOpenShifts().catch(() => []),
      ]);
      setOpenShifts(openShiftsRes || []);
      const now = getNow();
      const allShifts = scheduleResponses.flatMap(normalizeShifts).filter((shift) => {
        const shiftDate = shift.date || shift.isoDate;
        if (!shiftDate) return true;
        const [sh, sm] = (shift.startTime || "00:00").split(":").map(Number);
        const [y, m, d] = shiftDate.split("-").map(Number);
        const startDt = new Date(y, m - 1, d, sh, sm);
        return startDt > now;
      });
      setShifts([...new Map(allShifts.map((shift) => [String(shift.id), shift])).values()]);
      const userRequests = listFrom(leaveResponse).filter((r) => {
        const reqEmpId = r.employeeId || r.employee_id;
        return String(reqEmpId) === String(currentUid);
      });
      setRequests(userRequests);
      setLoadError("");
    } catch (error) {
      setLoadError(errorText(error));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.employeeId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live synchronization with database changes (Manager approval / rejection / etc.)
  useEffect(() => {
    const unsubscribe = subscribeLeave(() => loadData({ silent: true }));
    return () => unsubscribe();
  }, [loadData]);

  useEffect(() => {
    if (!queryShiftId) return;
    setSelectedShiftId(queryShiftId);
    setFormOpen(true);
  }, [queryShiftId]);

  useEffect(() => {
    const refresh = () => loadData({ silent: true });
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [loadData]);

  const openForm = () => {
    setSelectedShiftId(queryShiftId ?? "");
    setLeaveType("unpaid");
    setReason("");
    setNote("");
    setFormError("");
    setFeedback(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError("");
    setSearchParams({});
    if (!queryShiftId) setSelectedShiftId("");
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    setFormError("");
    setFeedback(null);
    if (!selectedShift) {
      setFormError("Vui lòng chọn ca làm việc cần xin nghỉ.");
      return;
    }
    if (selectedShift.startsAt <= getNow()) {
      setFormError("Không thể gửi yêu cầu cho ca đã bắt đầu hoặc đã kết thúc.");
      return;
    }
    if (unavailableShiftIds.has(String(selectedShift.id))) {
      setFormError("Ca này đã có đơn xin nghỉ trước đó hoặc đang chờ duyệt.");
      return;
    }
    const reasonCheck = validateLeaveReason(reason);
    if (!reasonCheck.valid) {
      setFormError(reasonCheck.error);
      return;
    }
    const noteCheck = validateNote(note, { required: false, maxLength: 200, label: "Ghi chú" });
    if (!noteCheck.valid) {
      setFormError(noteCheck.error);
      return;
    }

    setSaving(true);
    try {
      const currentUserId = user?.employeeId || user?.id || "NV001";
      const currentUserName = user?.name || "Nhân viên";
      await submitLeave({
        shift_id: selectedShift.id,
        shiftId: selectedShift.id,
        shiftDate: formatDate(selectedShift.date, true),
        isoDate: selectedShift.date,
        date: selectedShift.date,
        shiftName: selectedShift.shiftName,
        shiftTime: `${selectedShift.startTime} - ${selectedShift.endTime}`,
        startTime: selectedShift.startTime,
        endTime: selectedShift.endTime,
        shift: selectedShift,
        employeeId: currentUserId,
        employeeName: currentUserName,
        roleTag: selectedShift.roleTag,
        leaveType,
        leaveTypeName: leaveType === "annual" ? "Nghỉ phép năm (Có lương)" : leaveType === "sick" ? "Nghỉ ốm đau / Bệnh" : "Nghỉ việc riêng đột xuất",
        reason: reasonCheck.value,
        note: noteCheck.value,
      });
      await loadData({ silent: true });
      setFeedback({ type: "success", text: "Đã gửi yêu cầu nghỉ thành công." });
      setReason("");
      setNote("");
      setSelectedShiftId("");
      setFormOpen(false);
      setSearchParams({});
    } catch (error) {
      setFormError(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  const cancelRequest = useCallback(async (request) => {
    setBusyId(String(request.id));
    setFeedback(null);
    try {
      await cancelLeaveRequest(request.id);
      await loadData({ silent: true });
      setFeedback({ type: "success", text: "Đã hủy yêu cầu nghỉ." });
    } catch (error) {
      setFeedback({ type: "error", text: errorText(error) });
    } finally {
      setBusyId("");
    }
  }, [loadData]);

  const tabsConfig = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ duyệt" },
    { id: "approved", label: "Đã duyệt" },
    { id: "rejected", label: "Bị từ chối" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  const tabCounts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter((r) => ["pending", "pending_approval"].includes(statusOf(r))).length,
    approved: requests.filter((r) => ["approved", "replacement_confirmed"].includes(statusOf(r))).length,
    rejected: requests.filter((r) => statusOf(r) === "rejected").length,
    cancelled: requests.filter((r) => statusOf(r) === "cancelled").length,
  }), [requests]);

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (activeTab === "pending") {
      list = list.filter((r) => ["pending", "pending_approval"].includes(statusOf(r)));
    } else if (activeTab === "approved") {
      list = list.filter((r) => ["approved", "replacement_confirmed"].includes(statusOf(r)));
    } else if (activeTab === "rejected") {
      list = list.filter((r) => statusOf(r) === "rejected");
    } else if (activeTab === "cancelled") {
      list = list.filter((r) => statusOf(r) === "cancelled");
    }

    if (searchQuery.trim()) {
      list = list.filter((r) => {
        const shift = shiftFromRequest(r, shifts);
        return matchesSearch(searchQuery, [
          shift.date,
          formatDate(shift.date, true),
          shift.shiftName,
          r.reason,
          r.note,
          STATUS_LABELS[statusOf(r)],
        ]);
      });
    }

    return list;
  }, [requests, activeTab, searchQuery, shifts]);

  const columns = useMemo(() => [
    {
      key: "shift",
      label: "Ca xin nghỉ",
      width: "24%",
      align: "left",
      render: (req) => {
        const shift = shiftFromRequest(req, shifts);
        if (!shift.hasShiftInfo) {
          return <span className="text-[13px] text-slate-400">Chưa có thông tin ca</span>;
        }
        const colors = getShiftColors(shift.shiftName);
        return (
          <div className="space-y-0.5 min-w-[160px]">
            <div className="flex items-center gap-1.5 font-medium text-slate-900 text-[14px]">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colors.border }} />
              <span className="tabular-nums">{formatDate(shift.date, true)}</span>
            </div>
            <div className="text-[13px] text-slate-500 font-normal">
              {formatShiftName(shift.shiftName)} · {formatTimeRange(shift.time)}
            </div>
          </div>
        );
      },
    },
    {
      key: "reason",
      label: "Lý do nghỉ",
      width: "32%",
      align: "left",
      render: (req) => {
        const reasonText = req.reason ?? req.note ?? "—";
        return (
          <div className="max-w-xs min-w-[180px]">
            <span
              className="line-clamp-2 text-[14px] text-slate-700 font-normal"
              title={reasonText !== "—" ? reasonText : undefined}
            >
              {reasonText}
            </span>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "Thời gian gửi",
      width: "16%",
      align: "left",
      render: (req) => (
        <span className="whitespace-nowrap text-[13px] text-slate-500 tabular-nums">
          {formatSubmittedAt(req)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "16%",
      align: "center",
      render: (req) => {
        const s = statusOf(req);
        const tone = STATUS_TONES[s] ?? "warning";
        const label = STATUS_LABELS[s] ?? req.status ?? "Chờ duyệt";
        const rejectReason = s === "rejected" ? (req.rejectReason || req.managerNote || req.response_reason || "") : "";
        return (
          <div className="flex flex-col items-center justify-center space-y-1 min-w-[130px]">
            <StatusBadge tone={tone}>{label}</StatusBadge>
            {rejectReason && (
              <span
                className="line-clamp-2 text-center text-[13px] font-normal text-rose-600"
                title={`Lý do từ chối: ${rejectReason}`}
              >
                Lý do từ chối: {rejectReason}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Thao tác",
      width: "12%",
      align: "center",
      render: (req) => {
        const s = statusOf(req);
        if (["cancelled", "rejected"].includes(s)) {
          return (
            <div className="flex items-center justify-center">
              <span className="text-[13px] text-slate-400">—</span>
            </div>
          );
        }

        const eligibility = getCancelEligibility(req, openShifts);
        const isBusy = busyId === String(req.id);

        if (!eligibility.canCancel) {
          return (
            <div className="flex items-center justify-center">
              <span
                title={eligibility.reason}
                className="inline-block max-w-[140px] truncate text-[11.5px] text-slate-400 cursor-not-allowed italic"
              >
                {eligibility.reason}
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmCancelRequest(req);
              }}
            >
              {isBusy ? "Đang hủy..." : "Hủy yêu cầu"}
            </Button>
          </div>
        );
      },
    },
  ], [shifts, busyId, openShifts]);

  return (
    <div className={STAFF_LAYOUT.blockGap}>
      {feedback && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-[14px] ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {loadError}
          </span>
          <button
            type="button"
            onClick={() => loadData()}
            className="inline-flex shrink-0 items-center gap-1 font-medium cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <PageHeader
        breadcrumbs={[
          { label: "Nhân viên", to: "/employees" },
          { label: "Nghỉ phép" },
        ]}
        icon="fileText"
        title="Nghỉ phép"
        subtitle="Gửi yêu cầu nghỉ phép cho ca làm việc sắp tới và theo dõi trạng thái phê duyệt từ Quản lý."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={openForm}
          >
            Tạo đơn xin nghỉ
          </Button>
        }
      />

      {/* ===== NỘI DUNG CHÍNH (PAGE CARD) ===== */}
      <PageCard>
        <div className="space-y-4">
          <StatusTabs
            tabs={tabsConfig}
            value={activeTab}
            onChange={setActiveTab}
            counts={tabCounts}
          />

          <div className="w-full min-w-0 pt-1 border-t border-slate-100">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm kiếm theo ngày, ca làm việc, lý do..."
              onClear={() => setSearchQuery("")}
              className="w-full min-w-0"
            />
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin" /> Đang tải yêu cầu nghỉ...
            </div>
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              title="Không tìm thấy kết quả phù hợp"
              description="Thử thay đổi từ khóa hoặc bộ lọc"
              onClear={() => {
                setActiveTab("all");
                setSearchQuery("");
              }}
              canClear={activeTab !== "all" || Boolean(searchQuery)}
            />
          ) : (
            <Table
              columns={columns}
              rows={filteredRequests}
              variant="clean"
              minWidth={780}
              onRowClick={(req) => setDetailRequest(req)}
              rowAriaLabel={(req) => {
                const shift = shiftFromRequest(req, shifts);
                return `Xem chi tiết đơn xin nghỉ ${formatDate(shift.date, true)}`;
              }}
            />
          )}
        </div>
      </PageCard>

      {/* ===== CÁC MODAL ===== */}
      <CreateLeaveModal
        open={formOpen}
        onClose={closeForm}
        onSubmit={submitRequest}
        formError={formError}
        setFormError={setFormError}
        selectedShiftId={selectedShiftId}
        setSelectedShiftId={setSelectedShiftId}
        leaveType={leaveType}
        setLeaveType={setLeaveType}
        reason={reason}
        setReason={setReason}
        note={note}
        setNote={setNote}
        submitting={saving}
        shifts={shifts}
        unavailableShiftIds={unavailableShiftIds}
      />

      <LeaveDetailModal
        detailRequest={detailRequest}
        onClose={() => setDetailRequest(null)}
        onCancelRequest={(req) => setConfirmCancelRequest(req)}
        shifts={shifts}
        openShifts={openShifts}
        busyId={busyId}
      />

      <CancelLeaveModal
        confirmCancelRequest={confirmCancelRequest}
        onClose={() => setConfirmCancelRequest(null)}
        onConfirm={async (req) => {
          await cancelRequest(req);
          setConfirmCancelRequest(null);
          if (detailRequest?.id === req.id) {
            setDetailRequest(null);
          }
        }}
        shifts={shifts}
        openShifts={openShifts}
        busyId={busyId}
      />
    </div>
  );
}
