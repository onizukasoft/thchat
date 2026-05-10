"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { MessageCircle, Search } from "lucide-react";
import { getSocket } from "@/lib/socket-client";

type Conversation = {
  partner: {
    id: string;
    username: string;
    nickname: string | null;
    avatar: string | null;
    isOnline: boolean;
    profileFrameId?: string | null;
    showProfileFrame?: boolean;
  };
  lastMessage: string;
  lastMessageAt: string;
  isRead: boolean;
  unreadCount: number;
};

export default function ChatListPage() {
  const { data: session } = useSession();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  function loadConvs() {
    fetch("/api/messages/recent")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setConvs(d); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!session?.user?.id) return;
    loadConvs();

    const socket = getSocket();
    socket.on("message:receive", loadConvs);
    socket.on("message:sent", loadConvs);
    return () => {
      socket.off("message:receive", loadConvs);
      socket.off("message:sent", loadConvs);
    };
  }, [session?.user?.id]);

  const filtered = convs.filter((c) => {
    if (!search) return true;
    const name = (c.partner.nickname || c.partner.username).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (!session?.user?.id) {
    return (
      <div className="text-center py-20 text-gray-400">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">เข้าสู่ระบบเพื่อดูแชท</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">แชท</h1>
        {convs.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) > 0 && (
          <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {convs.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาการสนทนา..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{search ? "ไม่พบการสนทนา" : "ยังไม่มีการสนทนา"}</p>
          </div>
        ) : (
          filtered.map((c, i) => (
            <Link
              key={c.partner.id}
              href={`/chat/${c.partner.id}`}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                i > 0 ? "border-t border-gray-100 dark:border-gray-800" : ""
              }`}
            >
              <UserAvatar
                src={c.partner.avatar}
                fallback={(c.partner.nickname || c.partner.username)[0]}
                className="w-12 h-12 shrink-0"
                online={c.partner.isOnline}
                frameId={c.partner.showProfileFrame ? c.partner.profileFrameId : null}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm truncate ${!c.isRead ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                    {c.partner.nickname || c.partner.username}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: false, locale: th })}
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${!c.isRead ? "text-blue-500 font-medium" : "text-gray-400"}`}>
                  {c.lastMessage}
                </p>
              </div>
              {c.unreadCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold shrink-0">
                  {c.unreadCount > 99 ? "99+" : c.unreadCount}
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
