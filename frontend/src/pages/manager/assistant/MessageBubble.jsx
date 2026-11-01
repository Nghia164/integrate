import { useEffect, useState } from "react";
import { RotateCw, Sparkles } from "lucide-react";
import MessageBlock from "./MessageBlock";

// Các kiểu hiển thị 1 tin nhắn: người dùng, trợ lý, lỗi, đang trả lời.
const ERROR_NOTE = {
  timeout: "Trợ lý phản hồi quá chậm.",
  rate_limit: "Đã vượt hạn mức sử dụng AI.",
};
const STEPS = ["Đang đọc dữ liệu hệ thống…", "Đang phân tích…", "Đang soạn câu trả lời…"];

export function Avatar({ tone = "dark" }) {
  return (
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ${tone === "error" ? "bg-rose-500" : "bg-slate-900"}`}>
      <Sparkles size={16} />
    </span>
  );
}

// Dòng trạng thái đổi theo từng bước để người dùng thấy AI đang làm việc
export function Typing() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-start gap-3">
      <Avatar />
      <div className="flex items-center gap-2 px-1 pt-1.5 text-[14px] text-slate-500">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 150, 300].map((d) => (
            <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
          ))}
        </span>
        {STEPS[step]}
      </div>
    </div>
  );
}

export default function MessageBubble({ message, onRetry, onAsk }) {
  if (message.role === "user")
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-slate-200 px-4 py-2.5 text-[14px] text-slate-800">{message.text}</p>
      </div>
    );

  if (message.role === "error")
    return (
      <div className="flex gap-3">
        <Avatar tone="error" />
        <div role="alert" className="max-w-[85%] space-y-2 rounded-2xl rounded-tl-sm border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-900">
          <p className="font-medium">Trợ lý AI tạm thời không khả dụng, vui lòng thử lại sau.</p>
          <p className="text-[13px] text-rose-800">
            {ERROR_NOTE[message.code]} Các chức năng khác như xếp lịch, chấm công vẫn hoạt động bình thường.
          </p>
          <button type="button" onClick={() => onRetry(message)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[13px] font-medium text-rose-900 hover:bg-rose-100">
            <RotateCw size={14} /> Thử lại
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex gap-3">
      <Avatar />
      <div className="min-w-0 max-w-[88%] flex-1 space-y-3 pt-1 text-[14px] text-slate-800">
        {message.blocks.map((b, i) => <MessageBlock key={i} block={b} />)}
        {message.suggestions && (
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((s) => (
              <button key={s} type="button" onClick={() => onAsk(s)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] text-slate-700 hover:bg-slate-100">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}