import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get("count") === "unread") {
    const count = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });
    return NextResponse.json({ count });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // ดึง avatar ของ sender จาก link "/profile/:id"
  const senderIds = [...new Set(
    notifications
      .map((n) => n.link?.match(/^\/profile\/([^/?]+)/)?.[1])
      .filter(Boolean) as string[]
  )];

  const users = senderIds.length
    ? await prisma.user.findMany({
        where: { id: { in: senderIds } },
        select: { id: true, avatar: true },
      })
    : [];

  const avatarMap = Object.fromEntries(users.map((u) => [u.id, u.avatar]));

  const result = notifications.map((n) => {
    const senderId = n.link?.match(/^\/profile\/([^/?]+)/)?.[1];
    return { ...n, senderAvatar: senderId ? (avatarMap[senderId] ?? null) : null };
  });

  return NextResponse.json(result);
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ ok: true });
}
