import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond success to prevent email enumeration
  if (!user) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { email },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch {
    return NextResponse.json({ error: "ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
