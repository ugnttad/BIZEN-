import { useMemo, useState } from "react";
import { Bot, Loader2, SendHorizontal, Sparkles, UserRound } from "lucide-react";
import { bizenApi } from "../modules/api/bizenApi";

const quickPrompts = [
  "Xếp lịch tuần sau cho Sales",
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
    return "Tôi chưa gọi được AI backend. Dashboard phòng ban đang dùng headcount thật từ Neon để xác định thiếu nhân sự.";
  }
  return "Tôi chưa gọi được AI backend. Kiểm tra backend deploy, API URL và CORS.";
}

export default function AiChat({ compact = false }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Tôi là BIZEN AI. Tôi có thể đọc dữ liệu Neon về chấm công, lịch ca, nghỉ phép và lương để trả lời cho HR."
    }
  ]);

  const suggestions = useMemo(() => quickPrompts, []);

  async function sendMessage(text = input) {
    const clean = text.trim();
    if (!clean || loading) return;
    setMessages((current) => [...current, { from: "user", text: clean }]);
    setInput("");
    setLoading(true);

    try {
      const payload = await bizenApi.aiChat(clean);
      setMessages((current) => [...current, { from: "ai", text: payload.reply, mode: payload.mode }]);
    } catch {
      setMessages((current) => [...current, { from: "ai", text: buildReply(clean), mode: "client-fallback" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={compact ? "rounded-lg border border-slate-200 bg-white p-3" : "sticky top-4 rounded-lg border border-slate-200 bg-white shadow-sm"}>
      <header className="flex items-center gap-3 border-b border-slate-200 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">BIZEN AI</h2>
          <p className="text-xs text-slate-500">Neon data + OpenAI khi có API key</p>
        </div>
      </header>

      <div className={compact ? "max-h-64 space-y-3 overflow-y-auto p-3" : "max-h-[520px] space-y-3 overflow-y-auto p-4 no-scrollbar"}>
        {messages.map((message, index) => (
          <div key={`${message.from}-${index}`} className={`flex gap-2 ${message.from === "user" ? "justify-end" : "justify-start"}`}>
            {message.from === "ai" ? (
              <div className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-blue-700">
                <Bot className="h-4 w-4" />
              </div>
            ) : null}
            <div
              className={`max-w-[82%] rounded-lg px-3 py-2 text-sm leading-5 ${
                message.from === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              <p>{message.text}</p>
              {message.mode ? <p className="mt-1 text-[11px] font-semibold text-slate-400">{message.mode}</p> : null}
            </div>
            {message.from === "user" ? (
              <div className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-600">
                <UserRound className="h-4 w-4" />
              </div>
            ) : null}
          </div>
        ))}

        {loading ? (
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            Đang đọc dữ liệu Neon và tạo câu trả lời...
          </div>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-slate-200 p-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {suggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onClick={() => sendMessage(suggestion)}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Hỏi AI..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button type="submit" disabled={loading} className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" aria-label="Gửi">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </section>
  );
}
