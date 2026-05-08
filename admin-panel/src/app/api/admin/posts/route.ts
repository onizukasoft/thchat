import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) where.title = { contains: search };
  if (category) where.category = category;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, title: true, category: true, views: true, isPinned: true, createdAt: true,
        user: { select: { id: true, username: true, nickname: true, avatar: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, pages: Math.ceil(total / limit), page });
}
