import { MessageSquare, Trash2 } from "lucide-react";

const fmtTime = (ts) =>
  new Date(ts).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

// Lịch sử trò chuyện (gọn: thấy 3 cuộc gần nhất, còn lại cuộn trong danh sách)
export default function HistoryCard({ conversations, activeId, disabled, onOpen, onDelete }) {
  return (
    <section className="shrink-0">
      <h3 className="mb-2 text-[14px] font-semibold text-slate-900">Lịch sử trò chuyện</h3>
      {conversations.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-[13px] text-slate-400">Chưa có cuộc trò chuyện nào.</p>
      ) : (
        <ul className="max-h-[108px] space-y-0.5 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id} className={`group flex items-center rounded-lg ${c.id === activeId ? "bg-slate-100" : "hover:bg-slate-50"}`}>
              <button type="button" onClick={() => onOpen(c)} disabled={disabled} className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-left disabled:opacity-50">
                <MessageSquare size={14} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-slate-800">{c.title}</span>
                <span className="shrink-0 text-[11px] text-slate-400">{fmtTime(c.updatedAt)}</span>
              </button>
              <button type="button" aria-label={`Xóa cuộc trò chuyện ${c.title}`} onClick={() => onDelete(c.id)} className="mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 opacity-0 hover:bg-slate-200 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}