/**
 * FILE NÀY LÀM GÌ: Quản lý và tạo yêu cầu đổi ca làm việc của nhân viên | Loại: Giao diện Staff | US: US15, US16, US17
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  LoaderCircle,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { getMySchedule } from "../../../services/scheduleService.js";
import {
  cancelExchangeRequest,
  getExchangeCandidates,
  getExchangeRequests,
  respondExchange,
  sendExchangeRequest,
  subscribeShiftExchange,
} from "../../../services/shiftExchangeService.js";
import { PageHeader, PageCard, SearchInput } from "../../../components/PageKit.jsx";
import { StatusTabs } from "../../../components/PageKit";
import { Table, Avatar, StatusBadge, EmptyState } from "../../../components/TableKit";
import { Button } from "../../../components/FormKit";
import { getShiftColors } from "../../../lib/shiftColors.js";
import STAFF_LAYOUT from "../../../lib/layoutTokens.js";
import { getNow } from "../../../lib/dateUtils.js";
import { matchesSearch } from "../../../lib/searchUtils.js";

import {
  STATUS_LABELS,
  STATUS_TONES,
  requestStatus,
  mondayOf,
  formatDate,
  formatShiftName,
  shiftFromRequest,
  sentAt,
} from "./shiftExchangeHelpers";
import {
  CreateExchangeModal,
  DeclineExchangeModal,
  CancelExchangeModal,
  ExchangeDetailModal,
} from "./ShiftExchangeModals";

function localIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateTime(date, time) {
  const [hour = 0, minute = 0] = String(time ?? "00:00").slice(0, 5).split(":").map(Number);
  const value = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function timeText(value) {
  if (!value) return "--:--";
  const match = String(value).match(/(?:T|\s)?(\d{2}:\d{2})/);
  if (match) return match[1];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function officialShifts(payload) {
  const body = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  const schedule = body?.schedule && !Array.isArray(body.schedule) ? { ...body, ...body.schedule } : body;
  const published = schedule?.official_published ?? schedule?.is_official_published ?? schedule?.isOfficialPublished ?? schedule?.is_published;
  if (published === false || ["0", "false", "no"].includes(String(published).toLowerCase())) return [];
  const values = Array.isArray(schedule) ? schedule : schedule?.shifts ?? schedule?.events ?? schedule?.schedule_items ?? [];
  return values
    .filter((shift) => {
      const official = shift.is_official ?? shift.isOfficial;
      const type = String(shift.schedule_type ?? shift.type ?? "").toLowerCase();
      return official !== false && !["0", "false", "draft", "unofficial", "proposed"].includes(String(official).toLowerCase())
        && !["draft", "unofficial", "proposed", "pending"].includes(type);
    })
    .map((shift, index) => {
      const date = String(shift.date ?? shift.shift_date ?? shift.work_date ?? shift.start_at ?? shift.starts_at ?? shift.start_time ?? "").slice(0, 10);
      const startTime = timeText(shift.start_time ?? shift.startTime ?? shift.starts_at ?? shift.start_at);
      const endTime = timeText(shift.end_time ?? shift.endTime ?? shift.ends_at ?? shift.end_at);
      const status = String(shift.status ?? shift.request_status ?? "").toLowerCase();
      const start = dateTime(date, startTime);
      const rawRole = shift.role_tag ?? shift.roleTag ?? shift.role?.name ?? shift.required_role?.name ?? "Chưa xác định";
      const roleTag = Array.isArray(rawRole)
        ? rawRole.map((role) => typeof role === "object" ? role.name ?? role.label : role).filter(Boolean).join(", ")
        : typeof rawRole === "object"
          ? rawRole.name ?? rawRole.label ?? "Chưa xác định"
          : rawRole;
      return {
        id: shift.id ?? shift.schedule_shift_id ?? `${date}-${startTime}-${index}`,
        date,
        shiftName: shift.shift_name ?? shift.shiftName ?? shift.name ?? "Ca làm việc",
        startTime,
        endTime,
        roleTag,
        startDateTime: start,
        status,
      };
    })
    .filter((shift) => shift.date && shift.startDateTime > getNow() && !/pending_(exchange|leave)|waiting/.test(shift.status))
    .sort((a, b) => a.startDateTime - b.startDateTime);
}

function unwrapArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.candidates)) return value.candidates;
  if (Array.isArray(value?.requests)) return value.requests;
  return [];
}

function shiftTimeRange(shift) {
  if (!shift) return "--:-- – --:--";
  if (shift.time && String(shift.time).includes("-")) {
    return String(shift.time).replace("-", "–");
  }
  const start = timeText(shift.startTime ?? shift.start_time ?? shift.starts_at);
  const end = timeText(shift.end_time ?? shift.endTime ?? shift.ends_at);
  return `${start} – ${end}`;
}

function errorText(error) {
  return error?.response?.data?.message ?? error?.message ?? "Không thể thực hiện thao tác. Vui lòng thử lại.";
}

function normalizeRole(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isCandidateEligible(candidate, shift) {
  const eligible = candidate.eligible ?? candidate.is_eligible ?? candidate.isEligible;
  const status = String(candidate.status ?? "").toLowerCase();
  const active = candidate.active ?? candidate.is_active ?? candidate.isActive ?? (status ? status === "active" || status === "đang làm việc" : undefined);
  const roles = candidate.roles || [candidate.role_tag ?? candidate.roleTag ?? candidate.role?.name ?? candidate.role].filter(Boolean);
  const requiredRole = shift?.roleTag ?? shift?.role_tag ?? shift?.role;
  const hasMatchingRole = !requiredRole || roles.some((r) => normalizeRole(r) === normalizeRole(requiredRole));
  const disabledValue = (value) => value === false || ["false", "0", "no", "inactive", "nghỉ việc"].includes(String(value).toLowerCase());
  return !disabledValue(eligible) && !disabledValue(active) && hasMatchingRole;
}

export default function ShiftExchangePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [shifts, setShifts] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState(searchParams.get("shiftId") ?? "");
  const [candidates, setCandidates] = useState([]);
  const [candidateId, setCandidateId] = useState("");
  const [note, setNote] = useState("");
  const [requests, setRequests] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [sending, setSending] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(() => Boolean(searchParams.get("shiftId")));
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [detailRequest, setDetailRequest] = useState(null);

  const [feedback, setFeedback] = useState(null);
  const [loadError, setLoadError] = useState("");

  const selectedShift = shifts.find((shift) => String(shift.id) === String(selectedShiftId));
  const eligibleCandidates = candidates.filter((candidate) => isCandidateEligible(candidate, selectedShift));
  const queryShiftId = searchParams.get("shiftId");

  const chosenCandidate = useMemo(
    () => candidates.find((candidate) => String(candidate.id) === String(candidateId)),
    [candidateId, candidates],
  );


  const loadRequests = useCallback(async () => {
    const response = await getExchangeRequests();
    const body = response?.data && !Array.isArray(response.data) ? response.data : response;
    const rows = unwrapArray(body);
    const email = user?.email;
    const uid = user?.employeeId || user?.id;

    setRequests({
      sent: unwrapArray(body?.sent ?? body?.outgoing ?? body?.sent_requests ?? body?.data?.sent)
        .concat(rows.length && !body?.sent && !body?.outgoing && !body?.sent_requests ? rows.filter((request) => String(request.sender_id ?? request.sender?.id ?? request.requesterId ?? "") === String(uid ?? "") || (email && (request.sender_email ?? request.sender?.email) === email)) : []),
      received: unwrapArray(body?.received ?? body?.incoming ?? body?.received_requests ?? body?.data?.received)
        .concat(rows.length && !body?.received && !body?.incoming && !body?.received_requests ? rows.filter((request) => String(request.recipient_id ?? request.recipient?.id ?? request.targetEmployeeId ?? request.receiver?.id ?? "") === String(uid ?? "") || (email && (request.recipient_email ?? request.recipient?.email ?? request.receiver?.email) === email)) : []),
    });
  }, [user]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const monday = mondayOf(getNow());
        const weeks = Array.from({ length: 5 }, (_, index) => {
          const date = new Date(monday);
          date.setDate(date.getDate() + index * 7);
          return localIsoDate(date);
        });
        const schedules = await Promise.all(weeks.map((weekStart) => getMySchedule({ week_start: weekStart, view: "official" })));
        if (!alive) return;
        const upcoming = schedules.flatMap(officialShifts);
        const uniqueShifts = [...new Map(upcoming.map((shift) => [String(shift.id), shift])).values()];
        setShifts(uniqueShifts);
        if (queryShiftId && uniqueShifts.some((shift) => String(shift.id) === queryShiftId)) {
          setSelectedShiftId(queryShiftId);
          setIsCreateModalOpen(true);
        }
        await loadRequests();
      } catch (error) {
        if (alive) setLoadError(errorText(error));
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [loadRequests, queryShiftId]);

  useEffect(() => {
    const refreshRequests = () => loadRequests().catch((error) => setLoadError(errorText(error)));
    const timer = window.setInterval(refreshRequests, 30000);
    window.addEventListener("focus", refreshRequests);
    const unsub = subscribeShiftExchange(refreshRequests);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshRequests);
      if (typeof unsub === "function") unsub();
    };
  }, [loadRequests]);

  useEffect(() => {
    let alive = true;
    if (!selectedShift) {
      setCandidates([]);
      setCandidateId("");
      return undefined;
    }
    const curUid = user?.employeeId || user?.id;
    getExchangeCandidates(selectedShift, curUid)
      .then((response) => {
        if (!alive) return;
        const list = unwrapArray(response?.data ?? response);
        setCandidates(list);
      })
      .catch((error) => {
        if (alive) setFeedback({ type: "error", text: errorText(error) });
      })
      .finally(() => { if (alive) setLoadingCandidates(false); });
    return () => { alive = false; };
  }, [selectedShift, user?.employeeId, user?.id]);

  const chooseShift = (value) => {
    setSelectedShiftId(value);
    setFeedback(null);
    if (value) setSearchParams({ shiftId: value });
    else setSearchParams({});
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!selectedShift || !candidateId) {
      setFeedback({ type: "error", text: "Vui lòng chọn ca và đồng nghiệp nhận ca." });
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      await sendExchangeRequest({
        shift: selectedShift,
        shift_id: selectedShift.id,
        recipient_id: candidateId,
        targetEmployeeId: candidateId,
        note: note.trim(),
        reason: note.trim(),
      });
      await loadRequests();
      setNote("");
      setCandidateId("");
      setSelectedShiftId("");
      setSearchParams({});
      setIsCreateModalOpen(false);
      setFeedback({ type: "success", text: "Đã gửi yêu cầu đổi ca. Trạng thái: Chờ đồng nghiệp." });
    } catch (error) {
      setFeedback({ type: "error", text: errorText(error) });
    } finally {
      setSending(false);
    }
  };

  const handleAccept = useCallback(async (request) => {
    setBusyId(String(request.id));
    setFeedback(null);
    try {
      await respondExchange(request.id, { action: "accept" });
      await loadRequests();
      setFeedback({ type: "success", text: "Đã chấp nhận. Yêu cầu đang chuyển Quản lý duyệt." });
    } catch (error) {
      setFeedback({ type: "error", text: errorText(error) });
    } finally {
      setBusyId("");
    }
  }, [loadRequests]);

  const confirmDecline = async () => {
    if (!declineTarget) return;
    setBusyId(String(declineTarget.id));
    setFeedback(null);
    try {
      await respondExchange(declineTarget.id, { action: "decline", reason: declineReason.trim() });
      await loadRequests();
      setDeclineTarget(null);
      setDeclineReason("");
      setFeedback({ type: "success", text: "Đã từ chối yêu cầu đổi ca." });
    } catch (error) {
      setFeedback({ type: "error", text: errorText(error) });
    } finally {
      setBusyId("");
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setBusyId(String(cancelTarget.id));
    setFeedback(null);
    try {
      await cancelExchangeRequest(cancelTarget.id);
      await loadRequests();
      setCancelTarget(null);
      setFeedback({ type: "success", text: "Đã hủy yêu cầu đổi ca." });
    } catch (error) {
      setFeedback({ type: "error", text: errorText(error) });
    } finally {
      setBusyId("");
    }
  };

  // Combine and deduplicate
  const allList = useMemo(() => {
    const map = new Map();
    requests.received.forEach((r) => map.set(String(r.id), { ...r, _direction: "received" }));
    requests.sent.forEach((r) => {
      if (!map.has(String(r.id))) {
        map.set(String(r.id), { ...r, _direction: "sent" });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.sent_at || a.created_at || a.createdAt || 0).getTime();
      const timeB = new Date(b.sent_at || b.created_at || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [requests.received, requests.sent]);

  // Đồng bộ thông tin yêu cầu đổi ca đang xem chi tiết
  useEffect(() => {
    if (!detailRequest) return;
    const current = allList.find((r) => String(r.id) === String(detailRequest.id));
    if (!current && allList.length > 0) {
      setDetailRequest(null);
      setFeedback({ type: "error", text: "Không còn thông tin yêu cầu đổi ca này." });
    } else if (current) {
      setDetailRequest(current);
    }
  }, [allList, detailRequest]);

  // Tab Filtering
  const filteredRequests = useMemo(() => {
    let list = allList;
    if (activeTab === "received") {
      list = allList.filter((r) => r._direction === "received");
    } else if (activeTab === "sent") {
      list = allList.filter((r) => r._direction === "sent");
    } else if (activeTab === "history") {
      list = allList.filter((r) => ["approved", "rejected", "declined", "cancelled", "expired"].includes(requestStatus(r)));
    }

    if (searchQuery.trim()) {
      list = list.filter((r) => {
        const shift = shiftFromRequest(r);
        return matchesSearch(searchQuery, [
          r.sender_name,
          r.requesterName,
          r.recipient_name,
          r.targetEmployeeName,
          r.note,
          r.reason,
          shift?.shiftName,
          shift?.name,
          shift?.roleTag,
          shift?.date,
        ]);
      });
    }

    return list;
  }, [allList, activeTab, searchQuery]);

  const tabsConfig = [
    { id: "all", label: "Tất cả yêu cầu" },
    { id: "received", label: "Yêu cầu đến" },
    { id: "sent", label: "Yêu cầu của tôi" },
    { id: "history", label: "Lịch sử đã xong" },
  ];

  const tabCounts = {
    all: allList.length,
    received: requests.received.length,
    sent: requests.sent.length,
    history: allList.filter((r) => ["approved", "rejected", "declined", "cancelled", "expired"].includes(requestStatus(r))).length,
  };

  const currentUserId = user?.employeeId || user?.id || "";
  const currentUserEmail = user?.email || "";

  const columns = useMemo(() => [
    {
      key: "role",
      label: "Vai trò của bạn",
      width: "12%",
      align: "left",
      render: (req) => {
        const senderId = req.sender_id ?? req.sender?.id ?? req.requesterId;
        const isOutgoing =
          String(senderId ?? "") === String(currentUserId) ||
          (Boolean(currentUserEmail) && (req.sender_email ?? req.sender?.email) === currentUserEmail);
        return isOutgoing ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 uppercase tracking-wider whitespace-nowrap">
            <ArrowUpRight className="h-3 w-3" /> Người gửi
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 uppercase tracking-wider whitespace-nowrap">
            <ArrowDownLeft className="h-3 w-3" /> Người nhận
          </span>
        );
      },
    },
    {
      key: "giveShift",
      label: "Ca cho đi",
      width: "18%",
      align: "left",
      render: (req) => {
        const shift = shiftFromRequest(req);
        const dateVal = shift.isoDate ?? shift.date ?? shift.shift_date;
        const nameVal = shift.shiftName || shift.shift_name || shift.name;
        const colors = getShiftColors(nameVal);
        return (
          <div className="space-y-0.5 min-w-[130px]">
            <div className="flex items-center gap-1.5 font-medium text-slate-900 text-[14px]">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colors.border }} />
              <span className="tabular-nums">{formatDate(dateVal, true)}</span>
            </div>
            <div className="text-[13px] text-slate-500 font-normal">
              Ca {formatShiftName(nameVal)} · {shiftTimeRange(shift)}
            </div>
          </div>
        );
      },
    },
    {
      key: "peer",
      label: "Đồng nghiệp",
      width: "18%",
      align: "left",
      render: (req) => {
        const senderId = req.sender_id ?? req.sender?.id ?? req.requesterId;
        const isOutgoing =
          String(senderId ?? "") === String(currentUserId) ||
          (Boolean(currentUserEmail) && (req.sender_email ?? req.sender?.email) === currentUserEmail);
        const peerName = isOutgoing
          ? req.recipient_name ?? req.targetEmployeeName ?? req.recipient?.name ?? req.receiver?.name ?? "Đồng nghiệp"
          : req.sender_name ?? req.requesterName ?? req.sender?.name ?? "Người gửi";
        const peerRole = isOutgoing
          ? req.targetRoleTag ?? req.targetEmployeeRole ?? req.recipient?.roleTag ?? "Nhân viên"
          : req.requesterRoleTag ?? req.requesterRole ?? req.sender?.roleTag ?? "Nhân viên";
        return (
          <div className="flex items-center gap-2.5 min-w-[140px]">
            <Avatar name={peerName} size="sm" />
            <div>
              <span className="block font-medium text-slate-900 leading-tight">{peerName}</span>
              <span className="block text-[12px] text-slate-500 leading-tight">{peerRole}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "receiveShift",
      label: "Ca nhận",
      width: "18%",
      align: "left",
      render: (req) => {
        const shift = req.targetShift ?? req.target_shift ?? req.receiver_shift ?? req.recipient_shift;
        if (!shift || (!shift.date && !shift.isoDate && !shift.shift_date && !shift.shiftName && !shift.name)) {
          return (
            <div className="min-w-[120px]">
              <span className="block font-medium text-slate-700">Trực thay ca</span>
              <span className="block text-[12px] text-slate-400">Không nhận lại ca</span>
            </div>
          );
        }
        const dateVal = shift.isoDate ?? shift.date ?? shift.shift_date;
        const nameVal = shift.shiftName || shift.shift_name || shift.name;
        const colors = getShiftColors(nameVal);
        return (
          <div className="space-y-0.5 min-w-[130px]">
            <div className="flex items-center gap-1.5 font-medium text-slate-900">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colors.border }} />
              <span className="tabular-nums">{formatDate(dateVal)}</span>
            </div>
            <div className="text-[12px] text-slate-500">
              {formatShiftName(nameVal)} ({shiftTimeRange(shift)})
            </div>
          </div>
        );
      },
    },
    {
      key: "reason",
      label: "Hình thức & lý do",
      width: "18%",
      align: "left",
      render: (req) => {
        const targetShift = req.targetShift ?? req.target_shift ?? req.receiver_shift ?? req.recipient_shift;
        const exchangeType = req.exchangeType ?? (targetShift ? "swap" : "cover");
        const typeLabel = exchangeType === "swap" ? "Hoán đổi 2 ca" : "Nhờ làm thay ca";
        const noteText = req.note ?? req.reason ?? req.message;
        const status = requestStatus(req);
        const rejectReason = req.rejectReason ?? req.response_reason ?? (status === "rejected" ? req.managerNote : "");
        return (
          <div className="min-w-[170px] max-w-xs space-y-1">
            <span className="block font-medium text-slate-900">{typeLabel}</span>
            {noteText && (
              <span className="line-clamp-2 text-[13px] text-slate-600 italic" title={noteText}>
                "{noteText}"
              </span>
            )}
            {rejectReason && (
              <span className="block text-[12px] font-medium text-rose-600">
                Lý do từ chối: {rejectReason}
              </span>
            )}
            <span className="block text-[11px] text-slate-400">
              {req.id && `${req.id} • `}Đăng lúc {sentAt(req)}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "10%",
      align: "center",
      render: (req) => {
        const status = requestStatus(req);
        return (
          <div className="flex items-center justify-center min-w-[100px]">
            <StatusBadge tone={STATUS_TONES[status]}>
              {STATUS_LABELS[status] || status}
            </StatusBadge>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Hành động",
      width: "6%",
      align: "center",
      render: (req) => {
        const status = requestStatus(req);
        const senderId = req.sender_id ?? req.sender?.id ?? req.requesterId;
        const recipientId = req.recipient_id ?? req.recipient?.id ?? req.targetEmployeeId ?? req.receiver?.id;
        const isOutgoing =
          String(senderId ?? "") === String(currentUserId) ||
          (Boolean(currentUserEmail) && (req.sender_email ?? req.sender?.email) === currentUserEmail);
        const isIncoming =
          String(recipientId ?? "") === String(currentUserId) ||
          (Boolean(currentUserEmail) && (req.recipient_email ?? req.recipient?.email ?? req.receiver?.email) === currentUserEmail) ||
          !isOutgoing;

        const canCancel = isOutgoing && ["pending_employee", "pending_manager"].includes(status);
        const canRespond = isIncoming && status === "pending_employee";

        if (canRespond) {
          return (
            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeclineTarget(req);
                  setDeclineReason("");
                }}
                icon={<X className="h-3.5 w-3.5" />}
              >
                Từ chối
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busyId === String(req.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAccept(req);
                }}
                icon={<Check className="h-3.5 w-3.5" />}
              >
                {busyId === String(req.id) ? "Đang xử lý..." : "Chấp nhận"}
              </Button>
            </div>
          );
        }

        if (canCancel) {
          return (
            <div className="flex items-center justify-center whitespace-nowrap">
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === String(req.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setCancelTarget(req);
                }}
              >
                {busyId === String(req.id) ? "Đang xử lý..." : "Hủy"}
              </Button>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-center">
            <span className="text-[12px] text-slate-400">—</span>
          </div>
        );
      },
    },
  ], [currentUserId, currentUserEmail, busyId, handleAccept]);

  return (
    <div className={`${STAFF_LAYOUT.blockGap} min-w-0`}>
      {feedback && (
        <div role="status" className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[14px] ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {feedback.type === "success" ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />{loadError}</span>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex shrink-0 items-center gap-1 font-medium cursor-pointer hover:underline"><RefreshCw className="h-4 w-4" /> Thử lại</button>
        </div>
      )}

      {/* PAGE HEADER CHUẨN */}
      <PageHeader
        breadcrumb={["Lịch và ca", "Đổi ca"]}
        icon="swap"
        title="Đổi ca"
        description="Gửi yêu cầu hoán đổi ca làm việc cho đồng nghiệp và theo dõi tiến trình phê duyệt của Quản lý."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("history")}
            >
              Lịch sử đổi ca
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Tạo yêu cầu đổi ca
            </Button>
          </div>
        }
      />

      {/* MỘT PAGECARD DUY NHẤT CHỨA TẤT CẢ NỘI DUNG */}
      <PageCard className="space-y-4 min-w-0">
        {/* HÀNG 1: StatusTabs | HÀNG 2: SearchInput */}
        <div className="space-y-3 min-w-0 w-full">
          <div className="w-full min-w-0 overflow-x-auto pb-1">
            <StatusTabs
              tabs={tabsConfig}
              value={activeTab}
              onChange={setActiveTab}
              counts={tabCounts}
            />
          </div>
          <div className="w-full min-w-0 pt-1 border-t border-slate-100">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm theo tên, ca, lý do..."
              onClear={() => setSearchQuery("")}
              className="w-full min-w-0"
            />
          </div>
        </div>

        {/* NỘI DUNG BẢNG */}
        {loading ? (
          <div className="rounded-xl border border-slate-200/90 bg-white p-12 text-center text-[14px] text-slate-500 flex items-center justify-center gap-2.5 shadow-2xs">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#0F172A]" />
            Đang tải danh sách đổi ca...
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
            variant="clean"
            columns={columns}
            rows={filteredRequests}
            minWidth={880}
            onRowClick={(row) => setDetailRequest(row)}
            rowAriaLabel={(row) => `Xem chi tiết yêu cầu đổi ca ${row.id || ""}`}
          />
        )}
      </PageCard>

            {/* ===== CÁC MODAL ===== */}
      <CreateExchangeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={submitRequest}
        shifts={shifts}
        selectedShiftId={selectedShiftId}
        chooseShift={chooseShift}
        selectedShift={selectedShift}
        eligibleCandidates={eligibleCandidates}
        targetEmployeeId={candidateId}
        setTargetEmployeeId={setCandidateId}
        selectedCandidate={chosenCandidate}
        message={note}
        setMessage={setNote}
        sending={sending}
        loadingCandidates={loadingCandidates}
      />

      <DeclineExchangeModal
        declineTarget={declineTarget}
        onClose={() => { setDeclineTarget(null); setDeclineReason(""); }}
        declineReason={declineReason}
        setDeclineReason={setDeclineReason}
        confirmDecline={confirmDecline}
        busyId={busyId}
      />

      <CancelExchangeModal
        cancelTarget={cancelTarget}
        onClose={() => setCancelTarget(null)}
        confirmCancel={confirmCancel}
        busyId={busyId}
      />

      <ExchangeDetailModal
        detailRequest={detailRequest}
        onClose={() => setDetailRequest(null)}
        currentUserId={user?.employeeId || user?.id || "NV001"}
        currentUserEmail={user?.email}
        user={user}
        onCancel={(req) => setCancelTarget(req)}
        onAccept={handleAccept}
        onDecline={(req) => setDeclineTarget(req)}
      />
    </div>
  );
}
