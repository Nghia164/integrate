/**
 * Tầng: Thành phần giao diện (Component / Modal)
 * Chức năng: Hộp thoại xác nhận chạy xếp ca tự động (mô phỏng)
 * Liên quan: US11 (Xếp lịch tự động - sau này thay bằng Python OR-Tools)
 */
import { Modal } from "../../../../components/FormKit";
import { Button } from "../../../../components/FormKit";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function AutoGenerateModal({
  open,
  isGenerating,
  generationSuccess,
  constraints,
  employeesCount = 5,
  weekLabel = "Tuần này",
  onClose,
  onRun,
}) {
  return (
    <Modal open={open} title="Tạo lịch tự động bằng thuật toán (OR-Tools)" onClose={onClose}>
      <div className="space-y-5">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 size={40} className="animate-spin text-[#0F172A]" />
            <div className="mt-4 text-base font-bold text-slate-800">
              Đang giải thuật toán xếp lịch tự động...
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Đang phân bổ tối ưu {employeesCount} nhân viên vào 21 ca làm việc theo các ràng buộc đã bật...
            </p>
          </div>
        ) : generationSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 size={44} className="text-emerald-500" />
            <div className="mt-3 text-base font-bold text-slate-900">
              Tạo lịch thành công!
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Lịch làm việc đã được phân bổ tối ưu theo các ràng buộc và định biên nhân sự.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-slate-700">
              Bạn có chắc muốn chạy thuật toán tạo lịch tự động cho <span className="font-bold text-[#0F172A]">{weekLabel}</span>?
            </p>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-500">Số nhân viên:</span>{" "}
                  <span className="font-bold text-slate-900">{employeesCount} nhân viên</span>
                </div>
                <div>
                  <span className="text-slate-500">Số ngày xếp:</span>{" "}
                  <span className="font-bold text-slate-900">7 ngày</span>
                </div>
                <div>
                  <span className="text-slate-500">Nhu cầu nhân sự:</span>{" "}
                  <span className="font-bold text-slate-900">21 ca làm việc</span>
                </div>
                <div>
                  <span className="text-slate-500">Ràng buộc áp dụng:</span>{" "}
                  <span className="font-bold text-emerald-600">
                    {constraints.filter((c) => c.enabled).length}/{constraints.length}
                  </span>
                </div>
              </div>

              <div className="mt-3 border-t border-slate-200/60 pt-3">
                <div className="mb-1 text-[11px] font-semibold text-slate-500">
                  Các ràng buộc đang kích hoạt:
                </div>
                <div className="flex flex-wrap gap-1">
                  {constraints
                    .filter((c) => c.enabled)
                    .map((c) => (
                      <span
                        key={c.id}
                        className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700"
                      >
                        ✓ {c.title}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" size="md" onClick={onClose}>
                Hủy
              </Button>
              <Button type="button" size="md" onClick={onRun}>
                Bắt đầu tạo lịch
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
