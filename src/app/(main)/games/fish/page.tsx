"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const FISH = [
  { name: "ปลาทอง", icon: "🐟", coins: 5, chance: 0.35 },
  { name: "ปลาใหญ่", icon: "🐠", coins: 10, chance: 0.25 },
  { name: "ปลาฉลาม", icon: "🦈", coins: 30, chance: 0.08 },
  { name: "กุ้งมังกร", icon: "🦞", coins: 20, chance: 0.12 },
  { name: "หมึก", icon: "🐙", coins: 15, chance: 0.10 },
  { name: "ไม่ได้อะไร", icon: "💨", coins: 0, chance: 0.10 },
];

export default function FishPage() {
  const [casting, setCasting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [result, setResult] = useState<typeof FISH[0] | null>(null);
  const [log, setLog] = useState<{ fish: typeof FISH[0]; time: string }[]>([]);
  const [totalCoins, setTotalCoins] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const [msg, setMsg] = useState("");
  const castCount = useRef(0);

  async function cast() {
    if (casting || waiting || claimed || castCount.current >= 5) return;
    setCasting(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 500));
    setCasting(false);
    setWaiting(true);
    const waitTime = 2000 + Math.random() * 3000;
    await new Promise((r) => setTimeout(r, waitTime));
    setWaiting(false);
    const rand = Math.random();
    let cum = 0;
    let caught = FISH[FISH.length - 1];
    for (const f of FISH) { cum += f.chance; if (rand < cum) { caught = f; break; } }
    setResult(caught);
    castCount.current += 1;
    if (caught.coins > 0) setTotalCoins((t) => t + caught.coins);
    setLog((l) => [{ fish: caught, time: new Date().toLocaleTimeString("th") }, ...l].slice(0, 10));
    if (castCount.current >= 5) setMsg("ตกปลาครบ 5 ครั้งแล้ว กดรับเหรียญได้เลย!");
  }

  async function claim() {
    if (totalCoins === 0) { setMsg("ไม่มีเหรียญให้รับ"); return; }
    const res = await fetch("/api/games/reward", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "fish", coins: totalCoins }),
    });
    const data = await res.json();
    if (data.success) { setClaimed(true); setMsg(`รับ ${totalCoins} เหรียญแล้ว!`); }
    else { setClaimed(true); setMsg(data.message || "รับเหรียญแล้ววันนี้"); }
  }

  const remaining = 5 - castCount.current;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">ตกปลา</h1>
        <span className="text-sm text-gray-400 ml-auto">เหลือ {remaining} ครั้ง</span>
      </div>

      {/* Water scene */}
      <div className="bg-gradient-to-b from-sky-200 to-blue-400 rounded-2xl h-48 flex flex-col items-center justify-end overflow-hidden relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-4xl transition-all duration-500"
          style={{ transform: `translateX(-50%) translateY(${casting || waiting ? "0" : "-20px"})` }}>
          🎣
        </div>
        {waiting && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <div className="w-px bg-blue-700 opacity-60" style={{ height: "60px" }} />
            <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce" />
          </div>
        )}
        {result && result.coins > 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl animate-bounce">{result.icon}</div>
        )}
        <div className="w-full bg-blue-500 h-12 flex items-center justify-center">
          <span className="text-blue-200 text-xs">🌊 แม่น้ำโขง 🌊</span>
        </div>
      </div>

      {result && (
        <div className={`rounded-xl border p-3 text-center font-semibold ${result.coins > 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
          {result.coins > 0 ? `${result.icon} ได้ ${result.name}! +${result.coins} เหรียญ` : `${result.icon} ${result.name}...`}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={cast}
          disabled={casting || waiting || remaining <= 0 || claimed}
          className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${casting || waiting ? "bg-blue-300" : remaining <= 0 || claimed ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 active:scale-95"}`}
        >
          {casting ? "โยนแล้ว..." : waiting ? "⏳ รอปลากัด..." : remaining <= 0 ? "หมดแล้ว" : "🎣 โยนเบ็ด"}
        </button>
        {(remaining <= 0 || claimed) && totalCoins > 0 && !claimed && (
          <button onClick={claim} className="px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-white rounded-xl font-bold">
            รับ {totalCoins} 🪙
          </button>
        )}
      </div>

      {msg && <p className="text-center text-sm font-medium text-green-600">{msg}</p>}

      <div className="bg-white rounded-xl border divide-y overflow-hidden">
        <div className="px-4 py-2 text-xs font-semibold text-gray-400">ประวัติ • รวม {totalCoins} เหรียญ</div>
        {log.length === 0 && <p className="text-center py-4 text-sm text-gray-400">โยนเบ็ดเพื่อเริ่มตกปลา</p>}
        {log.map((l, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2 text-sm">
            <span className="text-xl">{l.fish.icon}</span>
            <span className="flex-1">{l.fish.name}</span>
            <span className={l.fish.coins > 0 ? "text-yellow-600 font-bold" : "text-gray-400"}>{l.fish.coins > 0 ? `+${l.fish.coins} 🪙` : "-"}</span>
            <span className="text-xs text-gray-300">{l.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
