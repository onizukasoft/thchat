import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET — รายชื่อเพื่อนที่ accepted แล้ว + คำขอที่รอ
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const [friends, pending] = await Promise.all([
    // เพื่อนที่ยอมรับแล้ว
    prisma.follow.findMany({
      where: { followerId: session.user.id, status: "accepted" },
      include: {
        following: {
          select: { id: true, username: true, nickname: true, avatar: true, gender: true, age: true, isOnline: true, lastSeen: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // คำขอที่ยังรอการยืนยัน (คนอื่นส่งมาหาเรา)
    prisma.follow.findMany({
      where: { followingId: session.user.id, status: "pending" },
      include: {
        follower: {
          select: { id: true, username: true, nickname: true, avatar: true, gender: true, age: true, isOnline: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    friends: friends.map((f) => f.following),
    pendingRequests: pending.map((f) => ({ ...f.follower, followerId: f.followerId, createdAt: f.createdAt })),
  });
}

// POST — ส่งคำขอเพิ่มเพื่อน
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { targetId } = await req.json();
  if (targetId === session.user.id) return NextResponse.json({ error: "ไม่สามารถเพิ่มตัวเองได้" }, { status: 400 });

  const [existing, targetUser, me] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
    }),
    prisma.user.findUnique({ where: { id: targetId }, select: { followPrice: true } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { nickname: true, username: true, coins: true } }),
  ]);

  // ถ้ามีอยู่แล้ว → ยกเลิก
  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
    });
    return NextResponse.json({ status: "cancelled" });
  }

  const price = targetUser?.followPrice ?? 0;
  const name = me?.nickname || me?.username || "มีคนใหม่";

  // ตรวจสอบเหรียญถ้าเป็นแบบเสียตัง
  if (price > 0) {
    if ((me?.coins ?? 0) < price) {
      return NextResponse.json({ error: "เหรียญไม่พอ", required: price, current: me?.coins ?? 0 }, { status: 402 });
    }
    // หักเหรียญ + สร้างคำขอ + แจ้งเตือน
    await prisma.$transaction([
      prisma.user.update({ where: { id: session.user.id }, data: { coins: { decrement: price } } }),
      prisma.coinTransaction.create({
        data: {
          userId: session.user.id,
          amount: -price,
          type: "spend",
          description: `ส่งคำขอเพิ่มเพื่อน (${name})`,
        },
      }),
      prisma.follow.create({ data: { followerId: session.user.id, followingId: targetId, status: "pending" } }),
      prisma.notification.create({
        data: {
          userId: targetId,
          type: "follow",
          title: name,
          body: `ส่งคำขอเพิ่มเพื่อน (จ่าย ${price} เหรียญ)`,
          link: `/profile/${session.user.id}`,
        },
      }),
    ]);
    return NextResponse.json({ status: "pending", paidCoins: price });
  }

  // ฟรี
  await Promise.all([
    prisma.follow.create({ data: { followerId: session.user.id, followingId: targetId, status: "pending" } }),
    prisma.notification.create({
      data: {
        userId: targetId,
        type: "follow",
        title: name,
        body: "ส่งคำขอเพิ่มเพื่อนหาคุณ",
        link: `/profile/${session.user.id}`,
      },
    }),
  ]);

  return NextResponse.json({ status: "pending" });
}

// PATCH — ยอมรับ หรือ ปฏิเสธ
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { followerId, action } = await req.json(); // action: "accept" | "reject"

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: session.user.id } },
  });
  if (!follow) return NextResponse.json({ error: "ไม่พบคำขอ" }, { status: 404 });

  if (action === "accept") {
    const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { nickname: true, username: true } });
    const name = me?.nickname || me?.username || "เพื่อน";

    await Promise.all([
      prisma.follow.update({
        where: { followerId_followingId: { followerId, followingId: session.user.id } },
        data: { status: "accepted" },
      }),
      // สร้าง reverse follow ด้วย (เพื่อนกัน 2 ทาง)
      prisma.follow.upsert({
        where: { followerId_followingId: { followerId: session.user.id, followingId: followerId } },
        update: { status: "accepted" },
        create: { followerId: session.user.id, followingId: followerId, status: "accepted" },
      }),
      // แจ้งเตือนคนที่ส่งคำขอว่าได้รับการยอมรับ
      prisma.notification.create({
        data: {
          userId: followerId,
          type: "follow",
          title: name,
          body: "ยอมรับคำขอเพิ่มเพื่อนของคุณแล้ว 🎉",
          link: `/profile/${session.user.id}`,
        },
      }),
    ]);
    return NextResponse.json({ status: "accepted" });
  }

  // reject
  await prisma.follow.delete({
    where: { followerId_followingId: { followerId, followingId: session.user.id } },
  });
  return NextResponse.json({ status: "rejected" });
}
