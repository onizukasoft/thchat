"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, User, UserCheck, UserX, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

type FavUser = {
  id: string; username: string; nickname: string | null; avatar: string | null;
  gender: string | null; age: number | null; isOnline: boolean;
};
type PendingUser = FavUser & { followerId: string; createdAt: string };

export default function FavoritesPage() {
  const [friends, setFriends] = useState<FavUser[]>([]);
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/favorites");
    const d = await res.json();
    if (d.friends) setFriends(d.friends);
    if (d.pendingRequests) setPending(d.pendingRequests);
  }

  useEffect(() => { load(); }, []);

  async function respond(followerId: string, action: "accept" | "reject") {
    setActionLoading(followerId);
    await fetch("/api/favorites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId, action }),
    });
    await load();
    setActionLoading(null);
  }

  async function unfollow(id: string) {
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: id }),
    });
    setFriends((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
        <h1 className="text-xl font-bold">เพื่อนคนโปรด</h1>
      </div>

      {/* คำขอรอการยืนยัน */}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-yellow-50 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="font-semibold text-sm text-yellow-700">คำขอเพิ่มเพื่อน</span>
            <span className="ml-auto bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="divide-y">
            {pending.map((u) => (
              <div key={u.followerId} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage src={u.avatar || ""} />
                  <AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold">
                    {(u.nickname || u.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{u.nickname || u.username}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true, locale: th })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => respond(u.followerId, "accept")}
                    disabled={actionLoading === u.followerId}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> ยอมรับ
                  </button>
                  <button
                    onClick={() => respond(u.followerId, "reject")}
                    disabled={actionLoading === u.followerId}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" /> ปฏิเสธ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* รายชื่อเพื่อน */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" />
          <span className="font-semibold text-sm">เพื่อนของฉัน</span>
          <span className="ml-auto text-xs text-gray-400">{friends.length} คน</span>
        </div>
        {friends.length === 0 ? (
          <div className="text-center py-10 text-gray-400 space-y-2">
            <Heart className="w-10 h-10 mx-auto opacity-20" />
            <p className="text-sm">ยังไม่มีเพื่อน</p>
            <Link href="/" className="text-xs text-blue-500 hover:underline">ไปหาเพื่อนใหม่</Link>
          </div>
        ) : (
          <div className="divide-y">
            {friends.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="relative shrink-0">
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={u.avatar || ""} />
                    <AvatarFallback className={`text-white font-bold text-sm ${u.gender === "female" ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-blue-400 to-indigo-500"}`}>
                      {(u.nickname || u.username)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {u.isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{u.nickname || u.username}</p>
                  <p className="text-xs text-gray-400">{u.isOnline ? "🟢 ออนไลน์" : "ออฟไลน์"}{u.age ? ` · ${u.age} ปี` : ""}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Link href={`/chat/${u.id}`} className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                  </Link>
                  <Link href={`/profile/${u.id}`} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <User className="w-4 h-4 text-gray-500" />
                  </Link>
                  <button onClick={() => unfollow(u.id)} className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                    <UserX className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
