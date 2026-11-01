import { Calendar, Info, Copy } from "lucide-react";

export default function ShiftDemandCard({
  days,
  shiftDemands,
  weekendConfigured,
  onToggleDay,
  onUpdateDemandField,
  onCopyWeekendDemand,
  onCustomWeekendDemand,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-[#CBE3F0] p-2 text-[#0F172A]">
          <Calendar size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Thiết lập nhu cầu nhân sự</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Điều chỉnh số lượng nhân sự cho từng ca theo ngày áp dụng.
          </p>
        </div>
      </div>

      {/* 1. Ngày áp dụng nhu cầu */}
      <div className="mb-5">
        <div className="mb-2 text-xs font-semibold text-slate-700">1. Ngày áp dụng nhu cầu</div>
        <div className="flex flex-wrap items-center gap-2">
          {days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => onToggleDay(day.id)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                day.active
                  ? "bg-[#0F172A] text-white shadow-xs"
                  : "border border-[#CBE3F0] bg-white text-[#0F172A] hover:bg-[#D9E8F5]"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Cảnh báo Thứ 7 & Chủ nhật */}
        {!weekendConfigured && (
          <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs">
            <div className="flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <div>
                <div className="font-semibold text-amber-900">
                  Thứ 7 và Chủ nhật chưa thiết lập nhu cầu.
                </div>
                <div className="mt-0.5 text-amber-800">
                  Bạn có thể sao chép nhu cầu cho T7 & CN hoặc thiết lập riêng.
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCopyWeekendDemand}
                className="flex items-center gap-1.5 rounded-lg border border-[#CBE3F0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F172A] shadow-xs hover:bg-[#D9E8F5] cursor-pointer"
              >
                <Copy size={13} />
                <span>Sao chép nhu cầu cho T7 & CN</span>
              </button>
              <button
                type="button"
                onClick={onCustomWeekendDemand}
                className="rounded-lg border border-[#CBE3F0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F172A] hover:bg-[#D9E8F5] cursor-pointer"
              >
                Thiết lập riêng T7 & CN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Nhu cầu theo ca mẫu */}
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-700">2. Nhu cầu theo ca mẫu</div>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500">
                <th className="px-3 py-2.5 font-medium">Ca làm việc</th>
                <th className="px-2 py-2.5 text-center font-medium">Phục vụ</th>
                <th className="px-2 py-2.5 text-center font-medium">Pha chế</th>
                <th className="px-2 py-2.5 text-center font-medium">Thu ngân</th>
                <th className="px-3 py-2.5 text-right font-medium">Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shiftDemands.map((shift) => (
                <tr key={shift.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-3 font-medium text-slate-800">{shift.name}</td>
                  <td className="px-2 py-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateDemandField(shift.id, "phucVu", -1)}
                        className="h-5 w-5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-4 text-center tabular-nums">{shift.phucVu}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateDemandField(shift.id, "phucVu", 1)}
                        className="h-5 w-5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateDemandField(shift.id, "phaChe", -1)}
                        className="h-5 w-5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-4 text-center tabular-nums">{shift.phaChe}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateDemandField(shift.id, "phaChe", 1)}
                        className="h-5 w-5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateDemandField(shift.id, "thuNgan", -1)}
                        className="h-5 w-5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-4 text-center tabular-nums">{shift.thuNgan}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateDemandField(shift.id, "thuNgan", 1)}
                        className="h-5 w-5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-slate-900 tabular-nums">
                    {shift.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
