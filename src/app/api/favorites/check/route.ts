import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ followed: false, status: null });

  const targetId = req.nextUrl.searchParams.get("targetId");
  if (!targetId) return NextResponse.json({ followed: false, status: null });

  const [outgoing, incoming] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
      select: { status: true },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: targetId, followingId: session.user.id } },
      select: { status: true },
    }),
  ]);

  return NextResponse.json({
    followed: !!outgoing,
    status: outgoing?.status ?? null,
    incomingPending: incoming?.status === "pending",
  });
}
