import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const { action, level, days } = await req.json();
  // action: "grant" | "revoke"

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, vipUntil: true } });
  if (!user) return NextResponse.json({ error: "ไม่พบ user" }, { status: 404 });

  if (action === "grant") {
    if (!level || !days || days < 1) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    const now = new Date();
    const base = user.vipUntil && user.vipUntil > now ? user.vipUntil : now;
    const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    const updated = await prisma.user.update({
      where: { id },
      data: { vipLevel: level, vipUntil: expiresAt },
      select: { id: true, vipLevel: true, vipUntil: true },
    });
    return NextResponse.json(updated);
  }

  if (action === "revoke") {
    await prisma.user.update({
      where: { id },
      data: { vipLevel: null, vipUntil: null },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
}
