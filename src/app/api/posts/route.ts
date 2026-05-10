import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function stripVideoUrls(mediaUrls: string | null): string | null {
  if (!mediaUrls) return null;
  try {
    const items: { url: string; type: string }[] = JSON.parse(mediaUrls);
    const filtered = items.filter((m) => m.type !== "video");
    return filtered.length ? JSON.stringify(filtered) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const userId = searchParams.get("userId");

    const posts = await prisma.post.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(userId ? { userId } : {}),
      },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } },
        _count: { select: { comments: true } },
        purchases: viewerId
          ? { where: { userId: viewerId }, select: { id: true } }
          : false,
      },
      orderBy: userId
        ? [{ isPinned: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
      take: 50,
    });

    const result = posts.map((p) => {
      const isOwner = p.userId === viewerId;
      const purchased = (p.purchases?.length ?? 0) > 0;
      const canSeeVideo = !p.isPaid || isOwner || purchased;
      return {
        ...p,
        mediaUrls: canSeeVideo ? p.mediaUrls : stripVideoUrls(p.mediaUrls),
        purchased,
        purchases: undefined,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/posts failed:", error);
    return NextResponse.json({ error: "โหลดโพสต์ไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { title, content, category, mediaUrls, isPaid, price } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "เนื้อหาว่างเปล่า" }, { status: 400 });
  if (title && title.length > 200) return NextResponse.json({ error: "หัวข้อยาวเกิน 200 ตัวอักษร" }, { status: 400 });
  if (content.length > 5000) return NextResponse.json({ error: "เนื้อหายาวเกิน 5,000 ตัวอักษร" }, { status: 400 });

  const post = await prisma.post.create({
    data: {
      title,
      content,
      category: category || "general",
      userId: session.user.id,
      mediaUrls: mediaUrls?.length ? JSON.stringify(mediaUrls) : null,
      isPaid: isPaid === true,
      price: isPaid === true ? Math.max(0, Number(price) || 0) : 0,
    },
    include: {
      user: { select: { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } },
      _count: { select: { comments: true } },
    },
  });
  return NextResponse.json(post, { status: 201 });
}
