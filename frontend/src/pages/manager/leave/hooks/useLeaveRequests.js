import { useEffect, useMemo, useState } from "react";
import {
  getLeaveRequests,
  approveLeave,
  rejectLeave,
  requestReplacement,
  respondReplacement,
  cancelReplacementRequest,
  createOpenShiftFromLeave,
  submitLeave,
  resetMockLeaveData,
  getAIReplacementCandidates,
  initialLeaveRequests,
  getSavedLeaveRequests,
  subscribeLeave,
} from "../../../../services/leaveService";
import { employeeRoster } from "../../../../services/scheduleService";
import { DEFAULT_FILTERS, PAGE_SIZES } from "../leaveShared";
import { matchesSearch } from "../../../../lib/searchUtils";

const loadSaved = () => {
  try {
    return getSavedLeaveRequests();
  } catch {
    return initialLeaveRequests;
  }
};

export function useLeaveRequests() {
  const [requests, setRequests] = useState(loadSaved);

  useEffect(() => {
    const unsub = subscribeLeave(() => {
      setRequests(loadSaved());
    });
    return unsub;
  }, []);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const [selected, setSelected] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingCands, setLoadingCands] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState(null);

  const showNotice = (message, type = "success") => setNotice({ message, type });

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    let cancelled = false;
    getLeaveRequests()
      .then((data) => !cancelled && data && setRequests(data))
      .catch(() => !cancelled && setRequests(initialLeaveRequests));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilterChange = (f) => {
    setFilters(f);
    setPage(1);
  };

  const handlePageSizeChange = (s) => {
    setPageSize(s);
    setPage(1);
  };

  const replace = (updated) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelected((s) => (s?.id === updated.id ? updated : s));
  };

  const run = async (action, okMsg, errMsg, type = "success") => {
    try {
      const updated = await action();
      replace(updated);
      showNotice(okMsg, type);
      return updated;
    } catch (err) {
      showNotice(err.business ? err.message : errMsg, "error");
      return null;
    }
  };

  const openDetail = (req) => {
    setSelected(req);
    setCandidates([]);
    if (req.status === "rejected") return;
    setLoadingCands(true);
    setTimeout(() => {
      setCandidates(getAIReplacementCandidates(req));
      setLoadingCands(false);
    }, 400);
  };

  const approve = (id) =>
    run(
      () => approveLeave(id, "Quản lý đã phê duyệt đơn xin nghỉ."),
      "Đã duyệt đơn xin nghỉ.",
      "Có lỗi xảy ra khi duyệt đơn."
    );

  const reject = async (reason) => {
    const ok = await run(
      () => rejectLeave(rejecting.id, reason),
      "Đã từ chối đơn xin nghỉ.",
      "Có lỗi xảy ra khi từ chối.",
      "warning"
    );
    if (ok) setRejecting(null);
  };

  const pickReplacement = (c) =>
    run(
      () =>
        requestReplacement(selected.id, {
          replacementId: c.id,
          replacementName: c.name,
          replacementRole: c.role,
        }),
      `Đã gửi đề nghị nhận ca cho ${c.name}. Chờ xác nhận.`,
      "Có lỗi xảy ra khi gửi đề nghị."
    );

  const answerReplacement = async (accepted) => {
    const updated = await run(
      () => respondReplacement(selected.id, accepted),
      accepted ? "Người thay đã nhận ca." : "Người thay từ chối. Hãy chọn người khác.",
      "Có lỗi xảy ra khi cập nhật phản hồi.",
      accepted ? "success" : "warning"
    );
    if (updated && !accepted) setCandidates(getAIReplacementCandidates(updated));
  };

  const cancelRequest = () =>
    run(
      () => cancelReplacementRequest(selected.id),
      "Đã rút đề nghị. Hãy chọn người khác.",
      "Có lỗi xảy ra khi rút đề nghị.",
      "info"
    );

  const openShift = () =>
    run(
      () => createOpenShiftFromLeave(selected.id),
      "Đã tạo ca trực mở cho toàn đội.",
      "Có lỗi khi tạo ca trực mở."
    );

  const createLeave = async (form) => {
    const emp = employeeRoster.find((e) => e.id === form.employeeId) ?? employeeRoster[0];
    const req = await submitLeave({
      ...form,
      employeeName: emp.name,
      employeeRole: emp.role,
      roleTag: emp.roleTag,
    });
    setRequests((prev) => [req, ...prev]);
    setCreating(false);
    showNotice("Đã tạo đơn xin nghỉ.");
  };

  const resetData = () => {
    const fresh = resetMockLeaveData();
    setRequests(fresh);
    setSelected((s) => fresh.find((r) => r.id === s?.id) ?? null);
    showNotice("Đã đặt lại dữ liệu mẫu.", "info");
  };

  const baseFiltered = useMemo(() => {
    return requests.filter(
      (r) =>
        (filters.role === "all" ||
          (r.roles ? r.roles.includes(filters.role) : (r.roleTag === filters.role || r.employeeRole === filters.role))) &&
        (filters.type === "all" || r.leaveType === filters.type) &&
        matchesSearch(filters.q, [
          r.employeeName,
          r.id,
          r.employeeId,
          r.reason,
          r.shiftName,
          r.roleTag,
          r.employeeRole,
          ...(Array.isArray(r.roles) ? r.roles : []),
          r.date,
          r.leaveType,
        ])
    );
  }, [requests, filters.q, filters.role, filters.type]);

  const counts = useMemo(() => {
    const by = (s) => baseFiltered.filter((r) => r.status === s).length;
    return {
      all: baseFiltered.length,
      pending: by("pending"),
      approved: by("approved"),
      replacement_pending: by("replacement_pending"),
      replacement_confirmed: by("replacement_confirmed"),
      rejected: by("rejected"),
    };
  }, [baseFiltered]);

  const coverageRate = useMemo(() => {
    const by = (s) => requests.filter((r) => r.status === s).length;
    const approvedTotal =
      by("approved") + by("replacement_pending") + by("replacement_confirmed");
    return approvedTotal ? Math.round((by("replacement_confirmed") / approvedTotal) * 100) : 100;
  }, [requests]);

  const rows = useMemo(
    () => baseFiltered.filter((r) => filters.status === "all" || r.status === filters.status),
    [baseFiltered, filters.status]
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize]
  );

  return {
    requests,
    filters,
    page: safePage,
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
    rows,
    pageRows,
    pageCount,
    handleFilterChange,
    handlePageSizeChange,
    setPage,
    openDetail,
    approve,
    reject,
    pickReplacement,
    answerReplacement,
    cancelRequest,
    openShift,
    createLeave,
    resetData,
  };
}
