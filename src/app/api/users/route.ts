import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gender = searchParams.get("gender");       // "female" | "male" | "lgbtq" | "all"
  const province = searchParams.get("province");
  const lookingFor = searchParams.get("lookingFor"); // comma-separated statuses
  const hashtag = searchParams.get("hashtag");
  const onlineOnly = searchParams.get("onlineOnly") === "1";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isBanned: false };

  if (gender === "lgbtq") {
    where.gender = "other";
  } else if (gender && gender !== "all") {
    where.gender = gender;
  }

  if (province) where.province = province;
  if (onlineOnly) where.isOnline = true;

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
      profileFrameId: true,
      showProfileFrame: true,
      vipLevel: true,
      lookingFor: true,
      hashtags: true,
    },
    orderBy: [{ isOnline: "desc" }, { lastSeen: "desc" }],
    take: 500,
  });

  // client-side-style filters that are hard to do in SQLite LIKE
  let result = users;

  if (lookingFor) {
    const wanted = lookingFor.split(",").map((s) => s.trim()).filter(Boolean);
    result = result.filter((u) => {
      if (!u.lookingFor) return false;
      const userTags = u.lookingFor.split(",").map((s) => s.trim());
      return wanted.some((w) => userTags.includes(w));
    });
  }

  if (hashtag) {
    const wantedTags = hashtag.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    result = result.filter((u) => {
      if (!u.hashtags) return false;
      const userTags = u.hashtags.split(",").map((s) => s.trim().toLowerCase());
      return wantedTags.some((w) => userTags.includes(w));
    });
  }

  return NextResponse.json(result);
}
