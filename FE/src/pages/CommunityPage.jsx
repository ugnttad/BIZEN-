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
  const typingStopTimerRef = useRef(null);
  const typingActiveRef = useRef(false);
  const lastTypingPingRef = useRef(0);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadCommunity() {
    setError("");
    const [memberRows, messageRows, typingRows] = await Promise.all([bizenApi.communityMembers(), bizenApi.communityMessages(), bizenApi.communityTyping()]);
    setMembers(memberRows);
    setMessages(messageRows);
    setTypingUsers(typingRows);
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

    const messageTimer = window.setInterval(() => {
      if (document.hidden) return;
      bizenApi.communityMessages().then(setMessages).catch(() => {});
    }, 2000);
    const typingTimer = window.setInterval(() => {
      if (document.hidden) return;
      bizenApi.communityTyping().then(setTypingUsers).catch(() => {});
    }, 1500);
    const memberTimer = window.setInterval(() => {
      if (document.hidden) return;
      bizenApi.communityMembers().then(setMembers).catch(() => {});
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(messageTimer);
      window.clearInterval(typingTimer);
      window.clearInterval(memberTimer);
      if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
      if (typingActiveRef.current) bizenApi.updateCommunityTyping(false).catch(() => {});
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const activeMembers = useMemo(() => members.filter((member) => member.status === "Active"), [members]);
  const typingEmployeeIds = useMemo(() => new Set(typingUsers.map((item) => item.senderEmployeeId).filter(Boolean)), [typingUsers]);
  const typingText = useMemo(() => {
    if (!typingUsers.length) return "";
    const names = typingUsers.map((item) => item.senderName).filter(Boolean);
    if (names.length === 1) return `${names[0]} đang nhập...`;
    if (names.length === 2) return `${names[0]} và ${names[1]} đang nhập...`;
    return `${names[0]} và ${names.length - 1} người khác đang nhập...`;
  }, [typingUsers]);

  function setTyping(nextValue) {
    const now = Date.now();
    if (nextValue && typingActiveRef.current && now - lastTypingPingRef.current < 1200) return;
    typingActiveRef.current = nextValue;
    lastTypingPingRef.current = now;
    bizenApi.updateCommunityTyping(nextValue).catch(() => {});
  }

  function scheduleTypingStop() {
    if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = window.setTimeout(() => {
      setTyping(false);
    }, 2200);
  }

  function handleBodyChange(event) {
    const nextBody = event.target.value;
    setBody(nextBody);
    if (nextBody.trim()) {
      setTyping(true);
      scheduleTypingStop();
      return;
    }
    if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
    setTyping(false);
  }

  function handleBlur() {
    if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
    setTyping(false);
  }

  async function submitMessage(event) {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError("");
    if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
    setTyping(false);
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
                {typingEmployeeIds.has(member.id) ? (
                  <p className="inline-flex items-center gap-1 truncate text-xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Đang nhập...
                  </p>
                ) : (
                  <p className="truncate text-xs text-slate-500">{member.position || member.department}</p>
                )}
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
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-slate-950">Bảng tin doanh nghiệp</h2>
              <p className="text-sm text-slate-500">Mọi người trong workspace đều đọc và gửi được.</p>
            </div>
            <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Realtime
            </span>
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
          {typingText ? (
            <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex gap-0.5 rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
              </span>
              {typingText}
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={submitMessage} className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={body}
              onChange={handleBodyChange}
              onBlur={handleBlur}
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
