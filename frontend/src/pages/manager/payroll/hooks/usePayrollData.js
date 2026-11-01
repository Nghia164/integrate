import { useState, useEffect, useMemo } from "react";
import { getPayrollSummary, subscribePayroll, computeTotals } from "../../../../services/payrollService";
import { currentMonth, monthRange } from "../payrollData";
import { getNow, startOfDay, addDays, toISO, toVN } from "../../../../lib/dateUtils";
import { matchesSearch } from "../../../../lib/searchUtils";


/**
 * Hook quản lý trạng thái, dữ liệu và bộ lọc của Bảng lương (US27)
 */
export function usePayrollData() {
  const [period, setPeriodState] = useState(() => {
    try {
      return sessionStorage.getItem("SMART_SCHEDULING_HR_PERIOD") || "month";
    } catch {
      return "month";
    }
  });
  const [month, setMonth] = useState(currentMonth());

  // Mốc đầu tuần khi chọn kiểu "Theo tuần" (mặc định tuần trước đã kết thúc 19/10/2026)
  const [weekMonday, setWeekMonday] = useState("2026-10-19");

  const [fromDate, setFromDateState] = useState(() => {
    try {
      return sessionStorage.getItem("SMART_SCHEDULING_HR_FROM") || "2026-10-19";
    } catch {
      return "2026-10-19";
    }
  });
  const [toDate, setToDateState] = useState(() => {
    try {
      return sessionStorage.getItem("SMART_SCHEDULING_HR_TO") || "2026-10-25";
    } catch {
      return "2026-10-25";
    }
  });

  const prevWeek = () => {
    setWeekMonday((m) => toISO(addDays(new Date(m), -7)));
  };
  const nextWeek = () => {
    setWeekMonday((m) => toISO(addDays(new Date(m), 7)));
  };

  const setPeriod = (p) => {
    setPeriodState(p);
    try { sessionStorage.setItem("SMART_SCHEDULING_HR_PERIOD", p); } catch { /* Bỏ qua lỗi */ }
    if (p === "range" && (!fromDate || !toDate)) {
      setFromDate("2026-10-19");
      setToDate("2026-10-25");
    }
  };

  const setFromDate = (f) => {
    setFromDateState(f);
    try { sessionStorage.setItem("SMART_SCHEDULING_HR_FROM", f); } catch { /* Bỏ qua lỗi */ }
  };
  const setToDate = (t) => {
    setToDateState(t);
    try { sessionStorage.setItem("SMART_SCHEDULING_HR_TO", t); } catch { /* Bỏ qua lỗi */ }
  };

  const [contract, setContract] = useState("all");
  const [search, setSearch] = useState("");

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const canClear =
    period !== "month" ||
    month !== currentMonth() ||
    fromDate !== "2026-10-19" ||
    toDate !== "2026-10-25" ||
    contract !== "all" ||
    search !== "";

  const resetFilters = () => {
    setPeriod("month");
    setMonth(currentMonth());
    setFromDate("2026-10-19");
    setToDate("2026-10-25");
    setWeekMonday("2026-10-19");
    setContract("all");
    setSearch("");
  };

  const rangeError = useMemo(() => {
    if (period === "month") return month ? "" : "Vui lòng chọn tháng/năm.";
    if (period === "range") {
      if (!fromDate || !toDate) return "Vui lòng chọn đủ Từ ngày và Đến ngày.";
      if (fromDate > toDate) return "“Từ ngày” không được lớn hơn “Đến ngày”.";
    }
    return "";
  }, [period, month, fromDate, toDate]);

  // Đổi tháng/năm hoặc kỳ thành tham số truy vấn
  const query = useMemo(() => {
    if (period === "month" && month) {
      const m = monthRange(month);
      return { period: "range", from: m.from, to: m.to, label: m.label, periodType: "month", monthKey: month };
    }
    if (period === "range") {
      const label = fromDate && toDate ? (fromDate === toDate ? `Ngày ${toVN(fromDate)}` : `Từ ${toVN(fromDate)} đến ${toVN(toDate)}`) : "";
      return { period: "range", from: fromDate, to: toDate, label, periodType: "range" };
    }
    const start = new Date(weekMonday);
    const end = addDays(start, 6);
    const from = toISO(start);
    const to = toISO(end);
    const label = `Tuần ${toVN(from)} – ${toVN(to)}`;
    return { period: "week", from, to, label, periodType: "week" };
  }, [period, month, fromDate, toDate, weekMonday]);

  // Lắng nghe cập nhật từ Single Source of Truth
  useEffect(() => {
    const unsub = subscribePayroll(() => {
      setRefreshKey((k) => k + 1);
    });
    return unsub;
  }, []);

  // Tải dữ liệu bảng lương
  useEffect(() => {
    if (rangeError) {
      queueMicrotask(() => setLoading(false));
      return undefined;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    getPayrollSummary(query)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được dữ liệu bảng lương");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, rangeError, refreshKey]);

  const calculated = !!data;
  const rows = useMemo(
    () =>
      (calculated ? data.rows : [])
        .filter(
          (r) =>
            (contract === "all" || r.contract === contract) &&
            matchesSearch(search, [
              r.name,
              r.employeeId,
              r.contract,
              r.role,
              r.roleTag,
              ...(Array.isArray(r.roles) ? r.roles : []),
            ])
        )
        .map((r) => ({ ...r, id: r.employeeId })),
    [data, calculated, contract, search]
  );

  const totals = useMemo(() => computeTotals(rows), [rows]);

  const visibleEmployeeIds = useMemo(() => new Set(rows.map((r) => r.employeeId)), [rows]);

  const missing = useMemo(() => {
    if (!calculated) return 0;
    if (data.issues?.missingShifts) {
      return data.issues.missingShifts.filter((s) => visibleEmployeeIds.has(s.employeeId)).length;
    }
    return data.issues?.missingCheckout ?? 0;
  }, [calculated, data, visibleEmployeeIds]);

  const hasData = calculated && data.rows.length > 0;
  const partial = calculated && !!data.to && data.to > toISO(startOfDay(getNow()));

  const runCalculation = async () => {
    if (rangeError || loading) return;
    setLoading(true);
    setError("");
    try {
      const d = await getPayrollSummary(query);
      setData(d);
      return d;
    } catch {
      setError("Không tải được dữ liệu bảng lương");
      throw new Error("Không tải được dữ liệu bảng lương");
    } finally {
      setLoading(false);
    }
  };

  return {
    period,
    setPeriod,
    month,
    setMonth,
    weekMonday,
    prevWeek,
    nextWeek,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    contract,
    setContract,
    search,
    setSearch,
    canClear,
    resetFilters,
    rangeError,
    query,
    data,
    rows,
    totals,
    missing,
    hasData,
    calculated,
    partial,
    loading,
    error,
    runCalculation,
  };
}
