// Danh sách câu hỏi gợi ý theo nhóm. Tiêu đề đứng yên, chỉ danh sách bên dưới cuộn.
const QUESTIONS = [
  { group: "Nhân sự", items: ["Ai nghỉ tuần này?", "Ca nào đang thiếu người?", "Ai có thể thay ca nghỉ sắp tới?"] },
  { group: "Chấm công", items: ["Ai đi trễ nhiều nhất tháng này?", "Có ca nào thiếu giờ ra không?"] },
  { group: "Giờ làm & lương", items: ["Ai làm vượt giờ tối đa tuần này?", "Tổng lương tháng này bao nhiêu?"] },
];

export default function SuggestedQuestions({ disabled, onAsk }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-slate-200 pt-4">
      <h3 className="mb-2 shrink-0 text-[14px] font-semibold text-slate-900">Câu hỏi gợi ý</h3>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {QUESTIONS.map((g) => (
          <div key={g.group}>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-slate-400">{g.group}</p>
            <div className="space-y-1.5">
              {g.items.map((q) => (
                <button key={q} type="button" onClick={() => onAsk(q)} disabled={disabled} className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}