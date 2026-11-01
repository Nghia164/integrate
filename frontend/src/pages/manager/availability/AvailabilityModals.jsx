// =============================================================================
// FILE NÀY LÀM GÌ: Hộp thoại chi tiết đăng ký khả năng làm việc của nhân viên (Manager)
// Loại: Modals
// US: US09 (Quản lý Khả năng làm việc của nhân viên)
// =============================================================================

import { Modal } from "../../../components/FormKit";
import { Button } from "../../../components/FormKit";
import { roleLabel, contractLabel, StatusBadge } from "../../../components/PageKit";
import { Avatar } from "../../../components/TableKit";

function formatDateTime(isoString) {
  if (!isoString) return "Chưa gửi đăng ký";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n) => String(n).padStart(2, "0");
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

export function EmployeeDetailModal({ employee, onClose }) {
  if (!employee) return null;

  return (
    <Modal open={Boolean(employee)} title="Chi tiết đăng ký của nhân viên" onClose={onClose}>
      <div className="space-y-4">
        {/* Thông tin định danh: Chỉ dùng Avatar chữ cái đầu, KHÔNG dùng ảnh thật */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Avatar name={employee.name} size="lg" />
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">{employee.name}</h3>
            <p className="text-[12px] text-slate-500">Mã NV: {employee.id}</p>
          </div>
        </div>

        {/* Thông tin vai trò & thời điểm gửi */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-[13.5px]">
          <div>
            <span className="text-[12px] font-medium text-slate-500">Vai trò (Role_Tag):</span>
            <p className="font-semibold text-slate-900">{roleLabel(employee.roleTag)} ({employee.roleTag})</p>
          </div>
          <div>
            <span className="text-[12px] font-medium text-slate-500">Hợp đồng:</span>
            <p className="font-semibold text-slate-900">{contractLabel(employee.contract)}</p>
          </div>
          <div className="col-span-2 border-t border-slate-200/60 pt-2.5">
            <span className="text-[12px] font-medium text-slate-500">Trạng thái đăng ký tuần:</span>
            {employee.registered ? (
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge tone="success">Đã đăng ký</StatusBadge>
                <span className="text-[13px] text-slate-700">lúc {formatDateTime(employee.submittedAt)}</span>
              </div>
            ) : (
              <div className="mt-1">
                <StatusBadge tone="neutral">Chưa gửi đăng ký</StatusBadge>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default EmployeeDetailModal;
