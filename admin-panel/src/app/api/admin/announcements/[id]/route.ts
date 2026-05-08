import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.content !== undefined) data.content = body.content;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const row = await prisma.announcement.update({ where: { id }, data });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
