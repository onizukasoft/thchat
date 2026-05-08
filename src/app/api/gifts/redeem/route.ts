import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getHeartRedeemOffer } from "@/lib/heart-redeem";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const offerId = typeof body.offerId === "string" ? body.offerId : "";
  const offer = getHeartRedeemOffer(offerId);
  if (!offer) return NextResponse.json({ error: "ไม่พบรายการแลก" }, { status: 400 });

  const uid = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [heartsAgg, user] = await Promise.all([
        tx.heartVote.aggregate({
          where: { toUserId: uid },
          _sum: { amount: true },
        }),
        tx.user.findUnique({
          where: { id: uid },
          select: { profileHeartsSpent: true },
        }),
      ]);

      if (!user) throw new Error("NO_USER");

      const received = heartsAgg._sum.amount ?? 0;
      const spent = user.profileHeartsSpent ?? 0;
      const available = received - spent;

      if (available < offer.costHearts) throw new Error("INSUFFICIENT_HEARTS");

      const updated = await tx.user.update({
        where: { id: uid },
        data: {
          profileHeartsSpent: { increment: offer.costHearts },
          ...(offer.coinsReward > 0 ? { coins: { increment: offer.coinsReward } } : {}),
          ...(offer.voteMonthBonus > 0 ? { voteMonthScore: { increment: offer.voteMonthBonus } } : {}),
          ...(offer.voteTotalBonus > 0 ? { voteTotalScore: { increment: offer.voteTotalBonus } } : {}),
          ...(offer.voteTotalBonus > 0 ? { starScore: { increment: offer.voteTotalBonus } } : {}),
        },
        select: {
          coins: true,
          voteMonthScore: true,
          voteTotalScore: true,
          profileHeartsSpent: true,
          starScore: true,
        },
      });

      if (offer.coinsReward > 0) {
        await tx.coinTransaction.create({
          data: {
            userId: uid,
            amount: offer.coinsReward,
            type: "heart_redeem",
            description: `แลกหัวใจโปรไฟล์: ${offer.title}`,
          },
        });
      }

      const heartsAvailable = Math.max(0, received - updated.profileHeartsSpent);

      return {
        heartsReceivedTotal: received,
        profileHeartsSpent: updated.profileHeartsSpent,
        heartsAvailable,
        coins: updated.coins,
        voteMonthScore: updated.voteMonthScore,
        voteTotalScore: updated.voteTotalScore,
        starScore: updated.starScore,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INSUFFICIENT_HEARTS") {
      return NextResponse.json({ error: "หัวใจจากโปรไฟล์ไม่พอแลก" }, { status: 400 });
    }
    if (msg === "NO_USER") {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "แลกไม่สำเร็จ" }, { status: 500 });
  }
}
