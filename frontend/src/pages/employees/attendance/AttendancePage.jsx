// =============================================================================
// FILE NÀY LÀM GÌ: Màn hình Chấm công Check-in / Check-out & Lịch sử (Staff)
// Loại: Page
// US: US24 (Check-in/Check-out), US25/US26 (Lịch sử & Giải trình)
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  LoaderCircle,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getMySchedule } from "../../../services/scheduleService";
import {
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceConfig,
  subscribeAttendance,
  submitExplanation,
  listMyExplanations,
  cancelExplanation,
  getAttendanceRecordHistory,
} from "../../../services/attendanceService";
import { checkLocationWithinRadius } from "../../../lib/geoUtils";
import { PageCard, PageHeader, StatStrip } from "../../../components/PageKit";
import { Button } from "../../../components/FormKit";
import { StatusTabs } from "../../../components/PageKit";
import { Table, StatusBadge } from "../../../components/TableKit";
import { getShiftColors } from "../../../lib/shiftColors.js";
import STAFF_LAYOUT from "../../../lib/layoutTokens.js";
import { getNow, isDemoGpsActive } from "../../../lib/dateUtils.js";
import { getAttendanceStatusInfo, isEligibleForExplanation } from "../../../lib/statusLabels.js";

import {
  TIME_TABS,
  STATUS_MAP,
  toIsoDate,
  getMonday,
  formatClock,
  formatDate,
  formatDuration,
  stripAccents,
} from "./attendanceHelpers";
import {
  CreateExplanationModal,
  ExplanationDetailModal,
  RecordDetailModal,
  ConfirmAttendanceModal,
} from "./AttendanceModals";

export default function AttendancePage() {
  const { user } = useAuth();
  const currentUid = user?.employeeId || user?.id;

  const [now, setNow] = useState(() => getNow());
  const [shifts, setShifts] = useState([]);
  const [records, setRecords] = useState([]);
  const [myExplanations, setMyExplanations] = useState([]);
  const [config, setConfig] = useState({
    store_latitude: 10.7769,
    store_longitude: 106.7009,
    allowed_radius_meters: 200,
    check_in_window_minutes: 15,
  });
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [locationStatus, setLocationStatus] = useState("checking");
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationDistance, setLocationDistance] = useState(null);
  const [locationError, setLocationError] = useState("");

  // Tab khối lịch sử: "history" (Lịch sử chấm công) | "explanations" (Giải trình của tôi)
  const [historySectionTab, setHistorySectionTab] = useState("history");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecordDetail, setSelectedRecordDetail] = useState(null);
  const [selectedRecordHistory, setSelectedRecordHistory] = useState([]);

  // Modal tạo giải trình & xem chi tiết giải trình
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [explanationForm, setExplanationForm] = useState({
    shiftId: "",
    proposedIn: "",
    proposedOut: "",
    reason: "",
  });
  const [explanationError, setExplanationError] = useState("");
  const [submittingExplanation, setSubmittingExplanation] = useState(false);
  const [selectedExplanationDetail, setSelectedExplanationDetail] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const toastTimerRef = useRef(null);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const showToast = useCallback((type, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), type, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Định vị sơ bộ với 5 trạng thái chuẩn và hỗ trợ cờ demo ?gps=store
  const requestLocation = useCallback(() => {
    // Nếu có cờ ?gps=store: đặt toạ độ trùng cửa hàng
    if (isDemoGpsActive()) {
      const cfg = configRef.current;
      const coords = {
        latitude: cfg.store_latitude ?? 10.7769,
        longitude: cfg.store_longitude ?? 106.7009,
        accuracy: 5,
      };
      setLocationCoords(coords);
      setLocationDistance(0);
      setLocationStatus("in_area");
      setLocationError("");
      return;
    }

    const cfg = configRef.current;
    if (cfg?.store_latitude == null || cfg?.store_longitude == null) {
      setLocationStatus("no_store_config");
      setLocationError("Chưa cấu hình vị trí cửa hàng.");
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus("denied");
      setLocationError("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    setLocationStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setLocationCoords(coords);
        const geo = checkLocationWithinRadius(coords, configRef.current);
        if (geo.distance_meters != null && !isNaN(geo.distance_meters)) {
          setLocationDistance(geo.distance_meters);
          if (geo.allowed) {
            setLocationStatus("in_area");
            setLocationError("");
          } else {
            setLocationStatus("out_of_area");
            setLocationError(`Bạn đang ở ngoài khu vực cho phép (cách ${geo.distance_meters} m, bán kính ${geo.allowed_radius_meters} m).`);
          }
        } else {
          setLocationStatus("no_store_config");
          setLocationError("Chưa cấu hình vị trí cửa hàng.");
        }
      },
      (err) => {
        setLocationStatus("denied");
        setLocationCoords(null);
        setLocationDistance(null);
        if (err.code === 1) {
          setLocationError("Chưa cấp quyền vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt để chấm công.");
        } else {
          setLocationError("Không lấy được vị trí hiện tại. Hãy kiểm tra GPS hoặc kết nối mạng.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  // Cập nhật khoảng cách khi vị trí hoặc config thay đổi
  useEffect(() => {
    if (isDemoGpsActive()) {
      setLocationDistance(0);
      setLocationStatus("in_area");
      setLocationError("");
      return;
    }
    if (locationCoords) {
      const geo = checkLocationWithinRadius(locationCoords, config);
      if (geo.distance_meters != null && !isNaN(geo.distance_meters)) {
        setLocationDistance(geo.distance_meters);
        if (geo.allowed) {
          setLocationStatus("in_area");
          setLocationError("");
        } else {
          setLocationStatus("out_of_area");
          setLocationError(`Bạn đang ở ngoài khu vực cho phép (cách ${geo.distance_meters} m, bán kính ${geo.allowed_radius_meters} m).`);
        }
      } else {
        setLocationStatus("no_store_config");
        setLocationError("Chưa cấu hình vị trí cửa hàng.");
      }
    }
  }, [config, locationCoords]);

  // Tải dữ liệu ca hôm nay, lịch sử và giải trình
  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const currentDate = getNow();
      const todayIso = toIsoDate(currentDate);
      const mondayIso = toIsoDate(getMonday(currentDate));
      const [schedRes, attRes, cfgRes] = await Promise.all([
        getMySchedule({ week_start: mondayIso, view: "official", employeeId: currentUid, currentUserId: currentUid }),
        getAttendance(),
        getAttendanceConfig(),
      ]);

      if (cfgRes) {
        setConfig(cfgRes);
        configRef.current = cfgRes;
      }

      // Ca Official hôm nay
      const rawShifts = schedRes?.shifts || schedRes?.data?.shifts || [];
      const todayShifts = rawShifts
        .filter((s) => toIsoDate(s.date) === todayIso && s.is_official !== false)
        .map((s) => ({
          id: s.id,
          date: toIsoDate(s.date),
          shiftName: s.shift_name || s.shiftName || "Ca làm việc",
          startTime: (s.start_time || s.startTime || "00:00").slice(0, 5),
          endTime: (s.end_time || s.endTime || "00:00").slice(0, 5),
          roleTag: s.role_tag || s.roleTag || "Nhân viên",
        }));
      setShifts(todayShifts);

      // Lịch sử chấm công của chính mình
      const rawRecords = Array.isArray(attRes) ? attRes : attRes?.records || attRes?.data || [];
      const myRecords = rawRecords.filter((r) => {
        const rEmail = r.employee_email || r.employee?.email;
        const rId = r.employee_id || r.employeeId || r.employee?.id;
        if (rEmail && user?.email && rEmail.toLowerCase() === user.email.toLowerCase()) return true;
        if (rId && currentUid && String(rId) === String(currentUid)) return true;
        return false;
      });
      setRecords(myRecords);

      // Giải trình của chính mình
      const exps = await listMyExplanations();
      setMyExplanations(Array.isArray(exps) ? exps : []);
    } catch (err) {
      showToast("error", err.message || "Không thể tải dữ liệu chấm công.");
    } finally {
      setLoading(false);
    }
  }, [currentUid, user?.email, showToast]);

  useEffect(() => {
    loadData(true);
    requestLocation();
    const clockTimer = setInterval(() => {
      setNow((prev) => new Date(prev.getTime() + 1000));
    }, 1000);
    const unsub = subscribeAttendance(() => loadData(false));
    return () => {
      clearInterval(clockTimer);
      if (typeof unsub === "function") unsub();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [loadData, requestLocation]);

  useEffect(() => {
    if (shifts.length > 0 && !shifts.some((s) => String(s.id) === String(selectedShiftId))) {
      setSelectedShiftId(String(shifts[0].id));
    }
  }, [shifts, selectedShiftId]);

  const selectedShift = useMemo(
    () => shifts.find((s) => String(s.id) === String(selectedShiftId)) || shifts[0] || null,
    [shifts, selectedShiftId],
  );

  const selectedShiftRecord = useMemo(
    () =>
      selectedShift
        ? records.find(
            (r) =>
              String(r.shift_id || r.shift?.id) === String(selectedShift.id) ||
              ((r.iso === selectedShift.date || r.date === selectedShift.date) &&
                String(r.shift?.shift_name || r.shiftName || "")
                  .toLowerCase()
                  .includes(String(selectedShift.shiftName || "").toLowerCase())),
          )
        : null,
    [records, selectedShift],
  );

  const shiftColors = useMemo(
    () => getShiftColors(selectedShift?.shiftName),
    [selectedShift],
  );

  // Kiểm tra khung giờ check-in
  const windowCheck = useMemo(() => {
    if (!selectedShift) return { canCheckIn: false, note: "" };
    const windowMinutes = config.check_in_window_minutes || 15;
    const [startH, startM] = selectedShift.startTime.split(":").map(Number);
    const [endH, endM] = selectedShift.endTime.split(":").map(Number);
    const startObj = new Date(now);
    startObj.setHours(startH, startM, 0, 0);
    const endObj = new Date(now);
    endObj.setHours(endH, endM, 0, 0);
    if (endObj <= startObj) endObj.setDate(endObj.getDate() + 1);

    const openTime = new Date(startObj.getTime() - windowMinutes * 60000);
    const openTimeStr = openTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    if (now < openTime) {
      return { canCheckIn: false, note: `Check-in mở lúc ${openTimeStr} (${windowMinutes} phút trước ca).` };
    }
    if (now > endObj) {
      return { canCheckIn: false, note: "Ca làm việc đã kết thúc." };
    }
    return { canCheckIn: true, note: "Đang trong khung giờ cho phép check-in." };
  }, [selectedShift, config.check_in_window_minutes, now]);

  const isCheckedIn = Boolean(selectedShiftRecord?.check_in_at);
  const isCheckedOut = Boolean(selectedShiftRecord?.check_out_at);
  const isOutOfArea = locationStatus === "out_of_area";

  const buttonAction = useMemo(() => {
    if (!selectedShift) return { label: "Không có ca", disabled: true, mode: "none" };
    if (isCheckedOut) {
      const dur = selectedShiftRecord.total_working_minutes
        ? formatDuration(selectedShiftRecord.total_working_minutes)
        : "";
      return { label: `Đã hoàn tất ca (${dur})`, disabled: true, mode: "done" };
    }
    if (isCheckedIn) {
      return {
        label: `Check-out ca ${selectedShift.shiftName.toLowerCase()} (${selectedShift.endTime})`,
        disabled: isOutOfArea,
        mode: "checkout",
      };
    }
    return {
      label: `Check-in ca ${selectedShift.shiftName.toLowerCase()} (${selectedShift.startTime})`,
      disabled: !windowCheck.canCheckIn || isOutOfArea,
      mode: "checkin",
    };
  }, [selectedShift, isCheckedIn, isCheckedOut, selectedShiftRecord, windowCheck, isOutOfArea]);

  // Thực hiện Check-in / Check-out
  // BACKEND: server kiểm tra giờ + GPS (chống giả mạo vị trí)
  const handleAction = async () => {
    if (buttonAction.disabled || busy || !selectedShift) return;
    setBusy(true);
    try {
      let posCoords = locationCoords;
      if (!posCoords && navigator.geolocation) {
        try {
          posCoords = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(
              (p) => res({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
              rej,
              { enableHighAccuracy: true, timeout: 8000 },
            );
          });
          setLocationCoords(posCoords);
        } catch {
          // ignore
        }
      }

      const payload = {
        shift_id: selectedShift.id,
        latitude: posCoords?.latitude,
        longitude: posCoords?.longitude,
        accuracy: posCoords?.accuracy,
        location: posCoords,
      };

      const res = buttonAction.mode === "checkout" ? await checkOut(payload) : await checkIn(payload);

      if (res && res.ok === false) {
        if (res.code === "OUT_OF_AREA") {
          showToast("error", "Bạn đang ở ngoài khu vực cho phép.");
        } else if (res.code === "OUT_OF_TIME_WINDOW") {
          showToast("error", res.message || windowCheck.note);
        } else if (res.code === "NO_SHIFT") {
          showToast("error", "Hôm nay bạn không có ca làm việc.");
        } else {
          showToast("error", res.message || "Không thể thực hiện chấm công.");
        }
        return;
      }

      const sTime = res?.serverTime || formatClock(getNow());
      const wMinutes = res?.workedMinutes;
      await loadData(false);

      if (buttonAction.mode === "checkout") {
        setConfirmModal({
          title: "Check-out thành công",
          message: `Check-out thành công lúc ${sTime}.`,
          duration: wMinutes ? formatDuration(wMinutes) : null,
        });
        showToast("success", `Check-out thành công lúc ${sTime}.`);
      } else {
        setConfirmModal({
          title: "Check-in thành công",
          message: `Check-in thành công lúc ${sTime}.`,
        });
        showToast("success", `Check-in thành công lúc ${sTime}.`);
      }
    } catch (err) {
      showToast("error", err.message || "Lỗi kết nối khi chấm công.");
    } finally {
      setBusy(false);
    }
  };

  // Ca đủ điều kiện giải trình (Đi trễ, Về sớm, Vắng mặt, Thiếu giờ ra)
  const eligibleShiftsForExplanation = useMemo(() => {
    return records.filter((r) => {
      if (!isEligibleForExplanation(r.status)) return false;
      if (r.locked) return false;
      const safeExps = Array.isArray(myExplanations) ? myExplanations : [];
      const hasPending = safeExps.some(
        (e) => (e.shiftId === r.shift_id || e.attendanceId === r.id) && e.status === "pending",
      );
      return !hasPending;
    });
  }, [records, myExplanations]);

  // Mở modal tạo giải trình
  const handleOpenCreateExplanation = (preselectedRow = null) => {
    const target = preselectedRow || eligibleShiftsForExplanation[0] || null;
    if (target) {
      const rawSt = String(target.status || "").toLowerCase();
      const isAbsent = rawSt === "absent" || (!target.checkIn && !target.check_in_at);
      const preIn = target.check_in_at ? formatClock(target.check_in_at) : (target.shift?.start_time || "08:00");
      const preOut = target.shift?.end_time || "16:30";
      setExplanationForm({
        shiftId: target.id || target.shift_id,
        proposedIn: isAbsent ? "08:00" : preIn,
        proposedOut: preOut,
        reason: "",
      });
    } else {
      setExplanationForm({ shiftId: "", proposedIn: "08:00", proposedOut: "16:30", reason: "" });
    }
    setExplanationError("");
    setCreateModalOpen(true);
  };

  // Gửi giải trình
  const handleSubmitExplanation = async () => {
    if (!explanationForm.shiftId) {
      setExplanationError("Vui lòng chọn ca cần giải trình.");
      return;
    }
    if (!explanationForm.reason.trim()) {
      setExplanationError("Vui lòng nhập lý do giải trình.");
      return;
    }
    setSubmittingExplanation(true);
    setExplanationError("");
    try {
      const res = submitExplanation({
        shiftId: explanationForm.shiftId,
        proposedIn: explanationForm.proposedIn,
        proposedOut: explanationForm.proposedOut,
        reason: explanationForm.reason.trim(),
      });
      if (res && res.ok === false) {
        setExplanationError(res.message || "Không thể gửi giải trình.");
        return;
      }
      showToast("success", "Đã gửi giải trình, chờ Quản lý duyệt.");
      setCreateModalOpen(false);
      await loadData(false);
      setHistorySectionTab("explanations");
    } catch (err) {
      setExplanationError(err.message || "Lỗi khi gửi giải trình.");
    } finally {
      setSubmittingExplanation(false);
    }
  };

  // Hủy giải trình
  const handleCancelExplanation = (expId) => {
    const res = cancelExplanation(expId);
    if (res && res.ok === false) {
      showToast("error", res.message || "Không thể hủy giải trình.");
      return;
    }
    showToast("success", "Đã hủy đơn giải trình.");
    loadData(false);
  };

  // Mở modal chi tiết bản ghi kèm lịch sử điều chỉnh (US26)
  const handleOpenRecordDetail = (row) => {
    setSelectedRecordDetail(row);
    if (row.id) {
      const hist = getAttendanceRecordHistory(row.id);
      setSelectedRecordHistory(hist);
    } else {
      setSelectedRecordHistory([]);
    }
  };

  // Bộ lọc lịch sử (tuân thủ getNow() thay cho new Date())
  const filteredRecords = useMemo(() => {
    const today = getNow();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const weekMonday = getMonday(today);
    const nextSunday = new Date(weekMonday);
    nextSunday.setDate(weekMonday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);

    return records.filter((r) => {
      const rDate = new Date(String(r.shift?.date || r.check_in_at || r.iso).slice(0, 10) + "T00:00:00");
      if (activeTab === "month") {
        if (rDate.getMonth() !== currentMonth || rDate.getFullYear() !== currentYear) return false;
      } else if (activeTab === "week") {
        if (rDate < weekMonday || rDate > nextSunday) return false;
      }

      if (searchQuery.trim()) {
        const q = stripAccents(searchQuery);
        const shiftName = stripAccents(r.shift?.shift_name || r.shiftName || "");
        const dateStr = formatDate(r.shift?.date || r.check_in_at || r.iso);
        const statusText = stripAccents(STATUS_MAP[r.status]?.label || r.status || "");
        if (!shiftName.includes(q) && !stripAccents(dateStr).includes(q) && !statusText.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, activeTab, searchQuery]);

  // ---------------------------------------------------------------------------
  // 1. DẢI 4 THẺ THỐNG KÊ (STATSTRIP) ĐẾM TỪ ĐÚNG DANH SÁCH HIỂN THỊ
  // ---------------------------------------------------------------------------
  const statItems = useMemo(() => {
    let totalMinutes = 0;
    let countedShifts = 0;
    let completedShifts = 0;
    let onTimeShifts = 0;
    let lateCount = 0;

    filteredRecords.forEach((r) => {
      const mins = Number(r.total_working_minutes) || Number(r.workedMinutes) || Number(r.actualMin) || 0;
      if (mins > 0) {
        totalMinutes += mins;
        countedShifts += 1;
      }
      const s = String(r.status || "").toLowerCase().replace(/[\s-]+/g, "_");
      if (["completed", "checked_out", "on_time", "late", "early_departure", "missing_checkout"].includes(s) || (r.check_out_at && r.check_in_at)) {
        completedShifts += 1;
        if (s === "on_time" || s === "completed" || (s === "checked_out" && !r.late_minutes && !r.early_minutes)) {
          onTimeShifts += 1;
        }
        if (s === "late" || (r.late_minutes && r.late_minutes > 0) || r.lateMin > 0) {
          lateCount += 1;
        }
      }
    });

    const totalHours = (totalMinutes / 60).toFixed(1);
    const latePct = completedShifts > 0 ? Math.round((lateCount / completedShifts) * 100) : 0;
    const safeExps = Array.isArray(myExplanations) ? myExplanations : [];
    const pendingExplanations = safeExps.filter((e) => e.status === "pending");
    const approvedExplanations = safeExps.filter((e) => e.status === "approved");

    const tabLabel = activeTab === "month" ? "tháng này" : activeTab === "week" ? "tuần này" : "đang xem";

    return [
      {
        key: "total-hours",
        label: `Tổng giờ làm (${tabLabel})`,
        value: `${totalHours} giờ`,
        note: `Tính trên ${filteredRecords.length} ca`,
        dot: "#2B9FCF",
        icon: <Clock className="w-4 h-4 text-[#0F172A]" />,
        footer: (
          <>
            <span>Số ca đã tính:</span>
            <span className="font-semibold text-[#0F172A] tabular-nums">{countedShifts} ca</span>
          </>
        ),
      },
      {
        key: "completed-shifts",
        label: "Số ca đã làm",
        value: `${completedShifts} ca`,
        note: "Ca đã kết thúc",
        dot: "#2A9D8F",
        icon: <CheckCircle2 className="w-4 h-4 text-[#0F172A]" />,
        footer: (
          <>
            <span>Đúng giờ:</span>
            <span className="font-semibold text-emerald-700 tabular-nums">{onTimeShifts} ca</span>
          </>
        ),
      },
      {
        key: "late-count",
        label: "Số lần đi trễ",
        value: `${lateCount} lần`,
        note: `Tỷ lệ ${latePct}%`,
        dot: "#E76F51",
        icon: <AlertCircle className="w-4 h-4 text-[#0F172A]" />,
        footer: (
          <>
            <span>Tỷ lệ:</span>
            <span className="font-semibold text-[#0F172A] tabular-nums">{latePct}%</span>
          </>
        ),
      },
      {
        key: "pending-explanations",
        label: "Giải trình đang chờ",
        value: `${pendingExplanations.length} đơn`,
        note: "Đang chờ Quản lý",
        dot: "#F4A261",
        icon: <FileText className="w-4 h-4 text-[#0F172A]" />,
        footer: (
          <>
            <span>Đã duyệt:</span>
            <span className="font-semibold text-emerald-700 tabular-nums">{approvedExplanations.length} đơn</span>
          </>
        ),
      },
    ];
  }, [filteredRecords, myExplanations, activeTab]);

  // Bộ lọc danh sách giải trình
  const filteredExplanations = useMemo(() => {
    const safeExps = Array.isArray(myExplanations) ? myExplanations : [];
    if (!searchQuery.trim()) return safeExps;
    const q = stripAccents(searchQuery);
    return safeExps.filter((e) => {
      const dateStr = formatDate(e.date);
      const name = stripAccents(e.shiftName || "");
      const reason = stripAccents(e.reason || "");
      return name.includes(q) || stripAccents(dateStr).includes(q) || reason.includes(q);
    });
  }, [myExplanations, searchQuery]);

  // Cột bảng Lịch sử chấm công (kèm nút Giải trình nếu đủ điều kiện)
  const columns = useMemo(
    () => [
      {
        key: "date",
        label: "Ngày",
        width: "20%",
        align: "left",
        render: (row) => (
          <span className="font-semibold text-slate-900 whitespace-nowrap">
            {formatDate(row.shift?.date || row.check_in_at)}
          </span>
        ),
      },
      {
        key: "shift",
        label: "Ca làm việc",
        width: "22%",
        align: "left",
        render: (row) => {
          const sName = row.shift?.shift_name || row.shiftName || "Ca làm việc";
          const sColors = getShiftColors(sName);
          const sStart = row.shift?.start_time || row.startTime || "--:--";
          const sEnd = row.shift?.end_time || row.endTime || "--:--";
          return (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: sColors.border }} />
              <div>
                <span className="font-medium text-slate-800">{sName}</span>
                <span className="block text-[12px] text-slate-500 tabular-nums">
                  {sStart} – {sEnd}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "check_in",
        label: "Giờ vào",
        width: "15%",
        align: "left",
        render: (row) => (
          <div>
            <span className="font-medium text-slate-800 tabular-nums">{formatClock(row.check_in_at)}</span>
            {row.late_minutes > 0 && (
              <span className="block text-[11px] font-medium text-amber-600">Trễ {row.late_minutes} phút</span>
            )}
          </div>
        ),
      },
      {
        key: "check_out",
        label: "Giờ ra",
        width: "15%",
        align: "left",
        render: (row) => (
          <div>
            <span className="font-medium text-slate-800 tabular-nums">
              {row.check_out_at ? formatClock(row.check_out_at) : "—"}
            </span>
            {row.early_minutes > 0 && (
              <span className="block text-[11px] font-medium text-amber-600">Sớm {row.early_minutes} phút</span>
            )}
          </div>
        ),
      },
      {
        key: "duration",
        label: "Thời lượng",
        width: "12%",
        align: "left",
        render: (row) => {
          const mins = row.total_working_minutes;
          if (mins == null) return <span className="text-slate-400">—</span>;
          const hrs = (mins / 60).toFixed(1);
          return <span className="font-medium text-slate-800 tabular-nums">{hrs} giờ</span>;
        },
      },
      {
        key: "status",
        label: "Trạng thái",
        width: "16%",
        align: "center",
        render: (row) => {
          const st = getAttendanceStatusInfo(row.status);
          const rawSt = String(row.status || "").toLowerCase().replace(/[\s-]+/g, "_");
          const isMissingCheckout = rawSt === "missing_checkout";
          return (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1">
                <StatusBadge status={row.status} fixed>{st.label}</StatusBadge>
                {row.adjusted && (
                  <span className="rounded bg-amber-50 px-1 py-0.5 text-[10.5px] font-medium text-amber-700 border border-amber-200">
                    Đã chỉnh sửa
                  </span>
                )}
              </div>
              {isMissingCheckout && (
                <span className="text-[10.5px] text-rose-600 font-normal leading-tight text-center">
                  Chưa được tính giờ cho đến khi Quản lý điều chỉnh
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        label: "",
        width: "10%",
        align: "right",
        render: (row) => {
          const isEligible = eligibleShiftsForExplanation.some((e) => e.id === row.id);
          if (!isEligible) return null;
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCreateExplanation(row);
              }}
              className="text-[12px] h-7 px-2.5 whitespace-nowrap cursor-pointer inline-flex items-center justify-center"
            >
              Giải trình
            </Button>
          );
        },
      },
    ],
    [eligibleShiftsForExplanation], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Cột bảng Giải trình của tôi
  const explanationColumns = useMemo(
    () => [
      {
        key: "shift",
        label: "Ca giải trình",
        width: "24%",
        align: "left",
        render: (row) => (
          <div>
            <span className="font-semibold text-slate-900 block">{formatDate(row.date)}</span>
            <span className="text-[12.5px] text-slate-600">Ca {row.shiftName} ({row.scheduled})</span>
          </div>
        ),
      },
      {
        key: "issueType",
        label: "Sự cố",
        width: "16%",
        align: "left",
        render: (row) => (
          <span className="font-medium text-slate-800">
            {row.issueType === "missing_checkin" ? "Quên check-in" : "Quên check-out"}
          </span>
        ),
      },
      {
        key: "proposed",
        label: "Giờ đề nghị",
        width: "16%",
        align: "left",
        render: (row) => (
          <span className="tabular-nums font-semibold text-[#0F172A]">
            {row.proposedIn} – {row.proposedOut}
          </span>
        ),
      },
      {
        key: "reason",
        label: "Lý do",
        width: "22%",
        align: "left",
        render: (row) => (
          <p className="line-clamp-2 text-[13px] text-slate-700" title={row.reason}>
            {row.reason}
          </p>
        ),
      },
      {
        key: "createdAt",
        label: "Thời gian gửi",
        width: "14%",
        align: "left",
        render: (row) => (
          <span className="text-[12.5px] text-slate-500 tabular-nums">
            {new Date(row.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}{" "}
            {new Date(row.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ),
      },
      {
        key: "status",
        label: "Trạng thái",
        width: "18%",
        align: "center",
        render: (row) => {
          const tone =
            row.status === "approved"
              ? "success"
              : row.status === "rejected"
              ? "error"
              : row.status === "cancelled"
              ? "neutral"
              : "warning";
          const label =
            row.status === "approved"
              ? "Đã duyệt"
              : row.status === "rejected"
              ? "Bị từ chối"
              : row.status === "cancelled"
              ? "Đã hủy"
              : "Chờ duyệt";
          return (
            <div className="flex flex-col items-center gap-0.5">
              <StatusBadge tone={tone}>{label}</StatusBadge>
              {row.status === "rejected" && row.rejectReason && (
                <span className="text-[11px] text-rose-600 line-clamp-2 text-center" title={row.rejectReason}>
                  Lý do: {row.rejectReason}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "action",
        label: "",
        width: "10%",
        align: "right",
        render: (row) => {
          if (row.status !== "pending") return null;
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCancelExplanation(row.id);
              }}
              className="text-[12px] h-7 px-2 text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              Hủy
            </Button>
          );
        },
      },
    ],
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const totalSummary = useMemo(() => {
    let totalMinutes = 0;
    filteredRecords.forEach((r) => {
      totalMinutes += Number(r.total_working_minutes) || 0;
    });
    return {
      count: filteredRecords.length,
      hours: (totalMinutes / 60).toFixed(1),
    };
  }, [filteredRecords]);

  // Tìm ca đang chọn trong modal tạo giải trình để suy ra loại sự cố
  const selectedModalShift = useMemo(() => {
    return eligibleShiftsForExplanation.find((s) => (s.id || s.shift_id) === explanationForm.shiftId) || null;
  }, [eligibleShiftsForExplanation, explanationForm.shiftId]);

  const modalIssueType = useMemo(() => {
    if (!selectedModalShift) return "Quên check-out";
    const rawSt = String(selectedModalShift.status || "").toLowerCase();
    return rawSt === "absent" || (!selectedModalShift.checkIn && !selectedModalShift.check_in_at)
      ? "Quên check-in"
      : "Quên check-out";
  }, [selectedModalShift]);

  return (
    <div className={STAFF_LAYOUT.blockGap}>
      {/* ===== VÙNG 1: TIÊU ĐỀ & NÚT THAO TÁC ===== */}
      <PageHeader
        breadcrumb={["Cá nhân", "Chấm công"]}
        icon="clipboardCheck"
        title="Chấm công"
        description="Chấm công vào, ra theo ca được giao và xem lịch sử giờ làm của bạn."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => handleOpenCreateExplanation()}
              disabled={loading || busy}
            >
              Gửi giải trình
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />}
              onClick={() => {
                loadData(true);
                requestLocation();
              }}
              disabled={loading || busy}
            >
              Làm mới
            </Button>
          </div>
        }
      />

      {/* TOAST THÔNG BÁO TỨC THÌ */}
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
            className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            aria-label="Đóng thông báo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ===== VÙNG 2: THỐNG KÊ (STATSTRIP) ===== */}
      {statItems && <StatStrip items={statItems} />}

      {/* ===== VÙNG 3: BÀN CHẤM CÔNG HÔM NAY ===== */}
      <PageCard className="min-w-0">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#CBE3F0] text-[#0F172A]">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[16px] font-bold text-[#0F172A]">Bàn chấm công trực tiếp</h2>
                <p className="text-[13px] text-slate-500">Ghi nhận giờ vào và ra ca làm việc qua định vị cửa hàng.</p>
              </div>
            </div>
            {selectedShift && (
              <StatusBadge
                tone={
                  isCheckedOut
                    ? "neutral"
                    : isCheckedIn
                    ? "info"
                    : windowCheck.canCheckIn
                    ? "warning"
                    : "neutral"
                }
              >
                {isCheckedOut
                  ? "Đã hoàn tất"
                  : isCheckedIn
                  ? "Đang trong ca"
                  : windowCheck.canCheckIn
                  ? "Sẵn sàng check-in"
                  : "Chưa đến giờ"}
              </StatusBadge>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-[14px] text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin text-[#0F172A]" /> Đang tải dữ liệu ca...
            </div>
          ) : shifts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <Calendar className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 font-semibold text-slate-700 text-[15px]">Hôm nay bạn không có ca làm việc</p>
              <p className="mt-0.5 text-[13px] text-slate-500">Chỉ những ca Official được phân công mới cần chấm công.</p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {/* CỘT TRÁI: ĐỒNG HỒ & THẺ CA */}
              <div className="space-y-3.5">
                <div className="rounded-xl border border-slate-200/90 bg-[#F8FAFC] p-4 text-center">
                  <p className="text-[12.5px] font-medium text-slate-500 capitalize">
                    {now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                  </p>
                  <p className="mt-0.5 text-[32px] font-bold text-[#0F172A] tabular-nums tracking-tight">
                    {now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                </div>

                {shifts.length > 1 && (
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-1">Chọn ca cần chấm công:</label>
                    <select
                      value={selectedShiftId}
                      onChange={(e) => setSelectedShiftId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13.5px] font-medium text-slate-800 outline-none focus:border-[#0F172A]"
                    >
                      {shifts.map((s) => (
                        <option key={s.id} value={s.id}>
                          Ca {s.shiftName} ({s.startTime} – {s.endTime}) · {s.roleTag}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedShift && (
                  <div
                    className="rounded-xl p-4 border"
                    style={{
                      borderLeft: `4px solid ${shiftColors.border}`,
                      backgroundColor: shiftColors.bg,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[12px] font-semibold text-slate-500">CA ĐƯỢC PHÂN CÔNG HÔM NAY</span>
                        <h3 className="text-[17px] font-bold text-slate-900 mt-0.5">Ca {selectedShift.shiftName}</h3>
                        <p className="text-[13px] font-medium text-slate-700">{selectedShift.roleTag}</p>
                      </div>
                      <span className="rounded-md bg-white/90 px-2.5 py-1 text-[13px] font-semibold text-slate-800 border border-slate-200/60 tabular-nums">
                        {selectedShift.startTime} – {selectedShift.endTime}
                      </span>
                    </div>

                    {selectedShiftRecord && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-4 text-[12.5px] text-slate-700">
                        <span>
                          Check-in: <strong className="text-slate-900">{formatClock(selectedShiftRecord.check_in_at)}</strong>
                        </span>
                        {selectedShiftRecord.check_out_at && (
                          <span>
                            Check-out: <strong className="text-slate-900">{formatClock(selectedShiftRecord.check_out_at)}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: TRẠNG THÁI VỊ TRÍ & NÚT LỚN DUY NHẤT */}
              <div className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-200/90 bg-white p-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#D9E8F5] bg-[#F4F7F9] p-3 text-[13px] text-[#0F172A]">
                    <MapPin className="h-4 w-4 text-[#0F172A] shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">
                          {locationStatus === "checking"
                            ? "Đang lấy vị trí..."
                            : locationStatus === "no_store_config"
                            ? "Chưa cấu hình vị trí cửa hàng"
                            : locationStatus === "denied"
                            ? "Chưa cấp quyền vị trí"
                            : locationStatus === "in_area"
                            ? `Trong khu vực cho phép ${locationDistance != null ? `(cách ${locationDistance} m)` : ""}`
                            : locationStatus === "out_of_area" && locationDistance != null
                            ? `Ngoài khu vực cho phép (cách ${locationDistance} m, bán kính ${config.allowed_radius_meters || 200} m)`
                            : "Đang lấy vị trí..."}
                        </p>
                        <button
                          type="button"
                          onClick={requestLocation}
                          className="text-[12px] font-medium text-[#0F172A] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                          title="Lấy lại vị trí GPS"
                        >
                          <RefreshCw className="h-3 w-3" /> Lấy lại vị trí
                        </button>
                      </div>
                      {locationStatus === "denied" ? (
                        <p className="text-[12px] text-amber-800 leading-normal bg-amber-50 p-2 rounded-lg border border-amber-200">
                          {locationError || "Chưa cấp quyền vị trí."} Vui lòng cho phép quyền vị trí trong cài đặt trình duyệt để thực hiện chấm công.
                        </p>
                      ) : locationError ? (
                        <p className="text-[12px] text-rose-600 leading-normal">{locationError}</p>
                      ) : null}
                      <p className="text-[11.5px] text-slate-500">
                        Bán kính hợp lệ: {config.allowed_radius_meters || 200} m quanh cửa hàng.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[12.5px] text-slate-500 px-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Hệ thống chỉ gửi vị trí khi bạn bấm chấm công để xác minh.</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-12 text-[15px] font-semibold flex items-center justify-center gap-2"
                    disabled={buttonAction.disabled || busy}
                    onClick={handleAction}
                  >
                    {busy ? (
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    ) : buttonAction.mode === "checkout" ? (
                      <LogOut className="h-5 w-5" />
                    ) : buttonAction.mode === "checkin" ? (
                      <LogIn className="h-5 w-5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    {busy ? "Đang xử lý…" : buttonAction.label}
                  </Button>

                  <p className="text-center text-[12px] text-slate-500">
                    {isOutOfArea
                      ? "Bạn đang ở ngoài khu vực bán kính cho phép của cửa hàng."
                      : buttonAction.mode === "checkin" && !windowCheck.canCheckIn
                      ? windowCheck.note
                      : buttonAction.mode === "checkin"
                      ? "Bấm để ghi nhận giờ vào ca của bạn."
                      : buttonAction.mode === "checkout"
                      ? "Bấm để ghi nhận giờ ra và hoàn thành ca."
                      : "Ca làm việc đã được chấm công đầy đủ."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageCard>

      {/* ===== VÙNG 4: LỊCH SỬ CHẤM CÔNG & GIẢI TRÌNH ===== */}
      <PageCard className="min-w-0 space-y-4">
        {/* TABS CHUYỂN ĐỔI: Lịch sử chấm công | Giải trình của tôi */}
        <div className="border-b border-slate-100 pb-3">
          <StatusTabs
            tabs={[
              { id: "history", label: "Lịch sử chấm công" },
              { id: "explanations", label: `Giải trình của tôi (${Array.isArray(myExplanations) ? myExplanations.length : 0})` },
            ]}
            value={historySectionTab}
            onChange={setHistorySectionTab}
          />
        </div>

        {/* BẢNG 1: LỊCH SỬ CHẤM CÔNG */}
        {historySectionTab === "history" && (
          <div className="space-y-3">
            {/* Thanh lọc theo thời gian & Ô tìm kiếm */}
            <div className="space-y-3 min-w-0 w-full">
              <div className="w-full min-w-0 overflow-x-auto pb-1">
                <StatusTabs tabs={TIME_TABS} value={activeTab} onChange={setActiveTab} />
              </div>
              <div className="w-full min-w-0 pt-1 border-t border-slate-100">
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo ca, ngày, trạng thái..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-[13.5px] outline-none focus:border-[#0F172A]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-[14px] text-slate-500">
                Chưa có lịch sử chấm công phù hợp.
              </div>
            ) : (
              <div className="space-y-3">
                <Table
                  variant="clean"
                  columns={columns}
                  rows={filteredRecords}
                  onRowClick={(row) => handleOpenRecordDetail(row)}
                  minWidth={740}
                  rowAriaLabel={(r) => `Xem chi tiết chấm công ca ${r.shift?.shift_name || r.shiftName}`}
                />
                <div className="flex flex-wrap items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-[13.5px] font-semibold text-slate-800">
                  <span>Tổng cộng {totalSummary.count} ca:</span>
                  <span className="tabular-nums text-[#0F172A]">{totalSummary.hours} giờ công</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BẢNG 2: GIẢI TRÌNH CỦA TÔI */}
        {historySectionTab === "explanations" && (
          <div className="space-y-3">
            <div className="w-full min-w-0">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm giải trình theo ca, ngày, lý do..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-[13.5px] outline-none focus:border-[#0F172A]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredExplanations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-[14px] text-slate-500">
                Chưa có đơn giải trình chấm công nào.
              </div>
            ) : (
              <Table
                variant="clean"
                columns={explanationColumns}
                rows={filteredExplanations}
                onRowClick={(row) => setSelectedExplanationDetail(row)}
                minWidth={740}
                rowAriaLabel={(r) => `Xem chi tiết giải trình ca ${r.shiftName}`}
              />
            )}
          </div>
        )}
      </PageCard>

      {/* ===== VÙNG 5: HỘP THOẠI GIẢI TRÌNH & CHI TIẾT BẢN GHI ===== */}
      <CreateExplanationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        submitting={submittingExplanation}
        form={explanationForm}
        setForm={setExplanationForm}
        eligibleShifts={eligibleShiftsForExplanation}
        modalIssueType={modalIssueType}
        error={explanationError}
        onSubmit={handleSubmitExplanation}
      />

      <ExplanationDetailModal
        detail={selectedExplanationDetail}
        onClose={() => setSelectedExplanationDetail(null)}
      />

      <RecordDetailModal
        record={selectedRecordDetail}
        history={selectedRecordHistory}
        onClose={() => setSelectedRecordDetail(null)}
      />

      <ConfirmAttendanceModal
        data={confirmModal}
        onClose={() => setConfirmModal(null)}
      />
    </div>
  );
}
