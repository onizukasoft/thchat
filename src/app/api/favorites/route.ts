import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const follows = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    include: {
      following: {
        select: { id: true, username: true, nickname: true, avatar: true, gender: true, age: true, isOnline: true, lastSeen: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(follows.map((f) => f.following));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { targetId } = await req.json();
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
  });

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
    });
    return NextResponse.json({ followed: false });
  }

  await Promise.all([
    prisma.follow.create({ data: { followerId: session.user.id, followingId: targetId } }),
    prisma.notification.create({
      data: { userId: targetId, type: "follow", title: "มีคนติดตามคุณ!", body: "มีผู้ใช้ใหม่ติดตามคุณ", link: `/profile/${session.user.id}` },
    }),
  ]);
  return NextResponse.json({ followed: true });
}
