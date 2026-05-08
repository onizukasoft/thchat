import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessSets, resolveAccess } from "@/lib/clip-access";

export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creatorId");
  const page = parseInt(searchParams.get("page") || "1");
  const take = 20;

  const clips = await prisma.clip.findMany({
    where: creatorId ? { creatorId } : {},
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take,
    include: {
      creator: {
        include: {
          user: { select: { id: true, username: true, nickname: true, avatar: true } },
        },
      },
    },
  });

  const access = await getAccessSets(session?.user?.id);

  const result = clips.map((clip) => {
    const hasAccess = resolveAccess(clip, session?.user?.id, access);
    return {
      id: clip.id,
      title: clip.title,
      description: clip.description,
      thumbnailUrl: clip.thumbnailUrl,
      videoUrl: hasAccess ? clip.videoUrl : null,  // never expose URL without access
      isSubscriberOnly: clip.isSubscriberOnly,
      lockedPrice: clip.lockedPrice,               // PPV price (null = not PPV)
      hasAccess,
      views: clip.views,
      createdAt: clip.createdAt,
      creator: {
        id: clip.creator.user.id,
        username: clip.creator.user.username,
        nickname: clip.creator.user.nickname,
        avatar: clip.creator.user.avatar,
        monthlyPrice: clip.creator.monthlyPrice,
      },
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!creator) return NextResponse.json({ error: "ต้องเปิด Creator Mode ก่อน" }, { status: 403 });

  const { title, description, videoUrl, thumbnailUrl, isSubscriberOnly, lockedPrice } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "กรุณาใส่ชื่อคลิป" }, { status: 400 });
  if (!videoUrl) return NextResponse.json({ error: "กรุณาอัปโหลดวิดีโอ" }, { status: 400 });

  const ppvPrice = lockedPrice && lockedPrice > 0 ? Math.floor(lockedPrice) : null;

  const clip = await prisma.clip.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      videoUrl,
      thumbnailUrl: thumbnailUrl || null,
      isSubscriberOnly: !!isSubscriberOnly,
      lockedPrice: ppvPrice,
      creatorId: session.user.id,
    },
  });

  return NextResponse.json(clip, { status: 201 });
}
