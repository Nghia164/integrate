/**
 * File: src/pages/employees/openShifts/OpenShiftsModals.jsx
 * Các Modal nghiệp vụ Ca trực mở Staff (US18, US19):
 * 1. OpenShiftDetailModal - Chi tiết ca trực mở
 * 2. ClaimShiftModal - Xác nhận nhận ca trực mở
 */

import { Sparkles, Check } from "lucide-react";
import { Modal, Button } from "../../../components/FormKit";
import { StatusBadge } from "../../../components/TableKit";
import { getShiftColors } from "../../../lib/shiftColors";
import { dayLabel } from "../../../services/openShiftService";
import { getShiftDurationHours } from "./openShiftsHelpers";

// 1. MODAL CHI TIẾT CA TRỰC MỞ
export function OpenShiftDetailModal({
  detailShift,
  onClose,
  currentEmployeeId,
  onClaim,
}) {
  if (!detailShift) return null;

  const claimedByMe = detailShift.claims?.some((c) => c.employeeId === currentEmployeeId);
  const duration = getShiftDurationHours(detailShift.startTime, detailShift.endTime);
  const claimedCount = detailShift.claims?.length || 0;
  const remainingSlots = Math.max(0, detailShift.needed - claimedCount);

  return (
    <Modal
      open={Boolean(detailShift)}
      isOpen={Boolean(detailShift)}
      onClose={onClose}
      size="md"
      header={
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#CBE3F0] text-[#0F172A] shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[16px] font-semibold text-[#0F172A]">
                Chi tiết ca trực mở
              </h2>
              <StatusBadge tone={claimedByMe ? "success" : "info"}>
                {claimedByMe ? "Đã nhận" : "Đang mở"}
              </StatusBadge>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Ca {detailShift.shiftName} · {dayLabel(detailShift.date)}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          {!claimedByMe && (
            <Button
              variant="primary"
              size="md"
              onClick={() => onClaim(detailShift)}
              icon={<Check className="w-4 h-4" />}
            >
              Nhận ca
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-4 min-w-0 w-full">
        <dl className="divide-y divide-[#E5ECF1] border-y border-[#E5ECF1]">
          <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-slate-500">Ngày làm</dt>
            <dd className="font-medium text-[#0F172A] text-right">{dayLabel(detailShift.date)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-slate-500">Ca làm việc</dt>
            <dd className="font-medium text-[#0F172A] text-right flex items-center gap-1.5 flex-wrap justify-end">
              {(() => {
                const c = getShiftColors(detailShift.shiftName);
                return (
                  <>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.border }} />
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: c.bg, color: c.text }}>
                      Ca {detailShift.shiftName}
                    </span>
                    <span className="text-slate-500 text-xs">({detailShift.startTime} – {detailShift.endTime})</span>
                  </>
                );
              })()}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-slate-500">Thời lượng</dt>
            <dd className="font-medium text-[#0F172A] text-right">{duration} giờ</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-slate-500">Vai trò yêu cầu</dt>
            <dd className="text-right">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[#D9E8F5] text-[#0F172A]">
                {detailShift.role}
              </span>
            </dd>
          </div>
          {detailShift.bonus > 0 && (
            <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
              <dt className="text-slate-500">Thưởng</dt>
              <dd className="text-right">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[#E8F1F5] text-[#0F172A]">
                  +{detailShift.bonus.toLocaleString("vi-VN")} đ
                </span>
              </dd>
            </div>
          )}
          {remainingSlots > 0 && (
            <div className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
              <dt className="text-slate-500">Chỗ trống</dt>
              <dd className="font-medium text-[#0F172A] text-right">Còn {remainingSlots} chỗ</dd>
            </div>
          )}
        </dl>

        {detailShift.note && detailShift.note.trim() && (
          <div>
            <h4 className="text-[14px] font-medium text-[#0F172A] mb-1.5">Ghi chú</h4>
            <div className="bg-[#F4F7F9] border border-[#E5ECF1] rounded-xl p-3 text-[13.5px] text-[#0F172A] leading-relaxed break-words">
              {detailShift.note}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// 2. MODAL XÁC NHẬN NHẬN CA TRỰC MỞ
export function ClaimShiftModal({
  confirmShift,
  onClose,
  onConfirm,
  submitting,
}) {
  if (!confirmShift) return null;

  const colors = getShiftColors(confirmShift.shiftName);
  const duration = getShiftDurationHours(
    confirmShift.startTime,
    confirmShift.endTime
  );

  return (
    <Modal
      open={Boolean(confirmShift)}
      isOpen={Boolean(confirmShift)}
      onClose={() => !submitting && onClose()}
      title="Xác nhận nhận ca trực mở"
      size="md"
    >
      <div className="space-y-4 py-1 text-[14px]">
        <p className="text-slate-600 leading-normal">
          Bạn có chắc chắn muốn đăng ký nhận ca trực mở này không? Sau khi xác nhận, ca sẽ lập tức được thêm vào Lịch của tôi và sổ cái chấm công.
        </p>

        {/* Thẻ tóm tắt thông tin ca */}
        <div
          className="p-4 rounded-xl space-y-2.5 border border-slate-200"
          style={{
            borderLeftWidth: "4px",
            borderLeftColor: colors.border,
            backgroundColor: colors.bg,
          }}
        >
          <div className="flex justify-between items-center text-[13.5px]">
            <span className="text-slate-500">Mã ca trực:</span>
            <span className="font-bold text-slate-900">{confirmShift.id}</span>
          </div>
          <div className="flex justify-between items-center text-[13.5px]">
            <span className="text-slate-500">Ngày làm việc:</span>
            <span className="font-semibold text-slate-900">
              {dayLabel(confirmShift.date)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[13.5px]">
            <span className="text-slate-500">Ca & Giờ làm:</span>
            <span className="font-semibold text-slate-900">
              Ca {confirmShift.shiftName} ({confirmShift.startTime} – {confirmShift.endTime}) · {duration}h
            </span>
          </div>
          <div className="flex justify-between items-center text-[13.5px]">
            <span className="text-slate-500">Vai trò yêu cầu:</span>
            <span className="font-semibold text-slate-900">
              {confirmShift.role}
            </span>
          </div>
          {confirmShift.note && (
            <div className="flex justify-between items-start text-[13.5px]">
              <span className="text-slate-500 shrink-0 mr-2">Ghi chú:</span>
              <span className="font-normal text-slate-800 text-right">
                {confirmShift.note}
              </span>
            </div>
          )}
          {confirmShift.bonus > 0 && (
            <div className="flex justify-between items-center text-emerald-700 font-bold pt-2 border-t border-slate-200/80 text-[14px]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Tiền thưởng khuyến khích:
              </span>
              <span className="tabular-nums">
                +{confirmShift.bonus.toLocaleString("vi-VN")} đ
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            loading={submitting}
            disabled={submitting}
            icon={<Check className="w-4 h-4" />}
          >
            Xác nhận nhận ca
          </Button>
        </div>
      </div>
    </Modal>
  );
}
