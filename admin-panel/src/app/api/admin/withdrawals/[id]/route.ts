import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const { action, adminNote } = await req.json();

  const request = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "ไม่พบคำขอ" }, { status: 404 });
  if (request.status !== "pending") return NextResponse.json({ error: "ดำเนินการไปแล้ว" }, { status: 400 });

  if (action === "approve") {
    await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: "approved", adminNote: adminNote?.trim() || null },
    });
  } else if (action === "reject") {
    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "rejected", adminNote: adminNote?.trim() || null },
      }),
      prisma.creatorProfile.update({
        where: { userId: request.creatorId },
        data: { withdrawable: { increment: request.amount } },
      }),
    ]);
  } else {
    return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
