import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TAKE = 10;

async function byCoins(gender: string) {
  return prisma.user.findMany({
    where: { gender },
    select: { id: true, username: true, nickname: true, avatar: true, coins: true, isOnline: true },
    orderBy: { coins: "desc" },
    take: TAKE,
  });
}

async function byGifts(gender: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const totals = await prisma.gift.groupBy({
    by: ["receiverId"],
    where: { createdAt: { gte: start, lt: end } },
    _sum: { coins: true },
    orderBy: { _sum: { coins: "desc" } },
    take: TAKE * 3,
  });

  const ids = totals.map((t) => t.receiverId);
  if (ids.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ids }, gender },
    select: { id: true, username: true, nickname: true, avatar: true, coins: true, isOnline: true },
  });

  const coinsMap = new Map(totals.map((t) => [t.receiverId, t._sum.coins ?? 0]));
  return users
    .sort((a, b) => (coinsMap.get(b.id) ?? 0) - (coinsMap.get(a.id) ?? 0))
    .slice(0, TAKE)
    .map((u) => ({ ...u, coins: coinsMap.get(u.id) ?? 0 }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "month";

  const fn = tab === "gift" || tab === "tip" ? byGifts : byCoins;
  const [female, male] = await Promise.all([fn("female"), fn("male")]);
  return NextResponse.json({ female, male });
}
