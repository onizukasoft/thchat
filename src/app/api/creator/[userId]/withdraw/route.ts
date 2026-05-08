import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_WITHDRAW = 100;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  const { userId } = await params;
  if (session.user.id !== userId) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });

  const requests = await prisma.withdrawalRequest.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  const { userId } = await params;
  if (session.user.id !== userId) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });

  const creator = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!creator) return NextResponse.json({ error: "ไม่ใช่ Creator" }, { status: 404 });

  const { amount, note } = await req.json();
  const coins = Math.floor(Number(amount));
  if (!coins || coins < MIN_WITHDRAW) {
    return NextResponse.json({ error: `ถอนขั้นต่ำ ${MIN_WITHDRAW} เหรียญ` }, { status: 400 });
  }
  if (creator.withdrawable < coins) {
    return NextResponse.json({ error: `เหรียญถอนได้ไม่พอ (มี ${creator.withdrawable} เหรียญ)` }, { status: 400 });
  }

  // Check for pending request already
  const pending = await prisma.withdrawalRequest.findFirst({
    where: { creatorId: userId, status: "pending" },
  });
  if (pending) {
    return NextResponse.json({ error: "มีคำขอที่รอดำเนินการอยู่แล้ว" }, { status: 400 });
  }

  const [request] = await prisma.$transaction([
    prisma.withdrawalRequest.create({
      data: { creatorId: userId, amount: coins, note: note?.trim() || null },
    }),
    prisma.creatorProfile.update({
      where: { userId },
      data: { withdrawable: { decrement: coins } },
    }),
  ]);

  return NextResponse.json(request, { status: 201 });
}
