import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const [user, recentPosts, recentTx, giftsReceived, heartsReceivedAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, nickname: true, email: true, avatar: true,
        bio: true, gender: true, age: true, province: true, role: true,
        isBanned: true, isOnline: true, coins: true, vipLevel: true, vipUntil: true,
        coverImage: true, relationship: true, starScore: true,
        createdAt: true, lastSeen: true,
        _count: { select: { posts: true, sentMessages: true, receivedGifts: true, followers: true, followings: true } },
      },
    }),
    prisma.post.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, category: true, views: true, createdAt: true, _count: { select: { comments: true } } },
    }),
    prisma.coinTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, amount: true, type: true, description: true, createdAt: true },
    }),
    prisma.gift.findMany({
      where: { receiverId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, giftType: true, coins: true, createdAt: true, sender: { select: { username: true, nickname: true } } },
    }),
    prisma.heartVote.aggregate({
      where: { toUserId: id },
      _sum: { amount: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const heartsReceivedTotal = heartsReceivedAgg._sum.amount ?? 0;
  return NextResponse.json({ user, recentPosts, recentTx, giftsReceived, heartsReceivedTotal });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.role !== undefined) data.role = body.role;
  if (body.isBanned !== undefined) data.isBanned = body.isBanned;
  if (body.coins !== undefined) data.coins = Number(body.coins);
  if (body.vipLevel !== undefined) data.vipLevel = body.vipLevel;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, role: true, isBanned: true, coins: true, vipLevel: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
