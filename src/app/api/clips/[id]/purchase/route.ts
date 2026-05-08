import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  const { id: clipId } = await params;

  const clip = await prisma.clip.findUnique({
    where: { id: clipId },
    include: { creator: true },
  });

  if (!clip) return NextResponse.json({ error: "ไม่พบคลิป" }, { status: 404 });
  if (!clip.lockedPrice || clip.lockedPrice <= 0) {
    return NextResponse.json({ error: "คลิปนี้ไม่ใช่ PPV" }, { status: 400 });
  }
  if (clip.creatorId === session.user.id) {
    return NextResponse.json({ error: "ไม่จำเป็นต้องซื้อคลิปของตัวเอง" }, { status: 400 });
  }

  // Already purchased?
  const existing = await prisma.clipPurchase.findUnique({
    where: { userId_clipId: { userId: session.user.id, clipId } },
  });
  if (existing) return NextResponse.json({ error: "ซื้อคลิปนี้ไปแล้ว" }, { status: 400 });

  const buyer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });
  if (!buyer || buyer.coins < clip.lockedPrice) {
    return NextResponse.json({ error: `เหรียญไม่พอ (ต้องการ ${clip.lockedPrice} เหรียญ)` }, { status: 400 });
  }

  const creatorEarns = Math.floor(clip.lockedPrice * 0.8);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { decrement: clip.lockedPrice } },
    }),
    prisma.creatorProfile.update({
      where: { userId: clip.creatorId },
      data: {
        totalEarned: { increment: clip.lockedPrice },
        withdrawable: { increment: creatorEarns },
      },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        amount: -clip.lockedPrice,
        type: "spend",
        description: `ปลดล็อคคลิป "${clip.title}"`,
      },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: clip.creatorId,
        amount: creatorEarns,
        type: "earn",
        description: `รายได้จาก PPV "${clip.title}"`,
      },
    }),
    prisma.clipPurchase.create({
      data: { userId: session.user.id, clipId, price: clip.lockedPrice },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
