import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, UsersRound } from "lucide-react";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import { bizenApi } from "../modules/api/bizenApi";
import { getAuthUser } from "../modules/auth/authStore";

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
}

export default function CommunityPage() {
  const user = getAuthUser();
  const bottomRef = useRef(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadCommunity() {
    setError("");
    const [memberRows, messageRows] = await Promise.all([bizenApi.communityMembers(), bizenApi.communityMessages()]);
    setMembers(memberRows);
    setMessages(messageRows);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadCommunity()
      .catch((requestError) => {
        if (active) setError(requestError.message || "Không tải được cộng đồng.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const timer = window.setInterval(() => {
      loadCommunity().catch(() => {});
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const activeMembers = useMemo(() => members.filter((member) => member.status === "Active"), [members]);

  async function submitMessage(event) {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError("");
    try {
      const sent = await bizenApi.sendCommunityMessage(body.trim());
      setMessages((current) => [...current, sent]);
      setBody("");
    } catch (requestError) {
      setError(requestError.message || "Không gửi được tin nhắn.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-120px)] gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-blue-700">Community</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">Cộng đồng nội bộ</h1>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <UsersRound className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">Tin nhắn chỉ hiển thị trong cùng doanh nghiệp/workspace.</p>

        <div className="mt-5 rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-bold text-slate-950">{activeMembers.length}/{members.length} thành viên đang hoạt động</p>
          <p className="mt-1 text-xs text-slate-500">Dùng để báo ca, nhắc checklist hoặc trao đổi nhanh trong quán.</p>
        </div>

        <div className="mt-5 space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
              <Avatar name={member.name} src={member.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">{member.name}</p>
                <p className="truncate text-xs text-slate-500">{member.position || member.department}</p>
              </div>
              <StatusBadge status={member.role} />
            </div>
          ))}
          {!members.length && !loading ? <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Chưa có thành viên.</p> : null}
        </div>
      </aside>

      <section className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-slate-950">Bảng tin doanh nghiệp</h2>
              <p className="text-sm text-slate-500">Mọi người trong workspace đều đọc và gửi được.</p>
            </div>
          </div>
        </header>

        {error ? <p className="m-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
          {loading ? (
            <div className="grid h-full min-h-60 place-items-center text-sm text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length ? (
            messages.map((message) => {
              const isMine = message.senderUserId === user?.id || message.senderEmployeeId === user?.employeeId;
              return (
                <div key={message.id} className={`flex gap-3 ${isMine ? "justify-end" : "justify-start"}`}>
                  {!isMine ? <Avatar name={message.senderName} src={message.senderAvatarUrl} size="sm" /> : null}
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${isMine ? "bg-blue-600 text-white" : "bg-white text-slate-800 ring-1 ring-slate-200"}`}>
                    <div className={`mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold ${isMine ? "text-blue-100" : "text-slate-500"}`}>
                      <span>{isMine ? "Bạn" : message.senderName}</span>
                      <span>{formatTime(message.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid h-full min-h-60 place-items-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Chưa có tin nhắn nào. Gửi tin đầu tiên để mở cộng đồng nội bộ.
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={submitMessage} className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={2}
              placeholder="Nhắn cho mọi người trong doanh nghiệp..."
              className="min-h-12 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300"
              aria-label="Gửi tin nhắn"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
