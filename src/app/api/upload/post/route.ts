import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, isAllowedMedia, isAllowedVideo } from "@/lib/storage";

const MAX_IMAGE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO = 200 * 1024 * 1024; // 200 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  if (files.length > 9) return NextResponse.json({ error: "อัปโหลดได้สูงสุด 9 ไฟล์" }, { status: 400 });

  const results: { url: string; type: "image" | "video" }[] = [];

  for (const file of files) {
    if (!isAllowedMedia(file.type)) {
      return NextResponse.json({ error: `ไม่รองรับไฟล์ประเภท ${file.type}` }, { status: 400 });
    }
    const isVideo = isAllowedVideo(file.type);
    const maxSize = isVideo ? MAX_VIDEO : MAX_IMAGE;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `${file.name} ขนาดเกิน ${isVideo ? "200 MB" : "10 MB"}`,
      }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(buf, file.type, "post");
    results.push({ url, type: isVideo ? "video" : "image" });
  }

  return NextResponse.json({ files: results });
}

