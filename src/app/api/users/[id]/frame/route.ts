import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getFrame, canUseFrame } from "@/lib/frames";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { profileFrameId: true, showProfileFrame: true, vipLevel: true },
  });
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  return NextResponse.json({
    frameId: user.profileFrameId,
    showProfileFrame: user.showProfileFrame,
    vipLevel: user.vipLevel,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id || session.user.id !== id) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const body = await req.json();
  const { frameId, showProfileFrame } = body as { frameId?: string | null; showProfileFrame?: boolean };

  const user = await prisma.user.findUnique({ where: { id }, select: { vipLevel: true } });
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  if (frameId !== undefined && frameId !== null) {
    const frame = getFrame(frameId);
    if (!frame) return NextResponse.json({ error: "ไม่พบกรอบ" }, { status: 400 });
    if (!canUseFrame(frame, user.vipLevel)) {
      return NextResponse.json({ error: "ต้องการ VIP ระดับสูงกว่า" }, { status: 403 });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(frameId !== undefined ? { profileFrameId: frameId } : {}),
      ...(showProfileFrame !== undefined ? { showProfileFrame } : {}),
    },
    select: { profileFrameId: true, showProfileFrame: true },
  });

  return NextResponse.json(updated);
}
