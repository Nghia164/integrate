/**
 * Tầng: Trang quản lý (Manager / Assistant)
 * Chức năng: Trợ lý AI hội thoại (US31)
 * Quy tắc: Dùng chung PageCard (tiêu đề h1 + nút hành động ở hàng 1, mô tả ở hàng 2)
 */

import { useEffect, useRef, useState } from "react";
import { Plus, Send, Sparkles } from "lucide-react";
import { Button } from "../../../components/FormKit";
import { PageCard } from "../../../components/PageKit";
import { askAssistant, blocksToText, IS_MOCK } from "../../../services/assistantService";
import MessageBubble, { Typing } from "./MessageBubble";
import HistoryCard from "./HistoryCard";
import SuggestedQuestions from "./SuggestedQuestions";
import TipCard from "./TipCard";

const WELCOME = ["Ai nghỉ tuần này?", "Ca nào đang thiếu người?", "Tổng lương tháng này bao nhiêu?", "Có ca nào thiếu giờ ra không?"];
const CHIPS = ["Tóm tắt tuần này", "Ai nghỉ tuần này?", "Ca nào đang thiếu người?", "Báo cáo giờ làm"];

const uid = () => Math.random().toString(36).slice(2);

const STORAGE_KEY = "assistant_conversations_v1";
const MAX_CONVERSATIONS = 30;
const loadConversations = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
};

const toHistory = (msgs) =>
  msgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-6)
    .map((m) => ({ role: m.role, text: m.role === "user" ? m.text : blocksToText(m.blocks) }));

export default function AssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(null);
  const scrollRef = useRef(null);
  const requestId = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length === 0 || !activeId) return;
    setConversations((prev) => {
      const old = prev.find((c) => c.id === activeId);
      if (old?.messages === messages) return prev;
      const title = messages.find((m) => m.role === "user")?.text.slice(0, 40) ?? "Cuộc trò chuyện";
      const updated = { id: activeId, title, updatedAt: Date.now(), messages };
      return [updated, ...prev.filter((c) => c.id !== activeId)].slice(0, MAX_CONVERSATIONS);
    });
  }, [messages, activeId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      /* Bỏ qua lỗi bộ nhớ trình duyệt đầy */
    }
  }, [conversations]);

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
    const question = text.trim();
    if (!question || loading) return;
    const history = toHistory(messages);
    if (!activeId) setActiveId(uid());
    setMessages((m) => [...m, { id: uid(), role: "user", text: question }]);
    setInput("");
    run(question, history);
  };

  const retry = (errorMsg) => {
    if (loading) return;
    const idx = messages.findIndex((m) => m.id === errorMsg.id);
    setMessages(messages.slice(0, idx));
    run(errorMsg.question, toHistory(messages.slice(0, idx - 1)));
  };

  const newChat = () => {
    requestId.current++;
    setActiveId(null);
    setMessages([]);
    setInput("");
    setLoading(false);
  };

  const openConversation = (c) => {
    if (loading) return;
    setMessages(c.messages);
    setActiveId(c.id);
    setInput("");
  };

  const deleteConversation = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) newChat();
  };

  return (
    <PageCard
      icon="bot"
      breadcrumb={["Trợ lý", "Trợ lý AI"]}
      title={
        <span className="flex items-center gap-3">
          Trợ lý AI
          {IS_MOCK && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[12px] font-medium text-amber-800">
              Dữ liệu mẫu
            </span>
          )}
        </span>
      }
      subtitle="Hỏi nhanh về nhân sự, lịch làm, chấm công và lương. AI chỉ phân tích và gợi ý, quyết định luôn thuộc về bạn."
      actions={
        <Button type="button" variant="outline" size="lg" onClick={newChat} icon={<Plus size={16} />}>
          Cuộc trò chuyện mới
        </Button>
      }
    >
      <div className="grid min-h-0 flex-1 pt-2 lg:grid-cols-[1fr_340px]">
        {/* KHUNG CHAT */}
        <section className="min-h-0 pb-2">
          <div className="flex h-[560px] flex-col rounded-2xl bg-slate-100 lg:h-full">
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {messages.length === 0 ? (
                <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm"><Sparkles size={28} /></span>
                  <h2 className="mt-4 text-[18px] font-semibold text-slate-900">Xin chào, mình có thể giúp gì cho bạn?</h2>
                  <p className="mt-1 text-[14px] text-slate-500">Mình chỉ phân tích và gợi ý. Mọi quyết định vẫn thuộc về bạn.</p>
                  <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                    {WELCOME.map((q) => (
                      <button key={q} type="button" onClick={() => send(q)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-[14px] text-slate-800 transition-colors hover:bg-slate-50">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} message={m} onRetry={retry} onAsk={send} />)
              )}
              {loading && <Typing />}
            </div>

            <div className="shrink-0 px-4 pb-4">
              {messages.length > 0 && (
                <div className="mb-3 flex flex-wrap justify-center gap-2">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={loading}
                      onClick={() => send(chip)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-xs transition-colors hover:border-[#3F62C4]/40 hover:bg-[#EEF2FB] hover:text-[#3F62C4] disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
              {/* Viền gradient nhẹ như ảnh mẫu */}
              <div className="rounded-2xl bg-gradient-to-r from-sky-300/70 via-white to-rose-300/70 p-[1.5px] shadow-sm">
                <div className="flex items-end gap-2 rounded-[14px] bg-white p-2">
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
                    placeholder="Nhập câu hỏi, ví dụ: Ai nghỉ tuần này?"
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
              </div>
              <p className="mt-2 text-center text-[12px] text-slate-500">AI có thể sai. Không gửi mật khẩu, số căn cước hay số tài khoản cho AI. Hãy kiểm tra lại số liệu trước khi quyết định.</p>
            </div>
          </div>
        </section>

        {/* CỘT PHẢI: lịch sử, câu hỏi gợi ý và thẻ gợi ý của AI */}
        <aside className="flex min-h-0 flex-col gap-4 border-t border-slate-200 bg-white p-5 lg:border-l lg:border-t-0">
          <HistoryCard conversations={conversations} activeId={activeId} disabled={loading} onOpen={openConversation} onDelete={deleteConversation} />
          <SuggestedQuestions disabled={loading} onAsk={send} />
          <TipCard disabled={loading} onAsk={send} />
        </aside>
      </div>
    </PageCard>
  );
}
