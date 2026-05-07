"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Search } from "lucide-react";

type Conversation = {
  partner: { id: string; username: string; nickname: string | null; avatar: string | null; isOnline: boolean };
  lastMessage: string;
  lastMessageAt: string;
  isRead: boolean;
};

export function RightSidebar() {
  const { data: session } = useSession();
  const [convs, setConvs] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/messages/recent").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setConvs(d);
    });
  }, [session]);

  if (!session?.user?.id) return null;

  return (
    <aside className="w-[260px] shrink-0 bg-white border-l border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            placeholder="ค้นหาแชทเก่า"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 rounded-full outline-none focus:bg-gray-200 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {convs.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-8">ยังไม่มีการสนทนา</p>
        ) : (
          convs.map((c) => (
            <Link
              key={c.partner.id}
              href={`/chat/${c.partner.id}`}
              className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50"
            >
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={c.partner.avatar || ""} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                    {(c.partner.nickname || c.partner.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {c.partner.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm truncate ${!c.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                    {c.partner.nickname || c.partner.username}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 ml-1">
                    {formatDistanceToNow(new Date(c.lastMessageAt), { locale: th })}
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${!c.isRead ? "text-blue-500 font-medium" : "text-gray-400"}`}>
                  {c.lastMessage}
                </p>
              </div>
              {!c.isRead && (
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              )}
            </Link>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-gray-100">
        <Link href="#" className="text-xs text-blue-500 hover:underline">ค้นหาแชทเก่า</Link>
      </div>
    </aside>
  );
}
