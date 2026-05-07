import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const GIFT_PRICES: Record<string, number> = {
  flower: 10, heart: 20, candy: 30, ring: 100, car: 500, diamond: 1000,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const gifts = await prisma.gift.findMany({
    where: { receiverId: session.user.id },
    include: { sender: { select: { id: true, username: true, nickname: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(gifts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { receiverId, giftType, message } = await req.json();
  const cost = GIFT_PRICES[giftType];
  if (!cost) return NextResponse.json({ error: "ของขวัญไม่ถูกต้อง" }, { status: 400 });

  const sender = await prisma.user.findUnique({ where: { id: session.user.id }, select: { coins: true } });
  if (!sender || sender.coins < cost) return NextResponse.json({ error: "เหรียญไม่พอ" }, { status: 400 });

  const [gift] = await Promise.all([
    prisma.gift.create({
      data: { senderId: session.user.id, receiverId, giftType, coins: cost, message },
      include: { sender: { select: { id: true, username: true, nickname: true, avatar: true } } },
    }),
    prisma.user.update({ where: { id: session.user.id }, data: { coins: { decrement: cost } } }),
    prisma.user.update({ where: { id: receiverId }, data: { coins: { increment: Math.floor(cost * 0.7) } } }),
    prisma.coinTransaction.create({ data: { userId: session.user.id, amount: -cost, type: "gift_send", description: `ส่งของขวัญ ${giftType}` } }),
    prisma.coinTransaction.create({ data: { userId: receiverId, amount: Math.floor(cost * 0.7), type: "gift_receive", description: `รับของขวัญ ${giftType}` } }),
    prisma.notification.create({ data: { userId: receiverId, type: "gift", title: "ได้รับของขวัญ!", body: `มีคนส่ง ${giftType} ให้คุณ`, link: "/gifts" } }),
  ]);

  return NextResponse.json(gift, { status: 201 });
}
