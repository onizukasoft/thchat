import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, isAllowedImage, isAllowedVideo } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });

  const isVideo = isAllowedVideo(file.type);
  const isImage = isAllowedImage(file.type);
  if (!isImage && !isVideo) return NextResponse.json({ error: "รองรับ JPG, PNG, WebP, GIF, MP4, WebM, MOV" }, { status: 400 });

  const maxSize = isVideo ? 30 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ error: `ไฟล์ต้องไม่เกิน ${isVideo ? "30" : "5"} MB` }, { status: 400 });

  const url = await uploadFile(Buffer.from(await file.arrayBuffer()), file.type, "avatar");
  await prisma.user.update({ where: { id: session.user.id }, data: { avatar: url } });
  return NextResponse.json({ url, isVideo });
}
