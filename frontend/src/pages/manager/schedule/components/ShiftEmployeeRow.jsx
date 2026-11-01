import { Avatar } from "../../../../components/TableKit";
import { Trash2 } from "lucide-react";

const ROLE_BADGE = {
  "Phục vụ": "bg-[#E8EEFB] text-[#3452A8]",
  "Pha chế": "bg-amber-50 text-amber-700",
  "Thu ngân": "bg-purple-50 text-purple-700",
};

export default function ShiftEmployeeRow({ emp, isConfirmed, onRemove }) {
  return (
    <div className="flex items-center justify-between p-2.5 hover:bg-slate-50">
      <div className="flex items-center gap-2.5">
        <Avatar name={emp.name} size="sm" />
        <div>
          <div className="text-xs font-semibold text-slate-800">{emp.name}</div>
          <div className="text-[11px] text-slate-400">{emp.id} • {emp.phone || "09xxxx"}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[emp.role] || "bg-slate-100 text-slate-700"}`}>
          {emp.role}
        </span>

        {!isConfirmed && (
          <button
            type="button"
            onClick={() => onRemove(emp.id)}
            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            title="Xóa khỏi ca"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
