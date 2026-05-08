import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    me,
    followersCount,
    followingCount,
    messagesSent,
    giftsReceived,
    giftsReceivedValue,
    notifications,
    recentTx,
    topUsers,
    friendRows,
    totalUsers,
    recentMessages,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: uid }, select: { coins: true, nickname: true, username: true, avatar: true, createdAt: true } }),
    prisma.follow.count({ where: { followingId: uid } }),
    prisma.follow.count({ where: { followerId: uid } }),
    prisma.message.count({ where: { senderId: uid } }),
    prisma.gift.count({ where: { receiverId: uid } }),
    prisma.gift.aggregate({ where: { receiverId: uid }, _sum: { coins: true } }),
    prisma.notification.count({ where: { userId: uid, isRead: false } }),
    prisma.coinTransaction.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.user.findMany({ orderBy: { coins: "desc" }, take: 5, select: { id: true, nickname: true, username: true, avatar: true, coins: true } }),
    prisma.follow.findMany({
      where: { followerId: uid, status: "accepted" },
      select: { following: { select: { id: true, nickname: true, username: true, avatar: true, isOnline: true } } },
    }),
    prisma.user.count(),
    prisma.message.findMany({
      where: { OR: [{ senderId: uid }, { receiverId: uid }] },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, content: true, createdAt: true,
        sender: { select: { id: true, nickname: true, username: true, avatar: true } },
        receiver: { select: { id: true, nickname: true, username: true, avatar: true } },
      },
    }),
  ]);

  return NextResponse.json({
    me,
    stats: {
      coins: me?.coins ?? 0,
      followers: followersCount,
      following: followingCount,
      messagesSent,
      giftsReceived,
      giftsValue: giftsReceivedValue._sum.coins ?? 0,
      unreadNotifications: notifications,
    },
    recentTx,
    topUsers,
    onlineFriends: friendRows.map((r) => r.following).filter((f) => f.isOnline),
    totalFriends: friendRows.length,
    recentMessages,
  });
}
