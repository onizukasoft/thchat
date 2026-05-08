import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const role = searchParams.get("role") ?? "";
  const status = searchParams.get("status") ?? "";
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { username: { contains: search } },
      { nickname: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (role) where.role = role;
  if (status === "banned") where.isBanned = true;
  if (status === "online") where.isOnline = true;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, username: true, nickname: true, email: true, avatar: true,
        gender: true, age: true, province: true, role: true, isBanned: true,
        isOnline: true, coins: true, vipLevel: true, vipUntil: true,
        createdAt: true, lastSeen: true,
        _count: { select: { posts: true, sentMessages: true, receivedGifts: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, pages: Math.ceil(total / limit), page });
}
