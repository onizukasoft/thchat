import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, COIN_PACKAGES } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { packageId } = await req.json();
  const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 400 });

  const totalCoins = pkg.coins + pkg.bonus;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "promptpay"],
    line_items: [
      {
        price_data: {
          currency: "thb",
          unit_amount: pkg.price,
          product_data: {
            name: `${pkg.coins.toLocaleString()} เหรียญ${pkg.bonus > 0 ? ` + โบนัส ${pkg.bonus.toLocaleString()}` : ""} — ThChat`,
            description: `รวม ${totalCoins.toLocaleString()} เหรียญ เข้าบัญชีทันที`,
            images: [],
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.user.id,
      coins: String(totalCoins),
      packageId: pkg.id,
      packageLabel: pkg.label,
    },
    success_url: `${baseUrl}/coins/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/coins`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
