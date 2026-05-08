import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPackageLimits } from "@/lib/packages";

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
      sender: { select: { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  await prisma.message.updateMany({
    where: { senderId: userId, receiverId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { userId: receiverId } = await params;
  const { content, type = "text" } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "ข้อความว่างเปล่า" }, { status: 400 });

  // ── ตรวจสอบ limit ──────────────────────────────────────────
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { vipLevel: true, vipUntil: true },
  });

  const limits = getPackageLimits(me?.vipLevel, me?.vipUntil);

  // นับจำนวนคนที่แชทไปแล้ววันนี้
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const chatCountToday = await prisma.message.groupBy({
    by: ["receiverId"],
    where: { senderId: session.user.id, createdAt: { gte: today } },
  });

  const alreadyChatted = chatCountToday.some((m) => m.receiverId === receiverId);
  const uniqueCount = chatCountToday.length;

  if (!alreadyChatted && uniqueCount >= limits.chatPerDay) {
    return NextResponse.json({
      error: "chat_limit",
      message: `คุณแชทครบ ${limits.chatPerDay} คนแล้ววันนี้`,
      limit: limits.chatPerDay,
      package: limits.label,
      upgrade: limits.chatPerDay < 50,
    }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: { content: content.trim(), type, senderId: session.user.id, receiverId },
    include: {
      sender: { select: { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } },
    },
  });

  return NextResponse.json(message);
}
