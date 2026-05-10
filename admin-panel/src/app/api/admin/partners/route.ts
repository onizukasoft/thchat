import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();
  if (!("ok" in auth)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  return NextResponse.json(partners);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!("ok" in auth)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, phone, bankAccount, bankName, sharePercent, notes } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "ต้องใส่ชื่อหุ้นส่วน" }, { status: 400 });
  }

  const partner = await prisma.partner.create({
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      bankAccount: bankAccount?.trim() || null,
      bankName: bankName?.trim() || null,
      sharePercent: Number(sharePercent) || 0,
      notes: notes?.trim() || null,
    },
  });
  return NextResponse.json(partner, { status: 201 });
}
