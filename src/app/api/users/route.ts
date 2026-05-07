import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gender = searchParams.get("gender");
  const province = searchParams.get("province");

  const where: Record<string, unknown> = {};
  if (gender && gender !== "all") where.gender = gender;
  if (province) where.province = province;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true,
      gender: true,
      age: true,
      bio: true,
      province: true,
      latitude: true,
      longitude: true,
      isOnline: true,
      lastSeen: true,
    },
    orderBy: [{ isOnline: "desc" }, { lastSeen: "desc" }],
    take: 500,
  });
  return NextResponse.json(users);
}
