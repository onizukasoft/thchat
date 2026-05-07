import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id },
    data: {
      role: body.role,
      isBanned: body.isBanned,
      coins: body.coins !== undefined ? Number(body.coins) : undefined,
      nickname: body.nickname,
    },
    select: { id: true, username: true, role: true, isBanned: true, coins: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  if (id === session!.user!.id) return NextResponse.json({ error: "ไม่สามารถลบตัวเองได้" }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
