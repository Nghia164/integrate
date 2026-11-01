import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import Block from "./Block";
import { STATUS_VI, STATUS_HEX } from "../../attendance/attendanceHelpers";
import { TOOLTIP_STYLE, TOOLTIP_TEXT, fmtNum } from "../dashboardData";

export default function AttendanceChartBlock({ attendance = [] }) {
  const attendanceTotal = attendance.reduce((a, r) => a + (r.value || 0), 0);

  return (
    <Block title="Tình hình chấm công" subtitle="Số ca theo trạng thái">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative h-[140px] w-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={attendance}
                dataKey="value"
                nameKey="name"
                innerRadius={46}
                outerRadius={66}
                paddingAngle={2}
                stroke="none"
              >
                {attendance.map((r) => (
                  <Cell key={r.name} fill={STATUS_HEX[r.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} {...TOOLTIP_TEXT} formatter={(v, n) => [`${v} ca`, STATUS_VI[n] ?? n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-[20px] font-bold leading-none tabular-nums text-slate-900">{fmtNum(attendanceTotal)}</p>
              <p className="mt-0.5 text-[12px] text-slate-500">ca</p>
            </div>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {attendance.map((r) => {
            const share = attendanceTotal ? Math.round((r.value / attendanceTotal) * 1000) / 10 : 0;
            return (
              <li key={r.name} className="flex items-center justify-between gap-2 text-[13px] text-slate-900">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_HEX[r.name] ?? "#94a3b8" }} />
                  {STATUS_VI[r.name] ?? r.name}
                </span>
                <span className="tabular-nums text-slate-500">
                  <b className="font-semibold text-slate-900">{r.value}</b> • {fmtNum(share)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Block>
  );
}
