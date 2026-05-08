import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET creator profile
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  const { userId } = await params;

  const creator = await prisma.creatorProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, username: true, nickname: true, avatar: true } },
      _count: { select: { subscriptions: true, clips: true } },
    },
  });

  if (!creator) return NextResponse.json({ error: "ไม่พบ Creator" }, { status: 404 });

  let isSubscribed = false;
  let subscriptionExpiresAt: Date | null = null;
  if (session?.user?.id && session.user.id !== userId) {
    const sub = await prisma.clipSubscription.findUnique({
      where: { subscriberId_creatorId: { subscriberId: session.user.id, creatorId: userId } },
    });
    isSubscribed = !!sub && sub.expiresAt > new Date();
    subscriptionExpiresAt = sub?.expiresAt ?? null;
  }

  const isOwn = session?.user?.id === userId;

  return NextResponse.json({
    userId: creator.userId,
    bio: creator.bio,
    monthlyPrice: creator.monthlyPrice,
    isActive: creator.isActive,
    subscriberCount: creator._count.subscriptions,
    clipCount: creator._count.clips,
    ...(isOwn ? { totalEarned: creator.totalEarned, withdrawable: creator.withdrawable } : {}),
    user: creator.user,
    isSubscribed,
    subscriptionExpiresAt,
    isOwn,
  });
}

// POST setup/update creator profile
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  const { userId } = await params;
  if (session.user.id !== userId) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });

  const { bio, monthlyPrice } = await req.json();
  if (monthlyPrice !== undefined && (monthlyPrice < 1 || monthlyPrice > 9999)) {
    return NextResponse.json({ error: "ราคาต้องอยู่ระหว่าง 1–9999 เหรียญ" }, { status: 400 });
  }

  const creator = await prisma.creatorProfile.upsert({
    where: { userId },
    update: {
      ...(bio !== undefined ? { bio: bio?.trim() || null } : {}),
      ...(monthlyPrice !== undefined ? { monthlyPrice } : {}),
    },
    create: { userId, bio: bio?.trim() || null, monthlyPrice: monthlyPrice ?? 99 },
  });

  return NextResponse.json(creator);
}
