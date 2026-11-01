// =============================================================================
// FILE NÀY LÀM GÌ: Màn hình Đăng ký lịch rảnh / bận theo tuần (Staff)
// Loại: Page
// US: US08 (Đăng ký lịch rảnh)
// =============================================================================

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Check, X, Send, RefreshCw } from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  getMyAvailability,
  saveMyAvailability,
  subscribeAvailability,
  addDays,
  toISO,
  countAvailabilitySlots,
} from "../../../services/availabilityService.js";
import { toVN, getNow, mondayOf, startOfDay } from "../../../lib/dateUtils.js";
import { useLiveData } from "../../../lib/hooks.js";
import {
  PageCard,
  PageHeader,
  PeriodControl,
  Alert,
} from "../../../components/PageKit.jsx";
import { NoticeBar } from "../../../components/NoticeKit.jsx";
import { Button } from "../../../components/FormKit";
import { WeekShiftGrid } from "../../../components/CalendarKit.jsx";
import STAFF_LAYOUT from "../../../lib/layoutTokens.js";

import { formatSubmittedAt } from "./availabilityHelpers.js";
import { CopyConfirmModal } from "./AvailabilityModals.jsx";

export default function AvailabilityPage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId || user?.id || "NV001";

  const [weekMonday, setWeekMonday] = useState("");
  const weekMondayRef = useRef(weekMonday);
  useEffect(() => {
    weekMondayRef.current = weekMonday;
  }, [weekMonday]);

  const [data, setData] = useState(null);
  const [slots, setSlots] = useState({});
  const [initialSlots, setInitialSlots] = useState({});
  const [prevWeekData, setPrevWeekData] = useState(null);
  const [prevWeekLoading, setPrevWeekLoading] = useState(false);
  const [prevWeekError, setPrevWeekError] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((type, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const loadData = useCallback(async (targetMonday) => {
    setLoading(true);
    try {
      const res = await getMyAvailability({
        weekMonday: targetMonday,
        employeeId,
      });
      setData(res);
      setWeekMonday(res.weekMonday);
      setSlots(res.slots || {});
      setInitialSlots(res.slots || {});

      // Đọc đăng ký tuần liền trước bằng hàm getMyAvailability có sẵn trong service
      setPrevWeekLoading(true);
      setPrevWeekError(null);
      try {
        const prevMon = toISO(addDays(new Date(res.weekMonday), -7));
        const prevRes = await getMyAvailability({
          weekMonday: prevMon,
          employeeId,
        });
        setPrevWeekData(prevRes);
      } catch (err) {
        setPrevWeekError(err);
        setPrevWeekData(null);
      } finally {
        setPrevWeekLoading(false);
      }
    } catch (err) {
      setAlert({
        type: "error",
        message: err.message || "Không thể tải dữ liệu đăng ký khả năng làm việc.",
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  // Nạp tuần mặc định khi mount lần đầu
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lắng nghe sự kiện lưu dữ liệu từ các tab/hệ thống, tải lại tuần người dùng đang xem
  useEffect(() => {
    return subscribeAvailability(() => {
      if (weekMondayRef.current) {
        loadData(weekMondayRef.current);
      }
    });
  }, [loadData]);

  const isDirty = useMemo(() => {
    const keys = Object.keys(slots);
    if (keys.length !== Object.keys(initialSlots).length) return true;
    return keys.some((k) => slots[k] !== initialSlots[k]);
  }, [slots, initialSlots]);

  useLiveData(() => {
    // Chỉ tự động tải lại nếu người dùng chưa bắt đầu chỉnh sửa dở dang
    if (!isDirty && weekMondayRef.current) {
      loadData(weekMondayRef.current);
    }
  }, [isDirty, loadData]);

  const handlePrevWeek = () => {
    if (!weekMonday) return;
    const prev = toISO(addDays(new Date(weekMonday), -7));
    loadData(prev);
  };

  const handleNextWeek = () => {
    if (!weekMonday) return;
    const next = toISO(addDays(new Date(weekMonday), 7));
    loadData(next);
  };

  // Xác định tuần kế tiếp theo lịch chuẩn getNow() - tuần mở đăng ký
  const openRegistrationMonday = useMemo(() => {
    const curMon = mondayOf(startOfDay(getNow()));
    const nextMon = addDays(curMon, 7);
    return toISO(nextMon);
  }, []);
  const isOpenRegistrationWeek = weekMonday === openRegistrationMonday;

  // Tính số ca rảnh / bận / chưa chọn bằng cùng hàm đếm countAvailabilitySlots với ma trận Manager
  const totalExpectedSlots = useMemo(() => {
    const daysCount = data?.days?.length || 7;
    const shiftsCount = data?.shifts?.length || 3;
    return daysCount * shiftsCount;
  }, [data]);

  const stats = useMemo(
    () => countAvailabilitySlots(slots, totalExpectedSlots),
    [slots, totalExpectedSlots]
  );

  const hasPrevWeekData = useMemo(() => {
    if (!prevWeekData?.slots) return false;
    return Object.values(prevWeekData.slots).some((v) => v === "available" || v === "busy");
  }, [prevWeekData]);

  // Bấm ô lần 1 thành Rảnh, lần 2 thành Bận, lần 3 về Chưa chọn
  const handleToggleSlot = (dayIndex, shiftName) => {
    if (data?.isLocked) return;
    const key = `${dayIndex}_${shiftName}`;
    const current = slots[key];
    setSlots((prev) => {
      const next = { ...prev };
      if (!current) {
        next[key] = "available";
      } else if (current === "available") {
        next[key] = "busy";
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const handleSetDay = (dayIndex, type = "available") => {
    if (data?.isLocked || !data?.shifts) return;
    setSlots((prev) => {
      const next = { ...prev };
      data.shifts.forEach((shift) => {
        next[`${dayIndex}_${shift.name}`] = type;
      });
      return next;
    });
  };

  const handleSetAll = (type) => {
    if (data?.isLocked || !data?.days || !data?.shifts) return;
    const next = {};
    data.days.forEach((day) => {
      data.shifts.forEach((shift) => {
        next[`${day.dayIndex}_${shift.name}`] = type;
      });
    });
    setSlots(next);
  };

  // Áp dụng sao chép lịch tuần trước vào giao diện (chỉ thay đổi UI state)
  const applyCopyPreviousWeek = useCallback(() => {
    if (!prevWeekData?.slots || !data?.days || !data?.shifts) return;
    const nextSlots = { ...slots };
    data.days.forEach((day) => {
      data.shifts.forEach((shift) => {
        const key = `${day.dayIndex}_${shift.name}`;
        const prevVal = prevWeekData.slots[key];
        // Ca không còn trong danh mục ca hiện tại thì bỏ qua; ô nào tuần trước chưa chọn thì để chưa chọn
        if (prevVal === "available" || prevVal === "busy") {
          nextSlots[key] = prevVal;
        } else {
          delete nextSlots[key];
        }
      });
    });
    setSlots(nextSlots);

    const prevMonIso = prevWeekData.weekMonday;
    const prevSunIso = toISO(addDays(new Date(prevMonIso), 6));
    const labelShort = `${toVN(prevMonIso).slice(0, 5)} – ${toVN(prevSunIso).slice(0, 5)}`;
    showToast("success", `Đã sao chép từ tuần ${labelShort}. Nhớ bấm Gửi đăng ký.`);
  }, [data, prevWeekData, slots, showToast]);

  const handleCopyPreviousWeek = () => {
    if (data?.isLocked || submitting || loading || prevWeekLoading) return;
    if (prevWeekError) {
      showToast("error", "Lỗi đọc dữ liệu tuần trước. Bấm để thử lại.");
      return;
    }
    if (!hasPrevWeekData) {
      showToast("info", "Chưa có đăng ký tuần trước để sao chép.");
      return;
    }
    if (isDirty) {
      setConfirmModalOpen(true);
    } else {
      applyCopyPreviousWeek();
    }
  };

  const handleSubmit = async () => {
    if (data?.isLocked) return;
    setSubmitting(true);
    try {
      const res = await saveMyAvailability({
        weekMonday,
        employeeId,
        slots,
        expectedVersion: data?.version,
      });
      if (res.ok) {
        setInitialSlots({ ...slots });
        showToast("success", "Gửi đăng ký lịch rảnh/bận thành công! Dữ liệu đã được cập nhật cho Quản lý xếp lịch.");
        await loadData(weekMonday);
      }
    } catch (err) {
      if (err?.code === "CONFLICT") {
        showToast("error", "Dữ liệu vừa được cập nhật từ thiết bị hoặc tab khác. Đang tải lại...");
        await loadData(weekMonday);
      } else if (err?.code === "DEADLINE_EXCEEDED" || err?.code === "INVALID_STATE") {
        showToast("error", err.message || "Đã quá hạn chót đăng ký lịch rảnh. Không thể gửi thay đổi.");
        await loadData(weekMonday);
      } else {
        showToast("error", err.message || "Không thể lưu lịch rảnh. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const todayIso = toISO(getNow());

  // Tính toán thời gian hạn chót và số giờ còn lại
  const deadlineInfo = useMemo(() => {
    if (!data?.deadlineAt) return null;
    const now = getNow();
    const d = new Date(data.deadlineAt);
    const diffMs = d.getTime() - now.getTime();
    const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const pad = (n) => String(n).padStart(2, "0");
    const formatted = `23:59 Thứ Sáu, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    return {
      formatted,
      hoursLeft,
      isExpired: data.isLocked || diffMs <= 0,
    };
  }, [data]);

  return (
    <div className={STAFF_LAYOUT.blockGap}>
      {/* ===== VÙNG 1: PAGE HEADER & THAO TÁC ===== */}
      <PageHeader
        icon="calendarClock"
        breadcrumb={["Lịch và ca", "Đăng ký rảnh/bận"]}
        title="Đăng ký rảnh/bận"
        description="Chọn các ca bạn có thể làm việc (Rảnh) hoặc bận (Bận) trong tuần tới để phục vụ việc xếp lịch tự động."
      />

      {/* ===== VÙNG 2: THANH THÔNG BÁO HẠN CHÓT ===== */}
      {deadlineInfo && (
        deadlineInfo.isExpired ? (
          <NoticeBar
            label="Trạng thái đăng ký"
            message="Đã quá hạn đăng ký · Tuần này đã khóa chỉnh sửa (Chỉ xem)"
            badge="Chỉ xem"
            badgeTone="error"
            rightContent={
              data?.submittedAt && (
                <span className="text-[13px] text-slate-500 font-normal tabular-nums">
                  {formatSubmittedAt(data.submittedAt)}
                </span>
              )
            }
          />
        ) : (
          <NoticeBar
            label="Hạn chót gửi đăng ký"
            message={`${deadlineInfo.formatted} · còn ${deadlineInfo.hoursLeft} giờ`}
            badge={data?.submittedAt ? "Đang mở" : "Chưa đăng ký"}
            badgeTone={data?.submittedAt ? "success" : "warning"}
            rightContent={
              data?.submittedAt && (
                <span className="text-[13px] text-slate-500 font-normal tabular-nums">
                  {formatSubmittedAt(data.submittedAt)}
                </span>
              )
            }
          />
        )
      )}

      {/* Thông báo Alert kết quả / lỗi hệ thống nếu có */}
      {alert && (
        <Alert
          tone={alert.type === "error" ? "error" : alert.type === "success" ? "success" : "info"}
          action={
            alert.type === "error" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAlert(null);
                  loadData(weekMonday);
                }}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Thử lại
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => setAlert(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            )
          }
        >
          <span>{alert.message}</span>
        </Alert>
      )}

      {/* TOAST THÔNG BÁO TỨC THÌ (thay thế toast cũ, không xếp chồng) */}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[14px] shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-sky-200 bg-sky-50 text-sky-900"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : toast.type === "error" ? (
            <X className="h-4 w-4 text-rose-600 shrink-0" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 3. MỘT PageCard duy nhất chứa toàn bộ nội dung thao tác */}
      <PageCard>
        <div className="space-y-4">
          {/* HÀNG CÔNG CỤ: Bộ chọn tuần bên trái, các nút cao 40px bên phải */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <PeriodControl
                label={data?.weekLabel || "Đang tải tuần..."}
                onPrev={handlePrevWeek}
                onNext={handleNextWeek}
                prevDisabled={loading}
                nextDisabled={loading}
              />
              {isOpenRegistrationWeek && !data?.isLocked && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700 border border-emerald-200/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Tuần đang mở đăng ký
                </span>
              )}
              {data?.isLocked && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600 border border-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Chỉ xem
                </span>
              )}
            </div>

            {/* Hàng nút bên phải thanh công cụ trong card, cao 40px:
                "Tất cả rảnh", "Tất cả bận", "Sao chép tuần trước", "Gửi đăng ký" */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="md"
                variant="outline"
                className="h-10 text-[13.5px]"
                onClick={() => handleSetAll("available")}
                disabled={data?.isLocked || loading}
              >
                Tất cả rảnh
              </Button>
              <Button
                size="md"
                variant="outline"
                className="h-10 text-[13.5px]"
                onClick={() => handleSetAll("busy")}
                disabled={data?.isLocked || loading}
              >
                Tất cả bận
              </Button>
              <Button
                size="md"
                variant="outline"
                className="h-10 text-[13.5px]"
                onClick={handleCopyPreviousWeek}
                loading={prevWeekLoading}
                disabled={!hasPrevWeekData || data?.isLocked || submitting || loading || prevWeekLoading}
                title={!hasPrevWeekData ? "Chưa có đăng ký tuần trước" : undefined}
              >
                Sao chép tuần trước
              </Button>
              {isDirty && (
                <span className="text-[12.5px] font-medium text-amber-700 whitespace-nowrap">
                  Chưa lưu thay đổi
                </span>
              )}
              <Button
                size="md"
                variant="primary"
                className="h-10 text-[13.5px]"
                onClick={handleSubmit}
                loading={submitting}
                disabled={data?.isLocked || loading || !isDirty}
                icon={<Send className="w-4 h-4" />}
              >
                Gửi đăng ký
              </Button>
            </div>
          </div>

          {/* DÒNG TỔNG KẾT DƯỚI THANH CÔNG CỤ (13px xám, không in đậm, không khung) */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-500 font-normal">
            <div>
              Ca rảnh: <span className="font-normal text-slate-800 tabular-nums">{stats.available}</span> · Ca bận: <span className="font-normal text-slate-800 tabular-nums">{stats.busy}</span> · Chưa chọn: <span className="font-normal text-slate-800 tabular-nums">{stats.unselected}</span>
            </div>
            <div className="text-[12.5px] text-slate-400 font-normal">
              Bấm vào từng ô để chuyển đổi giữa Rảnh (✓), Bận (✕) và Chưa chọn
            </div>
          </div>

          {/* TRẠNG THÁI ĐANG TẢI */}
          {loading && !data ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-[#0F172A]" />
              <span className="text-[14px]">Đang tải dữ liệu đăng ký...</span>
            </div>
          ) : (
            <>
              {/* LƯỚI ĐĂNG KÝ TRÊN DESKTOP: Dùng CHUNG khung WeekShiftGrid với Lịch của tôi */}
              <div className="hidden md:block">
                <WeekShiftGrid
                  days={data?.days || []}
                  shifts={data?.shifts || []}
                  showLegend={false}
                  renderDayAction={(day) => (
                    !data?.isLocked && (
                      <button
                        type="button"
                        onClick={() => handleSetDay(day.dayIndex, "available")}
                        className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title={`Đặt cả ngày ${day.dayName} rảnh`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                  renderCell={({ day, shift }) => {
                    const key = `${day.dayIndex}_${shift.name}`;
                    const val = slots[key];
                    const isAvail = val === "available";
                    const isBusy = val === "busy";
                    const ariaLabel = `${day.dayName} · Ca ${shift.name} · ${
                      isAvail ? "Rảnh" : isBusy ? "Bận" : "Chưa chọn"
                    }`;

                    return (
                      <button
                        type="button"
                        onClick={() => handleToggleSlot(day.dayIndex, shift.name)}
                        disabled={data?.isLocked || loading}
                        aria-label={ariaLabel}
                        title={
                          data?.isLocked
                            ? `${ariaLabel} (Đã khóa)`
                            : `${ariaLabel} - Bấm để đổi: Rảnh → Bận → Chưa chọn`
                        }
                        className={`w-full py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] ${
                          isAvail
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs font-semibold"
                            : isBusy
                            ? "border border-rose-200 bg-rose-50 text-rose-600 shadow-2xs font-semibold"
                            : "border border-dashed border-[#CBE3F0] bg-white text-slate-400 font-normal shadow-2xs"
                        } ${
                          data?.isLocked
                            ? "cursor-not-allowed opacity-75"
                            : "cursor-pointer hover:border-slate-300 hover:shadow-xs active:scale-[0.98]"
                        }`}
                      >
                        {isAvail ? (
                          <>
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Rảnh</span>
                          </>
                        ) : isBusy ? (
                          <>
                            <X className="w-4 h-4 stroke-[2.5]" />
                            <span>Bận</span>
                          </>
                        ) : (
                          <span className="text-slate-400 font-normal">Chưa chọn</span>
                        )}
                      </button>
                    );
                  }}
                />
              </div>

              {/* DANH SÁCH THEO NGÀY TRÊN MOBILE (md:hidden) */}
              <div className="md:hidden space-y-3">
                {data?.days?.map((day) => {
                  const isToday = day.dateIso === todayIso;
                  return (
                    <div
                      key={day.dayIndex}
                      className={`rounded-xl border p-3 transition-all ${
                        isToday ? "border-[#D9E8F5] bg-[#F0F6FB]/50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-slate-900">{day.dayName}</span>
                          <span className="text-[12px] font-normal text-slate-500 tabular-nums">{day.dateVn}</span>
                          {isToday && (
                            <span className="rounded-md bg-[#D9E8F5] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#0F172A]">
                              Hôm nay
                            </span>
                          )}
                        </div>
                        {!data?.isLocked && (
                          <button
                            type="button"
                            onClick={() => handleSetDay(day.dayIndex, "available")}
                            className="text-[11.5px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-0.5 rounded transition"
                            title={`Đặt cả ngày ${day.dayName} rảnh`}
                          >
                            + Cả ngày rảnh
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {data?.shifts?.map((shift) => {
                          const key = `${day.dayIndex}_${shift.name}`;
                          const val = slots[key];
                          const isAvail = val === "available";
                          const isBusy = val === "busy";
                          const ariaLabel = `${day.dayName} · Ca ${shift.name} · ${
                            isAvail ? "Rảnh" : isBusy ? "Bận" : "Chưa chọn"
                          }`;

                          return (
                            <button
                              key={shift.id || shift.name}
                              type="button"
                              onClick={() => handleToggleSlot(day.dayIndex, shift.name)}
                              disabled={data?.isLocked || loading}
                              aria-label={ariaLabel}
                              title={ariaLabel}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] ${
                                isAvail
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold"
                                  : isBusy
                                  ? "border-rose-200 bg-rose-50 text-rose-800 font-semibold"
                                  : "border-dashed border-[#CBE3F0] bg-white text-slate-400 font-normal"
                              } ${
                                data?.isLocked
                                  ? "cursor-not-allowed opacity-75"
                                  : "cursor-pointer hover:shadow-xs active:scale-[0.99]"
                              }`}
                            >
                              <div>
                                <div className="text-[13px] font-semibold leading-tight">
                                  Ca {shift.name}
                                </div>
                                <div className="text-[11px] font-normal text-slate-500 tabular-nums">
                                  {shift.startTime || shift.start} – {shift.endTime || shift.end}
                                </div>
                              </div>
                              <div
                                className={`flex h-7 px-2.5 items-center justify-center gap-1 rounded-lg border text-[12px] font-semibold ${
                                  isAvail
                                    ? "border-emerald-300 bg-emerald-100/60 text-emerald-700"
                                    : isBusy
                                    ? "border-rose-300 bg-rose-100/60 text-rose-700"
                                    : "border-dashed border-[#CBE3F0] bg-white text-slate-400"
                                }`}
                              >
                                {isAvail ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                    <span>Rảnh</span>
                                  </>
                                ) : isBusy ? (
                                  <>
                                    <X className="h-3.5 w-3.5 stroke-[2.5]" />
                                    <span>Bận</span>
                                  </>
                                ) : (
                                  "Chưa chọn"
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </PageCard>

      {/* ===== VÙNG 3: HỘP THOẠI XÁC NHẬN SAO CHÉP ===== */}
      <CopyConfirmModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          setConfirmModalOpen(false);
          applyCopyPreviousWeek();
        }}
      />
    </div>
  );
}
