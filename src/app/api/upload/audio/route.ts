import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

const ALLOWED_AUDIO = ["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/flac", "audio/aac", "audio/x-m4a"];
const MAX_SIZE = 30 * 1024 * 1024; // 30 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });

  const mime = file.type || "audio/mpeg";
  if (!ALLOWED_AUDIO.some((t) => mime.includes(t.split("/")[1])) && !mime.startsWith("audio/")) {
    return NextResponse.json({ error: "รองรับเฉพาะไฟล์เสียง MP3, OGG, WAV, M4A" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "ไฟล์ต้องไม่เกิน 30 MB" }, { status: 400 });

  // reuse "post" folder for audio files
  const url = await uploadFile(Buffer.from(await file.arrayBuffer()), "audio/mpeg", "post");
  return NextResponse.json({ url, name: file.name, size: file.size });
}
