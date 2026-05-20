import { useMemo, useState } from "react";
import { Bot, SendHorizontal, Sparkles, UserRound } from "lucide-react";
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
    return "AI đề xuất tăng 1 người cho ca chiều Sales, không xếp nhân viên đang nghỉ phép và giữ OT dưới 40 giờ/tuần.";
  }
  if (lower.includes("trễ")) {
    return "Top đi trễ tháng này: Trần Quốc Bảo 4 lần, Nguyễn Bảo Châu 3 lần, Phạm Thanh Đạt 3 lần.";
  }
  if (lower.includes("lương")) {
    return "Lương giảm chủ yếu do 1 lần đi trễ, 1 ngày công thiếu và khoản khấu trừ 380.000 VND trong tháng 05/2026.";
  }
  if (lower.includes("thiếu")) {
    return "Warehouse thiếu 1 người ở ca kho sớm ngày 21/05. Có thể điều Châu Anh Thư hoặc Nguyễn Đức Long nếu không vượt OT.";
  }
  return "Tôi đã kiểm tra dữ liệu mẫu và thấy 3 cảnh báo cần xử lý: đi trễ, thiếu nhân sự kho, OT Support tăng.";
}

export default function AiChat({ compact = false }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Tôi đang theo dõi chấm công, lịch ca và lương tháng 05/2026 cho BIZEN."
    }
  ]);

  const suggestions = useMemo(() => quickPrompts, []);

  async function sendMessage(text = input) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((current) => [...current, { from: "user", text: clean }]);
    setInput("");
    try {
      const payload = await bizenApi.aiChat(clean);
      setMessages((current) => [...current, { from: "ai", text: payload.reply }]);
    } catch {
      setMessages((current) => [...current, { from: "ai", text: buildReply(clean) }]);
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
          <p className="text-xs text-slate-500">HR, ca làm, lương</p>
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
            <p
              className={`max-w-[82%] rounded-lg px-3 py-2 text-sm leading-5 ${
                message.from === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {message.text}
            </p>
            {message.from === "user" ? (
              <div className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-600">
                <UserRound className="h-4 w-4" />
              </div>
            ) : null}
          </div>
        ))}
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
          <button type="submit" className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700" aria-label="Gửi">
            <SendHorizontal className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
