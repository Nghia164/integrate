/**
 * File: src/pages/employees/schedule/MySchedulePage.jsx
 * Tầng: Giao diện Staff (Employee Presentation) - US13
 * Nghiệp vụ: Xem lịch làm việc của tôi theo tuần, ngày, tháng
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  AlertCircle,
  Clock,
  Calendar,
  Briefcase,
  ArrowLeftRight,
  CalendarClock,
  RotateCw,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getMySchedule, subscribeSchedule } from "../../../services/scheduleService";
import { getTodayAttendanceStatus, subscribeAttendance } from "../../../services/attendanceService";
import { getExchangeRequests } from "../../../services/shiftExchangeService";
import { getLeaveRequests } from "../../../services/leaveService";
import { getNow } from "../../../lib/dateUtils";
import { buildWeekCells } from "../../../lib/scheduleHelpers";
import { Button } from "../../../components/FormKit";
import { StatusBadge } from "../../../components/TableKit";
import { PageHeader, StatStrip } from "../../../components/PageKit";
import { CalendarToolbar, WeekShiftGrid, ShiftModal } from "../../../components/CalendarKit";
import {
  getShiftColors,
  NEXT_SHIFT_BAR,
} from "../../../lib/shiftColors";
import STAFF_LAYOUT from "../../../lib/layoutTokens";
import "../../../components/calendarStyles.css";


// Ngôn ngữ tiếng Việt cho FullCalendar
const VI_LOCALE = {
  code: "vi",
  week: { dow: 1, doy: 4 },
  buttonText: {
    prev: "‹",
    next: "›",
    today: "Hôm nay",
    month: "Tháng",
    week: "Tuần",
    day: "Ngày",
    list: "Danh sách",
  },
  allDayText: "Cả ngày",
  moreLinkText: (n) => `+${n} ca nữa`,
  noEventsText: "Không có ca làm việc",
};

function toISO(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(startMonday) {
  const sunday = new Date(startMonday);
  sunday.setDate(sunday.getDate() + 6);
  const startD = startMonday.getDate();
  const startM = startMonday.getMonth() + 1;
  const endD = sunday.getDate();
  const endM = sunday.getMonth() + 1;
  const endY = sunday.getFullYear();
  return `${startD} thg ${startM} – ${endD} thg ${endM}, ${endY}`;
}

const VI_DAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export default function MySchedulePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  const employeeId = user?.employeeId || user?.id || "NV001";

  const [currentDate, setCurrentDate] = useState(() => getNow());
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("week"); // 'day' | 'week' | 'month'
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Phát hiện thiết bị di động
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tải dữ liệu lịch từ service
  const loadData = useCallback(
    async (targetDate) => {
      const refMonday = mondayOf(targetDate || currentDate);
      const weekStartIso = toISO(refMonday);
      try {
        setLoading(true);
        setError(null);
        const res = await getMySchedule({
          week_start: weekStartIso,
          employeeId,
          currentUserId: employeeId,
        });
        setScheduleData(res);
      } catch (err) {
        console.error("Lỗi tải lịch của tôi:", err);
        setError(err.message || "Không thể tải dữ liệu lịch làm việc. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    },
    [employeeId, currentDate]
  );

  useEffect(() => {
    loadData(currentDate);
  }, [loadData, currentDate]);

  // Lắng nghe cập nhật lịch và chấm công
  useEffect(() => {
    const unsubSched = subscribeSchedule(() => {
      loadData(currentDate);
    });
    const unsubAtt = subscribeAttendance(() => {
      getTodayAttendanceStatus(employeeId);
    });
    return () => {
      unsubSched?.();
      unsubAtt?.();
    };
  }, [loadData, currentDate, employeeId]);

  // ---------------------------------------------------------------------------
  // ĐIỀU HƯỚNG LỊCH (Đảm bảo hoạt động 100% trên cả Desktop và Mobile)
  // ---------------------------------------------------------------------------
  const handleToday = () => {
    const today = getNow();
    setCurrentDate(today);
    if (!isMobile && calendarRef.current) {
      calendarRef.current.getApi()?.today();
    }
  };

  const handlePrev = () => {
    const prev = new Date(currentDate);
    if (isMobile || viewMode === "week") {
      prev.setDate(prev.getDate() - 7);
    } else if (viewMode === "day") {
      prev.setDate(prev.getDate() - 1);
    } else if (viewMode === "month") {
      prev.setMonth(prev.getMonth() - 1);
    }
    setCurrentDate(prev);
    if (!isMobile && calendarRef.current) {
      calendarRef.current.getApi()?.gotoDate(prev);
    }
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (isMobile || viewMode === "week") {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === "day") {
      next.setDate(next.getDate() + 1);
    } else if (viewMode === "month") {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
    if (!isMobile && calendarRef.current) {
      calendarRef.current.getApi()?.gotoDate(next);
    }
  };

  const handleViewChange = (mode) => {
    setViewMode(mode);
    if (!isMobile && calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (!api) return;
      if (mode === "day") {
        api.changeView("timeGridDay");
        api.gotoDate(currentDate);
      } else if (mode === "month") {
        api.changeView("dayGridMonth");
        api.gotoDate(currentDate);
      }
    }
  };

  // Mở Modal chi tiết ca khi bấm vào thẻ ca
  const handleShiftCardClick = (shift) => {
    setSelectedEvent({
      id: shift.id,
      title: shift.title || `Ca ${shift.shiftName}`,
      isLeave: shift.isLeave || false,
      date: shift.date || shift.dateIso,
      startTime: shift.startTime,
      endTime: shift.endTime,
      shiftName: shift.shiftName,
      roleTag: shift.roleTag || shift.role,
      status: shift.status,
      reason: shift.reason,
      ...shift,
    });
  };

  const handleEventClick = (info) => {
    const props = info.event?.extendedProps || {};
    setSelectedEvent({
      id: info.event?.id,
      title: info.event?.title,
      isLeave: props.isLeave || false,
      date: props.date || toISO(info.event?.start),
      startTime: props.startTime,
      endTime: props.endTime,
      shiftName: props.shiftName || info.event?.title,
      roleTag: props.roleTag || props.role,
      status: props.status,
      reason: props.reason,
      ...props,
    });
  };

  // Nhãn khoảng thời gian hiển thị trên thanh điều khiển
  const periodLabel = useMemo(() => {
    if (viewMode === "day" && !isMobile) {
      const d = currentDate.getDate();
      const m = currentDate.getMonth() + 1;
      const y = currentDate.getFullYear();
      const dayName = VI_DAYS[currentDate.getDay()];
      return `${dayName}, ${d} thg ${m}, ${y}`;
    }
    if (viewMode === "month" && !isMobile) {
      const m = currentDate.getMonth() + 1;
      const y = currentDate.getFullYear();
      return `Tháng ${m}, ${y}`;
    }
    const refMonday = mondayOf(currentDate);
    return formatWeekRange(refMonday);
  }, [currentDate, viewMode, isMobile]);

  // ---------------------------------------------------------------------------
  // TÍNH TOÁN MA TRẬN LỊCH TUẦN BẰNG PURE HELPER buildWeekCells
  // ---------------------------------------------------------------------------
  const weekMatrix = useMemo(() => {
    return buildWeekCells(scheduleData?.myShifts || scheduleData?.shifts, employeeId);
  }, [scheduleData?.myShifts, scheduleData?.shifts, employeeId]);

  const weekStats = weekMatrix.stats;

  // ---------------------------------------------------------------------------
  // TÍNH TOÁN THANH "CA TIẾP THEO" DỰA VÀO getNow()
  // Ca đang làm hoặc ca sắp tới sớm nhất; KHÔNG BAO GIỜ hiện ca đã hoàn thành
  // ---------------------------------------------------------------------------
  const nextShiftInfo = useMemo(() => {
    const myShifts = scheduleData?.myShifts || [];
    const published = scheduleData?.published !== false;
    const now = getNow();

    if (myShifts.length === 0) {
      return { hasNext: false, published };
    }

    const sorted = [...myShifts].sort((a, b) => {
      const tA = new Date(`${a.date}T${a.startTime || "00:00"}:00`).getTime();
      const tB = new Date(`${b.date}T${b.startTime || "00:00"}:00`).getTime();
      return tA - tB;
    });

    let target = null;
    let isOngoing = false;

    for (const s of sorted) {
      const start = new Date(`${s.date}T${s.startTime || "00:00"}:00`);
      const end = new Date(`${s.date}T${s.endTime || "23:59"}:00`);
      if (now >= start && now <= end) {
        target = s;
        isOngoing = true;
        break;
      }
      if (start > now) {
        target = s;
        break;
      }
    }

    if (!target) {
      return { hasNext: false, published };
    }

    const colors = getShiftColors(target);
    const start = new Date(`${target.date}T${target.startTime || "00:00"}:00`);
    const diffMs = start.getTime() - now.getTime();

    let countdownText;
    if (isOngoing) {
      countdownText = "Đang diễn ra";
    } else if (diffMs > 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays > 0) {
        countdownText = `còn ${diffDays} ngày nữa`;
      } else if (diffHours > 0) {
        countdownText = `còn ${diffHours} giờ nữa`;
      } else {
        const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        countdownText = `còn ${diffMins} phút nữa`;
      }
    } else {
      return { hasNext: false, published };
    }

    const targetDateObj = new Date(`${target.date}T00:00:00`);
    const dayName = VI_DAYS[targetDateObj.getDay()];
    const [y, m, d] = target.date.split("-");
    const dateVn = `${d}/${m}/${y}`;

    return {
      hasNext: true,
      shift: target,
      colors,
      isOngoing,
      dayName,
      dateVn,
      shiftName: target.shiftName || colors.name,
      timeRange: `${target.startTime} – ${target.endTime}`,
      countdownText,
      published,
    };
  }, [scheduleData]);

  // ---------------------------------------------------------------------------
  // TẢI SỐ LƯỢNG YÊU CẦU ĐANG CHỜ DUYỆT (ĐỔI CA + NGHỈ PHÉP)
  // ---------------------------------------------------------------------------
  const [pendingCounts, setPendingCounts] = useState({ exchanges: 0, leaves: 0 });

  useEffect(() => {
    let active = true;
    async function fetchPending() {
      try {
        const [exRes, lvRes] = await Promise.all([
          getExchangeRequests({ employeeId }),
          getLeaveRequests({ employeeId }),
        ]);
        if (!active) return;
        const exList = Array.isArray(exRes) ? exRes : exRes?.data || [];
        const lvList = Array.isArray(lvRes) ? lvRes : lvRes?.data || [];
        const pendingEx = exList.filter(
          (r) =>
            (r.requesterId === employeeId || r.targetEmployeeId === employeeId || r.employeeId === employeeId) &&
            (r.status === "pending" || r.status === "manager_pending" || r.status === "peer_pending")
        ).length;
        const pendingLv = lvList.filter(
          (r) => (r.employeeId === employeeId || r.requesterId === employeeId) && r.status === "pending"
        ).length;
        setPendingCounts({ exchanges: pendingEx, leaves: pendingLv });
      } catch (err) {
        console.error("Lỗi tải thông tin chờ duyệt:", err);
      }
    }
    fetchPending();
    return () => {
      active = false;
    };
  }, [employeeId]);

  // ---------------------------------------------------------------------------
  // DẢI 3 THẺ KPI DỮ LIỆU THẬT (STATSTRIP) CHUẨN DESIGN SYSTEM
  // ---------------------------------------------------------------------------
  const statItems = useMemo(() => {
    return [
      {
        key: "next-shift",
        label: "Ca tiếp theo",
        value: nextShiftInfo.hasNext
          ? `Ca ${nextShiftInfo.shiftName}`
          : "Không có ca",
        badge: nextShiftInfo.isOngoing
          ? "Đang diễn ra"
          : nextShiftInfo.hasNext
            ? nextShiftInfo.countdownText
            : null,
        note: nextShiftInfo.hasNext
          ? `${nextShiftInfo.dayName}, ${nextShiftInfo.dateVn}`
          : "Nghỉ ngơi tuần này",
        dot: nextShiftInfo.colors?.dot || "#0F172A",
        icon: <Clock className="w-4 h-4 text-[#0F172A]" />,
        footer: (
          <>
            <span className="tabular-nums font-medium text-slate-700">
              {nextShiftInfo.hasNext ? nextShiftInfo.timeRange : "Chưa có ca trực"}
            </span>
            <span className="font-semibold text-[#0F172A]">
              {nextShiftInfo.hasNext ? nextShiftInfo.countdownText : "—"}
            </span>
          </>
        ),
      },
      {
        key: "week-shifts",
        label: "Tuần này",
        value: `${weekStats.shiftCount} ca`,
        badge: `${weekStats.totalHours} giờ`,
        note: "Lịch làm việc phân công",
        dot: "#2A9D8F",
        icon: <Calendar className="w-4 h-4 text-[#0F172A]" />,
        footer: (
          <>
            <span>Trạng thái:</span>
            <span className="font-semibold text-emerald-700">
              Đã áp dụng
            </span>
          </>
        ),
      },
      {
        key: "pending-requests",
        label: "Đang chờ",
        value: `${pendingCounts.exchanges + pendingCounts.leaves} yêu cầu`,
        badge: `${pendingCounts.exchanges} đổi ca · ${pendingCounts.leaves} nghỉ`,
        note: "Đơn đang xử lý",
        dot: "#E76F51",
        icon: <Briefcase className="w-4 h-4 text-[#0F172A]" />,
        footer: (
          <>
            <span>Tiến độ:</span>
            <span className="font-semibold text-amber-700">Chờ Quản lý xét duyệt</span>
          </>
        ),
      },
    ];
  }, [nextShiftInfo, weekStats, pendingCounts]);

  // Cuộn tới giờ phù hợp trong FullCalendar
  const computedScrollTime = useMemo(() => {
    const myShifts = scheduleData?.myShifts || [];
    if (myShifts.length > 0) {
      const starts = myShifts.map((s) => s.startTime).filter(Boolean).sort();
      if (starts.length > 0) {
        const h = parseInt(starts[0].split(":")[0], 10);
        const scrollH = Math.max(6, h - 1);
        return `${String(scrollH).padStart(2, "0")}:00:00`;
      }
    }
    return "06:00:00";
  }, [scheduleData]);

  // Đầu cột ngày trong FullCalendar: 2 dòng (Thứ 2 15px và 26/10 17px)
  const renderDayHeader = useCallback((headerInfo) => {
    const d = headerInfo.date;
    const dayName = VI_DAYS[d.getDay()];
    const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    const isToday = toISO(d) === toISO(getNow());

    return (
      <div className={`flex flex-col items-center justify-center py-1.5 ${isToday ? "text-[#0F172A]" : "text-slate-800"}`}>
        <span className="text-[15px] font-semibold">
          {dayName}
        </span>
        <span className="text-[17px] font-bold leading-tight mt-0.5">
          {dateStr}
        </span>
      </div>
    );
  }, []);

  // Hiển thị nội dung từng khối Ca trên FullCalendar (Chế độ Ngày và Tháng)
  const renderEventContent = useCallback((eventInfo) => {
    const props = eventInfo.event?.extendedProps || {};
    const isMonthView = eventInfo.view.type === "dayGridMonth";
    const colors = getShiftColors(props);

    if (props.isLeave) {
      return (
        <div className="flex h-full w-full items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-purple-900">
          <span className="text-[14px]">🏖️</span>
          <span className="truncate text-[13px] font-semibold">
            {eventInfo.event.title || "Nghỉ phép"}
          </span>
        </div>
      );
    }

    if (isMonthView) {
      return (
        <div
          className="flex w-full items-center gap-1.5 overflow-hidden rounded px-2 py-0.5 text-left leading-tight"
          style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}` }}
        >
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colors.dot }} />
          <span className="truncate text-[13px] font-medium text-slate-800">
            {props.shiftName || eventInfo.event.title} ({props.startTime})
          </span>
        </div>
      );
    }

    return (
      <div
        className="flex h-full w-full flex-col justify-between rounded-xl border border-slate-200/70 p-2.5 sm:p-3 text-left transition-all"
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <div>
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[16px] font-medium leading-snug"
              style={{ color: colors.text }}
            >
              {props.shiftName || eventInfo.event.title}
            </span>
            {props.status === "ongoing" && (
              <span className="rounded px-1.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Đang làm
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1 text-[15px] font-normal text-slate-700 whitespace-nowrap tabular-nums">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{props.startTime} – {props.endTime}</span>
          </div>
        </div>

        {props.roleTag && (
          <div className="mt-2 pt-1 border-t border-slate-200/60">
            <span
              className="inline-block rounded-md px-2 py-0.5 text-[13px] font-medium whitespace-nowrap"
              style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
            >
              {props.roleTag}
            </span>
          </div>
        )}
      </div>
    );
  }, []);

  // Danh sách các ca gom theo từng ngày (Dành cho hiển thị trên điện thoại theo US13)
  const mobileDaysList = useMemo(() => {
    const refMonday = mondayOf(currentDate);
    const days = [];
    const myShifts = scheduleData?.myShifts || [];
    const approvedLeaves = scheduleData?.approvedLeaves || [];

    for (let i = 0; i < 7; i++) {
      const curDate = new Date(refMonday);
      curDate.setDate(curDate.getDate() + i);
      const iso = toISO(curDate);
      const dayName = VI_DAYS[curDate.getDay()];
      const dateVn = `${String(curDate.getDate()).padStart(2, "0")}/${String(curDate.getMonth() + 1).padStart(2, "0")}`;
      const isToday = iso === toISO(getNow());

      const shiftsForDay = myShifts.filter((s) => s.date === iso);
      const leavesForDay = approvedLeaves.filter((l) => l.isoDate === iso);

      days.push({
        iso,
        dayName,
        dateVn,
        isToday,
        shifts: shiftsForDay,
        leaves: leavesForDay,
      });
    }

    return days;
  }, [currentDate, scheduleData]);

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate("/employees/shift-exchange")}
        className="gap-2 shadow-2xs cursor-pointer"
      >
        <ArrowLeftRight className="w-4 h-4 text-slate-600" />
        <span>Yêu cầu đổi ca</span>
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={() => navigate("/employees/availability")}
        className="gap-2 shadow-2xs cursor-pointer"
      >
        <CalendarClock className="w-4 h-4 text-white" />
        <span>Đăng ký rảnh/bận</span>
      </Button>
    </div>
  );

  return (
    <div className={STAFF_LAYOUT.blockGap}>
      {/* ========================================================= */}
      {/* ĐẦU TRANG: TIÊU ĐỀ + PHỤ ĐỀ NẰM TRONG 1 CARD RIÊNG        */}
      {/* ========================================================= */}
      <PageHeader
        icon="calendar"
        breadcrumb={["Lịch và ca", "Lịch của tôi"]}
        title="Lịch của tôi"
        badge={
          scheduleData && (
            <StatusBadge tone={scheduleData.published !== false ? "success" : "neutral"}>
              {scheduleData.published !== false ? "Đã áp dụng" : "Chưa áp dụng"}
            </StatusBadge>
          )
        }
        description="Xem lịch làm việc cá nhân, đăng ký ca rảnh hàng tuần và quản lý các ca trực đã phân công tại chi nhánh."
        actions={headerActions}
      />

      {/* Thông báo phản hồi */}
      {feedback && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-900"
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Lỗi tải dữ liệu */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-900"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadData(currentDate)}
            className="cursor-pointer"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Cảnh báo khi lịch tuần chưa được công bố */}
      {scheduleData && scheduleData.published === false && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] font-medium text-amber-900"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Lịch tuần này chưa được công bố. Vui lòng quay lại sau khi Quản lý ban hành chính thức.</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* KHỐI CHỈ SỐ KPI NHANH (4 CARDS) CHUẨN THIẾT KẾ MẪU        */}
      {/* ========================================================= */}
      {statItems && <StatStrip items={statItems} />}

      {/* ========================================================= */}
      {/* THẺ 1: THANH "CA TIẾP THEO"                               */}
      {/* Nền trung tính #F4F7F9, viền 1px #D9E8F5, bo góc lớn       */}
      {/* rounded-2xl, chữ navy (#0F172A), ngày giờ font-normal.    */}
      {/* ========================================================= */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-2xs transition-all text-[#0F172A]"
        style={{
          backgroundColor: NEXT_SHIFT_BAR.bg,
          borderColor: NEXT_SHIFT_BAR.border,
        }}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[14px] font-normal text-slate-700">
            Ca tiếp theo:
          </span>
          <div className="flex items-center gap-2 text-[15px] font-normal text-[#0F172A]">
            {nextShiftInfo.hasNext ? (
              <>
                <span className="font-normal">{nextShiftInfo.dayName}, {nextShiftInfo.dateVn} ·</span>
                <span className="inline-flex items-center gap-1.5 font-normal">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: nextShiftInfo.colors?.dot || "#0F172A" }}
                  />
                  <span>Ca <span className="font-medium text-[#0F172A]">{nextShiftInfo.shiftName}</span> {nextShiftInfo.timeRange}</span>
                </span>
              </>
            ) : scheduleData?.published === false ? (
              <span className="text-slate-600 font-normal">Lịch tuần này chưa được công bố</span>
            ) : (
              <span className="text-slate-600 font-normal">Bạn không có ca làm việc trong tuần này</span>
            )}
          </div>
          {nextShiftInfo.hasNext && nextShiftInfo.countdownText && (
            <span className="text-[13.5px] font-normal text-slate-600">
              ({nextShiftInfo.countdownText})
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[14.5px] font-normal text-[#0F172A]">
            Tuần này: <span className="font-normal">{weekStats.shiftCount} ca ({weekStats.totalHours}h)</span>
          </span>
          <StatusBadge tone={scheduleData?.published !== false ? "success" : "neutral"}>
            {scheduleData?.published !== false ? "Đã áp dụng" : "Chưa áp dụng"}
          </StatusBadge>
        </div>
      </div>

      {/* ========================================================= */}
      {/* THẺ 2: KHUNG LỊCH VÀ ĐIỀU KHIỂN CHÍNH                     */}
      {/* ========================================================= */}
      <div className={`${STAFF_LAYOUT.pageCard} ${STAFF_LAYOUT.pageCardInnerGap}`}>
        {/* HÀNG ĐIỀU KHIỂN LỊCH (Chữ 15px, Cao 40px, Khoảng cách rộng rãi) */}
        <CalendarToolbar
          periodLabel={periodLabel}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          viewMode={viewMode}
          onViewChange={handleViewChange}
          isMobile={isMobile}
        />

        {/* HIỂN THỊ NỘI DUNG LỊCH */}
        {loading && !scheduleData ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
            <RotateCw className="w-7 h-7 animate-spin text-slate-400" />
            <span className="text-[14px]">Đang tải dữ liệu lịch làm việc...</span>
          </div>
        ) : scheduleData && scheduleData.published === false ? (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-8 text-center text-[15px] text-amber-800">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="font-semibold text-amber-900">Lịch tuần này chưa được công bố</p>
            <p className="text-sm text-amber-700 mt-1">
              Quản lý đang xếp lịch và chưa công bố chính thức. Ca làm việc sẽ tự động hiển thị sau khi được phê duyệt ban hành.
            </p>
          </div>
        ) : !isMobile ? (
          viewMode === "week" ? (
            /* ========================================================= */
            /* MÁY TÍNH - TUẦN: BỐ CỤC HÀNG THEO CA (WeekShiftGrid)       */
            /* ========================================================= */
            <WeekShiftGrid
              days={scheduleData?.days || []}
              shifts={scheduleData?.shiftsConfig || []}
              myShifts={scheduleData?.myShifts || []}
              matrix={weekMatrix}
              approvedLeaves={scheduleData?.approvedLeaves || []}
              onShiftClick={handleShiftCardClick}
            />
          ) : (
            /* ========================================================= */
            /* MÁY TÍNH - NGÀY / THÁNG: FULLCALENDAR                     */
            /* ========================================================= */
            <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs">
              <div className="staff-calendar">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                  initialView={viewMode === "day" ? "timeGridDay" : "dayGridMonth"}
                  headerToolbar={false}
                  locales={[VI_LOCALE]}
                  locale="vi"
                  firstDay={1}
                  nowIndicator={true}
                  allDaySlot={false}
                  slotMinTime="06:00:00"
                  slotMaxTime="23:00:00"
                  slotDuration="01:00:00"
                  scrollTime={computedScrollTime}
                  scrollTimeReset={false}
                  expandRows={true}
                  stickyHeaderDates={true}
                  dayHeaderContent={renderDayHeader}
                  events={scheduleData?.calendarEvents || []}
                  eventClick={handleEventClick}
                  eventContent={renderEventContent}
                  height="70vh"
                />
              </div>
            </div>
          )
        ) : (
          /* ========================================================= */
          /* ĐIỆN THOẠI: DANH SÁCH THEO TỪNG NGÀY TRONG TUẦN (US13)     */
          /* ========================================================= */
          <div className="space-y-4">
            {mobileDaysList.map((day) => (
              <div
                key={day.iso}
                className={`rounded-2xl border p-4 transition-all ${
                  day.isToday ? "border-[#0F172A] bg-[#D9E8F5]/40 shadow-2xs" : "border-slate-200/90 bg-white"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[16px] font-bold ${day.isToday ? "text-[#0F172A]" : "text-slate-900"}`}>
                      {day.dayName}
                    </span>
                    <span className="text-[14px] font-medium text-slate-500">
                      {day.dateVn}
                    </span>
                  </div>
                  {day.isToday && (
                    <span className="rounded-full bg-[#0F172A] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-2xs">
                      Hôm nay
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2.5">
                  {day.leaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[16px]">🏖️</span>
                        <div>
                          <div className="text-[14px] font-semibold text-purple-900">
                            Nghỉ phép ({leave.shiftName || "Cả ngày"})
                          </div>
                          <div className="text-[12px] text-purple-700">
                            Lý do: {leave.reason || "Việc cá nhân"}
                          </div>
                        </div>
                      </div>
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                        Đã duyệt
                      </span>
                    </div>
                  ))}

                  {day.shifts.map((shift) => {
                    const col = getShiftColors(shift);
                    return (
                      <button
                        key={shift.id}
                        type="button"
                        onClick={() => handleShiftCardClick(shift)}
                        className="w-full text-left rounded-xl p-3 border cursor-pointer transition-all hover:shadow-xs active:scale-[0.99]"
                        style={{
                          borderLeftWidth: "4px",
                          borderLeftColor: col.border,
                          backgroundColor: col.bg,
                          borderColor: `${col.border}50`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-semibold" style={{ color: col.text }}>
                            Ca {shift.shiftName}
                          </span>
                          {shift.status === "ongoing" && (
                            <span className="rounded px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Đang làm
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-[14px] text-slate-700 tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{shift.startTime} – {shift.endTime}</span>
                        </div>

                        {shift.roleTag && (
                          <div className="mt-2">
                            <span
                              className="inline-block rounded-md px-2 py-0.5 text-[12px] font-medium"
                              style={{ backgroundColor: col.badgeBg, color: col.badgeText }}
                            >
                              {shift.roleTag}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {day.leaves.length === 0 && day.shifts.length === 0 && (
                    <p className="py-2 text-center text-[13px] text-slate-400">
                      Không có ca làm việc
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL CHI TIẾT CA LÀM VIỆC DÙNG CHUNG                    */}
      {/* ========================================================= */}
      {selectedEvent && (
        <ShiftModal
          shift={selectedEvent}
          isOpen={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          onExchange={(shift) => {
            setSelectedEvent(null);
            navigate(`/employees/shift-exchange?shiftId=${shift.id}`);
          }}
        />
      )}
    </div>
  );
}
