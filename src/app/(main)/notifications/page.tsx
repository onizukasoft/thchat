"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

type Notif = { id: string; type: string; title: string; body: string; link: string | null; isRead: boolean; createdAt: string };

const TYPE_ICON: Record<string, string> = {
  message: "💬", follow: "👥", gift: "🎁", comment: "💭", system: "📢",
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setNotifs(d); });
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-500" />
        <h1 className="text-xl font-bold">แจ้งเตือน</h1>
        {unread > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unread}</span>
        )}
        {unread > 0 && (
          <Button size="sm" variant="outline" className="ml-auto gap-1 text-xs" onClick={markAllRead}>
            <Check className="w-3 h-3" /> อ่านทั้งหมด
          </Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y overflow-hidden">
          {notifs.map((n) => {
            const content = (
              <div className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50" : ""}`}>
                <span className="text-xl mt-0.5 shrink-0">{TYPE_ICON[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: th })}
                  </p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
