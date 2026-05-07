"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const QUESTIONS = [
  { q: "เมืองหลวงของประเทศไทยคือที่ไหน?", choices: ["เชียงใหม่", "กรุงเทพฯ", "พัทยา", "หัวหิน"], ans: 1 },
  { q: "ประเทศไทยมีกี่จังหวัด?", choices: ["70", "75", "77", "80"], ans: 2 },
  { q: "ดอกไม้ประจำชาติไทยคืออะไร?", choices: ["กล้วยไม้", "มะลิ", "ดอกบัว", "ชบา"], ans: 1 },
  { q: "ภาษาไทยมีพยัญชนะกี่ตัว?", choices: ["42", "44", "46", "48"], ans: 1 },
  { q: "สัตว์ประจำชาติไทยคืออะไร?", choices: ["สิงโต", "ช้าง", "เสือ", "ควาย"], ans: 1 },
  { q: "แม่น้ำที่ยาวที่สุดในไทยคืออะไร?", choices: ["แม่น้ำโขง", "แม่น้ำปิง", "แม่น้ำเจ้าพระยา", "แม่น้ำยม"], ans: 0 },
  { q: "วันชาติไทยตรงกับวันที่เท่าไหร่?", choices: ["5 ธันวาคม", "12 สิงหาคม", "28 กรกฎาคม", "10 ธันวาคม"], ans: 2 },
  { q: "ข้าวชนิดใดที่ไทยปลูกมากที่สุด?", choices: ["ข้าวเหนียว", "ข้าวจ้าว", "ข้าวกล้อง", "ข้าวโพด"], ans: 1 },
  { q: "ภาคใดของไทยที่มีพื้นที่มากที่สุด?", choices: ["ภาคเหนือ", "ภาคใต้", "ภาคอีสาน", "ภาคกลาง"], ans: 2 },
  { q: "ศาสนาประจำชาติไทยคืออะไร?", choices: ["อิสลาม", "คริสต์", "พุทธ", "ฮินดู"], ans: 2 },
];

export default function QuizPage() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [msg, setMsg] = useState("");

  const q = QUESTIONS[idx];

  function choose(i: number) {
    if (chosen !== null) return;
    setChosen(i);
    if (i === q.ans) setScore((s) => s + 1);
    setTimeout(() => {
      if (idx + 1 >= QUESTIONS.length) setDone(true);
      else { setIdx((n) => n + 1); setChosen(null); }
    }, 800);
  }

  async function claim() {
    const coins = score * 3;
    const res = await fetch("/api/games/reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "quiz", coins }),
    });
    const data = await res.json();
    if (data.success) { setClaimed(true); setMsg(`รับ ${coins} เหรียญแล้ว!`); }
    else { setClaimed(true); setMsg(data.message || "รับเหรียญแล้ววันนี้"); }
  }

  function restart() {
    setIdx(0); setScore(0); setChosen(null); setDone(false); setClaimed(false); setMsg("");
  }

  if (done) {
    const coins = score * 3;
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/games" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold">ถาม-ตอบ</h1>
        </div>
        <div className="bg-white rounded-2xl border p-6 text-center space-y-4">
          <div className="text-6xl">{score >= 8 ? "🏆" : score >= 5 ? "🥈" : "😅"}</div>
          <p className="text-2xl font-bold">{score}/{QUESTIONS.length} ข้อ</p>
          <p className="text-gray-500">รับได้ <span className="text-yellow-600 font-bold">{coins} เหรียญ</span></p>
          {msg && <p className="text-sm font-semibold text-green-600">{msg}</p>}
          <div className="flex gap-2">
            {!claimed && <button onClick={claim} className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-xl font-bold">รับเหรียญ 🪙</button>}
            <button onClick={restart} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold">เล่นใหม่</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">ถาม-ตอบ</h1>
        <span className="text-sm text-gray-400 ml-auto">{idx + 1}/{QUESTIONS.length}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${((idx) / QUESTIONS.length) * 100}%` }} />
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <p className="font-semibold text-lg leading-relaxed">{q.q}</p>
        <div className="space-y-2">
          {q.choices.map((c, i) => (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={chosen !== null}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                chosen === null ? "border-gray-200 hover:border-blue-400 hover:bg-blue-50" :
                i === q.ans ? "border-green-400 bg-green-50 text-green-700" :
                chosen === i ? "border-red-400 bg-red-50 text-red-600" :
                "border-gray-200 opacity-50"
              }`}
            >
              {["A", "B", "C", "D"][i]}. {c}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center text-sm text-gray-400">คะแนน: {score} ข้อ • ถูกต้องรับข้อละ 3 เหรียญ</div>
    </div>
  );
}
