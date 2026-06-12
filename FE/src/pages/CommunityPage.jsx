import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageCircle, MessagesSquare, Search, Send, UserRound, UsersRound } from "lucide-react";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import { bizenApi } from "../modules/api/bizenApi";
import { getAuthUser } from "../modules/auth/authStore";

const TEAM_CHANNEL = "team";
const DIRECT_CHANNEL = "direct";

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
}

function buildTypingText(rows) {
  if (!rows.length) return "";
  const names = rows.map((item) => item.senderName).filter(Boolean);
  if (names.length === 1) return `${names[0]} đang nhập...`;
  if (names.length === 2) return `${names[0]} và ${names[1]} đang nhập...`;
  return `${names[0]} và ${names.length - 1} người khác đang nhập...`;
}

export default function CommunityPage() {
  const user = getAuthUser();
  const bottomRef = useRef(null);
  const typingStopTimerRef = useRef(null);
  const typingActiveRef = useRef(false);
  const lastTypingPingRef = useRef(0);
  const activeTypingTargetRef = useRef(null);
  const [channel, setChannel] = useState(TEAM_CHANNEL);
  const [members, setMembers] = useState([]);
  const [directPeers, setDirectPeers] = useState([]);
  const [selectedPeerId, setSelectedPeerId] = useState("");
  const [teamMessages, setTeamMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [teamTypingUsers, setTeamTypingUsers] = useState([]);
  const [directTypingUsers, setDirectTypingUsers] = useState([]);
  const [body, setBody] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [directLoading, setDirectLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const selectedPeer = useMemo(() => directPeers.find((peer) => peer.userId === selectedPeerId) || null, [directPeers, selectedPeerId]);
  const visibleMessages = channel === TEAM_CHANNEL ? teamMessages : directMessages;
  const visibleTypingText = channel === TEAM_CHANNEL ? buildTypingText(teamTypingUsers) : buildTypingText(directTypingUsers);
  const activeMembers = useMemo(() => members.filter((member) => member.status === "Active"), [members]);
  const typingEmployeeIds = useMemo(() => new Set(teamTypingUsers.map((item) => item.senderEmployeeId).filter(Boolean)), [teamTypingUsers]);
  const filteredPeers = useMemo(() => {
    const normalized = memberQuery.trim().toLowerCase();
    if (!normalized) return directPeers;
    return directPeers.filter((peer) => [peer.name, peer.email, peer.position, peer.department, peer.role].join(" ").toLowerCase().includes(normalized));
  }, [directPeers, memberQuery]);

  async function loadInitial() {
    setError("");
    const [memberRows, messageRows, typingRows, peerRows] = await Promise.all([
      bizenApi.communityMembers(),
      bizenApi.communityMessages(),
      bizenApi.communityTyping(),
      bizenApi.directChatPeers()
    ]);
    setMembers(memberRows);
    setTeamMessages(messageRows);
    setTeamTypingUsers(typingRows);
    setDirectPeers(peerRows);
    setSelectedPeerId((current) => current || peerRows[0]?.userId || "");
  }

  async function loadDirectChat(peerUserId) {
    if (!peerUserId) {
      setDirectMessages([]);
      setDirectTypingUsers([]);
      return;
    }
    setDirectLoading(true);
    try {
      const [messageRows, typingRows] = await Promise.all([bizenApi.directMessages(peerUserId), bizenApi.directTyping(peerUserId)]);
      setDirectMessages(messageRows);
      setDirectTypingUsers(typingRows);
    } catch (requestError) {
      setError(requestError.message || "Không tải được chat riêng.");
    } finally {
      setDirectLoading(false);
    }
  }

  function sendTyping(target, isTyping) {
    if (!target) return;
    if (target.channel === DIRECT_CHANNEL) {
      if (!target.peerUserId) return;
      bizenApi.updateDirectTyping(target.peerUserId, isTyping).catch(() => {});
      return;
    }
    bizenApi.updateCommunityTyping(isTyping).catch(() => {});
  }

  function stopActiveTyping() {
    if (!activeTypingTargetRef.current) return;
    sendTyping(activeTypingTargetRef.current, false);
    activeTypingTargetRef.current = null;
    typingActiveRef.current = false;
  }

  function getTypingTarget() {
    return {
      channel,
      peerUserId: channel === DIRECT_CHANNEL ? selectedPeerId : null
    };
  }

  function setTyping(nextValue) {
    const target = getTypingTarget();
    if (target.channel === DIRECT_CHANNEL && !target.peerUserId) return;
    const now = Date.now();
    if (nextValue && typingActiveRef.current && now - lastTypingPingRef.current < 1200) return;
    lastTypingPingRef.current = now;
    if (!nextValue) {
      stopActiveTyping();
      return;
    }
    typingActiveRef.current = true;
    activeTypingTargetRef.current = target;
    sendTyping(target, true);
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

  function selectDirectPeer(peerUserId) {
    stopActiveTyping();
    setSelectedPeerId(peerUserId);
    setChannel(DIRECT_CHANNEL);
    setBody("");
  }

  function switchChannel(nextChannel) {
    stopActiveTyping();
    setChannel(nextChannel);
    setBody("");
  }

  async function submitMessage(event) {
    event.preventDefault();
    const cleanBody = body.trim();
    if (!cleanBody) return;
    if (channel === DIRECT_CHANNEL && !selectedPeerId) return;
    setSending(true);
    setError("");
    if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
    setTyping(false);
    try {
      if (channel === DIRECT_CHANNEL) {
        const sent = await bizenApi.sendDirectMessage(selectedPeerId, cleanBody);
        setDirectMessages((current) => [...current, sent]);
        bizenApi.directChatPeers().then(setDirectPeers).catch(() => {});
      } else {
        const sent = await bizenApi.sendCommunityMessage(cleanBody);
        setTeamMessages((current) => [...current, sent]);
      }
      setBody("");
    } catch (requestError) {
      setError(requestError.message || "Không gửi được tin nhắn.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadInitial()
      .catch((requestError) => {
        if (active) setError(requestError.message || "Không tải được cộng đồng.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const memberTimer = window.setInterval(() => {
      if (document.hidden) return;
      Promise.all([bizenApi.communityMembers(), bizenApi.directChatPeers()])
        .then(([memberRows, peerRows]) => {
          setMembers(memberRows);
          setDirectPeers(peerRows);
        })
        .catch(() => {});
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(memberTimer);
      if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
      stopActiveTyping();
    };
  }, []);

  useEffect(() => {
    if (channel !== DIRECT_CHANNEL) return;
    loadDirectChat(selectedPeerId);
  }, [channel, selectedPeerId]);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      if (document.hidden) return;
      if (channel === DIRECT_CHANNEL) {
        if (!selectedPeerId) return;
        bizenApi.directMessages(selectedPeerId).then(setDirectMessages).catch(() => {});
        return;
      }
      bizenApi.communityMessages().then(setTeamMessages).catch(() => {});
    }, 2000);

    const typingTimer = window.setInterval(() => {
      if (document.hidden) return;
      if (channel === DIRECT_CHANNEL) {
        if (!selectedPeerId) return;
        bizenApi.directTyping(selectedPeerId).then(setDirectTypingUsers).catch(() => {});
        return;
      }
      bizenApi.communityTyping().then(setTeamTypingUsers).catch(() => {});
    }, 1500);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(typingTimer);
    };
  }, [channel, selectedPeerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleMessages.length, channel, selectedPeerId]);

  const chatTitle = channel === TEAM_CHANNEL ? "Bảng tin doanh nghiệp" : selectedPeer?.name || "Chọn người để chat riêng";
  const chatDescription =
    channel === TEAM_CHANNEL
      ? "Mọi người trong workspace đều đọc và gửi được."
      : selectedPeer
        ? [selectedPeer.position, selectedPeer.department, selectedPeer.email].filter(Boolean).join(" · ")
        : "Chọn một thành viên trong danh sách bên trái để bắt đầu.";
  const inputPlaceholder =
    channel === TEAM_CHANNEL
      ? "Nhắn cho mọi người trong doanh nghiệp..."
      : selectedPeer
        ? `Nhắn riêng cho ${selectedPeer.name}...`
        : "Chọn người nhận trước khi nhắn...";
  const inputDisabled = channel === DIRECT_CHANNEL && !selectedPeerId;

  return (
    <div className="grid min-h-[calc(100vh-120px)] gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="premium-card rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-blue-700">Community</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">Cộng đồng nội bộ</h1>
          </div>
          <span className="brand-icon-tile grid h-11 w-11 place-items-center rounded-xl">
            <UsersRound className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">Bảng tin chung cho cả doanh nghiệp và chat riêng 1-1 giữa các tài khoản.</p>

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-50 p-1 ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => switchChannel(TEAM_CHANNEL)}
            className={`rounded-lg px-3 py-2 text-sm font-bold transition ${channel === TEAM_CHANNEL ? "brand-button text-white" : "text-slate-600 hover:bg-white"}`}
          >
            Bảng tin
          </button>
          <button
            type="button"
            onClick={() => switchChannel(DIRECT_CHANNEL)}
            className={`rounded-lg px-3 py-2 text-sm font-bold transition ${channel === DIRECT_CHANNEL ? "brand-button text-white" : "text-slate-600 hover:bg-white"}`}
          >
            Chat riêng
          </button>
        </div>

        {channel === TEAM_CHANNEL ? (
          <>
            <div className="mt-5 rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-950">
                {activeMembers.length}/{members.length} thành viên đang hoạt động
              </p>
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
          </>
        ) : (
          <>
            <label className="soft-focus mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} className="min-w-0 flex-1 outline-none" placeholder="Tìm người để nhắn riêng" />
            </label>
            <div className="mt-4 space-y-2">
              {filteredPeers.map((peer) => (
                <button
                  type="button"
                  key={peer.userId}
                  onClick={() => selectDirectPeer(peer.userId)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                    selectedPeerId === peer.userId ? "border-blue-200 bg-blue-50 shadow-sm" : "border-slate-100 bg-white hover:border-blue-100 hover:bg-blue-50/50"
                  }`}
                >
                  <Avatar name={peer.name} src={peer.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{peer.name}</p>
                    <p className="truncate text-xs text-slate-500">{peer.lastMessage || peer.position || peer.department || peer.email}</p>
                  </div>
                  <StatusBadge status={peer.role} />
                </button>
              ))}
              {!filteredPeers.length && !loading ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Chưa có tài khoản nào khác để chat riêng.</p>
              ) : null}
            </div>
          </>
        )}
      </aside>

      <section className="premium-card flex min-h-[680px] flex-col rounded-2xl">
        <header className="relative z-10 border-b border-slate-200/80 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="brand-icon-tile grid h-10 w-10 place-items-center rounded-xl">
              {channel === TEAM_CHANNEL ? <MessageCircle className="h-5 w-5" /> : <MessagesSquare className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-bold text-slate-950">{chatTitle}</h2>
              <p className="truncate text-sm text-slate-500">{chatDescription}</p>
            </div>
            <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Realtime
            </span>
          </div>
        </header>

        {error ? <p className="relative z-10 m-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

        <div className="relative z-10 min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/80 px-4 py-4">
          {loading || directLoading ? (
            <div className="grid h-full min-h-60 place-items-center text-sm text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : channel === DIRECT_CHANNEL && !selectedPeer ? (
            <div className="grid h-full min-h-60 place-items-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              <div>
                <UserRound className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700">Chọn một người để bắt đầu chat riêng.</p>
              </div>
            </div>
          ) : visibleMessages.length ? (
            visibleMessages.map((message) => {
              const isMine = message.senderUserId === user?.id || message.senderEmployeeId === user?.employeeId;
              return (
                <div key={message.id} className={`flex gap-3 ${isMine ? "justify-end" : "justify-start"}`}>
                  {!isMine ? <Avatar name={message.senderName} src={message.senderAvatarUrl} size="sm" /> : null}
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${isMine ? "brand-button rounded-br-md text-white" : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200"}`}>
                    <div className={`mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold ${isMine ? "text-white/80" : "text-slate-500"}`}>
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
              {channel === TEAM_CHANNEL ? "Chưa có tin nhắn nào. Gửi tin đầu tiên để mở cộng đồng nội bộ." : "Chưa có tin nhắn riêng nào. Bắt đầu cuộc trò chuyện 1-1 ở đây."}
            </div>
          )}
          {visibleTypingText ? (
            <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex gap-0.5 rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
              </span>
              {visibleTypingText}
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={submitMessage} className="relative z-10 border-t border-slate-200/80 bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={body}
              onChange={handleBodyChange}
              onBlur={handleBlur}
              rows={2}
              disabled={inputDisabled}
              placeholder={inputPlaceholder}
              className="soft-focus min-h-12 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              type="submit"
              disabled={sending || !body.trim() || inputDisabled}
              className="brand-button btn-motion grid h-12 w-12 shrink-0 place-items-center rounded-xl disabled:bg-slate-300"
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
