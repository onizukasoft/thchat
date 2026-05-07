"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const EMOJIS = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼"];

function shuffle<T>(arr: T[]): T[] {
  return [...arr, ...arr].sort(() => Math.random() - 0.5);
}

export default function MatchPage() {
  const [cards, setCards] = useState<{ emoji: string; id: number; flipped: boolean; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [msg, setMsg] = useState("");
  const [locked, setLocked] = useState(false);

  function init() {
    const emojis = shuffle(EMOJIS);
    setCards(emojis.map((e, i) => ({ emoji: e, id: i, flipped: false, matched: false })));
    setSelected([]);
    setMoves(0);
    setWon(false);
    setClaimed(false);
    setMsg("");
    setLocked(false);
  }

  useEffect(() => { init(); }, []);

  function flip(id: number) {
    if (locked || won) return;
    const card = cards[id];
    if (card.flipped || card.matched || selected.includes(id)) return;
    const newCards = cards.map((c, i) => i === id ? { ...c, flipped: true } : c);
    const newSelected = [...selected, id];
    setCards(newCards);
    if (newSelected.length === 2) {
      setLocked(true);
      setMoves((m) => m + 1);
      const [a, b] = newSelected;
      if (newCards[a].emoji === newCards[b].emoji) {
        const matched = newCards.map((c, i) => newSelected.includes(i) ? { ...c, matched: true } : c);
        setCards(matched);
        setSelected([]);
        setLocked(false);
        if (matched.every((c) => c.matched)) setWon(true);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => newSelected.includes(i) ? { ...c, flipped: false } : c));
          setSelected([]);
          setLocked(false);
        }, 800);
      }
    } else {
      setSelected(newSelected);
    }
  }

  async function claim() {
    const coins = Math.max(5, 30 - moves);
    const res = await fetch("/api/games/reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "match", coins }),
    });
    const data = await res.json();
    if (data.success) { setClaimed(true); setMsg(`รับ ${coins} เหรียญแล้ว!`); }
    else { setClaimed(true); setMsg(data.message || "รับเหรียญแล้ววันนี้"); }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">จับคู่รูป</h1>
        <span className="text-sm text-gray-400 ml-auto">ใช้เวลา {moves} ครั้ง</span>
      </div>

      <div className="bg-white rounded-2xl border p-4">
        <div className="grid grid-cols-4 gap-2">
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => flip(i)}
              className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all duration-300 border-2 ${
                card.matched ? "border-green-400 bg-green-50 scale-95" :
                card.flipped ? "border-blue-400 bg-blue-50" :
                "border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer"
              }`}
            >
              {card.flipped || card.matched ? card.emoji : "❓"}
            </button>
          ))}
        </div>
      </div>

      {won && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-3">
          <p className="text-green-700 font-bold text-lg">🎉 จับคู่ครบแล้ว! ใช้ {moves} ครั้ง</p>
          <p className="text-sm text-gray-500">รับได้ {Math.max(5, 30 - moves)} เหรียญ</p>
          {msg && <p className="text-sm font-semibold text-green-600">{msg}</p>}
          <div className="flex gap-2">
            {!claimed && <button onClick={claim} className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-bold">รับเหรียญ 🪙</button>}
            <button onClick={init} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold">เล่นใหม่</button>
          </div>
        </div>
      )}
      {!won && <button onClick={init} className="w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">เริ่มใหม่</button>}
    </div>
  );
}
