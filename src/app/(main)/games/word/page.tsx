"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const WORDS = ["แมว","หมา","ปลา","วัว","เป็ด","ไก่","หมู","ม้า","ช้าง","เสือ","กบ","นก","ปู","กุ้ง","หอย"];
const HINTS = {
  "แมว": "สัตว์เลี้ยงที่ร้องเหมียว",
  "หมา": "สัตว์เลี้ยงที่ซื่อสัตย์",
  "ปลา": "สัตว์น้ำที่ว่ายน้ำเก่ง",
  "วัว": "สัตว์ที่ให้นม",
  "เป็ด": "สัตว์ปีกที่ว่ายน้ำได้",
  "ไก่": "สัตว์ที่ให้ไข่",
  "หมู": "สัตว์ที่ชอบอยู่ในโคลน",
  "ม้า": "สัตว์ที่วิ่งเร็วมาก",
  "ช้าง": "สัตว์ประจำชาติไทย",
  "เสือ": "สัตว์นักล่าในป่า",
  "กบ": "สัตว์สีเขียวที่กระโดดได้",
  "นก": "สัตว์ที่บินได้",
  "ปู": "สัตว์น้ำที่เดินข้าง",
  "กุ้ง": "อาหารทะเลยอดนิยม",
  "หอย": "สัตว์ที่มีเปลือก",
} as Record<string, string>;

export default function WordPage() {
  const [word] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [msg, setMsg] = useState("");
  const maxTries = 6;
  const hint = HINTS[word];

  function submit() {
    if (input.trim() === "") return;
    const g = input.trim();
    const newGuesses = [...guesses, g];
    setGuesses(newGuesses);
    setInput("");
    if (g === word) { setWon(true); return; }
    if (newGuesses.length >= maxTries) setLost(true);
  }

  function getLetterStatus(guess: string, pos: number) {
    const ch = guess[pos];
    if (!ch) return "bg-gray-100";
    if (ch === word[pos]) return "bg-green-400 text-white";
    if (word.includes(ch)) return "bg-yellow-400 text-white";
    return "bg-gray-300 text-white";
  }

  async function claim() {
    const coins = Math.max(5, (maxTries - guesses.length + 1) * 5);
    const res = await fetch("/api/games/reward", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "word", coins }),
    });
    const data = await res.json();
    if (data.success) { setClaimed(true); setMsg(`รับ ${coins} เหรียญแล้ว!`); }
    else { setClaimed(true); setMsg(data.message || "รับเหรียญแล้ววันนี้"); }
  }

  // Pad guesses to show empty rows
  const rows = Array.from({ length: maxTries }, (_, i) => guesses[i] ?? null);
  const maxLen = word.length;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">เกมคำศัพท์</h1>
        <span className="text-sm text-gray-400 ml-auto">{guesses.length}/{maxTries}</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        💡 คำใบ้: <strong>{hint}</strong> ({maxLen} ตัวอักษร)
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="space-y-2">
          {rows.map((g, ri) => (
            <div key={ri} className="flex gap-1.5 justify-center">
              {Array.from({ length: maxLen }, (_, ci) => (
                <div key={ci} className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold border-2 transition-colors ${
                  g ? getLetterStatus(g, ci) + " border-transparent" : "border-gray-200 bg-gray-50"
                }`}>
                  {g?.[ci] ?? ""}
                </div>
              ))}
            </div>
          ))}
        </div>

        {!won && !lost && (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={`พิมพ์คำ ${maxLen} ตัว...`}
              maxLength={maxLen}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-center font-bold focus:outline-none focus:border-blue-400"
            />
            <button onClick={submit} className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold">ส่ง</button>
          </div>
        )}

        <div className="flex gap-3 text-xs text-center">
          <div className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-400 inline-block"/><span>ถูกที่</span></div>
          <div className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-yellow-400 inline-block"/><span>มีแต่ผิดที่</span></div>
          <div className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-300 inline-block"/><span>ไม่มี</span></div>
        </div>
      </div>

      {(won || lost) && (
        <div className={`rounded-xl border p-4 text-center space-y-3 ${won ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          {won ? <p className="font-bold text-green-700 text-lg">🎉 ถูกต้อง! ใช้ {guesses.length} ครั้ง</p>
            : <p className="font-bold text-red-600">😢 คำตอบคือ <strong>{word}</strong></p>}
          {msg && <p className="text-sm text-green-600 font-semibold">{msg}</p>}
          {won && !claimed && (
            <button onClick={claim} className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-bold">รับเหรียญ 🪙</button>
          )}
        </div>
      )}
    </div>
  );
}
