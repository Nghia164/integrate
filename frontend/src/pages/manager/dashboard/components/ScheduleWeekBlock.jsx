import Block from "./Block";
import { Avatar } from "../../../../components/TableKit";
import { DAYS, SHIFT_OPTIONS, SHIFT_STYLE } from "../dashboardData";
import { getNow } from "../../../../lib/dateUtils";

export default function ScheduleWeekBlock({ weekLabel = "", schedule = [] }) {
  const todayIdx = (getNow().getDay() + 6) % 7; // 0 = Thứ 2

  return (
    <Block
      title="Lịch làm việc tuần này"
      subtitle={
        schedule.length === 0
          ? `${weekLabel} • Chưa công bố`
          : `${weekLabel} • ${schedule.length} nhân viên`
      }
      action={
        <div className="hidden items-center gap-3 text-[13px] text-slate-600 sm:flex">
          {SHIFT_OPTIONS.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SHIFT_STYLE[s].dot }} />
              {s}
            </span>
          ))}
        </div>
      }
    >
      {schedule.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-[14px] font-medium text-slate-500">
          Tuần này chưa có lịch được công bố
        </div>
      ) : (
        <div className="max-h-[380px] overflow-auto rounded-xl border border-slate-200 bg-white p-2">
          <table className="w-full min-w-[640px] border-separate border-spacing-x-1 border-spacing-y-1.5">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 w-48 bg-white" />
                {DAYS.map((d, i) => (
                  <th key={d} className="sticky top-0 z-10 bg-white pb-1 text-center text-[13px] font-medium">
                    <span
                      className={`inline-flex flex-col items-center leading-tight ${
                        i === todayIdx
                          ? "rounded-lg bg-slate-900 px-2.5 py-1 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      <span className="font-semibold">{d}</span>
                      {i === todayIdx && (
                        <span className="text-[10px] font-medium tracking-tight">Hôm nay</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.employee}>
                  <td className="sticky left-0 z-10 bg-white pr-2">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={row.employee} />
                      <span className="truncate text-[14px] font-medium text-slate-900">{row.employee}</span>
                    </span>
                  </td>
                  {row.shifts.map((s, i) => {
                    const st = s ? SHIFT_STYLE[s] : null;
                    return (
                      <td
                        key={i}
                        className={`rounded-lg px-1.5 py-2 text-center text-[13px] font-medium ${
                          i === todayIdx && !s ? "bg-slate-50" : ""
                        }`}
                        style={st ? { background: st.bg, color: st.fg } : { color: "#cbd5e1" }}
                      >
                        {s ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Block>
  );
}
