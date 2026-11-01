import { Sparkles } from "lucide-react";

// Thẻ "Gợi ý của AI" (nền gradient như ảnh mẫu). Bấm nút chỉ là đặt câu hỏi, AI không tự làm gì.
export default function TipCard({ disabled, onAsk }) {
  return (
    <section className="shrink-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-100 via-white to-rose-100 p-3.5">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
        <Sparkles size={15} /> Gợi ý của AI
      </h3>
      <p className="mt-1 text-[12px] text-slate-600">Tiết kiệm thời gian: để mình tóm tắt tình hình tuần này.</p>
      <button type="button" onClick={() => onAsk("Tóm tắt tuần này")} disabled={disabled} className="mt-2.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50">
        Tóm tắt tuần này
      </button>
    </section>
  );
}