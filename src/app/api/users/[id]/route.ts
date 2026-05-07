import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true,
      coverImage: true,
      bio: true,
      gender: true,
      age: true,
      province: true,
      relationship: true,
      coins: true,
      starScore: true,
      voteMonthScore: true,
      voteTotalScore: true,
      vipLevel: true,
      isOnline: true,
      lastSeen: true,
      createdAt: true,
      _count: { select: { followers: true, followings: true, posts: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id || session.user.id !== id) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id },
    data: {
      nickname: body.nickname,
      bio: body.bio,
      avatar: body.avatar,
      coverImage: body.coverImage ?? undefined,
      gender: body.gender,
      age: body.age ? Number(body.age) : undefined,
      province: body.province ?? undefined,
      relationship: body.relationship ?? undefined,
    },
    select: { id: true, username: true, nickname: true, avatar: true, bio: true, gender: true, age: true, province: true },
  });
  return NextResponse.json(user);
}
