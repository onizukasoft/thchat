import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { game, coins } = await req.json();
  if (!game || !coins || coins < 0 || coins > 500) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  // Check if already claimed this game today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.coinTransaction.findFirst({
    where: { userId: session.user.id, type: `game_${game}`, createdAt: { gte: today } },
  });
  if (existing) return NextResponse.json({ error: "already_claimed", message: "รับเหรียญแล้ววันนี้" }, { status: 400 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { coins: { increment: coins } } }),
    prisma.coinTransaction.create({ data: { userId: session.user.id, amount: coins, type: `game_${game}`, description: `เล่นเกม ${game}` } }),
  ]);

  return NextResponse.json({ success: true, coins });
}
