import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.isPinned !== undefined) data.isPinned = body.isPinned;

  const post = await prisma.post.update({ where: { id }, data, select: { id: true, isPinned: true } });
  return NextResponse.json(post);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
