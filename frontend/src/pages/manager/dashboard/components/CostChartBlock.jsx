import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from "recharts";
import Block from "./Block";
import { C, AXIS_TICK, TOOLTIP_STYLE, TOOLTIP_TEXT, fmtMoney } from "../dashboardData";

export default function CostChartBlock({ costPerBucket = [] }) {
  const costUnit = costPerBucket[0]?.label?.startsWith("Tuần") ? "tuần" : "ngày";

  return (
    <Block title="Chi phí lương theo kỳ" subtitle={`Tiền lương tính từ giờ thực tế, chia theo ${costUnit}`}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={costPerBucket}>
            <defs>
              <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.main} stopOpacity={0.18} />
                <stop offset="100%" stopColor={C.main} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip
              cursor={{ stroke: C.soft }}
              contentStyle={TOOLTIP_STYLE}
              {...TOOLTIP_TEXT}
              formatter={(v) => [fmtMoney(v), "Chi phí lương"]}
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke={C.main}
              strokeWidth={2}
              fill="url(#costFill)"
              activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: C.main }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Block>
  );
}
