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
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) where.name = { contains: search };

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, description: true, isPublic: true, createdAt: true,
        _count: { select: { members: true, messages: true } },
      },
    }),
    prisma.room.count({ where }),
  ]);

  return NextResponse.json({ rooms, total, pages: Math.ceil(total / limit), page });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await req.json();
  await prisma.room.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
