import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const SELECT_USER = { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } as const;
const SELECT_COUNT = { select: { comments: true } } as const;

function hasVideo(mediaUrls: string | null) {
  if (!mediaUrls) return false;
  try { return (JSON.parse(mediaUrls) as { type: string }[]).some((m) => m.type === "video"); }
  catch { return false; }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const catFilter = category && category !== "all" ? { category } : {};

  // Not logged in — plain feed
  if (!session?.user?.id) {
    const posts = await prisma.post.findMany({
      where: catFilter,
      include: { user: { select: SELECT_USER }, _count: SELECT_COUNT },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return NextResponse.json({ friendVideos: [], feed: posts });
  }

  const myId = session.user.id;

  const followings = await prisma.follow.findMany({
    where: { followerId: myId },
    select: { followingId: true },
  });
  const friendIds = followings.map((f) => f.followingId);

  const [friendPosts, explorePosts] = await Promise.all([
    friendIds.length
      ? prisma.post.findMany({
          where: { userId: { in: friendIds }, ...catFilter },
          include: { user: { select: SELECT_USER }, _count: SELECT_COUNT },
          orderBy: { createdAt: "desc" },
          take: 40,
        })
      : [],
    prisma.post.findMany({
      where: { userId: { notIn: [...friendIds, myId] }, ...catFilter },
      include: { user: { select: SELECT_USER }, _count: SELECT_COUNT },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // Friend videos for the strip (shown only when no category filter)
  const friendVideos = !catFilter.category
    ? friendPosts.filter((p) => hasVideo(p.mediaUrls))
    : [];

  // Interleave: 2 friend posts then 1 explore
  type FeedPost = (typeof friendPosts)[number] | (typeof explorePosts)[number];
  const feed: FeedPost[] = [];
  let fi = 0, ei = 0;
  while (fi < friendPosts.length || ei < explorePosts.length) {
    if (fi < friendPosts.length) feed.push(friendPosts[fi++]);
    if (fi < friendPosts.length) feed.push(friendPosts[fi++]);
    if (ei < explorePosts.length) feed.push(explorePosts[ei++]);
  }

  return NextResponse.json({ friendVideos, feed });
}
