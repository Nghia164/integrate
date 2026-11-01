import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Send, Plus, ArrowUpRight } from "lucide-react";
import { askAssistant, blocksToText, IS_MOCK } from "../../../services/assistantService";
import MessageBubble, { Typing } from "./MessageBubble";

// Khung hỏi nhanh Trợ lý AI đặt trong Dashboard (trả lời ngay tại chỗ).
// Đặt file tại: src/pages/manager/assistant/AssistantPanel.jsx (cạnh MessageBubble.jsx).
// Dùng đúng askAssistant / MessageBubble của trang Trợ lý AI nên câu trả lời hiển thị giống hệt.
// Cuộc trò chuyện ở đây không lưu vào lịch sử; muốn hỏi sâu hơn thì bấm "Mở trang Trợ lý AI".
//
// props: suggestions - mảng câu hỏi gợi ý (hiện khi chưa có tin nhắn)

const uid = () => Math.random().toString(36).slice(2);

// Chỉ gửi 6 tin gần nhất để AI hiểu ngữ cảnh mà không gửi thừa dữ liệu (giống trang Trợ lý AI)
const toHistory = (msgs) =>
  msgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-6)
    .map((m) => ({ role: m.role, text: m.role === "user" ? m.text : blocksToText(m.blocks) }));

export default function AssistantPanel({ suggestions = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const requestId = useRef(0); // bỏ qua kết quả trả về muộn của cuộc trò chuyện cũ

  // Cuộn trong khung chat (không cuộn cả trang)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const run = async (question, history) => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const answer = await askAssistant(question, history);
      if (id === requestId.current) setMessages((m) => [...m, { id: uid(), role: "assistant", ...answer }]);
    } catch (err) {
      if (id === requestId.current) setMessages((m) => [...m, { id: uid(), role: "error", code: err.code, question }]);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const send = (text = input) => {
    const question = String(text).trim();
    if (!question || loading) return;
    const history = toHistory(messages);
    setMessages((m) => [...m, { id: uid(), role: "user", text: question }]);
    setInput("");
    run(question, history);
  };

  const retry = (errorMsg) => {
    if (loading) return;
    const idx = messages.findIndex((m) => m.id === errorMsg.id);
    setMessages(messages.slice(0, idx)); // bỏ thông báo lỗi, giữ lại câu hỏi
    run(errorMsg.question, toHistory(messages.slice(0, idx - 1)));
  };

  const newChat = () => {
    requestId.current++;
    setMessages([]);
    setInput("");
    setLoading(false);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      {/* Đầu khối */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm">
            <Sparkles size={18} strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              Trợ lý AI
              {IS_MOCK && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[12px] font-medium text-amber-800">Dữ liệu mẫu</span>}
            </h2>
            <p className="text-[13px] text-slate-500">Hỏi nhanh về giờ làm, chấm công, lương hoặc xếp lịch. AI chỉ phân tích và gợi ý.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={newChat}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Plus size={14} /> Hỏi lại từ đầu
            </button>
          )}
          <Link
            to="/manager/assistant"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Mở trang Trợ lý AI <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Hội thoại (chỉ hiện khi đã hỏi) */}
      {messages.length > 0 && (
        <div ref={scrollRef} className="mt-4 max-h-[420px] space-y-5 overflow-y-auto rounded-xl bg-slate-100 p-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} onRetry={retry} onAsk={send} />
          ))}
          {loading && <Typing />}
        </div>
      )}

      {/* Ô nhập */}
      <div className="mt-4 flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2">
        <textarea
          rows={1}
          maxLength={500}
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nhập câu hỏi, ví dụ: Ca nào đang thiếu người?"
          aria-label="Câu hỏi cho Trợ lý AI"
          className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[14px] font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={15} /> Gửi
        </button>
      </div>

      {/* Gợi ý (chỉ khi chưa có tin nhắn) */}
      {messages.length === 0 && suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}