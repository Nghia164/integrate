import React, { useState, useEffect, useMemo } from "react";
import { Clock, Wallet, AlarmClock, UserX, Users } from "lucide-react";
import { getDashboardStats, subscribeDashboard } from "../../../../services/dashboardService";
import { getEmployeeOptions } from "../../../../services/workHoursService";
import { STATUS_HEX } from "../../attendance/attendanceHelpers";
import { fmtNum, fmtMoney } from "../dashboardData";

/**
 * Hook quản lý trạng thái, dữ liệu và bộ lọc của Dashboard quản lý (US28)
 */
export function useDashboardData() {
  const [period, setPeriod] = useState("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [shiftName, setShiftName] = useState("all");
  const [roleTag, setRoleTag] = useState("all");

  const [roleTags, setRoleTags] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const canClear =
    period !== "month" ||
    fromDate !== "" ||
    toDate !== "" ||
    shiftName !== "all" ||
    roleTag !== "all";

  const resetFilters = () => {
    setPeriod("month");
    setFromDate("");
    setToDate("");
    setShiftName("all");
    setRoleTag("all");
  };

  const rangeError = useMemo(() => {
    if (period !== "range") return "";
    if (!fromDate || !toDate) return "Vui lòng chọn đủ Từ ngày và Đến ngày.";
    if (fromDate > toDate) return "“Từ ngày” không được lớn hơn “Đến ngày”.";
    return "";
  }, [period, fromDate, toDate]);

  // Tải danh mục vai trò
  useEffect(() => {
    getEmployeeOptions()
      .then((opts) => setRoleTags(opts.roleTags ?? []))
      .catch(() => setRoleTags([]));
  }, []);

  // Lắng nghe cập nhật Single Source of Truth
  useEffect(() => {
    const unsub = subscribeDashboard(() => {
      setRefreshKey((k) => k + 1);
    });
    return unsub;
  }, []);

  // Tải số liệu Dashboard
  useEffect(() => {
    if (rangeError) {
      queueMicrotask(() => {
        setData(null);
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
    getDashboardStats({ period, from: fromDate, to: toDate, shiftName, roleTag })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError("Không tải được dữ liệu bảng điều khiển"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period, fromDate, toDate, shiftName, roleTag, rangeError, refreshKey]);

  const c = data?.cards;
  const showStats = !!data && !data.empty && !rangeError && !error;
  const hoursPct =
    showStats && c?.scheduledHours > 0
      ? Math.round((c.actualHours / c.scheduledHours) * 1000) / 10
      : 0;

  const statItems = useMemo(() => {
    if (!showStats || !c) return null;
    return [
      {
        key: "hours",
        icon: React.createElement(Clock, { size: 16, strokeWidth: 1.8, className: "text-[#0F172A]" }),
        dot: "#2B9FCF",
        label: "Giờ làm thực tế",
        value: `${fmtNum(c.actualHours)}h`,
        note: `${fmtNum(hoursPct)}% theo kế hoạch`,
        footer: React.createElement(
          React.Fragment,
          null,
          React.createElement("span", null, "Theo lịch:"),
          React.createElement("span", { className: "font-semibold text-[#0F172A] tabular-nums" }, `${fmtNum(c.scheduledHours)}h`)
        ),
      },
      {
        key: "cost",
        icon: React.createElement(Wallet, { size: 16, strokeWidth: 1.8, className: "text-[#0F172A]" }),
        dot: "#0F172A",
        label: "Chi phí lương",
        value: fmtMoney(c.payrollCost),
        note: `${fmtNum(c.totalShifts)} ca đối soát`,
        footer: React.createElement(
          React.Fragment,
          null,
          React.createElement("span", null, "Tổng số ca:"),
          React.createElement("span", { className: "font-semibold text-[#0F172A] tabular-nums" }, `${fmtNum(c.totalShifts)} ca`)
        ),
      },
      {
        key: "late",
        icon: React.createElement(AlarmClock, { size: 16, strokeWidth: 1.8, className: "text-[#0F172A]" }),
        dot: STATUS_HEX.Late,
        label: "Tỷ lệ đi trễ",
        value: `${fmtNum(c.lateRate)}%`,
        note: `${c.lateCount}/${c.totalShifts} ca`,
        footer: React.createElement(
          React.Fragment,
          null,
          React.createElement("span", null, "Số ca trễ:"),
          React.createElement("span", { className: "font-semibold text-amber-700 tabular-nums" }, `${c.lateCount} ca`)
        ),
      },
      {
        key: "absent",
        icon: React.createElement(UserX, { size: 16, strokeWidth: 1.8, className: "text-[#0F172A]" }),
        dot: STATUS_HEX.Absent,
        label: "Tỷ lệ vắng",
        value: `${fmtNum(c.absentRate)}%`,
        note: `${c.absentCount}/${c.totalShifts} ca`,
        footer: React.createElement(
          React.Fragment,
          null,
          React.createElement("span", null, "Số ca vắng:"),
          React.createElement("span", { className: "font-semibold text-rose-700 tabular-nums" }, `${c.absentCount} ca`)
        ),
      },
      {
        key: "fill",
        icon: React.createElement(Users, { size: 16, strokeWidth: 1.8, className: "text-[#0F172A]" }),
        dot: STATUS_HEX["On-Time"],
        label: "Lấp đầy ca",
        value: `${fmtNum(c.fillRate)}%`,
        note: `${c.fillFilled}/${c.fillRequired} vị trí`,
        footer: React.createElement(
          React.Fragment,
          null,
          React.createElement("span", null, "Vị trí đạt:"),
          React.createElement("span", { className: "font-semibold text-emerald-700 tabular-nums" }, `${c.fillFilled}/${c.fillRequired}`)
        ),
      },
    ];
  }, [showStats, c, hoursPct]);

  const suggestions = useMemo(() => {
    return [
      "Tóm tắt tình hình kỳ này",
      ...(data && !data.empty && c?.lateRate > 0 ? [`Vì sao tỷ lệ đi trễ là ${fmtNum(c.lateRate)}%?`] : []),
      ...(data && data.todo?.understaffed > 0
        ? [`Có ${data.todo.understaffed} ca thiếu người, nên xếp ai?`]
        : []),
      "Nhân viên nào làm thấp hơn lịch nhiều nhất?",
    ];
  }, [data, c]);

  return {
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
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
