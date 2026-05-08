import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, isAllowedImage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  if (!isAllowedImage(file.type)) return NextResponse.json({ error: "รองรับเฉพาะ JPG, PNG, WebP, GIF" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "ไฟล์ต้องไม่เกิน 10 MB" }, { status: 400 });

  const url = await uploadFile(Buffer.from(await file.arrayBuffer()), file.type, "chat");
  return NextResponse.json({ url });
}
