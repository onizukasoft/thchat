"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, MoreVertical, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

type Notif = {
  id: string; type: string; title: string; body: string;
  link: string | null; isRead: boolean; createdAt: string;
};

const TYPE_CONFIG: Record<string, { icon: string; bg: string }> = {
  message:  { icon: "💬", bg: "bg-green-400" },
  follow:   { icon: "⭐", bg: "bg-yellow-400" },
  gift:     { icon: "🎁", bg: "bg-pink-400" },
  comment:  { icon: "💭", bg: "bg-blue-400" },
  system:   { icon: "📢", bg: "bg-red-400" },
  vote:     { icon: "⭐", bg: "bg-yellow-400" },
  vip:      { icon: "👤", bg: "bg-blue-500" },
  coin:     { icon: "🪙", bg: "bg-yellow-500" },
  announce: { icon: "📣", bg: "bg-red-500" },
  kick:     { icon: "🚪", bg: "bg-gray-500" },
};

const SYSTEM_AVATAR = (
  <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
      <span className="text-white text-xl">😊</span>
    </div>
  </div>
);

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/notifications");
    const d = await res.json();
    if (Array.isArray(d)) setNotifs(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unread = notifs.filter((n) => !n.isRead).length;
  const isSystem = (type: string) => ["system", "vip", "coin", "announce", "kick"].includes(type);

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-3 mb-1">
        <h1 className="text-xl font-bold">การแจ้งเตือน{unread > 0 && <span className="ml-2 text-sm font-normal text-blue-500">({unread} ใหม่)</span>}</h1>
        <div className="flex items-center gap-1">
          <button onClick={load} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
          {unread > 0 && (
            <button onClick={markAllRead} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {notifs.length === 0 && !loading ? (
        <div className="text-center py-24 text-gray-400 space-y-3">
          <Bell className="w-14 h-14 mx-auto opacity-20" />
          <p className="font-medium">ยังไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifs.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? { icon: "🔔", bg: "bg-gray-400" };
            const time = formatDistanceToNow(new Date(n.createdAt), { addSuffix: false, locale: th });
            const isSystemType = isSystem(n.type);

            const inner = (
              <div className={`flex items-center gap-3 px-3 py-3.5 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50/60" : "bg-white"}`}>
                {/* Avatar */}
                <div className="relative shrink-0">
                  {isSystemType ? SYSTEM_AVATAR : (
                    <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-sm">
                      <span className="text-white text-2xl">😊</span>
                    </div>
                  )}
                  {/* Icon badge */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${cfg.bg} rounded-full flex items-center justify-center text-xs shadow-md border-2 border-white`}>
                    {cfg.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    <span className="font-bold">{n.title}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5 leading-snug">{n.body}</p>
                </div>

                {/* Time + unread dot */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs text-gray-400 whitespace-nowrap">{time}</span>
                  {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </div>
              </div>
            );

            return n.link ? (
              <Link key={n.id} href={n.link}>{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
