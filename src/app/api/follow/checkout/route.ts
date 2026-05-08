import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { targetId } = await req.json();
  if (!targetId || targetId === session.user.id) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const [target, me] = await Promise.all([
    prisma.user.findUnique({ where: { id: targetId }, select: { id: true, nickname: true, username: true, followPrice: true } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { nickname: true, username: true } }),
  ]);

  if (!target || !target.followPrice || target.followPrice <= 0) {
    return NextResponse.json({ error: "ไม่พบราคา" }, { status: 400 });
  }

  const targetName = target.nickname || target.username;
  const myName = me?.nickname || me?.username || "ผู้ใช้";
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "thb",
        unit_amount: target.followPrice,
        product_data: {
          name: `ส่งคำขอเพิ่มเพื่อน ${targetName}`,
          description: `จาก ${myName} — ThChat`,
        },
      },
      quantity: 1,
    }],
    metadata: {
      type: "follow_request",
      userId: session.user.id,
      targetId,
      amount: String(target.followPrice),
    },
    success_url: `${baseUrl}/profile/${targetId}?follow=success`,
    cancel_url: `${baseUrl}/profile/${targetId}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
