"use client";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";

const GAMES = [
  { name: "ทายใจ", icon: "🎯", desc: "ทายตัวเลข 1–100 ให้ถูกต้อง", players: 1204, color: "from-blue-400 to-cyan-500", href: "/games/guess" },
  { name: "จับคู่รูป", icon: "🃏", desc: "จับคู่อีโมจิให้ตรงกัน", players: 876, color: "from-purple-400 to-pink-500", href: "/games/match" },
  { name: "ถาม-ตอบ", icon: "❓", desc: "ตอบคำถามไทย 10 ข้อ", players: 2341, color: "from-orange-400 to-yellow-500", href: "/games/quiz" },
  { name: "โชคดีวันนี้", icon: "🎰", desc: "หมุนวงล้อรับเหรียญ", players: 5689, color: "from-green-400 to-emerald-500", href: "/games/spin" },
  { name: "ตกปลา", icon: "🎣", desc: "ตกปลาสะสมเหรียญ", players: 432, color: "from-teal-400 to-blue-500", href: "/games/fish" },
  { name: "เกมคำศัพท์", icon: "📚", desc: "ทายคำศัพท์ไทย (Wordle)", players: 321, color: "from-rose-400 to-red-500", href: "/games/word" },
];

export default function GamesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Gamepad2 className="w-5 h-5 text-green-500" />
        <h1 className="text-xl font-bold">เกมส์</h1>
        <span className="text-sm text-gray-400 ml-auto">เล่นเกมส์รับเหรียญ</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GAMES.map((game) => (
          <Link key={game.name} href={game.href} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group block">
            <div className={`h-28 bg-gradient-to-br ${game.color} flex items-center justify-center relative`}>
              <span className="text-5xl group-hover:scale-110 transition-transform">{game.icon}</span>
              <div className="absolute bottom-2 right-2 bg-black/30 text-white text-xs px-2 py-0.5 rounded-full">
                👥 {game.players.toLocaleString()}
              </div>
              <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                เล่นได้เลย
              </div>
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm">{game.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{game.desc}</p>
              <p className="text-xs text-yellow-600 mt-1 font-medium">🪙 รับเหรียญได้</p>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 pb-2">รับเหรียญได้ 1 ครั้ง/วัน/เกม</p>
    </div>
  );
}
