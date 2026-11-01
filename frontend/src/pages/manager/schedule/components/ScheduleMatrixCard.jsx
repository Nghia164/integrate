import { CheckCircle2, CalendarDays, AlertTriangle, Clock, PlusCircle } from "lucide-react";

export default function ScheduleMatrixCard({
  days,
  shiftDemands,
  schedules,
  selectedShiftKey,
  onSelectShift,
  onOpenFullSchedule,
  onGoToOpenShift,
}) {
  // Tìm các ca còn thiếu nhân viên
  const deficientShifts = [];
  days.forEach((day) => {
    shiftDemands.forEach((demand) => {
      const key = `${demand.id}_${day.id}`;
      const shiftData = schedules[key] || { assigned: [] };
      const currentCount = shiftData.assigned.length;
      if (currentCount < demand.total) {
        deficientShifts.push({
          key,
          day,
          demand,
          assigned: shiftData.assigned,
          missing: demand.total - currentCount,
        });
      }
    });
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-[#CBE3F0] p-2 text-[#0F172A]">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Kết quả tạo lịch</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Nhấn vào bất kỳ ca nào để xem thông tin nhân viên
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenFullSchedule}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:border-[#0F172A]/40 hover:text-[#0F172A] hover:bg-slate-50 transition active:scale-95 cursor-pointer"
        >
          <CalendarDays size={13} />
          <span>Xem cả tuần</span>
        </button>
      </div>

      {/* Bảng ma trận Ca / Ngày */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-center text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600">
              <th className="px-2 py-2.5 text-left font-medium">Ca / Ngày</th>
              {days.map((d) => (
                <th key={d.id} className="px-1.5 py-2.5 font-medium whitespace-nowrap">
                  {d.label}
                  <span className="block text-[10px] text-slate-400">{d.date}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shiftDemands.map((demand) => (
              <tr key={demand.id}>
                <td className="px-2 py-2.5 text-left font-medium text-slate-700">
                  {demand.shortName}
                </td>
                {days.map((d) => {
                  const key = `${demand.id}_${d.id}`;
                  const shiftData = schedules[key] || { assigned: [] };
                  const currentCount = shiftData.assigned.length;
                  const isSatisfied = currentCount >= demand.total;
                  const isSelected = selectedShiftKey === key;

                  return (
                    <td key={d.id} className="p-1">
                      <button
                        type="button"
                        onClick={() => onSelectShift(demand.id, d.id)}
                        className={`group relative w-full cursor-pointer rounded-md px-1 py-1.5 font-semibold transition-all duration-150 hover:scale-105 hover:shadow-xs active:scale-95 tabular-nums ${
                          isSatisfied
                            ? "bg-[#EEF9F2] text-emerald-700 hover:bg-emerald-100"
                            : "bg-[#FDF2F2] text-rose-600 hover:bg-rose-100"
                        } ${
                          isSelected ? "ring-2 ring-[#0F172A] ring-offset-1 font-bold" : ""
                        }`}
                        title={`Nhấn để xem nhân viên: ${demand.name} - ${d.label} (${d.date})`}
                      >
                        <span>
                          {currentCount}/{demand.total}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ghi chú màu sắc */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Đủ nhân viên</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600">Thiếu nhân viên</span>
          </div>
        </div>
        <span className="text-[11px] font-medium text-[#0F172A]">
          👉 Nhấn vào ô để xem ca
        </span>
      </div>

      {/* Cảnh báo ca chưa đủ nhân viên */}
      {deficientShifts.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-[#FFFBEB] p-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <div className="font-semibold text-amber-900">
                Lịch làm việc có ca chưa đủ nhân viên
              </div>
              <div className="mt-0.5 text-amber-800">
                Hệ thống đã phát hiện một số ca chưa đáp ứng đủ nhu cầu nhân sự.
              </div>
            </div>
          </div>

          {/* Danh sách các ca thiếu */}
          <div className="mt-3 space-y-2">
            {deficientShifts.slice(0, 3).map((def) => {
              const [sId, dId] = def.key.split("_");
              return (
                <div
                  key={def.key}
                  onClick={() => onSelectShift(sId, dId)}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-amber-100 bg-white/90 p-2.5 transition hover:bg-amber-50/50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                      <Clock size={14} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        {def.day.fullDate} - {def.demand.shortName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Hiện có {def.assigned.length}/{def.demand.total} người
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 font-bold text-rose-700 text-[11px]">
                      Thiếu {def.missing}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGoToOpenShift(def);
                      }}
                      className="flex items-center gap-1 rounded-md bg-[#0F172A] px-2 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-[#1E293B] transition active:scale-95 cursor-pointer"
                    >
                      <PlusCircle size={12} />
                      <span>Tạo ca mở</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
