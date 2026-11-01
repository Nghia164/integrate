// Bảng ma trận lịch làm việc theo nhân viên x 7 ngày tuần (Grid View)
import { DayHeaderCell, ScheduleShiftCard, EmptyShiftCell } from "../../../../components/CalendarKit";

import { SHIFT_COLORS } from "../../../../lib/shiftColors";


export default function CreatedScheduleGridView({
  days,
  pageGridEmployees,
  schedules,
  onOpenShiftModal,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Chú thích màu ca dùng chung với Staff (Option B - Single Source of Truth) */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm border"
            style={{
              backgroundColor: SHIFT_COLORS.morning.bg,
              borderColor: SHIFT_COLORS.morning.border,
            }}
          />
          Ca sáng (06:00 - 12:00)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm border"
            style={{
              backgroundColor: SHIFT_COLORS.afternoon.bg,
              borderColor: SHIFT_COLORS.afternoon.border,
            }}
          />
          Ca chiều (12:00 - 17:00)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm border"
            style={{
              backgroundColor: SHIFT_COLORS.evening.bg,
              borderColor: SHIFT_COLORS.evening.border,
            }}
          />
          Ca tối (17:00 - 22:00)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-slate-300 bg-slate-200" />
          Không có ca
        </span>
        <span className="ml-auto text-slate-400">💡 Bấm vào ô để điều chỉnh phân công ca</span>
      </div>

      {pageGridEmployees.length === 0 ? (
        <p className="py-10 text-center text-[15px] text-slate-500">
          Không có nhân viên phù hợp với bộ lọc hiện tại.
        </p>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: "min(65vh, 560px)" }}>
          <table
            className="w-full table-fixed border-separate border-spacing-0 text-xs"
            style={{ minWidth: 200 + 72 + 84 + days.length * 85 }}
          >
            <thead>
              <tr>
                <th
                  style={{ width: 200 }}
                  className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-white px-4 py-2.5 text-left text-[13px] font-semibold text-[#59667a]"
                >
                  Nhân viên
                </th>
                {days.map((d) => {
                  const isWeekend = d.id === "T7" || d.id === "CN";
                  return (
                    <DayHeaderCell
                      key={d.id}
                      label={d.label}
                      date={d.date}
                      isWeekend={isWeekend}
                    />
                  );
                })}
                <th
                  style={{ width: 72 }}
                  className="sticky top-0 z-20 border-b border-l border-slate-200 bg-white px-2 py-2.5 text-center text-[13px] font-semibold text-[#59667a]"
                >
                  Số ca
                </th>
                <th
                  style={{ width: 84 }}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-white px-2 py-2.5 text-center text-[13px] font-semibold text-[#59667a]"
                >
                  Giờ làm
                </th>
              </tr>
            </thead>
            <tbody>
              {pageGridEmployees.map((e) => {
                let empShifts = 0;
                let empHours = 0;

                return (
                  <tr key={e.id}>
                    <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-4 py-2">
                      <span className="block text-[13px] font-medium text-[#141f33]">{e.name}</span>
                      <span className="block text-[11px] text-slate-400">
                        {e.id} • {e.role}
                      </span>
                    </td>
                    {days.map((d) => {
                      const morningShift = schedules[`morning_${d.id}`]?.assigned?.some(
                        (item) => item.id === e.id
                      );
                      const afternoonShift = schedules[`afternoon_${d.id}`]?.assigned?.some(
                        (item) => item.id === e.id
                      );
                      const eveningShift = schedules[`evening_${d.id}`]?.assigned?.some(
                        (item) => item.id === e.id
                      );

                      let assignedShift = null;
                      if (morningShift) {
                        assignedShift = {
                          shiftKey: `morning_${d.id}`,
                          shiftId: "morning",
                          name: "Sáng",
                          start: "06:00",
                          end: "12:00",
                          hours: 6,
                        };
                      } else if (afternoonShift) {
                        assignedShift = {
                          shiftKey: `afternoon_${d.id}`,
                          shiftId: "afternoon",
                          name: "Chiều",
                          start: "12:00",
                          end: "17:00",
                          hours: 5,
                        };
                      } else if (eveningShift) {
                        assignedShift = {
                          shiftKey: `evening_${d.id}`,
                          shiftId: "evening",
                          name: "Tối",
                          start: "17:00",
                          end: "22:00",
                          hours: 5,
                        };
                      }

                      if (assignedShift) {
                        empShifts += 1;
                        empHours += assignedShift.hours;
                      }

                      return (
                        <td key={d.id} className="border-b border-slate-100 p-1">
                          {assignedShift ? (
                            <ScheduleShiftCard
                              shiftId={assignedShift.shiftId}
                              name={assignedShift.name}
                              start={assignedShift.start}
                              end={assignedShift.end}
                              onClick={() => onOpenShiftModal(assignedShift.shiftKey)}
                            />
                          ) : (
                            <EmptyShiftCell />
                          )}
                        </td>
                      );
                    })}
                    <td className="border-b border-l border-slate-100 bg-slate-50/40 px-2 py-2 text-center tabular-nums">
                      <span className="text-[12px] font-semibold text-slate-700">{empShifts} ca</span>
                    </td>
                    <td className="border-b border-slate-100 bg-slate-50/40 px-2 py-2 text-center tabular-nums">
                      <span className="text-[12px] font-semibold text-slate-900">{empHours}g</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
