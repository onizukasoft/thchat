"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Headphones, MessageCircle, Radio } from "lucide-react";

type DJUser = {
  id: string; username: string; nickname: string | null; avatar: string | null;
  gender: string | null; bio: string | null; isOnline: boolean;
};

export default function DJPage() {
  const [djs, setDjs] = useState<DJUser[]>([]);

  useEffect(() => {
    // Show online users as DJs for now
    fetch("/api/users").then((r) => r.json()).then((d: DJUser[]) => {
      if (Array.isArray(d)) setDjs(d.filter((u) => u.isOnline).slice(0, 20));
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Headphones className="w-5 h-5 text-purple-500" />
        <h1 className="text-xl font-bold">ดีเจ</h1>
        <span className="ml-2 flex items-center gap-1 text-xs text-red-500 font-medium">
          <Radio className="w-3 h-3 animate-pulse" /> LIVE
        </span>
      </div>

      {djs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Headphones className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีดีเจออนไลน์</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {djs.map((dj, idx) => (
            <div key={dj.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-24 bg-gradient-to-br from-purple-400 to-pink-500 relative flex items-center justify-center">
                <div className="text-white text-4xl opacity-20">🎵</div>
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
                </div>
                <div className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
                  {Math.floor(Math.random() * 500 + 10)} ผู้ฟัง
                </div>
              </div>
              <div className="p-3 flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-purple-300">
                  <AvatarImage src={dj.avatar || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-bold">
                    {(dj.nickname || dj.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{dj.nickname || dj.username}</p>
                  <p className="text-xs text-gray-400 truncate">{dj.bio || `DJ #${idx + 1}`}</p>
                </div>
                <Link href={`/chat/${dj.id}`} className="text-purple-400 hover:text-purple-600">
                  <MessageCircle className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
