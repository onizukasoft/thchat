import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, isAllowedVideo, isAllowedImage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) || "video";

  if (!file) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });

  if (type === "thumbnail") {
    if (!isAllowedImage(file.type)) return NextResponse.json({ error: "รองรับเฉพาะรูปภาพ" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "รูปต้องไม่เกิน 5 MB" }, { status: 400 });
    const url = await uploadFile(Buffer.from(await file.arrayBuffer()), file.type, "clip");
    return NextResponse.json({ url });
  }

  if (!isAllowedVideo(file.type)) return NextResponse.json({ error: "รองรับเฉพาะ MP4, WebM, MOV" }, { status: 400 });
  if (file.size > 500 * 1024 * 1024) return NextResponse.json({ error: "คลิปต้องไม่เกิน 500 MB" }, { status: 400 });

  const url = await uploadFile(Buffer.from(await file.arrayBuffer()), file.type, "clip");
  return NextResponse.json({ url });
}
