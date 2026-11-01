import { useState, useEffect, useMemo } from "react";
import { getEmployeeOptions, getWorkHoursSummary, subscribeWorkHours, getEmployeeById } from "../../../../services/workHoursService";
import { round1 } from "../workHoursData";
import { matchesSearch } from "../../../../lib/searchUtils";

/**
 * Hook quản lý trạng thái, dữ liệu và bộ lọc của Tổng hợp giờ làm việc (US14)
 */
export function useWorkHoursData() {
  const [period, setPeriodState] = useState(() => {
    try {
      return sessionStorage.getItem("SMART_SCHEDULING_HR_PERIOD") || "week";
    } catch {
      return "week";
    }
  });
  const [fromDate, setFromDateState] = useState(() => {
    try {
      return sessionStorage.getItem("SMART_SCHEDULING_HR_FROM") || "";
    } catch {
      return "";
    }
  });
  const [toDate, setToDateState] = useState(() => {
    try {
      return sessionStorage.getItem("SMART_SCHEDULING_HR_TO") || "";
    } catch {
      return "";
    }
  });

  const setPeriod = (p) => {
    setPeriodState(p);
    try { sessionStorage.setItem("SMART_SCHEDULING_HR_PERIOD", p); } catch { /* Bỏ qua lỗi bộ nhớ trình duyệt */ }
  };
  const setFromDate = (f) => {
    setFromDateState(f);
    try { sessionStorage.setItem("SMART_SCHEDULING_HR_FROM", f); } catch { /* Bỏ qua lỗi bộ nhớ trình duyệt */ }
  };
  const setToDate = (t) => {
    setToDateState(t);
    try { sessionStorage.setItem("SMART_SCHEDULING_HR_TO", t); } catch { /* Bỏ qua lỗi bộ nhớ trình duyệt */ }
  };
  const [employeeId, setEmployeeId] = useState("all");
  const [roleTag, setRoleTag] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const [options, setOptions] = useState({ employees: [], roleTags: [] });
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const canClear =
    period !== "week" ||
    fromDate !== "" ||
    toDate !== "" ||
    employeeId !== "all" ||
    roleTag !== "all" ||
    searchTerm !== "" ||
    sortBy !== "default";

  const resetFilters = () => {
    setPeriod("week");
    setFromDate("");
    setToDate("");
    setEmployeeId("all");
    setRoleTag("all");
    setSearchTerm("");
    setSortBy("default");
  };

  const rangeError = useMemo(() => {
    if (period !== "range") return "";
    if (!fromDate || !toDate) return "Vui lòng chọn đủ Từ ngày và Đến ngày.";
    if (fromDate > toDate) return "“Từ ngày” không được lớn hơn “Đến ngày”.";
    return "";
  }, [period, fromDate, toDate]);

  // Tải danh mục nhân viên và vai trò
  useEffect(() => {
    getEmployeeOptions()
      .then(setOptions)
      .catch(() => setOptions({ employees: [], roleTags: [] }));

    const unsub = subscribeWorkHours(() => {
      getEmployeeOptions()
        .then(setOptions)
        .catch(() => {});
      setRefreshKey((k) => k + 1);
    });
    return unsub;
  }, []);

  // Tải bảng tổng hợp giờ làm
  useEffect(() => {
    if (rangeError) {
      queueMicrotask(() => {
        setSummary(null);
        setError("");
        setLoading(false);
      });
      return undefined;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    getWorkHoursSummary({ period, from: fromDate, to: toDate, employeeId, roleTag })
      .then((data) => !cancelled && setSummary(data))
      .catch(() => !cancelled && setError("Không tải được dữ liệu tổng hợp giờ làm"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period, fromDate, toDate, employeeId, roleTag, rangeError, refreshKey]);

  const employeeMap = useMemo(() => {
    const map = {};
    for (const e of options.employees) map[e.id] = e;
    return map;
  }, [options.employees]);

  const rows = useMemo(() => {
    if (!summary) return [];
    let list = summary.rows.map((r) => {
      const empId = r.employeeId || r.id;
      const emp = employeeMap[empId];
      const rosterEmp = getEmployeeById(empId);
      const scheduled = r.scheduledHours || 0;
      const actual = r.actualHours || 0;
      const ratio = scheduled > 0 ? Math.round((actual / scheduled) * 100) : actual > 0 ? 100 : 0;

      return {
        ...r,
        id: empId,
        employeeId: empId,
        name: emp?.name ?? rosterEmp?.name ?? r.name ?? empId,
        roleTag: emp?.roleTag ?? rosterEmp?.roleTag ?? r.roleTag ?? "",
        role: rosterEmp?.role ?? "",
        contract: rosterEmp?.contract ?? r.contract ?? "Toàn thời gian",
        diff: round1(actual - scheduled),
        ratio,
        nightHours: r.nightHours ?? 0,
        holidayHours: r.holidayHours ?? 0,
      };
    });

    if (searchTerm) {
      list = list.filter((r) =>
        matchesSearch(searchTerm, [
          r.name,
          r.employeeId,
          r.roleTag,
          ...(Array.isArray(r.roles) ? r.roles : []),
          r.contract,
        ])
      );
    }

    if (sortBy === "actual-desc") list.sort((a, b) => b.actualHours - a.actualHours);
    else if (sortBy === "diff-desc") list.sort((a, b) => b.diff - a.diff);
    else if (sortBy === "shifts-desc") list.sort((a, b) => b.shiftCount - a.shiftCount);

    return list;
  }, [summary, employeeMap, searchTerm, sortBy]);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (acc, r) => ({
        shiftCount: acc.shiftCount + r.shiftCount,
        scheduledHours: acc.scheduledHours + r.scheduledHours,
        actualHours: acc.actualHours + r.actualHours,
        nightHours: acc.nightHours + r.nightHours,
        holidayHours: acc.holidayHours + r.holidayHours,
      }),
      { shiftCount: 0, scheduledHours: 0, actualHours: 0, nightHours: 0, holidayHours: 0 }
    );
    return {
      shiftCount: t.shiftCount,
      scheduledHours: round1(t.scheduledHours),
      actualHours: round1(t.actualHours),
      diff: round1(t.actualHours - t.scheduledHours),
      nightHours: round1(t.nightHours),
      holidayHours: round1(t.holidayHours),
    };
  }, [rows]);

  const overallRatio =
    totals.scheduledHours > 0
      ? Math.round((totals.actualHours / totals.scheduledHours) * 100)
      : totals.actualHours > 0
      ? 100
      : 0;

  return {
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
    sortBy,
    setSortBy,
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
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
