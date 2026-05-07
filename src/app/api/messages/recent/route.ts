import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ],
    },
    include: {
      sender: { select: { id: true, username: true, nickname: true, avatar: true, isOnline: true } },
      receiver: { select: { id: true, username: true, nickname: true, avatar: true, isOnline: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Group by conversation partner and keep latest message
  const convMap = new Map<string, typeof messages[0]>();
  for (const msg of messages) {
    const partnerId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    if (!convMap.has(partnerId)) convMap.set(partnerId, msg);
  }

  const conversations = Array.from(convMap.values()).map((msg) => {
    const partner = msg.senderId === session.user!.id ? msg.receiver : msg.sender;
    return {
      partner,
      lastMessage: msg.content,
      lastMessageAt: msg.createdAt,
      isRead: msg.isRead || msg.senderId === session.user!.id,
    };
  });

  return NextResponse.json(conversations);
}
