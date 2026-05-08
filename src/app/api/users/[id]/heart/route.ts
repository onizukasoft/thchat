import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ votedToday: false });

  const { id: userId } = await params;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const vote = await prisma.heartVote.findFirst({
    where: { fromUserId: session.user.id, toUserId: userId, createdAt: { gte: today } },
  });

  return NextResponse.json({ votedToday: !!vote, amount: vote?.amount ?? 0 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await params;
  if (userId === session.user.id) return NextResponse.json({ error: "ให้หัวใจตัวเองไม่ได้" }, { status: 400 });

  const { amount } = await req.json();
  const hearts = Math.max(1, Math.min(5, Number(amount) || 1));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const alreadyVoted = await prisma.heartVote.findFirst({
    where: { fromUserId: session.user.id, toUserId: userId, createdAt: { gte: today } },
  });
  if (alreadyVoted) return NextResponse.json({ error: "ให้หัวใจได้วันละครั้ง" }, { status: 429 });

  const [vote, updated] = await Promise.all([
    prisma.heartVote.create({ data: { fromUserId: session.user.id, toUserId: userId, amount: hearts } }),
    prisma.user.update({
      where: { id: userId },
      data: { voteMonthScore: { increment: hearts }, voteTotalScore: { increment: hearts }, starScore: { increment: hearts } },
      select: { voteMonthScore: true, voteTotalScore: true, starScore: true },
    }),
    prisma.notification.create({
      data: {
        userId,
        type: "follow",
        title: "ได้รับหัวใจ!",
        body: `มีคนให้หัวใจคุณ ${hearts} ดวง`,
        link: `/profile/${session.user.id}`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, amount: hearts, ...updated });
}
