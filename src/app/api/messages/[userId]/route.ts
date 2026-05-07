import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { userId } = await params;
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: userId },
        { senderId: userId, receiverId: session.user.id },
      ],
    },
    include: {
      sender: { select: { id: true, username: true, nickname: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Mark as read
  await prisma.message.updateMany({
    where: { senderId: userId, receiverId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json(messages);
}
