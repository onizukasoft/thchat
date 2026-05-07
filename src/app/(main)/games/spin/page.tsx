"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Coins } from "lucide-react";

const PRIZES = [
  { label: "5 🪙", coins: 5, color: "#4ade80" },
  { label: "ลองใหม่", coins: 0, color: "#f87171" },
  { label: "20 🪙", coins: 20, color: "#60a5fa" },
  { label: "ลองใหม่", coins: 0, color: "#f87171" },
  { label: "10 🪙", coins: 10, color: "#facc15" },
  { label: "ลองใหม่", coins: 0, color: "#f87171" },
  { label: "50 🪙", coins: 50, color: "#a78bfa" },
  { label: "ลองใหม่", coins: 0, color: "#f87171" },
];

const SECTOR = 360 / PRIZES.length;

export default function SpinPage() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof PRIZES[0] | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [msg, setMsg] = useState("");
  const totalRef = useRef(0);

  async function spin() {
    if (spinning || claimed) return;
    setResult(null);
    setMsg("");
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const prizeIdx = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[prizeIdx];
    const targetAngle = 360 * extraSpins + (360 - prizeIdx * SECTOR - SECTOR / 2);
    const newRotation = totalRef.current + targetAngle;
    totalRef.current = newRotation;
    setSpinning(true);
    setRotation(newRotation);
    setTimeout(async () => {
      setSpinning(false);
      setResult(prize);
      if (prize.coins > 0) {
        const res = await fetch("/api/games/reward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: "spin", coins: prize.coins }),
        });
        const data = await res.json();
        if (data.success) { setClaimed(true); setMsg(`ได้รับ ${prize.coins} เหรียญแล้ว!`); }
        else if (data.error === "already_claimed") { setClaimed(true); setMsg("รับเหรียญแล้ววันนี้"); }
      } else {
        setMsg("เสียดาย! ลองใหม่พรุ่งนี้นะ");
        setClaimed(true);
      }
    }, 4000);
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">โชคดีวันนี้</h1>
        <span className="text-xs text-gray-400 ml-auto">หมุน 1 ครั้ง/วัน</span>
      </div>

      <div className="bg-white rounded-2xl border p-6 flex flex-col items-center gap-6">
        {/* Wheel */}
        <div className="relative">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-0 h-0"
            style={{ borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: "20px solid #ef4444" }} />
          <div
            className="w-64 h-64 rounded-full border-4 border-gray-200 overflow-hidden"
            style={{ transition: spinning ? "transform 4s cubic-bezier(0.17,0.67,0.12,0.99)" : "none", transform: `rotate(${rotation}deg)` }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {PRIZES.map((prize, i) => {
                const startAngle = (i * SECTOR - 90) * (Math.PI / 180);
                const endAngle = ((i + 1) * SECTOR - 90) * (Math.PI / 180);
                const x1 = 50 + 50 * Math.cos(startAngle);
                const y1 = 50 + 50 * Math.sin(startAngle);
                const x2 = 50 + 50 * Math.cos(endAngle);
                const y2 = 50 + 50 * Math.sin(endAngle);
                const midAngle = ((i + 0.5) * SECTOR - 90) * (Math.PI / 180);
                const tx = 50 + 32 * Math.cos(midAngle);
                const ty = 50 + 32 * Math.sin(midAngle);
                return (
                  <g key={i}>
                    <path d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`} fill={prize.color} stroke="white" strokeWidth="0.5" />
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                      fontSize="6" fontWeight="bold" fill="white"
                      transform={`rotate(${(i + 0.5) * SECTOR}, ${tx}, ${ty})`}>
                      {prize.label}
                    </text>
                  </g>
                );
              })}
              <circle cx="50" cy="50" r="6" fill="white" stroke="#d1d5db" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {result && (
          <div className={`text-center py-3 px-6 rounded-xl font-bold text-lg ${result.coins > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
            {result.coins > 0 ? `🎉 ได้ ${result.label}!` : "😅 ลองใหม่!"}<br />
            <span className="text-sm font-normal">{msg}</span>
          </div>
        )}

        <button
          onClick={spin}
          disabled={spinning || claimed}
          className={`w-full py-3 rounded-xl font-bold text-white text-lg transition-all ${spinning || claimed ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 active:scale-95"}`}
        >
          {spinning ? "กำลังหมุน..." : claimed ? "หมุนแล้ววันนี้" : "🎰 หมุนเลย!"}
        </button>
      </div>
    </div>
  );
}
