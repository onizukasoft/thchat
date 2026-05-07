import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, onlineUsers, newUsersMonth, totalPosts, totalMessages, totalGifts, bannedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isOnline: true } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.post.count(),
    prisma.message.count(),
    prisma.gift.count(),
    prisma.user.count({ where: { isBanned: true } }),
  ]);

  return NextResponse.json({ totalUsers, onlineUsers, newUsersMonth, totalPosts, totalMessages, totalGifts, bannedUsers });
}
