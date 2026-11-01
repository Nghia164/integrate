// =============================================================================
// FILE NÀY LÀM GÌ: Hộp thoại xác nhận sao chép lịch tuần trước (Staff)
// Loại: Modals
// US: US08 (Đăng ký lịch rảnh)
// =============================================================================

import { Modal } from "../../../components/FormKit";
import { Button } from "../../../components/FormKit";

/**
 * Hộp thoại xác nhận ghi đè khi sao chép lịch tuần trước
 */
export function CopyConfirmModal({ open, onClose, onConfirm }) {
  return (
    <Modal
      open={open}
      isOpen={open}
      title="Xác nhận sao chép lịch tuần trước"
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-[14px] text-slate-600">
          Bạn đang có thay đổi chưa lưu trên lưới đăng ký hiện tại. Sao chép lịch từ tuần trước sẽ ghi đè toàn bộ các lựa chọn này. Bạn có chắc chắn muốn tiếp tục?
        </p>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
          >
            Xác nhận sao chép
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CopyConfirmModal;
