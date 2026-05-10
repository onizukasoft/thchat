"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import { getSocket } from "@/lib/socket-client";
import { playMessageSound } from "@/lib/sounds";
import {
  ArrowLeft, Send, ImageIcon, X, Loader2, Crown, Languages,
  Heart, ThumbsUp, ThumbsDown, Smile, Frown, Flame, Star,
  PartyPopper, Zap, Trophy, Gift, Sparkles, Music2, Rocket,
  Coffee, SmilePlus, Check, CheckCheck, PhoneOff, User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import { VideoCall } from "@/components/video-call";

type Message = {
  id: string;
  content: string;
  type: string;
  mediaUrl: string | null;
  senderId: string;
  createdAt: string;
  sender: { id: string; username: string; nickname: string | null; avatar: string | null; profileFrameId?: string | null; showProfileFrame?: boolean };
};

type User = { id: string; username: string; nickname: string | null; avatar: string | null; isOnline: boolean; profileFrameId?: string | null; showProfileFrame?: boolean };

// ─── Icon reactions (replaces emoji stickers) ────────────────────────────────
const REACTIONS = [
  { name: "Heart",       icon: Heart,       color: "text-rose-500",   bg: "bg-rose-50 dark:bg-rose-900/30" },
  { name: "ThumbsUp",    icon: ThumbsUp,    color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/30" },
  { name: "ThumbsDown",  icon: ThumbsDown,  color: "text-gray-500",   bg: "bg-gray-100 dark:bg-gray-800" },
  { name: "Smile",       icon: Smile,       color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/30" },
  { name: "Frown",       icon: Frown,       color: "text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/30" },
  { name: "Flame",       icon: Flame,       color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/30" },
  { name: "Star",        icon: Star,        color: "text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/30" },
  { name: "PartyPopper", icon: PartyPopper, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/30" },
  { name: "Zap",         icon: Zap,         color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/30" },
  { name: "Crown",       icon: Crown,       color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-900/30" },
  { name: "Gift",        icon: Gift,        color: "text-pink-500",   bg: "bg-pink-50 dark:bg-pink-900/30" },
  { name: "Sparkles",    icon: Sparkles,    color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/30" },
  { name: "Trophy",      icon: Trophy,      color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/30" },
  { name: "Rocket",      icon: Rocket,      color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/30" },
  { name: "Music2",      icon: Music2,      color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/30" },
  { name: "Coffee",      icon: Coffee,      color: "text-amber-700",  bg: "bg-amber-50 dark:bg-amber-900/30" },
];

function ReactionIcon({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const r = REACTIONS.find((x) => x.name === name);
  if (!r) return <span className="text-3xl leading-none">{name}</span>;
  const Icon = r.icon;
  const sz = size === "lg" ? "w-14 h-14" : size === "sm" ? "w-5 h-5" : "w-10 h-10";
  return (
    <div className={`inline-flex items-center justify-center rounded-2xl p-2 ${r.bg}`}>
      <Icon className={`${sz} ${r.color}`} strokeWidth={1.5} />
    </div>
  );
}

// ─── User Popup ───────────────────────────────────────────────────────────────
function UserPopup({ user, onClose, onChat }: {
  user: User;
  onClose: () => void;
  onChat: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={onClose} />
      <div className="fixed z-[201] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="h-16 bg-gradient-to-br from-purple-500 to-indigo-600" />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex flex-col items-center -mt-8 pb-5 px-5">
          <UserAvatar
            src={user.avatar}
            fallback={(user.nickname || user.username)[0]?.toUpperCase()}
            className="w-16 h-16 border-4 border-white dark:border-gray-900 shadow-md"
            frameId={user.showProfileFrame ? user.profileFrameId : null}
          />
          <p className="mt-2 font-bold text-gray-900 dark:text-white text-base">
            {user.nickname || user.username}
          </p>
          {user.nickname && (
            <p className="text-xs text-gray-400">@{user.username}</p>
          )}
          <div className="flex gap-2 mt-4 w-full">
            <button
              onClick={onChat}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              โปรไฟล์
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine, onAvatarClick }: { msg: Message; isMine: boolean; onAvatarClick?: () => void }) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  if (msg.type === "call") {
    // รองรับทั้ง format ใหม่ "ended:ข้อความ" และ format เก่าที่มี emoji
    let kind: "ended" | "missed" = "missed";
    let label = msg.content;

    if (msg.content.startsWith("ended:")) {
      kind = "ended"; label = msg.content.slice(6);
    } else if (msg.content.startsWith("missed:") || msg.content.startsWith("offline:") || msg.content.startsWith("rejected:")) {
      kind = "missed"; label = msg.content.slice(msg.content.indexOf(":") + 1);
    } else if (msg.content.includes("📞")) {
      kind = "ended"; label = msg.content.replace("📞", "").trim();
    } else if (msg.content.includes("📵")) {
      kind = "missed"; label = msg.content.replace("📵", "").trim();
    }

    return (
      <div className="flex justify-center my-1">
        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
          kind === "ended"
            ? "bg-purple-50 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400"
            : "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
        }`}>
          {kind === "ended"
            ? <Check className="w-3.5 h-3.5 shrink-0" />
            : <PhoneOff className="w-3.5 h-3.5 shrink-0" />
          }
          {label}
        </span>
      </div>
    );
  }

  const isReaction = msg.type === "sticker";
  const isText = msg.type !== "image" && !isReaction;

  async function toggleTranslate() {
    if (translated !== null) { setTranslated(null); return; }
    setTranslating(true);
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msg.content, to: "th" }),
    });
    const data = await res.json();
    setTranslated(res.ok ? data.translated : "แปลไม่สำเร็จ");
    setTranslating(false);
  }

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
      {!isMine && (
        <button onClick={onAvatarClick} className="shrink-0 mb-0.5 rounded-full active:scale-90 transition-transform">
          <UserAvatar
            src={msg.sender.avatar}
            fallback={(msg.sender.nickname || msg.sender.username)[0]}
            className="w-7 h-7"
            frameId={msg.sender.showProfileFrame ? msg.sender.profileFrameId : null}
          />
        </button>
      )}

      <div className={`max-w-[72%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {/* Content */}
        {msg.type === "image" && msg.mediaUrl ? (
          <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
            <img
              src={msg.mediaUrl}
              alt="รูปภาพ"
              className="max-w-[220px] max-h-[280px] rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
            />
          </a>
        ) : isReaction ? (
          <ReactionIcon name={msg.content} size="lg" />
        ) : (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
            isMine
              ? "bg-purple-600 text-white rounded-br-md"
              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-gray-700"
          }`}>
            {msg.content}
            {translated && (
              <p className={`mt-1.5 pt-1.5 text-xs border-t ${
                isMine ? "border-white/30 text-white/70" : "border-gray-200 dark:border-gray-600 text-gray-400"
              }`}>
                {translated}
              </p>
            )}
          </div>
        )}

        {/* Time + translate */}
        <div className={`flex items-center gap-1.5 mt-0.5 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: th })}
          </span>
          {isMine && <CheckCheck className="w-3 h-3 text-gray-300 dark:text-gray-600" />}
          {isText && (
            <button
              onClick={toggleTranslate}
              disabled={translating}
              className={`flex items-center gap-0.5 text-[10px] transition-colors ${
                translated ? "text-purple-500" : "text-gray-300 dark:text-gray-600 hover:text-purple-400"
              }`}
            >
              {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; file: File } | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [chatLimit, setChatLimit] = useState<{ message: string; limit: number; upgrade: boolean } | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    const [msgRes, userRes, friendRes] = await Promise.all([
      fetch(`/api/messages/${userId}`),
      fetch(`/api/users/${userId}`),
      fetch(`/api/favorites/check?targetId=${userId}`),
    ]);
    const [msgs, user, friendData] = await Promise.all([msgRes.json(), userRes.json(), friendRes.json()]);
    if (Array.isArray(msgs)) setMessages(msgs);
    setOtherUser(user);
    setIsOnline(user.isOnline ?? false);
    setIsFriend(friendData.status === "accepted");
  }, [userId]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) { router.push("/login"); return; }
    fetchData();

    const socket = getSocket();
    socket.emit("user:online", session.user.id);

    const onReceive = (msg: Message) => {
      if (msg.senderId === userId || msg.senderId === session.user?.id) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderId === userId) {
          setOtherTyping(false);
          playMessageSound();
        }
      }
    };
    const onSent = (msg: Message) => { setMessages((prev) => [...prev, msg]); setSending(false); };
    const onError = (err: { error: string; message: string; limit: number; upgrade: boolean }) => {
      setSending(false);
      if (err.error === "chat_limit") setChatLimit({ message: err.message, limit: err.limit, upgrade: err.upgrade });
    };
    const onOnline = (ids: string[]) => setIsOnline(ids.includes(userId));
    const onTypingStart = (fromId: string) => { if (fromId === userId) setOtherTyping(true); };
    const onTypingStop = (fromId: string) => { if (fromId === userId) setOtherTyping(false); };

    socket.on("message:receive", onReceive);
    socket.on("message:sent", onSent);
    socket.on("message:error", onError);
    socket.on("users:online", onOnline);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    return () => {
      socket.off("message:receive", onReceive);
      socket.off("message:sent", onSent);
      socket.off("message:error", onError);
      socket.off("users:online", onOnline);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [session, status, userId, fetchData, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep chat container sized to the actual visible viewport (handles mobile keyboard)
  useEffect(() => {
    const NAVBAR_H = 52; // h-13 in px
    function update() {
      const el = containerRef.current;
      if (!el || window.innerWidth >= 768) {
        if (el) el.style.height = "";
        return;
      }
      const vv = window.visualViewport;
      el.style.height = `${(vv?.height ?? window.innerHeight) - NAVBAR_H}px`;
    }
    update();
    window.visualViewport?.addEventListener("resize", update);
    return () => window.visualViewport?.removeEventListener("resize", update);
  }, []);

  function emitTyping() {
    const myId = session?.user?.id;
    if (!myId) return;
    getSocket().emit("user:typing", { senderId: myId, receiverId: userId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      getSocket().emit("user:stop_typing", { senderId: myId, receiverId: userId });
    }, 2000);
  }

  function sendText(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !session?.user?.id || sending || chatLimit) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    getSocket().emit("user:stop_typing", { senderId: session.user.id, receiverId: userId });
    setSending(true);
    getSocket().emit("message:send", { senderId: session.user.id, receiverId: userId, content: input.trim(), type: "text" });
    setInput("");
    setShowReactions(false);
  }

  function sendReaction(name: string) {
    if (!session?.user?.id || sending || chatLimit) return;
    setSending(true);
    getSocket().emit("message:send", { senderId: session.user.id, receiverId: userId, content: name, type: "sticker" });
    setShowReactions(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview({ url: URL.createObjectURL(file), file });
    e.target.value = "";
  }

  async function sendImage() {
    if (!imagePreview || !session?.user?.id || uploading || chatLimit) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", imagePreview.file);
    const res = await fetch("/api/upload/chat", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) return;
    URL.revokeObjectURL(imagePreview.url);
    setImagePreview(null);
    setSending(true);
    getSocket().emit("message:send", {
      senderId: session.user.id,
      receiverId: userId,
      content: "รูปภาพ",
      type: "image",
      mediaUrl: data.url,
    });
  }

  if (!session?.user?.id) return null;

  const displayName = otherUser?.nickname || otherUser?.username || "";

  return (
    <>
    {showPopup && otherUser && (
      <UserPopup
        user={otherUser}
        onClose={() => setShowPopup(false)}
        onChat={() => { setShowPopup(false); router.push(`/profile/${otherUser.id}`); }}
      />
    )}
    <div ref={containerRef} className="flex flex-col h-[calc(100dvh-3.25rem)] bg-gray-50 dark:bg-gray-950 overflow-hidden -mt-2 -mx-2 -mb-28 md:rounded-xl md:border md:border-gray-200 dark:md:border-gray-700 md:-mt-4 md:-mx-4 md:-mb-4">

      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {otherUser && (
          <>
            <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative shrink-0">
                <UserAvatar
                  src={otherUser.avatar}
                  fallback={displayName[0]}
                  className="w-9 h-9"
                  frameId={otherUser.showProfileFrame ? otherUser.profileFrameId : null}
                  online={isOnline}
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate leading-tight">
                  {displayName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {otherTyping ? (
                    <span className="text-[11px] text-purple-500 font-medium flex items-center gap-1">
                      กำลังพิมพ์
                      <span className="flex gap-0.5">
                        {[0, 150, 300].map((d) => (
                          <span key={d} className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </span>
                    </span>
                  ) : (
                    <>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-400" : "bg-gray-300"}`} />
                      <span className="text-[11px] text-gray-400">{isOnline ? "ออนไลน์" : "ออฟไลน์"}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>

            {isFriend && (
              <VideoCall
                myId={session.user.id}
                myName={session.user.name ?? ""}
                myAvatar={session.user.image ?? null}
                otherUser={otherUser}
              />
            )}
          </>
        )}
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
        <div className="space-y-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Heart className="w-7 h-7 text-purple-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">เริ่มการสนทนากับ <span className="font-medium text-gray-600 dark:text-gray-300">{displayName}</span></p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={msg.senderId === session.user?.id}
              onAvatarClick={msg.senderId !== session.user?.id ? () => setShowPopup(true) : undefined}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ─── Image preview ─── */}
      {imagePreview && (
        <div className="px-3 pb-2 shrink-0 flex items-center gap-3">
          <div className="relative">
            <img src={imagePreview.url} alt="" className="h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
            <button
              onClick={() => { URL.revokeObjectURL(imagePreview.url); setImagePreview(null); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 dark:bg-gray-600 text-white rounded-full flex items-center justify-center shadow"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={sendImage}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            ส่งรูป
          </button>
        </div>
      )}

      {/* ─── Reaction panel ─── */}
      {showReactions && (
        <div className="px-3 pb-2 shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 shadow-lg">
            <div className="grid grid-cols-8 gap-1.5">
              {REACTIONS.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.name}
                    onClick={() => sendReaction(r.name)}
                    className={`flex items-center justify-center w-full aspect-square rounded-xl transition-all active:scale-90 hover:scale-110 ${r.bg}`}
                  >
                    <Icon className={`w-6 h-6 ${r.color}`} strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Chat limit banner ─── */}
      {chatLimit && (
        <div className="mx-3 mb-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl shrink-0 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{chatLimit.message}</p>
          </div>
          {chatLimit.upgrade && (
            <Link href="/vip" className="shrink-0 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors">
              VIP
            </Link>
          )}
        </div>
      )}

      {/* ─── Input bar ─── */}
      <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-3 py-2.5">
        <form onSubmit={sendText} className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

          {/* Attach */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!chatLimit}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-30"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Reactions toggle */}
          <button
            type="button"
            onClick={() => setShowReactions(!showReactions)}
            disabled={!!chatLimit}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-30 ${
              showReactions
                ? "text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                : "text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            }`}
          >
            <SmilePlus className="w-5 h-5" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); if (e.target.value) emitTyping(); }}
              placeholder={chatLimit ? "ไม่สามารถส่งข้อความได้" : "พิมพ์ข้อความ..."}
              className="w-full bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 disabled:opacity-50"
              disabled={sending || !!chatLimit}
              onFocus={() => setShowReactions(false)}
            />
          </div>

          {/* Send */}
          <button
            type="submit"
            disabled={!input.trim() || sending || !!chatLimit}
            className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center shrink-0 transition-all active:scale-90"
          >
            {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </form>
      </div>

    </div>
    </>
  );
}
