import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const posts = await prisma.post.findMany({
    where: category ? { category } : undefined,
    include: {
      user: { select: { id: true, username: true, nickname: true, avatar: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { title, content, category } = await req.json();
  const post = await prisma.post.create({
    data: { title, content, category: category || "general", userId: session.user.id },
    include: {
      user: { select: { id: true, username: true, nickname: true, avatar: true } },
      _count: { select: { comments: true } },
    },
  });
  return NextResponse.json(post, { status: 201 });
}
