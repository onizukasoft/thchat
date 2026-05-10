import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!("ok" in auth)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { partnerId, amount, note } = await req.json();
  if (!partnerId || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const [payment] = await prisma.$transaction([
    prisma.partnerPayment.create({
      data: {
        partnerId,
        amount: Number(amount),
        note: note?.trim() || null,
      },
    }),
    prisma.partner.update({
      where: { id: partnerId },
      data: { totalPaid: { increment: Number(amount) } },
    }),
  ]);

  return NextResponse.json(payment, { status: 201 });
}
