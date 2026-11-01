/**
 * FILE NÀY LÀM GÌ: Xem và nhận ca trực mở | Loại: Giao diện Staff | US: US18, US19
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Check,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  getOpenShifts,
  getOpenShiftsForEmployee,
  claimOpenShift,
  subscribeOpenShift,
  dayLabel,
  fmtDate,
} from "../../../services/openShiftService.js";
import { useLiveData } from "../../../lib/hooks.js";

import {
  PageCard,
  PageHeader,
  SearchInput,
  Alert,
} from "../../../components/PageKit.jsx";
import { StatusTabs } from "../../../components/PageKit";
import { Table, StatusBadge, EmptyState } from "../../../components/TableKit";
import { Button } from "../../../components/FormKit";
import { getShiftColors } from "../../../lib/shiftColors.js";
import STAFF_LAYOUT from "../../../lib/layoutTokens.js";
import { matchesSearch } from "../../../lib/searchUtils.js";

import {
  TABS,
  getShiftDurationHours,
} from "./openShiftsHelpers";
import {
  OpenShiftDetailModal,
  ClaimShiftModal,
} from "./OpenShiftsModals";

export default function OpenShiftsPage() {
  const { user } = useAuth();
  const currentEmployeeId = user?.employeeId || user?.id || "NV001";

  const userRoleTags = useMemo(() => {
    if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles;
    }
    if (user?.roleTags && Array.isArray(user.roleTags) && user.roleTags.length > 0) {
      return user.roleTags;
    }
    if (user?.roleTag || user?.role) {
      return [user.roleTag || user.role];
    }
    return ["Phục vụ"];
  }, [user]);

  const actualEmployee = useMemo(
    () => ({
      employeeId: currentEmployeeId,
      name: user?.name || "Nhân viên",
      phone: user?.phone || "",
      roles: userRoleTags,
      roleTags: userRoleTags,
      status: user?.status || "Đang làm việc",
    }),
    [currentEmployeeId, user, userRoleTags]
  );

  const [shifts, setShifts] = useState([]);
  const [eligibleShifts, setEligibleShifts] = useState([]);
  const [tab, setTab] = useState("open");
  const [keyword, setKeyword] = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [confirmShift, setConfirmShift] = useState(null);
  const [detailShift, setDetailShift] = useState(null);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, eligible] = await Promise.all([
        getOpenShifts(),
        getOpenShiftsForEmployee(currentEmployeeId).catch(() => []),
      ]);
      setShifts(list || []);
      setEligibleShifts(eligible || []);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.message || "Không thể tải danh sách ca trực mở.",
      });
    } finally {
      setLoading(false);
    }
  }, [currentEmployeeId]);

  useEffect(() => {
    loadData();
    const unsub = subscribeOpenShift(() => {
      loadData();
    });
    return unsub;
  }, [loadData]);

  useLiveData(() => {
    loadData();
  }, [loadData]);

  // Tự động đồng bộ detailShift khi dữ liệu shifts thay đổi
  useEffect(() => {
    if (!detailShift) return;
    const current = shifts.find((s) => s.id === detailShift.id && !s.cancelled);
    if (!current) {
      showToast("info", "Không còn thông tin");
      setDetailShift(null);
    } else if (current !== detailShift) {
      setDetailShift(current);
    }
  }, [shifts, detailShift, showToast]);

  // Bộ đếm tab
  const tabCounts = useMemo(() => {
    const uncancelled = shifts.filter((s) => !s.cancelled);
    const myCount = uncancelled.filter((s) =>
      s.claims?.some((c) => c.employeeId === currentEmployeeId)
    ).length;
    return { open: eligibleShifts.length, my_claims: myCount };
  }, [shifts, eligibleShifts, currentEmployeeId]);

  // Danh sách các vai trò có trong dữ liệu
  const availableRoles = useMemo(() => {
    const set = new Set();
    shifts.forEach((s) => {
      if (s.role && !s.cancelled) set.add(s.role);
    });
    return Array.from(set);
  }, [shifts]);

  // Lọc theo tab, keyword, shiftFilter, roleFilter
  const filteredShifts = useMemo(() => {
    const baseList = tab === "open"
      ? eligibleShifts
      : shifts.filter((s) => !s.cancelled && s.claims?.some((c) => c.employeeId === currentEmployeeId));

    return baseList.filter((s) => {
      if (s.cancelled) return false;

      if (shiftFilter !== "all" && s.shiftName !== shiftFilter) return false;
      if (roleFilter !== "all" && s.role !== roleFilter) return false;

      if (keyword.trim()) {
        if (
          !matchesSearch(keyword, [
            s.id,
            s.shiftName,
            s.role,
            s.date,
            dayLabel(s.date),
            s.note,
          ])
        ) {
          return false;
        }
      }
      return true;
    });
  }, [shifts, eligibleShifts, tab, shiftFilter, roleFilter, keyword, currentEmployeeId]);

  // Sắp xếp theo ngày
  const sortedShifts = useMemo(() => {
    return [...filteredShifts].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [filteredShifts]);

  // Xử lý mở Modal xác nhận nhận ca
  const handleOpenClaimModal = (shift) => {
    setAlert(null);
    setConfirmShift(shift);
  };

  // Xác nhận nhận ca với Optimistic Locking
  const handleConfirmClaim = async () => {
    if (!confirmShift || submitting) return;
    setSubmitting(true);
    try {
      const res = await claimOpenShift(
        confirmShift.id,
        actualEmployee,
        confirmShift.version
      );
      if (res?.ok || res?.shift) {
        showToast(
          "success",
          `Nhận ca ${confirmShift.shiftName} ngày ${fmtDate(confirmShift.date)} thành công! Ca đã được thêm vào Lịch của tôi.`
        );
        setConfirmShift(null);
        await loadData();
      }
    } catch (err) {
      const message = err?.message || "Không thể nhận ca. Ca có thể đã có người nhận hoặc bị thay đổi.";
      showToast("error", message);
      setConfirmShift(null);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  // Cấu hình các cột của bảng danh sách ca mở
  const columns = useMemo(
    () => [
      {
        key: "shift",
        label: "Ca làm việc",
        width: "25%",
        align: "left",
        render: (row) => {
          const colors = getShiftColors(row.shiftName);
          const duration = getShiftDurationHours(row.startTime, row.endTime);
          return (
            <div className="space-y-0.5 min-w-[160px]">
              <div className="flex items-center gap-1.5 font-medium text-slate-900 text-[14px]">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: colors.border }}
                />
                <span className="tabular-nums">{dayLabel(row.date)}</span>
              </div>
              <div className="text-[13px] text-slate-500 font-normal">
                Ca {row.shiftName} · {row.startTime}–{row.endTime} ({duration}h)
              </div>
            </div>
          );
        },
      },
      {
        key: "role",
        label: "Vai trò yêu cầu",
        width: "16%",
        align: "left",
        render: (row) => (
          <span className="inline-block px-2.5 py-1 rounded-md text-[12.5px] font-medium bg-[#D9E8F5] text-[#0F172A]">
            {row.role}
          </span>
        ),
      },
      {
        key: "bonus",
        label: "Thưởng khuyến khích",
        width: "18%",
        align: "left",
        render: (row) => {
          if (!row.bonus || row.bonus <= 0) {
            return <span className="text-[13px] text-slate-400">Không có thưởng</span>;
          }
          return (
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[13.5px]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="tabular-nums">+{row.bonus.toLocaleString("vi-VN")} đ</span>
            </div>
          );
        },
      },
      {
        key: "note",
        label: "Ghi chú",
        width: "23%",
        align: "left",
        render: (row) => {
          if (!row.note || !row.note.trim()) {
            return <span className="text-[13px] text-slate-400">—</span>;
          }
          return (
            <span
              className="line-clamp-2 text-[13.5px] text-slate-600 font-normal"
              title={row.note}
            >
              {row.note}
            </span>
          );
        },
      },
      {
        key: "action",
        label: "Thao tác",
        width: "18%",
        align: "right",
        render: (row) => {
          const claimedByMe = row.claims?.some(
            (c) => c.employeeId === currentEmployeeId
          );

          if (claimedByMe) {
            return (
              <div className="flex items-center justify-end">
                <StatusBadge tone="success">Đã nhận ca</StatusBadge>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-end">
              <Button
                variant="primary"
                size="sm"
                className="h-8 px-3 text-[12.5px]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenClaimModal(row);
                }}
                icon={<Check className="w-3.5 h-3.5" />}
              >
                Nhận ca
              </Button>
            </div>
          );
        },
      },
    ],
    [currentEmployeeId]
  );

  return (
    <div className={STAFF_LAYOUT.blockGap}>
      {/* Toast thông báo nhanh góc màn hình */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[14px] shadow-lg border transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-sky-50 border-sky-200 text-sky-900"
          }`}
        >
          {toast.type === "success" && (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          {toast.type === "error" && (
            <X className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium leading-snug">{toast.message}</span>
        </div>
      )}

      {/* Thông báo Alert đầu trang */}
      {alert && (
        <Alert
          tone={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* ===== HEADER ===== */}
      <PageHeader
        breadcrumbs={[
          { label: "Nhân viên", to: "/employees" },
          { label: "Ca trực mở" },
        ]}
        icon="userPlus"
        title="Ca trực mở"
        subtitle="Khám phá các ca trực đang mở phù hợp với vai trò của bạn và đăng ký nhận ca để tăng thu nhập."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            disabled={loading}
          >
            Làm mới
          </Button>
        }
      />

      {/* ===== NỘI DUNG CHÍNH (PAGE CARD) ===== */}
      <PageCard>
        <div className="space-y-4">
          <StatusTabs
            tabs={TABS}
            value={tab}
            onChange={(val) => {
              setTab(val);
              setKeyword("");
              setShiftFilter("all");
              setRoleFilter("all");
            }}
            counts={tabCounts}
          />

          <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 min-w-0">
              <SearchInput
                value={keyword}
                onChange={setKeyword}
                placeholder="Tìm kiếm theo mã, ngày, ca làm, vai trò, ghi chú..."
                onClear={() => setKeyword("")}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
              <select
                aria-label="Lọc theo ca làm việc"
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13.5px] text-slate-800 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0F172A] cursor-pointer"
              >
                <option value="all">Tất cả ca</option>
                <option value="Sáng">Ca Sáng</option>
                <option value="Chiều">Ca Chiều</option>
                <option value="Tối">Ca Tối</option>
              </select>

              <select
                aria-label="Lọc theo vai trò"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13.5px] text-slate-800 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0F172A] cursor-pointer"
              >
                <option value="all">Tất cả vai trò</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {(keyword || shiftFilter !== "all" || roleFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-[13px] text-slate-500 hover:text-slate-800"
                  onClick={() => {
                    setKeyword("");
                    setShiftFilter("all");
                    setRoleFilter("all");
                  }}
                >
                  Xóa lọc
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* NỘI DUNG BẢNG DANH SÁCH CA TRỰC MỞ */}
        {loading ? (
          <div className="rounded-xl border border-slate-200/90 bg-white p-12 text-center text-[14px] text-slate-500 flex items-center justify-center gap-2.5 shadow-2xs">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#0F172A]" />
            Đang tải danh sách ca trực mở...
          </div>
        ) : sortedShifts.length === 0 ? (
          <EmptyState
            title="Không tìm thấy kết quả phù hợp"
            description="Thử thay đổi từ khóa hoặc bộ lọc"
            onClear={() => {
              setKeyword("");
              setShiftFilter("all");
              setRoleFilter("all");
            }}
            canClear={Boolean(keyword || shiftFilter !== "all" || roleFilter !== "all")}
          />
        ) : (
          <Table
            variant="clean"
            columns={columns}
            rows={sortedShifts}
            minWidth={880}
            onRowClick={(row) => setDetailShift(row)}
            rowAriaLabel={(row) => `Xem chi tiết ca trực mở ${dayLabel(row.date)}`}
          />
        )}
      </PageCard>

      {/* ===== CÁC MODAL ===== */}
      <OpenShiftDetailModal
        detailShift={detailShift}
        onClose={() => setDetailShift(null)}
        currentEmployeeId={currentEmployeeId}
        onClaim={(target) => {
          setDetailShift(null);
          handleOpenClaimModal(target);
        }}
      />

      <ClaimShiftModal
        confirmShift={confirmShift}
        onClose={() => setConfirmShift(null)}
        onConfirm={handleConfirmClaim}
        submitting={submitting}
      />
    </div>
  );
}
