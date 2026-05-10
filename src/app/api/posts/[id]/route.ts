import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } },
      comments: {
        include: { user: { select: { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!post) return NextResponse.json({ error: "ไม่พบโพสต์" }, { status: 404 });
  return NextResponse.json(post);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.action !== "view") return NextResponse.json({ error: "invalid" }, { status: 400 });
  await prisma.post.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin();
  if ("error" in check) return check.error;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
