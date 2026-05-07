"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User } from "lucide-react";

type FavUser = {
  id: string; username: string; nickname: string | null; avatar: string | null;
  gender: string | null; age: number | null; isOnline: boolean;
};

export default function FavoritesPage() {
  const [users, setUsers] = useState<FavUser[]>([]);

  useEffect(() => {
    fetch("/api/favorites").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setUsers(d); });
  }, []);

  async function unfollow(id: string) {
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: id }),
    });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        <h1 className="text-xl font-bold">เพื่อนคนโปรด</h1>
        <span className="ml-auto text-sm text-gray-400">{users.length} คน</span>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีเพื่อนคนโปรด</p>
          <Link href="/" className="text-blue-500 text-sm hover:underline mt-1 inline-block">
            ค้นหาเพื่อน
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-xl border p-3 flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={u.avatar || ""} />
                  <AvatarFallback className={`text-white font-bold ${u.gender === "female" ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-blue-400 to-indigo-500"}`}>
                    {(u.nickname || u.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${u.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{u.nickname || u.username}</p>
                <p className="text-xs text-gray-400">
                  {u.gender === "female" ? "♀ หญิง" : u.gender === "male" ? "♂ ชาย" : ""}
                  {u.age ? ` · ${u.age} ปี` : ""}
                  {" · "}{u.isOnline ? <span className="text-green-500">ออนไลน์</span> : "ออฟไลน์"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Link href={`/chat/${u.id}`}>
                  <Button size="sm" className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href={`/profile/${u.id}`}>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <User className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-red-200 text-red-400 hover:bg-red-50" onClick={() => unfollow(u.id)}>
                  <Heart className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
