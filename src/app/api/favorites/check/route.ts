import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ followed: false, status: null });

  const targetId = req.nextUrl.searchParams.get("targetId");
  if (!targetId) return NextResponse.json({ followed: false, status: null });

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
    select: { status: true },
  });

  return NextResponse.json({
    followed: !!follow,
    status: follow?.status ?? null,
  });
}
