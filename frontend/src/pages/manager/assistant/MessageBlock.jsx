import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Database, Lightbulb } from "lucide-react";

const INSIGHT = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", Icon: Lightbulb },
  warn: { box: "border-amber-200 bg-amber-50 text-amber-900", Icon: AlertTriangle },
  good: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", Icon: CheckCircle2 },
};
const NOTE_TONE = { good: "text-emerald-600", bad: "text-rose-600" };
const actionClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-900 hover:bg-slate-100";

export default function MessageBlock({ block }) {
  switch (block.type) {
    case "text":
      return <p>{block.text}</p>;

    case "list":
      return (
        <ul className="list-disc space-y-1 pl-5">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-[13px]">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                {block.columns.map((c) => (
                  <th key={c} className="px-3 py-2 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {row.map((cell, j) => (
                    <td key={j} className="whitespace-nowrap px-3 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "stats":
      return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {block.items.map((i) => (
            <div key={i.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <p className="text-[12px] text-slate-500">{i.label}</p>
              <p className="text-[20px] font-semibold leading-tight tabular-nums text-slate-900">{i.value}</p>
              {i.note && <p className={`text-[12px] ${NOTE_TONE[i.tone] ?? "text-slate-500"}`}>{i.note}</p>}
            </div>
          ))}
        </div>
      );

    case "bars": {
      const max = block.max ?? Math.max(...block.items.map((i) => i.value), 1);
      return (
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
          {block.title && <p className="text-[12px] font-medium text-slate-500">{block.title}</p>}
          {block.items.map((i) => (
            <div key={i.label}>
              <div className="mb-1 flex justify-between gap-3 text-[13px]">
                <span>{i.label}</span>
                <span className="tabular-nums text-slate-600">{i.display ?? i.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (i.value / max) * 100)}%`,
                    backgroundColor: i.color ?? "#0f172a",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "insight": {
      const { box, Icon } = INSIGHT[block.tone] ?? INSIGHT.info;
      return (
        <div className={`flex gap-2.5 rounded-xl border px-3.5 py-3 ${box}`}>
          <Icon size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold">{block.title ?? "Nhận xét"}</p>
            <p className="text-[13px]">{block.text}</p>
          </div>
        </div>
      );
    }

    case "actions":
      return (
        <div className="flex flex-wrap gap-2">
          {block.items.map((a) => (
            <Link key={a.label} to={a.to} className={actionClass}>
              {a.label} <ArrowRight size={14} />
            </Link>
          ))}
        </div>
      );

    case "link":
      return (
        <Link to={block.to} className={`${actionClass} w-fit`}>
          {block.label} <ArrowRight size={14} />
        </Link>
      );

    case "source":
      return (
        <p className="flex items-center gap-1.5 text-[12px] text-slate-400">
          <Database size={12} /> {block.text}
        </p>
      );

    default:
      return null;
  }
}
