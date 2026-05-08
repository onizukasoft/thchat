import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 30;

  const where: Record<string, unknown> = {};
  if (type) where.giftType = type;

  const [gifts, total, summary] = await Promise.all([
    prisma.gift.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, giftType: true, coins: true, message: true, createdAt: true,
        sender: { select: { id: true, username: true, nickname: true, avatar: true } },
        receiver: { select: { id: true, username: true, nickname: true, avatar: true } },
      },
    }),
    prisma.gift.count({ where }),
    prisma.gift.groupBy({ by: ["giftType"], _count: true, _sum: { coins: true }, orderBy: { _sum: { coins: "desc" } } }),
  ]);

  return NextResponse.json({ gifts, total, pages: Math.ceil(total / limit), page, summary });
}
