import { Link } from "react-router-dom";
import Block from "./Block";

function TodoItem({ to, label, count }) {
  const has = count > 0;
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-[14px] text-slate-900 transition-colors hover:bg-slate-50"
    >
      <span className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${has ? "bg-rose-500" : "bg-slate-300"}`} />
        {label}
      </span>
      <span
        className={`min-w-[30px] rounded-md px-2 py-0.5 text-center text-[12px] font-semibold tabular-nums ${
          has ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

/**
 * Khối "Cần xử lý" (đơn nghỉ, đổi ca, ca thiếu người)
 */
export default function TodoBlock({ todo, className = "" }) {
  return (
    <Block title="Cần xử lý" subtitle="Bấm vào từng mục để xử lý" className={className}>
      <div className="flex flex-1 flex-col justify-between gap-1">
        <TodoItem to="/manager/leave" label="Đơn xin nghỉ chờ duyệt" count={todo?.pendingLeave ?? 0} />
        <TodoItem to="/manager/shift-exchange" label="Yêu cầu đổi ca chờ duyệt" count={todo?.pendingExchange ?? 0} />
        <TodoItem to="/manager/open-shifts" label="Ca còn thiếu người" count={todo?.understaffed ?? 0} />
      </div>
    </Block>
  );
}
