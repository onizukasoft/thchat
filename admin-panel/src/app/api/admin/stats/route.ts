import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [
    totalUsers,
    onlineUsers,
    newUsersToday,
    newUsersMonth,
    bannedUsers,
    totalPosts,
    newPostsToday,
    totalMessages,
    totalRooms,
    totalGifts,
    totalCoins,
    coinsTx,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isOnline: true } }),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.message.count(),
    prisma.room.count(),
    prisma.gift.count(),
    prisma.user.aggregate({ _sum: { coins: true } }),
    prisma.coinTransaction.count({ where: { createdAt: { gte: startOfWeek } } }),
  ]);

  return NextResponse.json({
    totalUsers,
    onlineUsers,
    newUsersToday,
    newUsersMonth,
    bannedUsers,
    totalPosts,
    newPostsToday,
    totalMessages,
    totalRooms,
    totalGifts,
    totalCoinsInCirculation: totalCoins._sum.coins ?? 0,
    coinsTxThisWeek: coinsTx,
  });
}
