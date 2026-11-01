import {
  Users,
  Calendar,
  Clock,
  Coffee,
  AlertTriangle,
  Timer,
  ShieldCheck,
  CheckCircle2,
  Settings,
} from "lucide-react";

export default function ScheduleConstraintsCard({
  constraints,
  onToggle,
  onUpdateValue,
}) {
  const renderIcon = (type) => {
    switch (type) {
      case "users":
        return <Users size={17} className="text-[#0F172A]" />;
      case "calendar":
        return <Calendar size={17} className="text-amber-500" />;
      case "clock":
        return <Clock size={17} className="text-[#0F172A]" />;
      case "coffee":
        return <Coffee size={17} className="text-orange-500" />;
      case "alert":
        return <AlertTriangle size={17} className="text-rose-500" />;
      case "timer":
        return <Timer size={17} className="text-emerald-600" />;
      case "shield":
        return <ShieldCheck size={17} className="text-amber-600" />;
      default:
        return <CheckCircle2 size={17} className="text-[#0F172A]" />;
    }
  };

  const getBgColor = (color) => {
    switch (color) {
      case "blue":
        return "bg-[#CBE3F0]";
      case "orange":
        return "bg-amber-50";
      case "indigo":
        return "bg-[#CBE3F0]";
      case "red":
        return "bg-rose-50";
      case "green":
        return "bg-emerald-50";
      case "amber":
        return "bg-amber-50";
      default:
        return "bg-slate-50";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-[#CBE3F0] p-2 text-[#0F172A]">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Ràng buộc khi xếp lịch</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Các ràng buộc giúp hệ thống tạo lịch phù hợp với nhu cầu và quy định của quán.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {constraints.map((c) => (
          <div key={c.id} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getBgColor(c.color)}`}>
                  {renderIcon(c.type)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{c.title}</div>
                  <div className="text-xs text-slate-400">{c.desc}</div>
                </div>
              </div>

              {/* Ràng buộc cứng: Luôn áp dụng; Ràng buộc mềm: Công tắc bật/tắt */}
              {c.category === "hard" ? (
                <span className="shrink-0 text-xs font-medium text-slate-500 whitespace-nowrap pt-1">
                  Luôn áp dụng
                </span>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={c.enabled}
                  aria-label={`Bật tắt ràng buộc ${c.title}`}
                  onClick={() => onToggle(c.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    c.enabled ? "bg-[#0F172A]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      c.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            </div>

            {c.inputLabel && (
              <div className="mt-2.5 ml-11 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-xs text-slate-500">{c.inputLabel}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={c.value}
                    onChange={(e) => onUpdateValue(c.id, Number(e.target.value) || 0)}
                    className="h-7 w-16 rounded border border-slate-200 bg-white text-center text-xs font-semibold text-slate-700 outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                  />
                  <span className="text-xs text-slate-400">{c.unit}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
