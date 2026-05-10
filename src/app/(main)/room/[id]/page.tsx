"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSocket } from "@/lib/socket-client";
import { ArrowLeft, Hash, Send, MessageCircle, User, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";

type RoomMsg = {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  user: { id: string; username: string; nickname: string | null; avatar: string | null; profileFrameId?: string | null; showProfileFrame?: boolean };
};

type RoomInfo = { id: string; name: string; description: string | null };

type SelectedUser = RoomMsg["user"];

function UserPopup({ user, onClose }: { user: SelectedUser; onClose: () => void }) {
  const router = useRouter();
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200]" onClick={onClose} />
      {/* Card */}
      <div className="fixed z-[201] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header gradient */}
        <div className="h-16 bg-gradient-to-br from-purple-500 to-indigo-600" />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {/* Avatar */}
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
          {/* Actions */}
          <div className="flex gap-2 mt-4 w-full">
            <button
              onClick={() => { onClose(); router.push(`/profile/${user.id}`); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              โปรไฟล์
            </button>
            <button
              onClick={() => { onClose(); router.push(`/chat/${user.id}`); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              แชท
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RoomPage() {
  const { data: session } = useSession();
  const params = useParams();
  const roomId = params.id as string;

  const [messages, setMessages] = useState<RoomMsg[]>([]);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [input, setInput] = useState("");
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    const [msgRes, roomsRes] = await Promise.all([
      fetch(`/api/rooms/${roomId}/messages`),
      fetch("/api/rooms"),
    ]);
    const [msgs, rooms] = await Promise.all([msgRes.json(), roomsRes.json()]);
    setMessages(msgs);
    const found = rooms.find((r: RoomInfo) => r.id === roomId);
    if (found) setRoom(found);
  }, [roomId]);

  useEffect(() => {
    fetchData();
    const socket = getSocket();
    if (session?.user?.id) socket.emit("user:online", session.user.id);

    socket.emit("room:join", roomId);
    socket.on("room:message:new", (msg: RoomMsg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit("room:leave", roomId);
      socket.off("room:message:new");
    };
  }, [session, roomId, fetchData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !session?.user?.id) return;
    const socket = getSocket();
    socket.emit("room:message", {
      userId: session.user.id,
      roomId,
      content: input.trim(),
    });
    setInput("");
  }

  return (
    <>
      {selectedUser && (
        <UserPopup user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      <div className="flex flex-col h-[calc(100vh-4rem)] bg-white rounded-xl border overflow-hidden -mt-4">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
          <Link href="/room" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Hash className="w-5 h-5 text-purple-500" />
          <div>
            <p className="font-semibold">{room?.name || "ห้องแชท"}</p>
            {room?.description && <p className="text-xs text-gray-400">{room.description}</p>}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">ยังไม่มีข้อความในห้องนี้</p>
            )}
            {messages.map((msg) => {
              const isMine = msg.userId === session?.user?.id;
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                  {!isMine && (
                    <button
                      onClick={() => setSelectedUser(msg.user)}
                      className="shrink-0 rounded-full focus:outline-none active:scale-95 transition-transform"
                    >
                      <UserAvatar
                        src={msg.user.avatar}
                        fallback={(msg.user.nickname || msg.user.username)[0]}
                        className="w-8 h-8"
                        frameId={msg.user.showProfileFrame ? msg.user.profileFrameId : null}
                      />
                    </button>
                  )}
                  <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                    {!isMine && (
                      <span className="text-xs text-gray-500 px-1">
                        {msg.user.nickname || msg.user.username}
                      </span>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-sm break-words ${isMine ? "bg-purple-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: th })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t bg-white">
          {!session?.user?.id ? (
            <p className="flex-1 text-center text-sm text-gray-400">
              <Link href="/login" className="text-purple-600 hover:underline">เข้าสู่ระบบ</Link> เพื่อส่งข้อความ
            </p>
          ) : (
            <>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                className="flex-1 rounded-full"
              />
              <Button type="submit" size="icon" className="rounded-full bg-purple-600 hover:bg-purple-700 shrink-0" disabled={!input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </>
          )}
        </form>
      </div>
    </>
  );
}
