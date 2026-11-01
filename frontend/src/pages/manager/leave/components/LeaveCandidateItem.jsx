import { Check } from "lucide-react";
import { Button } from "../../../../components/FormKit";
import { Avatar } from "../../../../components/TableKit";

// Một ứng viên thay thế do hệ thống gợi ý.
export default function LeaveCandidateItem({ cand, best, onPick }) {
  return (
    <li className={`rounded-lg border p-4 ${best ? "border-slate-900" : "border-slate-300"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <Avatar name={cand.name} size="md" />
          <span>
            <span className="block font-medium text-slate-900">
              {cand.name} {best && <span className="ml-1 rounded border border-slate-300 px-1.5 py-0.5 text-[12px] font-medium">Tối ưu nhất</span>}
            </span>
            <span className="block text-[13px] text-slate-600">{cand.id} • {cand.role}</span>
          </span>
        </span>
        <b className="text-[15px] tabular-nums text-slate-900">{cand.matchScore}% phù hợp</b>
      </div>
      <ul className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-[14px] text-slate-700">
        {cand.reasons.map((r) => (
          <li key={r} className="flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            {r}
          </li>
        ))}
      </ul>
      {onPick && (
        <div className="mt-3 flex justify-end">
          <Button type="button" size="sm" onClick={() => onPick(cand)}>
            Gửi đề nghị cho {cand.name.split(" ").pop()}
          </Button>
        </div>
      )}
    </li>
  );
}
