import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text, to = "th" } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "ไม่มีข้อความ" }, { status: 400 });

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: "แปลไม่สำเร็จ" }, { status: 502 });

  const data = await res.json();
  // data[0] is array of [translated, original, ...] segments
  const translated = (data[0] as [string, string][]).map(([t]) => t).join("");
  const detectedLang: string = data[2] ?? "auto";

  return NextResponse.json({ translated, detectedLang });
}
