import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  cancelOpenShift,
  createOpenShift,
  getOpenShifts,
  updateOpenShift,
  subscribeOpenShift,
  getCancelRule,
  getEditRule,
  statusOf,
  weekdayOf,
  fmtDate,
} from "../../../../services/openShiftService";
import { getShiftConfig } from "../../../../services/shiftConfigService";
import { fromPayload } from "../../shiftconfig/shiftConfigData";
import { PAGE_SIZES, compareShifts } from "../openShiftData";
import { matchesSearch } from "../../../../lib/searchUtils";

const DEFAULT_FILTERS = { status: "all", q: "", role: "all" };

export function useOpenShifts() {
  const location = useLocation();
  const navigate = useNavigate();
  const fromSchedule = location.state?.shift;

  const [shifts, setShifts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const [form, setForm] = useState(fromSchedule ? { shift: null } : null);
  const [detailId, setDetailId] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    Promise.all([getOpenShifts(), getShiftConfig().catch(() => ({}))])
      .then(([list, cfg]) => {
        setShifts(list);
        setCatalog(fromPayload(cfg).shifts.filter((s) => s.status === "active"));
      })
      .catch(() => setLoadError("Không tải được danh sách ca trực mở."))
      .finally(() => setLoading(false));
    if (fromSchedule) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsub = subscribeOpenShift(() => {
      getOpenShifts().then((list) => setShifts(list)).catch(() => {});
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const [prevFilterKey, setPrevFilterKey] = useState("");
  const currentFilterKey = `${JSON.stringify(filters)}|${pageSize}`;
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setPage(1);
  }

  const act = async (fn, success) => {
    try {
      await fn();
      setShifts(await getOpenShifts());
      setNotice({ message: success, type: "success" });
      return true;
    } catch (err) {
      setNotice({
        message: err.business ? err.message : "Không thực hiện được, vui lòng thử lại.",
        type: "error",
      });
      return false;
    }
  };

  const saveForm = async (payload) => {
    const ok = await act(
      () => (payload.id ? updateOpenShift(payload) : createOpenShift(payload)),
      payload.id ? "Đã cập nhật ca trực mở." : "Đã mở ca trực mới."
    );
    if (ok) setForm(null);
  };

  const confirmCancel = async (shift) => {
    const ok = await act(() => cancelOpenShift(shift.id), "Đã hủy ca trực mở.");
    if (ok) setCancelling(null);
  };

  const baseFiltered = useMemo(() => {
    return shifts.filter(
      (s) =>
        (filters.role === "all" ||
          (s.roles ? s.roles.includes(filters.role) : (s.role === filters.role || s.roleTag === filters.role))) &&
        matchesSearch(filters.q, [
          s.shiftName,
          s.role,
          s.roleTag,
          ...(Array.isArray(s.roles) ? s.roles : []),
          fmtDate(s.date),
          weekdayOf(s.date),
          s.note,
          ...s.claims.map((c) => c.name),
          ...s.claims.map((c) => c.employeeId),
        ])
    );
  }, [shifts, filters.q, filters.role]);

  const countOf = (tab) =>
    (tab === "all" ? baseFiltered : baseFiltered.filter((s) => statusOf(s) === tab)).length;

  const rows = useMemo(
    () =>
      baseFiltered
        .filter((s) => filters.status === "all" || statusOf(s) === filters.status)
        .sort((a, b) => compareShifts(a, b, statusOf)),
    [baseFiltered, filters.status]
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize]
  );

  const canClear = filters.q !== "" || filters.role !== "all" || filters.status !== "all";
  const openCount = useMemo(
    () => shifts.filter((s) => statusOf(s) === "open").length,
    [shifts]
  );
  const detail = shifts.find((s) => s.id === detailId) ?? null;

  const menuItems = (s) => {
    const edit = getEditRule(s);
    const cancel = getCancelRule(s);
    return [
      { label: "Xem chi tiết", onClick: () => setDetailId(s.id) },
      { label: "Sửa ca trực", disabled: !edit.allowed, onClick: () => setForm({ shift: s }) },
      {
        label: "Hủy ca trực",
        danger: true,
        disabled: !cancel.allowed,
        onClick: () => setCancelling(s),
      },
    ];
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return {
    fromSchedule,
    shifts,
    catalog,
    loading,
    loadError,
    filters,
    setFilters,
    resetFilters,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    form,
    setForm,
    detailId,
    setDetailId,
    cancelling,
    setCancelling,
    notice,
    saveForm,
    confirmCancel,
    countOf,
    rows,
    pageCount,
    pageRows,
    canClear,
    openCount,
    detail,
    menuItems,
  };
}
