"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GuessPage() {
  const [secret, setSecret] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState<{ n: number; hint: string }[]>([]);
  const [won, setWon] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [msg, setMsg] = useState("");
  const maxGuesses = 7;

  function guess() {
    const n = parseInt(input);
    if (isNaN(n) || n < 1 || n > 100) return;
    setInput("");
    let hint = "";
    if (n === secret) { hint = "🎯 ถูกต้อง!"; setWon(true); }
    else if (n < secret) hint = n < secret - 20 ? "⬆️ น้อยไปมาก" : "⬆️ น้อยกว่า";
    else hint = n > secret + 20 ? "⬇️ มากไปมาก" : "⬇️ มากกว่า";
    setGuesses((g) => [...g, { n, hint }]);
  }

  async function claim() {
    const coins = Math.max(5, (maxGuesses - guesses.length + 1) * 5);
    const res = await fetch("/api/games/reward", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "guess", coins }),
    });
    const data = await res.json();
    if (data.success) { setClaimed(true); setMsg(`รับ ${coins} เหรียญแล้ว!`); }
    else { setClaimed(true); setMsg(data.message || "รับเหรียญแล้ววันนี้"); }
  }

  function restart() {
    setSecret(Math.floor(Math.random() * 100) + 1);
    setInput(""); setGuesses([]); setWon(false); setClaimed(false); setMsg("");
  }

  const lost = !won && guesses.length >= maxGuesses;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">ทายใจ</h1>
        <span className="text-sm text-gray-400 ml-auto">เหลือ {maxGuesses - guesses.length} ครั้ง</span>
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <p className="text-center text-gray-600">ทายตัวเลข <span className="font-bold text-blue-600">1–100</span></p>
        <div className="flex gap-2">
          <input
            type="number" min={1} max={100} value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !won && !lost && guess()}
            disabled={won || lost}
            placeholder="ใส่ตัวเลข..."
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-center font-bold text-lg focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={guess}
            disabled={won || lost || !input}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold disabled:opacity-40"
          >ทาย</button>
        </div>

        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {guesses.map((g, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium ${g.hint.includes("ถูก") ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"}`}>
              <span>ครั้งที่ {i + 1}: <strong>{g.n}</strong></span>
              <span>{g.hint}</span>
            </div>
          ))}
        </div>
      </div>

      {(won || lost) && (
        <div className={`rounded-xl border p-4 text-center space-y-3 ${won ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          {won ? <p className="font-bold text-green-700 text-lg">🎉 เยี่ยม! ทายถูกใน {guesses.length} ครั้ง</p>
            : <p className="font-bold text-red-600 text-lg">😢 ตัวเลขคือ <strong>{secret}</strong></p>}
          {msg && <p className="text-sm text-green-600 font-semibold">{msg}</p>}
          <div className="flex gap-2">
            {won && !claimed && (
              <button onClick={claim} className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-bold">รับเหรียญ 🪙</button>
            )}
            <button onClick={restart} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold">เล่นใหม่</button>
          </div>
        </div>
      )}
    </div>
  );
}
