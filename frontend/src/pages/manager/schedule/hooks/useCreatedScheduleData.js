// =============================================================================
// HOOK: useCreatedScheduleData
// Tầng: Hook giao diện (Custom Hook) - US11: Xem, sửa và công bố lịch đã tạo
// Mô tả: Quản lý danh sách ca theo tuần (tuần trước, tuần này, tuần sau),
//        lọc nhân viên, tính toán thống kê và kiểm tra ca thiếu định biên.
// =============================================================================

import { createElement, Fragment, useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Building, Users, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { subscribeSchedule } from "../../../../services/scheduleService";
import {
  employeeRoster,
  getWeekDays,
  getCurrentWeekLabel,
  initialShiftDemands,
  DAILY_SHIFT_REQUIREMENTS,
  getSavedSchedules,
  saveSchedules,
  isScheduleConfirmed,
} from "../scheduleShared";
import { getNow, addDays } from "../../../../lib/dateUtils";
import { stripAccents } from "../../../../lib/formatters";


/**
 * Hook quản lý trạng thái, bộ lọc và tính toán thống kê của trang Lịch đã tạo
 */
export function useCreatedScheduleData({ showToast }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [schedules, setSchedules] = useState(() => {
    if (location.state?.schedules) {
      saveSchedules(location.state.schedules);
      return location.state.schedules;
    }
    return getSavedSchedules();
  });

  useEffect(() => {
    const unsub = subscribeSchedule(() => {
      setSchedules(getSavedSchedules());
    });
    return unsub;
  }, []);

  const [period, setPeriod] = useState("week");
  const [shiftDemands] = useState(initialShiftDemands);

  // Tính toán 7 ngày trong tuần theo khoảng thời gian được chọn
  const days = useMemo(() => {
    const offset = period === "prev" ? -7 : period === "next" ? 7 : 0;
    return getWeekDays(addDays(getNow(), offset));
  }, [period]);

  // Nhãn tuần động (vd: Tuần 19/10/2026 - 25/10/2026)
  const weekLabel = useMemo(() => {
    const offset = period === "prev" ? -7 : period === "next" ? 7 : 0;
    return getCurrentWeekLabel(addDays(getNow(), offset));
  }, [period]);

  // Tuần sau ban đầu chưa có lịch để Manager demo xếp ca tự động (mô phỏng, sau này thay bằng Python OR-Tools - US10)
  const activeSchedules = useMemo(() => {
    if (period === "next" && !location.state?.schedules) {
      const empty = {};
      days.forEach((day) => {
        shiftDemands.forEach((demand) => {
          empty[`${demand.id}_${day.id}`] = {
            shiftId: demand.id,
            dayId: day.id,
            assigned: [],
          };
        });
      });
      return empty;
    }
    return schedules;
  }, [period, schedules, days, shiftDemands, location.state]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [activeModalShiftKey, setActiveModalShiftKey] = useState(null);

  const canClear = search !== "" || roleFilter !== "all" || shiftFilter !== "all" || period !== "week";

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setShiftFilter("all");
    setPeriod("week");
  };

  const handleOpenShiftModal = (shiftKey) => setActiveModalShiftKey(shiftKey);
  const handleCloseModal = () => setActiveModalShiftKey(null);

  const handleSaveModal = (shiftKey, updatedList) => {
    if (period !== "next" && isScheduleConfirmed()) {
      showToast?.("Lịch tuần này đã được xác nhận chính thức, không thể sửa đổi.");
      handleCloseModal();
      return;
    }
    const updated = {
      ...activeSchedules,
      [shiftKey]: {
        ...(activeSchedules[shiftKey] || {}),
        assigned: updatedList,
      },
    };
    setSchedules(updated);
    saveSchedules(updated);
    handleCloseModal();
    showToast?.("Đã cập nhật phân công ca thành công!");
  };

  const handleGoToOpenShift = (shiftInfo) => {
    handleCloseModal();
    navigate("/manager/open-shifts", {
      state: {
        shift: shiftInfo,
        fromSchedule: true,
      },
    });
  };

  // Thống kê tổng hợp
  const stats = useMemo(() => {
    const uniqueEmployees = new Set();
    let totalRequiredPositions = 0;
    let totalAssignedPositions = 0;
    let totalAssignedHours = 0;
    let deficientShiftsCount = 0;

    days.forEach((day) => {
      shiftDemands.forEach((demand) => {
        const key = `${demand.id}_${day.id}`;
        const shiftData = activeSchedules[key] || { assigned: [] };
        const count = shiftData.assigned.length;
        const dailyReq = DAILY_SHIFT_REQUIREMENTS[day.id]?.[demand.id] || demand;
        totalRequiredPositions += dailyReq.total;
        totalAssignedPositions += count;
        const hours = demand.id === "morning" ? 6 : 5;
        totalAssignedHours += count * hours;
        shiftData.assigned.forEach((e) => uniqueEmployees.add(e.id));
        if (count < dailyReq.total) {
          deficientShiftsCount++;
        }
      });
    });

    const fillRate = Math.round((totalAssignedPositions / (totalRequiredPositions || 1)) * 100);

    return {
      uniqueEmployees,
      totalRequiredPositions,
      totalAssignedPositions,
      totalAssignedHours,
      deficientShiftsCount,
      fillRate,
    };
  }, [days, shiftDemands, activeSchedules]);

  // Phẳng hóa phân công cho dạng xem Danh sách
  const allAssignments = useMemo(() => {
    const list = [];
    days.forEach((day) => {
      shiftDemands.forEach((demand) => {
        const key = `${demand.id}_${day.id}`;
        const shiftData = activeSchedules[key] || { assigned: [] };
        const emps = shiftData.assigned || [];
        const hours = demand.id === "morning" ? 6 : 5;

        emps.forEach((emp) => {
          list.push({
            id: `${emp.id}_${day.id}_${demand.id}`,
            shiftKey: key,
            employeeId: emp.id,
            employeeName: emp.name,
            employeeAvatar: emp.avatar,
            role: emp.role || emp.roles?.[0] || "Phục vụ",
            roles: emp.roles || [emp.role || "Phục vụ"],
            dayId: day.id,
            dayLabel: day.label,
            dayName: day.fullDate.split(",")[0],
            date: `${day.date}/2026`,
            fullDate: day.fullDate,
            shiftId: demand.id,
            shiftName: demand.shortName,
            shiftFullName: demand.name,
            scheduled: demand.time,
            hours,
            status: "Đã phân công",
          });
        });
      });
    });
    return list;
  }, [days, shiftDemands, activeSchedules]);

  const keyword = stripAccents(search);
  const filteredAssignments = useMemo(() => {
    return allAssignments.filter((r) => {
      if (keyword) {
        const matchName = stripAccents(r.employeeName).includes(keyword);
        const matchId = String(r.employeeId || "").toLowerCase().includes(keyword);
        if (!matchName && !matchId) return false;
      }
      if (roleFilter !== "all" && !(r.roles ? r.roles.includes(roleFilter) : r.role === roleFilter)) return false;
      if (shiftFilter !== "all" && r.shiftId !== shiftFilter) return false;
      return true;
    });
  }, [allAssignments, keyword, roleFilter, shiftFilter]);

  const filteredEmployees = useMemo(() => {
    return employeeRoster.filter((emp) => {
      if (keyword) {
        const matchName = stripAccents(emp.name).includes(keyword);
        const matchId = String(emp.id || "").toLowerCase().includes(keyword);
        if (!matchName && !matchId) return false;
      }
      if (roleFilter !== "all" && !(emp.roles ? emp.roles.includes(roleFilter) : emp.role === roleFilter)) return false;
      if (shiftFilter !== "all") {
        const hasShift = days.some(
          (d) => activeSchedules[`${shiftFilter}_${d.id}`]?.assigned?.some((e) => e.id === emp.id)
        );
        if (!hasShift) return false;
      }
      return true;
    });
  }, [keyword, roleFilter, shiftFilter, days, activeSchedules]);

  const modalData = useMemo(() => {
    if (!activeModalShiftKey) return null;
    const [shiftId, dayId] = activeModalShiftKey.split("_");
    const baseDemand = shiftDemands.find((d) => d.id === shiftId) || shiftDemands[0];
    const dailyReq = DAILY_SHIFT_REQUIREMENTS[dayId]?.[shiftId] || baseDemand;
    const demand = { ...baseDemand, ...dailyReq };
    const day = days.find((d) => d.id === dayId) || days[0];
    const assigned = activeSchedules[activeModalShiftKey]?.assigned || [];

    const pvAssigned = assigned.filter((e) => e.role === "Phục vụ").length;
    const pcAssigned = assigned.filter((e) => e.role === "Pha chế").length;
    const tnAssigned = assigned.filter((e) => e.role === "Thu ngân").length;
    const missing = Math.max(0, demand.total - assigned.length);

    return {
      key: activeModalShiftKey,
      shiftId,
      dayId,
      demand,
      day,
      assigned,
      pvAssigned,
      pcAssigned,
      tnAssigned,
      missing,
    };
  }, [activeModalShiftKey, shiftDemands, days, activeSchedules]);

  const statItems = useMemo(
    () => [
      {
        key: "shifts",
        icon: createElement(Building, { size: 16, strokeWidth: 1.8, className: "text-[#0F172A]" }),
        dot: "#0F172A",
        label: "Tổng số ca tuần",
        value: "21 ca",
        note: "3 ca × 7 ngày",
        footer: createElement(
          Fragment,
          null,
          createElement("span", null, "Toàn tuần:"),
          createElement("span", { className: "font-semibold text-[#0F172A] tabular-nums" }, "7 ngày")
        ),
      },
      {
        key: "employees",
        icon: createElement(Users, { size: 16, strokeWidth: 1.8, className: "text-[#0F172A]" }),
        dot: "#8B5CF6",
        label: "Nhân sự tham gia",
        value: `${stats.uniqueEmployees.size} / ${employeeRoster.length}`,
        note: "Nhân viên phân công",
        footer: createElement(
          Fragment,
          null,
          createElement("span", null, "Tỷ lệ huy động:"),
          createElement(
            "span",
            { className: "font-semibold text-[#0F172A] tabular-nums" },
            `${Math.round((stats.uniqueEmployees.size / (employeeRoster.length || 1)) * 100)}%`
          )
        ),
      },
      {
        key: "hours",
        icon: createElement(Clock, { size: 16, strokeWidth: 1.8, className: "text-[#0F172A]" }),
        dot: "#2B9FCF",
        label: "Tổng giờ phân công",
        value: `${stats.totalAssignedHours}g`,
        note: "Toàn tuần",
        footer: createElement(
          Fragment,
          null,
          createElement("span", null, "Trung bình:"),
          createElement(
            "span",
            { className: "font-semibold text-[#0F172A] tabular-nums" },
            `${(stats.totalAssignedHours / (stats.uniqueEmployees.size || 1)).toFixed(1)}g/người`
          )
        ),
      },
      {
        key: "fillRate",
        icon: createElement(CheckCircle2, { size: 16, strokeWidth: 1.8, className: "text-[#0F172A]" }),
        dot: "#2A9D8F",
        label: "Tỷ lệ lấp đầy ca",
        value: `${stats.fillRate}%`,
        note: `${stats.totalAssignedPositions}/${stats.totalRequiredPositions} vị trí`,
        footer: createElement(
          Fragment,
          null,
          createElement("span", null, "Vị trí còn thiếu:"),
          createElement(
            "span",
            { className: "font-semibold text-emerald-700 tabular-nums" },
            `${Math.max(0, stats.totalRequiredPositions - stats.totalAssignedPositions)} vị trí`
          )
        ),
      },
      {
        key: "deficient",
        icon: createElement(AlertTriangle, { size: 16, strokeWidth: 1.8, className: "text-[#0F172A]" }),
        dot: stats.deficientShiftsCount > 0 ? "#E76F51" : "#2A9D8F",
        label: "Ca cần bổ sung",
        value: `${stats.deficientShiftsCount} ca`,
        note: stats.deficientShiftsCount > 0 ? "Cần phân công thêm" : "Đã đủ định biên",
        footer: createElement(
          Fragment,
          null,
          createElement("span", null, "Tình trạng:"),
          createElement(
            "span",
            { className: `font-semibold tabular-nums ${stats.deficientShiftsCount > 0 ? "text-rose-700" : "text-emerald-700"}` },
            stats.deficientShiftsCount > 0 ? "Chưa đạt" : "Đạt định biên"
          )
        ),
      },
    ],
    [stats]
  );

  return {
    days,
    weekLabel,
    shiftDemands,
    schedules: activeSchedules,
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
    allAssignments,
    filteredAssignments,
    filteredEmployees,
    modalData,
  };
}
