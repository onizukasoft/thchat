import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
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
    select: { id: true, userId: true, isPaid: true, price: true },
  });

  if (!post) return NextResponse.json({ error: "ไม่พบโพสต์" }, { status: 404 });
  if (!post.isPaid) return NextResponse.json({ error: "โพสต์นี้ไม่ต้องซื้อ" }, { status: 400 });
  if (post.userId === session.user.id) {
    return NextResponse.json({ error: "ไม่สามารถซื้อโพสต์ตัวเองได้" }, { status: 400 });
  }

  // Check already purchased
  const existing = await prisma.postPurchase.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: id } },
  });
  if (existing) return NextResponse.json({ error: "ซื้อแล้ว" }, { status: 400 });

  // Check buyer coins
  const buyer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });
  if (!buyer || buyer.coins < post.price) {
    return NextResponse.json({ error: "เหรียญไม่พอ" }, { status: 400 });
  }

  await prisma.$transaction([
    // Deduct from buyer
    prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { decrement: post.price } },
    }),
    // Add to creator (70% revenue share, adjust as needed)
    prisma.user.update({
      where: { id: post.userId },
      data: { coins: { increment: Math.floor(post.price * 0.7) } },
    }),
    // Record purchase
    prisma.postPurchase.create({
      data: { userId: session.user.id, postId: id, price: post.price },
    }),
    // Log transactions
    prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        amount: -post.price,
        type: "post_purchase",
        description: `ซื้อวิดีโอ #${id}`,
      },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: post.userId,
        amount: Math.floor(post.price * 0.7),
        type: "post_income",
        description: `รายได้จากวิดีโอ #${id}`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
