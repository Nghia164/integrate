import { Avatar } from "../../../../components/TableKit";
import { Modal } from "../../../../components/FormKit";
import { Button } from "../../../../components/FormKit";
import { Calendar, Edit3, PlusCircle } from "lucide-react";

export default function ShiftDetailModal({
  open,
  selectedInfo,
  onClose,
  onOpenEdit,
  onGoToOpenShift,
}) {
  if (!selectedInfo) return null;

  return (
    <Modal open={open} title="Chi tiết ca làm việc" onClose={onClose}>
      <div className="space-y-5">
        {/* Banner ca làm việc */}
        <div
          className={`flex items-start justify-between rounded-xl p-4 border ${
            selectedInfo.isSatisfied
              ? "border-emerald-200 bg-[#EEF9F2]"
              : "border-rose-100 bg-[#FDF2F2]"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg ${
                selectedInfo.isSatisfied ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
              }`}
            >
              <Calendar size={18} />
            </div>
            <div>
              <div
                className={`text-sm font-bold ${
                  selectedInfo.isSatisfied ? "text-emerald-800" : "text-rose-600"
                }`}
              >
                {selectedInfo.day.fullDate}
              </div>
              <div className="text-xs text-slate-600">
                {selectedInfo.demand.name}
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              selectedInfo.isSatisfied
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {selectedInfo.isSatisfied
              ? `Đủ ${selectedInfo.assigned.length}/${selectedInfo.demand.total} nhân viên`
              : `Thiếu ${selectedInfo.totalMissing} nhân viên`}
          </span>
        </div>

        {/* Bảng nhu cầu nhân sự */}
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-700">Nhu cầu nhân sự</div>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                  <th className="px-3 py-2 font-medium">Vai trò</th>
                  <th className="px-3 py-2 text-center font-medium">Yêu cầu</th>
                  <th className="px-3 py-2 text-center font-medium">Đã xếp</th>
                  <th className="px-3 py-2 text-center font-medium">Thiếu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="px-3 py-2.5 font-medium">Phục vụ</td>
                  <td className="px-3 py-2.5 text-center">{selectedInfo.demand.phucVu}</td>
                  <td className="px-3 py-2.5 text-center">{selectedInfo.pvAssigned}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={selectedInfo.pvMissing === 0 ? "text-slate-400" : "font-semibold text-rose-600"}>
                      {selectedInfo.pvMissing}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-medium">Pha chế</td>
                  <td className="px-3 py-2.5 text-center">{selectedInfo.demand.phaChe}</td>
                  <td className="px-3 py-2.5 text-center">{selectedInfo.pcAssigned}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={selectedInfo.pcMissing === 0 ? "text-slate-400" : "font-semibold text-rose-600"}>
                      {selectedInfo.pcMissing}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-medium">Thu ngân</td>
                  <td className="px-3 py-2.5 text-center">{selectedInfo.demand.thuNgan}</td>
                  <td className="px-3 py-2.5 text-center">{selectedInfo.tnAssigned}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={selectedInfo.tnMissing === 0 ? "text-slate-400" : "font-semibold text-rose-600"}>
                      {selectedInfo.tnMissing}
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-50/50 font-bold">
                  <td className="px-3 py-2.5 text-slate-900">Tổng</td>
                  <td className="px-3 py-2.5 text-center text-slate-900">{selectedInfo.demand.total}</td>
                  <td className="px-3 py-2.5 text-center text-slate-900">{selectedInfo.assigned.length}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={selectedInfo.isSatisfied ? "text-emerald-600" : "text-rose-600"}>
                      {selectedInfo.totalMissing}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Danh sách nhân viên đã được xếp */}
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-700">
            Nhân viên đã được xếp ({selectedInfo.assigned.length}/{selectedInfo.demand.total})
          </div>
          {selectedInfo.assigned.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              Chưa có nhân viên nào được phân công cho ca này.
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-slate-100 p-2">
              {selectedInfo.assigned.map((emp, idx) => {
                const empObj = typeof emp === "string" ? { id: emp, name: emp, role: "Nhân viên" } : emp;
                return (
                  <div
                    key={empObj.id || idx}
                    className="flex items-center justify-between rounded-lg bg-slate-50/70 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={empObj.name} size="sm" />
                      <div>
                        <span className="text-xs font-semibold text-slate-800">{empObj.name}</span>
                        <span className="ml-2 text-[10px] text-slate-400">({empObj.id})</span>
                      </div>
                    </div>
                    <span className="rounded bg-[#CBE3F0] px-2 py-0.5 text-xs font-medium text-[#0F172A]">
                      {empObj.role}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Đóng
          </Button>
          {!selectedInfo.isSatisfied && (
            <Button
              type="button"
              variant="outline"
              size="md"
              icon={<PlusCircle size={15} />}
              onClick={() => onGoToOpenShift(selectedInfo)}
            >
              Tạo ca mở
            </Button>
          )}
          <Button
            type="button"
            size="md"
            icon={<Edit3 size={15} />}
            onClick={onOpenEdit}
          >
            Chỉnh sửa phân công
          </Button>
        </div>
      </div>
    </Modal>
  );
}
