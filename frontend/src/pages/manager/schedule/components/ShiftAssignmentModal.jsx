import { Avatar } from "../../../../components/TableKit";
import { useState } from "react";
import { Plus, AlertTriangle, UserPlus, CalendarDays } from "lucide-react";
import { Modal } from "../../../../components/FormKit";
import { Button } from "../../../../components/FormKit";
import ShiftEmployeeRow from "./ShiftEmployeeRow";

// Hộp thoại xem chi tiết ca và điều chỉnh phân công nhân sự trong ca

export default function ShiftAssignmentModal({
  modalData,
  employeeRoster,
  isConfirmed = false,
  onClose,
  onSave,
  onGoToOpenShift,
}) {
  const [editList, setEditList] = useState(modalData ? [...modalData.assigned] : []);
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  if (!modalData) return null;

  const pvCount = editList.filter((e) => e.role === "Phục vụ").length;
  const pcCount = editList.filter((e) => e.role === "Pha chế").length;
  const tnCount = editList.filter((e) => e.role === "Thu ngân").length;
  const missing = Math.max(0, modalData.demand.total - editList.length);

  const handleAdd = (emp) => {
    if (!editList.some((e) => e.id === emp.id)) {
      setEditList((prev) => [...prev, emp]);
    }
    setShowAddDropdown(false);
  };

  const handleRemove = (empId) => {
    setEditList((prev) => prev.filter((e) => e.id !== empId));
  };

  const handleConfirmSave = () => {
    onSave(modalData.key, editList);
  };

  const availableEmployees = employeeRoster.filter((e) => !editList.some((a) => a.id === e.id));

  return (
    <Modal
      open={!!modalData}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8EEFB] text-[#3452A8]">
            <CalendarDays size={18} />
          </div>
          <div>
            <div className="text-[16px] font-bold text-slate-900">
              Chi tiết {modalData.demand.name.split("(")[0]} - {modalData.day.fullDate}
            </div>
            <div className="text-[12px] font-normal text-slate-500">
              Thời gian: {modalData.demand.time} • Cần: {modalData.demand.total} nhân sự
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    >
      <div className="space-y-4 pt-1">
        {/* Định biên & hiện trạng */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <div className="text-xs text-slate-500">Phục vụ</div>
            <div className="mt-1 text-sm font-bold text-[#0F172A]">
              {pvCount} / {modalData.demand.phucVu}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <div className="text-xs text-slate-500">Pha chế</div>
            <div className="mt-1 text-sm font-bold text-amber-600">
              {pcCount} / {modalData.demand.phaChe}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <div className="text-xs text-slate-500">Thu ngân</div>
            <div className="mt-1 text-sm font-bold text-purple-600">
              {tnCount} / {modalData.demand.thuNgan}
            </div>
          </div>
        </div>

        {/* Thông báo thiếu nhân sự nếu có */}
        {missing > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-[#FDF2F2] p-3 text-xs">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle size={16} className="shrink-0" />
              <span>
                Ca này đang <strong>thiếu {missing} nhân viên</strong> so với nhu cầu.
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="danger"
              icon={<UserPlus size={13} />}
              onClick={() => onGoToOpenShift(modalData)}
            >
              Tạo ca mở
            </Button>
          </div>
        )}

        {/* Danh sách nhân viên trong ca */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
              Nhân viên đã xếp ({editList.length} người)
            </h4>

            {/* Nút thêm nhân viên */}
            {!isConfirmed && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAddDropdown((v) => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#0F172A] hover:underline cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Thêm nhân viên</span>
                </button>

              {showAddDropdown && (
                <div className="absolute right-0 top-6 z-30 max-h-56 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400">
                    Chọn nhân viên để thêm:
                  </div>
                  {availableEmployees.length === 0 ? (
                    <div className="p-2 text-center text-xs text-slate-400">
                      Tất cả nhân viên đã có trong ca.
                    </div>
                  ) : (
                    availableEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleAdd(emp)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-[#E8EEFB]"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={emp.name} size="sm" />
                          <span className="font-medium text-slate-800">{emp.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{emp.role}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {editList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Chưa có nhân viên nào trong ca này.
              </div>
            ) : (
              editList.map((emp) => (
                <ShiftEmployeeRow
                  key={emp.id}
                  emp={emp}
                  isConfirmed={isConfirmed}
                  onRemove={handleRemove}
                />
              ))
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            {isConfirmed ? "Đóng" : "Hủy"}
          </Button>
          <Button
            type="button"
            size="md"
            disabled={isConfirmed}
            onClick={handleConfirmSave}
          >
            {isConfirmed ? "Lịch đã xác nhận" : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
