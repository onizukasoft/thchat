import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const clip = await prisma.clip.findUnique({ where: { id } });
  if (!clip) return NextResponse.json({ error: "ไม่พบคลิป" }, { status: 404 });

  await prisma.clip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
