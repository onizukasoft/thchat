import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      isPaid: true,
      mediaUrls: true,
    },
  });

  if (!post) return NextResponse.json({ error: "ไม่พบโพสต์" }, { status: 404 });

  // Owner always has access
  const isOwner = post.userId === session.user.id;

  if (post.isPaid && !isOwner) {
    const purchased = await prisma.postPurchase.findUnique({
      where: { userId_postId: { userId: session.user.id, postId: id } },
    });
    if (!purchased) {
      return NextResponse.json({ error: "ต้องซื้อเพื่อดูวิดีโอนี้" }, { status: 403 });
    }
  }

  // Parse video URL from mediaUrls
  let videoUrl: string | null = null;
  try {
    const items: { url: string; type: string }[] = JSON.parse(post.mediaUrls ?? "[]");
    videoUrl = items.find((m) => m.type === "video")?.url ?? null;
  } catch {
    // ignore
  }

  if (!videoUrl) return NextResponse.json({ error: "ไม่พบวิดีโอ" }, { status: 404 });

  return NextResponse.json({ url: videoUrl });
}
