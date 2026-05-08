"use client";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";

export default function GamesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Gamepad2 className="w-5 h-5 text-green-500" />
        <h1 className="text-xl font-bold">เกมส์</h1>
        <span className="text-sm text-gray-400 ml-auto">โต๊ะละสูงสุด 6 คน</span>
      </div>

      <p className="text-sm text-gray-500">
        ตอนนี้มีเฉพาะป็อกเด้ง — แต่ละผู้เล่นสามารถเข้าโต๊ะได้เหมือนนั่งเก้าอี้ในโต๊ะจริง เมื่อครบจะไม่รับเข้าเพิ่มในโต๊ะนั้น
      </p>

      <Link
        href="/games/pokdeng"
        className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group block"
      >
        <div className="h-32 bg-gradient-to-br from-green-700 to-emerald-500 flex items-center justify-center relative">
          <span className="text-6xl group-hover:scale-110 transition-transform">🎴</span>
          <div className="absolute top-2 right-2 bg-black/35 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            multiplayer
          </div>
        </div>
        <div className="p-4">
          <p className="font-semibold">ป็อกเด้ง</p>
          <p className="text-xs text-gray-500 mt-1">สร้างห้องเป็นเจ้ามือ หรือเข้าร่วมโต๊ะได้ — โต๊ะละไม่เกิน 6 คน</p>
          <p className="text-xs text-amber-700 mt-2 font-medium">เล่นพร้อมเพื่อนในระบบ (ออนไลน์)</p>
        </div>
      </Link>
    </div>
  );
}
