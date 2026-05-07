import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();

  const comment = await prisma.comment.create({
    data: { content, userId: session.user.id, postId: id },
    include: { user: { select: { id: true, username: true, nickname: true, avatar: true } } },
  });
  return NextResponse.json(comment, { status: 201 });
}
