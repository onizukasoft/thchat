import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  const { userId: creatorId } = await params;

  if (session.user.id === creatorId) {
    return NextResponse.json({ error: "ไม่สามารถสมัครสมาชิกตัวเองได้" }, { status: 400 });
  }

  const creator = await prisma.creatorProfile.findUnique({ where: { userId: creatorId } });
  if (!creator || !creator.isActive) return NextResponse.json({ error: "ไม่พบ Creator" }, { status: 404 });

  const subscriber = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });
  if (!subscriber || subscriber.coins < creator.monthlyPrice) {
    return NextResponse.json({ error: `เหรียญไม่พอ (ต้องการ ${creator.monthlyPrice} เหรียญ)` }, { status: 400 });
  }

  // Check existing subscription
  const existing = await prisma.clipSubscription.findUnique({
    where: { subscriberId_creatorId: { subscriberId: session.user.id, creatorId } },
  });

  const now = new Date();
  const base = existing && existing.expiresAt > now ? existing.expiresAt : now;
  const expiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  await prisma.$transaction([
    // Deduct coins from subscriber
    prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { decrement: creator.monthlyPrice } },
    }),
    // Add coins to creator (80% after 20% platform fee)
    prisma.creatorProfile.update({
      where: { userId: creatorId },
      data: {
        totalEarned: { increment: creator.monthlyPrice },
        withdrawable: { increment: Math.floor(creator.monthlyPrice * 0.8) },
      },
    }),
    // Record transaction
    prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        amount: -creator.monthlyPrice,
        type: "spend",
        description: `สมัครสมาชิก Creator (30 วัน)`,
      },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: creatorId,
        amount: Math.floor(creator.monthlyPrice * 0.8),
        type: "earn",
        description: `รายได้จากสมาชิก`,
      },
    }),
    // Upsert subscription
    existing
      ? prisma.clipSubscription.update({
          where: { subscriberId_creatorId: { subscriberId: session.user.id, creatorId } },
          data: { expiresAt },
        })
      : prisma.clipSubscription.create({
          data: { subscriberId: session.user.id, creatorId, expiresAt },
        }),
  ]);

  return NextResponse.json({ ok: true, expiresAt });
}
