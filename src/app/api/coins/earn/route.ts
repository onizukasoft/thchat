import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const TASK_KEY = (key: string) => `ภารกิจ:${key}`;

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

async function getTaskStatus(userId: string) {
  const today = todayRange();

  const [user, todayClaims, everProfileClaim, postToday, messageToday] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { avatar: true, bio: true } }),
    prisma.coinTransaction.findMany({
      where: { userId, type: "earn", createdAt: today },
      select: { description: true },
    }),
    prisma.coinTransaction.findFirst({
      where: { userId, type: "earn", description: TASK_KEY("complete_profile") },
    }),
    prisma.post.count({ where: { userId, createdAt: today } }),
    prisma.message.count({ where: { senderId: userId, createdAt: today } }),
  ]);

  const claimedTodayKeys = new Set(todayClaims.map((t) => t.description));
  const adClaimsToday = todayClaims.filter((t) => t.description === TASK_KEY("watch_ad")).length;

  return {
    user,
    daily_login: !claimedTodayKeys.has(TASK_KEY("daily_login")),
    complete_profile:
      !everProfileClaim && !!user?.avatar && !!user?.bio && user.bio.trim().length > 0,
    post_board: postToday > 0 && !claimedTodayKeys.has(TASK_KEY("post_board")),
    send_message: messageToday > 0 && !claimedTodayKeys.has(TASK_KEY("send_message")),
    watch_ad: adClaimsToday < 3,
    watch_ad_count: adClaimsToday,
    hasAvatar: !!user?.avatar,
    hasBio: !!user?.bio && user.bio.trim().length > 0,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const [user, status] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { coins: true } }),
    getTaskStatus(session.user.id),
  ]);

  return NextResponse.json({
    balance: user?.coins ?? 0,
    tasks: {
      daily_login: { claimable: status.daily_login },
      complete_profile: {
        claimable: status.complete_profile,
        hasAvatar: status.hasAvatar,
        hasBio: status.hasBio,
      },
      post_board: { claimable: status.post_board },
      send_message: { claimable: status.send_message },
      watch_ad: { claimable: status.watch_ad, claimedToday: status.watch_ad_count },
    },
  });
}

const TASK_COINS: Record<string, number> = {
  daily_login: 10,
  complete_profile: 50,
  post_board: 5,
  send_message: 5,
  watch_ad: 3,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { task } = await req.json();
  if (!(task in TASK_COINS)) return NextResponse.json({ error: "task ไม่ถูกต้อง" }, { status: 400 });

  // Re-verify server-side that mission is actually complete
  const status = await getTaskStatus(session.user.id);
  const claimable: Record<string, boolean> = {
    daily_login: status.daily_login,
    complete_profile: status.complete_profile,
    post_board: status.post_board,
    send_message: status.send_message,
    watch_ad: status.watch_ad,
  };

  if (!claimable[task]) {
    return NextResponse.json({ error: "ยังทำภารกิจไม่ครบหรือรับรางวัลไปแล้ว" }, { status: 400 });
  }

  const coins = TASK_COINS[task];
  const [user] = await Promise.all([
    prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { increment: coins } },
      select: { coins: true },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: session.user.id,
        amount: coins,
        type: "earn",
        description: TASK_KEY(task),
      },
    }),
  ]);

  return NextResponse.json({ balance: user.coins, earned: coins });
}
