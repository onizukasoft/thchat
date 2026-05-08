import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search = searchParams.get("search") ?? "";
  const limit = 20;

  const where = search
    ? { title: { contains: search } }
    : {};

  const [clips, total] = await Promise.all([
    prisma.clip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        creator: {
          include: {
            user: { select: { id: true, username: true, nickname: true, avatar: true } },
          },
        },
        _count: { select: { purchases: true } },
      },
    }),
    prisma.clip.count({ where }),
  ]);

  return NextResponse.json({ clips, total, pages: Math.ceil(total / limit) });
}
