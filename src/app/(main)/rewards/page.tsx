"use client";
import { Star, Lock } from "lucide-react";

const REWARDS = [
  { icon: "🌟", name: "สมาชิกใหม่", desc: "สมัครสมาชิกสำเร็จ", coins: 20, done: true },
  { icon: "💬", name: "นักสนทนา", desc: "ส่งข้อความ 10 ครั้ง", coins: 30, done: false },
  { icon: "👥", name: "นักเข้าสังคม", desc: "มีเพื่อน 5 คน", coins: 50, done: false },
  { icon: "📝", name: "นักเขียน", desc: "โพสต์กระดาน 3 ครั้ง", coins: 40, done: false },
  { icon: "🎁", name: "ผู้ใจดี", desc: "ส่งของขวัญ 5 ชิ้น", coins: 100, done: false },
  { icon: "👑", name: "ราชา/ราชินี", desc: "มีผู้ติดตาม 50 คน", coins: 200, done: false },
  { icon: "💎", name: "ผู้เชี่ยวชาญ", desc: "ใช้งานครบ 30 วัน", coins: 500, done: false },
];

export default function RewardsPage() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        <h1 className="text-xl font-bold">รางวัล & ความสำเร็จ</h1>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl p-4 text-white flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">ความสำเร็จ</p>
          <p className="text-2xl font-bold">1 / {REWARDS.length}</p>
        </div>
        <div className="text-4xl opacity-30">🏆</div>
      </div>

      <div className="space-y-3">
        {REWARDS.map((r) => (
          <div key={r.name} className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${r.done ? "" : "opacity-70"}`}>
            <span className="text-3xl">{r.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{r.name}</p>
              <p className="text-xs text-gray-400">{r.desc}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-yellow-600">+{r.coins} 🪙</p>
              {r.done ? (
                <span className="text-xs text-green-600 font-medium">✅ สำเร็จ</span>
              ) : (
                <Lock className="w-4 h-4 text-gray-300 ml-auto mt-1" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
