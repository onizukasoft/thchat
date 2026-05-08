import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) return NextResponse.json({ error: "ลิงก์หมดอายุหรือไม่ถูกต้อง" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null },
  });

  return NextResponse.json({ ok: true });
}
