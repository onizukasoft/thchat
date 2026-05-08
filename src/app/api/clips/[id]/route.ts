import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessSets, resolveAccess } from "@/lib/clip-access";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const clip = await prisma.clip.findUnique({
    where: { id },
    include: {
      creator: {
        include: {
          user: { select: { id: true, username: true, nickname: true, avatar: true } },
        },
      },
    },
  });

  if (!clip) return NextResponse.json({ error: "ไม่พบคลิป" }, { status: 404 });

  const access = await getAccessSets(session?.user?.id);
  const hasAccess = resolveAccess(clip, session?.user?.id, access);

  // Only increment views when the user can actually see the clip
  if (hasAccess) {
    await prisma.clip.update({ where: { id }, data: { views: { increment: 1 } } });
  }

  return NextResponse.json({
    id: clip.id,
    title: clip.title,
    description: clip.description,
    thumbnailUrl: clip.thumbnailUrl,
    videoUrl: hasAccess ? clip.videoUrl : null,   // gate kept server-side
    isSubscriberOnly: clip.isSubscriberOnly,
    lockedPrice: clip.lockedPrice,
    hasAccess,
    views: clip.views,
    createdAt: clip.createdAt,
    creator: {
      id: clip.creator.user.id,
      username: clip.creator.user.username,
      nickname: clip.creator.user.nickname,
      avatar: clip.creator.user.avatar,
      monthlyPrice: clip.creator.monthlyPrice,
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  const { id } = await params;

  const clip = await prisma.clip.findUnique({ where: { id } });
  if (!clip) return NextResponse.json({ error: "ไม่พบคลิป" }, { status: 404 });
  if (clip.creatorId !== session.user.id) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });

  await prisma.clip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
