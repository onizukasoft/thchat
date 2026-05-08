import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
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
      },
      orderBy: userId
        ? [{ isPinned: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
      take: 50,
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET /api/posts failed:", error);
    return NextResponse.json({ error: "โหลดโพสต์ไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { title, content, category, mediaUrls } = await req.json();
  const post = await prisma.post.create({
    data: {
      title,
      content,
      category: category || "general",
      userId: session.user.id,
      mediaUrls: mediaUrls?.length ? JSON.stringify(mediaUrls) : null,
    },
    include: {
      user: { select: { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } },
      _count: { select: { comments: true } },
    },
  });
  return NextResponse.json(post, { status: 201 });
}
