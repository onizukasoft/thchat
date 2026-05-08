import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const filter = searchParams.get("filter") ?? "active"; // active | all

  const now = new Date();
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { username: { contains: search } },
      { nickname: { contains: search } },
      { email: { contains: search } },
    ];
  }

  if (filter === "active") {
    where.vipLevel = { not: null };
    where.vipUntil = { gt: now };
  } else if (filter === "expired") {
    where.vipLevel = { not: null };
    where.vipUntil = { lte: now };
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, username: true, nickname: true, avatar: true,
      vipLevel: true, vipUntil: true, coins: true,
    },
    orderBy: { vipUntil: "desc" },
    take: 50,
  });

  return NextResponse.json(users);
}
