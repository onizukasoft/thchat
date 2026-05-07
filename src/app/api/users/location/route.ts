import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { latitude, longitude } = await req.json();
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "ข้อมูล location ไม่ถูกต้อง" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { latitude, longitude },
  });

  return NextResponse.json({ ok: true });
}
