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
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.coinTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, amount: true, type: true, description: true, createdAt: true,
        user: { select: { id: true, username: true, nickname: true, avatar: true } },
      },
    }),
    prisma.coinTransaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, pages: Math.ceil(total / limit), page });
}
