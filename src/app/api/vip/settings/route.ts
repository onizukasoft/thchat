import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      vipLevel: true,
      vipUntil: true,
      showOnlineStatus: true,
      showProfileFrame: true,
      profileFrameId: true,
      avatar: true,
      lastSeen: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await req.json();
  const data: {
    showOnlineStatus?: boolean;
    showProfileFrame?: boolean;
    profileFrameId?: string | null;
  } = {};
  if (typeof body.showOnlineStatus === "boolean") data.showOnlineStatus = body.showOnlineStatus;
  if (typeof body.showProfileFrame === "boolean") data.showProfileFrame = body.showProfileFrame;
  if ("profileFrameId" in body) data.profileFrameId = body.profileFrameId ?? null;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      showOnlineStatus: true,
      showProfileFrame: true,
      profileFrameId: true,
    },
  });

  return NextResponse.json(user);
}
