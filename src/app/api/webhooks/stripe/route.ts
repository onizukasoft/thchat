import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, coins, type, vipLevel, vipDays, packageId, packageLabel } = session.metadata ?? {};

    if (!userId || !coins) {
      console.error("Missing metadata in session", session.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Idempotency
    const existing = await prisma.coinTransaction.findFirst({
      where: { userId, description: { contains: session.id } },
    });
    if (existing) return NextResponse.json({ ok: true, skipped: true });

    const coinAmount = parseInt(coins, 10);

    if (type === "vip" && vipLevel && vipDays) {
      // VIP purchase — activate VIP + credit coins
      const days = parseInt(vipDays, 10);
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { vipUntil: true },
      });
      const now = new Date();
      const base = currentUser?.vipUntil && currentUser.vipUntil > now ? currentUser.vipUntil : now;
      const newVipUntil = new Date(base.getTime() + days * 86400 * 1000);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            coins: { increment: coinAmount },
            vipLevel,
            vipUntil: newVipUntil,
          },
        }),
        prisma.coinTransaction.create({
          data: {
            userId,
            amount: coinAmount,
            type: "stripe_purchase",
            description: `ซื้อ ${packageLabel ?? "VIP"} (+${coinAmount.toLocaleString()} เหรียญ) — ${session.id}`,
          },
        }),
      ]);

      console.log(`✅ VIP ${vipLevel} activated for user ${userId} until ${newVipUntil.toISOString()}`);
    } else {
      // Coin-only purchase
      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { coins: { increment: coinAmount } } }),
        prisma.coinTransaction.create({
          data: {
            userId,
            amount: coinAmount,
            type: "stripe_purchase",
            description: `ซื้อเหรียญ ${coinAmount.toLocaleString()} เหรียญ (${packageLabel ?? packageId}) — ${session.id}`,
          },
        }),
      ]);

      console.log(`✅ Credited ${coinAmount} coins to user ${userId} [session: ${session.id}]`);
    }
  }

  return NextResponse.json({ received: true });
}
