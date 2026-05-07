import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const rooms = await prisma.room.findMany({
    where: { isPublic: true },
    include: { _count: { select: { members: true, messages: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { name, description } = await req.json();
  const room = await prisma.room.create({
    data: { name, description },
  });
  return NextResponse.json(room, { status: 201 });
}
