import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import Block from "./Block";
import { C, AXIS_TICK, TOOLTIP_STYLE, TOOLTIP_TEXT, fmtNum } from "../dashboardData";

export default function WorkHoursBarBlock({ hoursPerEmployee = [] }) {
  return (
    <Block
      title="Giờ theo lịch so với giờ thực tế"
      subtitle="Số giờ được xếp lịch và số giờ thực sự làm của từng nhân viên"
    >
      <div className="overflow-x-auto">
        <div className="h-64" style={{ minWidth: hoursPerEmployee.length * 56 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hoursPerEmployee} barGap={4}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                interval={0}
                tickFormatter={(v) => v.split(" ").slice(-1)[0]}
              />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={34} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={TOOLTIP_STYLE}
                {...TOOLTIP_TEXT}
                formatter={(v) => `${fmtNum(v)} giờ`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                height={32}
                formatter={(v) => <span className="text-[12.5px] text-slate-600">{v}</span>}
              />
              <Bar dataKey="scheduled" name="Theo lịch" fill={C.soft} radius={[5, 5, 0, 0]} maxBarSize={22} />
              <Bar dataKey="actual" name="Thực tế" fill={C.main} radius={[5, 5, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Block>
  );
}
