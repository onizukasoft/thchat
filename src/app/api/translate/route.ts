import { NextRequest, NextResponse } from "next/server";

const ALLOWED_LANGS = new Set([
  "th","en","zh","ja","ko","vi","id","ms","my","km","lo","tl","hi","ar","fr","de","es","pt","ru","tr",
]);

export async function POST(req: NextRequest) {
  const { text, to = "th" } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "ไม่มีข้อความ" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "ข้อความยาวเกิน" }, { status: 400 });
  const targetLang = ALLOWED_LANGS.has(to) ? to : "th";

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: "แปลไม่สำเร็จ" }, { status: 502 });

  const data = await res.json();
  // data[0] is array of [translated, original, ...] segments
  const translated = (data[0] as [string, string][]).map(([t]) => t).join("");
  const detectedLang: string = data[2] ?? "auto";

  return NextResponse.json({ translated, detectedLang });
}
