"use client";
import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

type Ann = { id: string; title: string; content: string; createdAt: string };

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Ann[]>([]);

  useEffect(() => {
    fetch("/api/announcements").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setItems(d); });
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-orange-500" />
        <h1 className="text-xl font-bold">ประกาศ</h1>
      </div>

      {items.length === 0 ? (
        <div className="space-y-3">
          {/* Default announcements */}
          {[
            { id: "1", title: "🎉 ยินดีต้อนรับสู่ ThChat!", content: "ThChat พร้อมให้บริการแล้ว! เชิญชวนเพื่อนมาสมัครและใช้งานร่วมกันนะครับ มีฟีเจอร์ใหม่อัปเดตเรื่อยๆ", createdAt: new Date().toISOString() },
            { id: "2", title: "📱 ฟีเจอร์ใหม่: ระบบของขวัญ", content: "ตอนนี้สามารถส่งของขวัญให้เพื่อนได้แล้ว! ไปที่โปรไฟล์ของเพื่อนและกดส่งของขวัญได้เลย", createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: "3", title: "🔧 ปรับปรุงระบบ", content: "ปรับปรุงประสิทธิภาพระบบแชทให้เร็วขึ้น และแก้ไขบั๊กต่างๆ", createdAt: new Date(Date.now() - 172800000).toISOString() },
          ].map((a) => (
            <div key={a.id} className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold">{a.title}</h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: th })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold">{a.title}</h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: th })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
