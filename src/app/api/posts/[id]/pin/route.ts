import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPackageLimits } from "@/lib/packages";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { pinned } = await req.json();
  if (typeof pinned !== "boolean") return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, userId: true, isPinned: true },
  });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { vipLevel: true, vipUntil: true },
  });
  const limits = getPackageLimits(me?.vipLevel, me?.vipUntil);

  if (pinned) {
    if (limits.pinPosts <= 0) {
      return NextResponse.json({ error: "pin_not_allowed", message: "แพ็กเกจนี้ยังไม่รองรับการปักหมุดโพสต์" }, { status: 403 });
    }
    const pinnedCount = await prisma.post.count({ where: { userId: session.user.id, isPinned: true } });
    if (!post.isPinned && pinnedCount >= limits.pinPosts) {
      return NextResponse.json(
        { error: "pin_limit", message: `ปักหมุดได้สูงสุด ${limits.pinPosts} โพสต์` },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { isPinned: pinned },
    select: { id: true, isPinned: true },
  });

  return NextResponse.json({ success: true, post: updated, pinLimit: limits.pinPosts });
}
