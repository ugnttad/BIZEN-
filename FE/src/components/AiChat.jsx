import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, SendHorizontal, Sparkles, UserRound, Zap } from "lucide-react";
import { bizenApi } from "../modules/api/bizenApi";

const quickPrompts = [
  "Xếp lịch tuần sau cho Pha chế",
  "Ai đi trễ nhiều nhất tháng này?",
  "Tại sao lương của Thanh Đạt giảm?",
  "Hôm nay bộ phận nào thiếu người?"
];

function buildReply(text) {
  const lower = text.toLowerCase();
  if (lower.includes("lịch") || lower.includes("xếp")) {
    return "Tôi chưa gọi được AI backend, nhưng dữ liệu Neon cho thấy cần tránh nhân viên đang nghỉ phép và ưu tiên bù ca thiếu người.";
  }
  if (lower.includes("trễ")) {
    return "Tôi chưa gọi được AI backend. Hãy kiểm tra bảng chấm công: trạng thái Late đang được lấy trực tiếp từ Neon.";
  }
  if (lower.includes("lương")) {
    return "Tôi chưa gọi được AI backend. Bảng lương vẫn có breakdown từ Neon: base salary, ngày công, OT, bonus, deduction và final salary.";
  }
  if (lower.includes("thiếu")) {
    return "Tôi chưa gọi được AI backend. Dashboard bộ phận đang dùng headcount thật từ Neon để xác định thiếu nhân sự.";
  }
  return "Tôi chưa gọi được AI backend. Kiểm tra backend deploy, API URL và CORS.";
}

export default function AiChat({ compact = false }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "ai",
      text: "Tôi là BIZEN AI. Tôi có thể đọc dữ liệu Neon về chấm công, lịch ca, nghỉ phép và lương để hỗ trợ người vận hành."
    }
  ]);

  const suggestions = useMemo(() => quickPrompts, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function sendMessage(text = input) {
    const clean = text.trim();
    if (!clean || loading) return;
    if (clean.length > 500) {
      setMessages((current) => [...current, { from: "ai", text: "Câu hỏi tối đa 500 ký tự để BIZEN AI trả lời gọn và ổn định." }]);
      return;
    }
    const aiMessageId = `ai-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, from: "user", text: clean },
      { id: aiMessageId, from: "ai", text: "", mode: "streaming", streaming: true }
    ]);
    setInput("");
    setLoading(true);

    let receivedStreamText = false;
    try {
      await bizenApi.aiChatStream(clean, {
        onEvent: (event, payload) => {
          if (event === "meta") {
            setMessages((current) =>
              current.map((message) => (message.id === aiMessageId ? { ...message, mode: payload?.mode || "gemini", issue: payload?.issue || null } : message))
            );
          }

          if (event === "delta" && payload?.delta) {
            receivedStreamText = true;
            setMessages((current) =>
              current.map((message) => (message.id === aiMessageId ? { ...message, text: `${message.text || ""}${payload.delta}` } : message))
            );
          }

          if (event === "done") {
            setMessages((current) =>
              current.map((message) =>
                message.id === aiMessageId
                  ? {
                      ...message,
                      mode: payload?.model ? `${payload.mode} · ${payload.model}` : payload?.mode || message.mode,
                      issue: payload?.issue || message.issue || null,
                      streaming: false
                    }
                  : message
              )
            );
          }
        }
      });

      if (!receivedStreamText) {
        const payload = await bizenApi.aiChat(clean);
        setMessages((current) =>
          current.map((message) =>
            message.id === aiMessageId ? { ...message, text: payload.reply, mode: payload.mode, issue: payload.issue || null, streaming: false } : message
          )
        );
      }
    } catch {
      setMessages((current) =>
        current.map((message) => (message.id === aiMessageId ? { ...message, text: buildReply(clean), mode: "client-fallback", streaming: false } : message))
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={compact ? "premium-card rounded-2xl p-3" : "premium-card sticky top-24 rounded-2xl"}>
      <header className="relative z-10 border-b border-slate-200/80 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-950">BIZEN AI</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Realtime
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">Neon data + Gemini 2.5 Flash</p>
          </div>
        </div>
      </header>

      <div className={compact ? "relative z-10 max-h-64 space-y-3 overflow-y-auto p-3 no-scrollbar" : "relative z-10 max-h-[520px] space-y-3 overflow-y-auto p-4 no-scrollbar"}>
        {messages.map((message, index) => (
          <div key={message.id || `${message.from}-${index}`} className={`animate-float-in flex gap-2 ${message.from === "user" ? "justify-end" : "justify-start"}`}>
            {message.from === "ai" ? (
              <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Bot className="h-4 w-4" />
              </div>
            ) : null}
            <div
              className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-5 shadow-sm ${
                message.from === "user"
                  ? "rounded-br-md bg-blue-600 text-white shadow-blue-600/20"
                  : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
              }`}
            >
              <p>{message.text || (message.streaming ? "Đang tạo phản hồi realtime..." : "")}</p>
              {message.issue ? (
                <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] font-semibold leading-4 text-amber-800">
                  {message.issue.message} {message.issue.action}
                </p>
              ) : null}
              {message.mode ? <p className="mt-1 text-[11px] font-bold text-slate-400">{message.mode}</p> : null}
            </div>
            {message.from === "user" ? (
              <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                <UserRound className="h-4 w-4" />
              </div>
            ) : null}
          </div>
        ))}

        {loading ? (
          <div className="animate-float-in flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang đọc dữ liệu Neon và tạo câu trả lời...
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative z-10 space-y-3 border-t border-slate-200/80 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-slate-500">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          Gợi ý nhanh
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {suggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onClick={() => sendMessage(suggestion)}
              className="btn-motion shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form
          className="soft-focus flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <MessageCircle className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Hỏi AI..."
            className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-motion grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Gửi"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </section>
  );
}
