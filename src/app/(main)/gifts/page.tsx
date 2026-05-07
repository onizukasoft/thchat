"use client";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Gift } from "lucide-react";

const GIFT_EMOJI: Record<string, string> = {
  flower: "🌹", heart: "❤️", candy: "🍬", ring: "💍", car: "🚗", diamond: "💎",
};

type GiftItem = {
  id: string; giftType: string; coins: number; message: string | null; createdAt: string;
  sender: { id: string; username: string; nickname: string | null; avatar: string | null };
};

export default function GiftsPage() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);

  useEffect(() => {
    fetch("/api/gifts").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setGifts(d); });
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-pink-500" />
        <h1 className="text-xl font-bold">ของขวัญของคุณ</h1>
        <span className="ml-auto text-sm text-gray-400">{gifts.length} ชิ้น</span>
      </div>

      {gifts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🎁</div>
          <p>ยังไม่มีของขวัญ</p>
          <p className="text-xs mt-1">แชทกับเพื่อนเพื่อรับของขวัญ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gifts.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border p-4 flex items-center gap-3">
              <span className="text-4xl">{GIFT_EMOJI[g.giftType] || "🎁"}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={g.sender.avatar || ""} />
                    <AvatarFallback className="text-xs bg-pink-100 text-pink-600">
                      {(g.sender.nickname || g.sender.username)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">{g.sender.nickname || g.sender.username}</span>
                </div>
                {g.message && <p className="text-xs text-gray-600 mt-1 italic">&quot;{g.message}&quot;</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(g.createdAt), { addSuffix: true, locale: th })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-yellow-600 font-bold">+{Math.floor(g.coins * 0.7)} 🪙</p>
                <p className="text-[10px] text-gray-400">คุณได้รับ</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
