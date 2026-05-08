import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "day"; // "day" | "month"

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });

  const transactions = await prisma.coinTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Earned = sum of positive amounts from non-stripe-purchase types
  const earned = transactions.filter((t) => t.amount > 0 && t.type !== "stripe_purchase").reduce((s, t) => s + t.amount, 0);
  const purchased = transactions.filter((t) => t.type === "stripe_purchase").reduce((s, t) => s + t.amount, 0);

  // Group by day or month
  const groups: Record<string, typeof transactions> = {};
  for (const tx of transactions) {
    const d = new Date(tx.createdAt);
    const key =
      mode === "month"
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }

  // Expiring: VIP bonus coins (earned type) within last 30 days — show as potentially expiring
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const expiring = transactions.filter(
    (t) => t.amount > 0 && t.type === "earn" && new Date(t.createdAt) > thirtyDaysAgo
  );

  return NextResponse.json({
    balance: user?.coins ?? 0,
    earned,
    purchased,
    groups,
    expiring,
  });
}
