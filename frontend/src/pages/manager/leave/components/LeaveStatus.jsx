import { STATUS } from "../leaveShared";

export default function LeaveStatus({ status }) {
  const { label, hex } = STATUS[status] ?? STATUS.pending;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[14px] font-medium text-slate-900">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
      {label}
    </span>
  );
}
