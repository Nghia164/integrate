import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
} from "recharts";
import Block from "./Block";
import { C, AXIS_TICK, TOOLTIP_STYLE, TOOLTIP_TEXT, fmtNum, SHIFT_STYLE } from "../dashboardData";

export default function FillRateChartBlock({ fillByShift = [] }) {
  return (
    <Block title="Tỷ lệ lấp đầy ca" subtitle="Vị trí đã đủ người trên vị trí cần">
      <div className="min-h-[150px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fillByShift} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="shift" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => `Ca ${v.toLowerCase()}`} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              contentStyle={TOOLTIP_STYLE}
              {...TOOLTIP_TEXT}
              labelFormatter={(v) => `Ca ${String(v).toLowerCase()}`}
              formatter={(v, n, item) => [`${fmtNum(v)}% (${item.payload.filled}/${item.payload.required} vị trí)`, "Lấp đầy"]}
            />
            <Bar dataKey="rate" radius={[5, 5, 0, 0]} maxBarSize={36}>
              {fillByShift.map((r) => (
                <Cell key={r.shift} fill={(SHIFT_STYLE[r.shift] ?? SHIFT_STYLE["Chiều"]).dot} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Block>
  );
}
