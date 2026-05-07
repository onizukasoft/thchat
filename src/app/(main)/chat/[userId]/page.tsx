"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSocket } from "@/lib/socket-client";
import { ArrowLeft, Send, ImageIcon, Smile, X, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";

type Message = {
  id: string;
  content: string;
  type: string;
  mediaUrl: string | null;
  senderId: string;
  createdAt: string;
  sender: { id: string; username: string; nickname: string | null; avatar: string | null };
};

type User = { id: string; username: string; nickname: string | null; avatar: string | null; isOnline: boolean };

const STICKERS = [
  "😀","😂","🥰","😍","🤩","😎","🥺","😢","😡","🤔","😴","🤗",
  "👍","👎","👏","🙏","💪","🤝","✌️","🫶",
  "❤️","💔","🔥","⭐","🎉","🎊","💯","🌹","🍀","🎁",
  "😸","😹","😻","🙀","😿","😾","🐶","🐱","🐼","🐨",
];

export default function ChatPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; file: File } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    const [msgRes, userRes] = await Promise.all([
      fetch(`/api/messages/${userId}`),
      fetch(`/api/users/${userId}`),
    ]);
    const [msgs, user] = await Promise.all([msgRes.json(), userRes.json()]);
    if (Array.isArray(msgs)) setMessages(msgs);
    setOtherUser(user);
    setIsOnline(user.isOnline ?? false);
  }, [userId]);

  useEffect(() => {
    if (!session?.user?.id) { router.push("/login"); return; }
    fetchData();

    const socket = getSocket();
    socket.emit("user:online", session.user.id);

    const onReceive = (msg: Message) => {
      if (msg.senderId === userId || msg.senderId === session.user?.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const onSent = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setSending(false);
    };
    const onOnline = (ids: string[]) => setIsOnline(ids.includes(userId));

    socket.on("message:receive", onReceive);
    socket.on("message:sent", onSent);
    socket.on("users:online", onOnline);
    return () => {
      socket.off("message:receive", onReceive);
      socket.off("message:sent", onSent);
      socket.off("users:online", onOnline);
    };
  }, [session, userId, fetchData, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendText(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !session?.user?.id || sending) return;
    setSending(true);
    getSocket().emit("message:send", { senderId: session.user.id, receiverId: userId, content: input.trim(), type: "text" });
    setInput("");
    setShowStickers(false);
  }

  function sendSticker(emoji: string) {
    if (!session?.user?.id || sending) return;
    setSending(true);
    getSocket().emit("message:send", { senderId: session.user.id, receiverId: userId, content: emoji, type: "sticker" });
    setShowStickers(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview({ url, file });
    e.target.value = "";
  }

  async function sendImage() {
    if (!imagePreview || !session?.user?.id || uploading) return;
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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 overflow-hidden -mt-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {otherUser && (
          <>
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherUser.avatar || ""} />
                <AvatarFallback className="bg-purple-100 text-purple-700">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
            </div>
            <div>
              <Link href={`/profile/${otherUser.id}`} className="font-semibold hover:underline text-sm">
                {displayName}
              </Link>
              <p className="text-xs text-gray-400">{isOnline ? "ออนไลน์อยู่" : "ออฟไลน์"}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">เริ่มการสนทนากับ {displayName}</p>
          )}
          {messages.map((msg) => {
            const isMine = msg.senderId === session.user?.id;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                {!isMine && (
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarImage src={msg.sender.avatar || ""} />
                    <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                      {(msg.sender.nickname || msg.sender.username)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] space-y-1 flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  {msg.type === "image" && msg.mediaUrl ? (
                    <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                      <img
                        src={msg.mediaUrl}
                        alt="รูปภาพ"
                        className="max-w-[220px] max-h-[280px] rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ) : msg.type === "sticker" ? (
                    <span className="text-5xl leading-none select-none">{msg.content}</span>
                  ) : (
                    <div className={`px-3 py-2 rounded-2xl text-sm break-words ${
                      isMine ? "bg-purple-600 text-white rounded-br-sm" : "bg-gray-100 dark:bg-gray-700 dark:text-gray-100 text-gray-800 rounded-bl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: th })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 pb-2 shrink-0">
          <div className="relative inline-block">
            <img src={imagePreview.url} alt="" className="h-24 rounded-xl object-cover border" />
            <button
              onClick={() => { URL.revokeObjectURL(imagePreview.url); setImagePreview(null); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={sendImage}
            disabled={uploading}
            className="ml-3 px-3 py-1 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "ส่งรูป"}
          </button>
        </div>
      )}

      {/* Sticker picker */}
      {showStickers && (
        <div className="px-3 pb-2 shrink-0">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 grid grid-cols-10 gap-1">
            {STICKERS.map((s) => (
              <button key={s} onClick={() => sendSticker(s)} className="text-2xl hover:scale-125 transition-transform leading-none p-0.5">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={sendText} className="flex items-center gap-2 px-3 py-2.5 border-t dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setShowStickers(!showStickers)}
          className={`p-2 transition-colors ${showStickers ? "text-purple-600" : "text-gray-400 hover:text-purple-600"}`}
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="flex-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-100 rounded-full px-4 py-2 text-sm outline-none"
          disabled={sending}
          onFocus={() => setShowStickers(false)}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center shrink-0 transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}
