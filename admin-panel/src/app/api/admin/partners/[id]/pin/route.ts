import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPin } from "@/lib/token";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!("ok" in auth)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { pin } = await req.json();
  if (!pin || String(pin).length < 4) {
    return NextResponse.json({ error: "PIN ต้องมีอย่างน้อย 4 ตัว" }, { status: 400 });
  }

  const hashed = await hashPin(String(pin));
  await prisma.partner.update({ where: { id }, data: { pin: hashed } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!("ok" in auth)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.partner.update({ where: { id }, data: { pin: null } });
  return NextResponse.json({ ok: true });
}
