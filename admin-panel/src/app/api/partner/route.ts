import { NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requirePartner();
  if (!("ok" in auth)) return auth.error;

  const partner = await prisma.partner.findUnique({
    where: { id: auth.partnerId },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Platform revenue stats (coins purchased = revenue proxy)
  const [totalCoinsBought, totalVipRevenue, totalUsers] = await Promise.all([
    prisma.coinTransaction.aggregate({
      where: { amount: { gt: 0 }, type: "purchase" },
      _sum: { amount: true },
    }),
    prisma.coinTransaction.aggregate({
      where: { type: "vip_purchase", amount: { lt: 0 } },
      _sum: { amount: true },
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({
    partner: {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      sharePercent: partner.sharePercent,
      totalPaid: partner.totalPaid,
      bankAccount: partner.bankAccount,
      bankName: partner.bankName,
      payments: partner.payments,
    },
    stats: {
      totalUsers,
      totalCoinsBought: totalCoinsBought._sum.amount ?? 0,
      totalVipRevenue: Math.abs(totalVipRevenue._sum.amount ?? 0),
    },
  });
}
