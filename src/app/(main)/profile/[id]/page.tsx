"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  Gift, CheckCircle2, Heart, Coins, Edit, MessageCircle,
  UserPlus, UserCheck, Loader2, MapPin, Users, FileText, Crown,
  MessageSquare, Eye, Play, Bell, Trophy, Headphones,
  Gamepad2, ChevronRight, Film, Plus, Lock, Globe,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { getSocket } from "@/lib/socket-client";

type MediaItem = { url: string; type: "image" | "video" };

type Post = {
  id: string; title: string; content: string; category: string;
  mediaUrls: string | null; isPinned: boolean; views: number; createdAt: string;
  _count: { comments: number };
};

function parseMedia(raw: string | null): MediaItem[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function PostMedia({ items }: { items: MediaItem[] }) {
  if (!items.length) return null;
  const first = items[0];
  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
      {first.type === "video" ? (
        <>
          <video src={first.url} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-8 h-8 fill-white text-white opacity-80" />
          </div>
        </>
      ) : (
        <img src={first.url} alt="" className="w-full h-full object-cover" />
      )}
      {items.length > 1 && (
        <span className="absolute top-1.5 right-1.5 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded-full">
          +{items.length - 1}
        </span>
      )}
    </div>
  );
}

type UserProfile = {
  id: string; username: string; nickname: string | null; avatar: string | null;
  coverImage: string | null; bio: string | null; gender: string | null; age: number | null;
  province: string | null; relationship: string | null; coins: number;
  starScore: number; voteMonthScore: number; voteTotalScore: number;
  vipLevel: string | null; vipUntil: string | null;
  showProfileFrame: boolean; profileFrameId: string | null;
  followPrice: number | null;
  isOnline: boolean; lastSeen: string; createdAt: string;
  _count: { followers: number; followings: number; posts: number };
};

const RELATIONSHIP_LABEL: Record<string, string> = {
  single: "โสด", taken: "คบแล้ว", complicated: "ซับซ้อน",
};
const GENDER_LABEL: Record<string, string> = {
  male: "ชาย", female: "หญิง", other: "ไม่ระบุ",
};

const HEART_MAX = 600;

function HeartLevel({ score, canGive, votedToday, onGive }: {
  score: number; canGive?: boolean; votedToday?: boolean; onGive?: (n: number) => void;
}) {
  const level = score >= 500 ? 5 : score >= 400 ? 4 : score >= 300 ? 3 : score >= 200 ? 2 : score >= 100 ? 1 : 0;
  const [hover, setHover] = useState(-1);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => {
            const filled = canGive && !votedToday ? i <= hover : i < level;
            return (
              <button
                key={i}
                type="button"
                disabled={!canGive || votedToday}
                onMouseEnter={() => canGive && !votedToday && setHover(i)}
                onMouseLeave={() => setHover(-1)}
                onClick={() => canGive && !votedToday && onGive?.(i + 1)}
                className={`transition-all duration-150 ${canGive && !votedToday ? "cursor-pointer hover:scale-125 active:scale-110" : "cursor-default"}`}
              >
                <Heart
                  className={`w-9 h-9 transition-all ${
                    filled
                      ? "fill-rose-500 text-rose-500"
                      : "fill-gray-100 text-gray-200 dark:fill-gray-700 dark:text-gray-600"
                  }`}
                />
              </button>
            );
          })}
        </div>
        {canGive && votedToday && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
              ให้หัวใจแล้ววันนี้ ✓
            </span>
          </div>
        )}
      </div>
      {canGive && !votedToday && (
        <p className="text-xs text-gray-400 dark:text-gray-500">แตะเพื่อให้หัวใจ</p>
      )}
    </div>
  );
}

type DashData = {
  stats: { coins: number; followers: number; following: number; messagesSent: number; giftsReceived: number; giftsValue: number; unreadNotifications: number };
  recentTx: { id: string; amount: number; type: string; description: string; createdAt: string }[];
  recentMessages: { id: string; content: string; createdAt: string; sender: { id: string; nickname: string | null; username: string; avatar: string | null }; receiver: { id: string; nickname: string | null; username: string; avatar: string | null } }[];
  onlineFriends: { id: string; nickname: string | null; username: string; avatar: string | null; isOnline: boolean }[];
  totalFriends: number;
};

const QUICK_LINKS = [{ icon: "🎴", label: "ป็อกเด้ง", href: "/games/pokdeng", color: "bg-emerald-50" }];

type FloatingHeart = { id: number; x: number; y: number; rotate: number };

export default function ProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [dash, setDash] = useState<DashData | null>(null);
  const [profileTab, setProfileTab] = useState<"posts" | "clips" | "dash">("posts");
  const [clips, setClips] = useState<{ id: string; title: string; thumbnailUrl: string | null; videoUrl: string | null; isSubscriberOnly: boolean; hasAccess: boolean; views: number }[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<{ monthlyPrice: number } | null | undefined>(undefined); // undefined=loading, null=not creator
  const [followed, setFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [votedToday, setVotedToday] = useState(false);
  const [pinLoadingId, setPinLoadingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const scoreRef = useRef<HTMLParagraphElement>(null);
  const heartIdRef = useRef(0);

  const fetchUser = useCallback(async () => {
    const [userRes, postsRes] = await Promise.all([
      fetch(`/api/users/${userId}`),
      fetch(`/api/posts?userId=${encodeURIComponent(userId)}`),
    ]);
    if (!userRes.ok) {
      throw new Error("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
    }
    const data = await userRes.json();
    setUser(data);
    setIsOnline(data.isOnline ?? false);
    if (!postsRes.ok) {
      setPosts([]);
      return;
    }
    try {
      const postsData = await postsRes.json();
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch {
      setPosts([]);
    }
  }, [userId]);

  useEffect(() => {
    if (session?.user?.id === userId) {
      fetch("/api/dashboard").then((r) => r.json()).then(setDash);
    }
  }, [session, userId]);

  useEffect(() => {
    if (session?.user?.id && session.user.id !== userId) {
      fetch(`/api/users/${userId}/heart`).then((r) => r.json()).then((d) => setVotedToday(d.votedToday));
      fetch(`/api/favorites/check?targetId=${userId}`).then((r) => r.json()).then((d) => setFollowed(d.followed ?? false)).catch(() => {});
    }
  }, [session, userId]);

  async function handleFollow() {
    if (!session?.user?.id) return;
    setFollowLoading(true);
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: userId }),
    });
    const data = await res.json();
    if (res.status === 402) {
      alert(`เหรียญไม่พอ! ต้องการ ${data.required} เหรียญ (มีอยู่ ${data.current} เหรียญ)`);
    } else {
      setFollowed(data.status === "pending" || data.status === "accepted");
    }
    setFollowLoading(false);
  }

  async function giveHearts(amount: number) {
    if (sending || votedToday) return;
    setSending(true);

    const score = scoreRef.current?.getBoundingClientRect();
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.65;
    const targetX = score ? score.left + score.width / 2 : originX;
    const targetY = score ? score.top + score.height / 2 : 200;

    document.documentElement.style.setProperty("--heart-tx", `${targetX - originX}px`);
    document.documentElement.style.setProperty("--heart-ty", `${targetY - originY}px`);

    const floaters: FloatingHeart[] = Array.from({ length: amount }, () => ({
      id: ++heartIdRef.current,
      x: originX + (Math.random() - 0.5) * 60,
      y: originY + (Math.random() - 0.5) * 20,
      rotate: (Math.random() - 0.5) * 40,
    }));
    setFloatingHearts((p) => [...p, ...floaters]);

    const res = await fetch(`/api/users/${userId}/heart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();

    setTimeout(() => {
      setFloatingHearts((p) => p.filter((h) => !floaters.find((fh) => fh.id === h.id)));
      if (res.ok) {
        setVotedToday(true);
        setUser((prev) => prev ? { ...prev, voteMonthScore: data.voteMonthScore, voteTotalScore: data.voteTotalScore, starScore: data.starScore } : prev);
      }
      setSending(false);
    }, 950);
  }

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (profileTab !== "clips") return;
    Promise.all([
      fetch(`/api/clips?creatorId=${userId}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/creator/${userId}`).then((r) => r.ok ? r.json() : null),
    ]).then(([cl, cp]) => {
      setClips(Array.isArray(cl) ? cl : []);
      setCreatorProfile(cp);
    });
  }, [profileTab, userId]);

  useEffect(() => {
    const socket = getSocket();
    const handler = (ids: string[]) => setIsOnline(ids.includes(userId));
    socket.on("users:online", handler);
    socket.emit("request:online");
    return () => { socket.off("users:online", handler); };
  }, [userId]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        <Heart className="w-8 h-8 animate-pulse text-rose-300 mr-2" />
        <span className="text-sm">กำลังโหลด...</span>
      </div>
    );
  }

  const isOwn = session?.user?.id === userId;
  const hasActiveVip = !!(user.vipLevel && user.vipUntil && new Date(user.vipUntil) > new Date());
  const canUseVipFrame = user.showProfileFrame && !!user.profileFrameId;
  const displayName = user.nickname || user.username || "?";
  const lastSeenDate = user.lastSeen ? new Date(user.lastSeen) : null;
  const lastSeenText = lastSeenDate && !isNaN(lastSeenDate.getTime())
    ? formatDistanceToNow(lastSeenDate, { addSuffix: false, locale: th })
    : "";

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ─── Cover ─── */}
      <div className="relative h-44 overflow-hidden">
        {user.coverImage ? (
          <img src={user.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-800" />
        )}
      </div>

      {/* ─── Avatar + Name + Stats ─── */}
      <div className="bg-white dark:bg-gray-900 pb-4 border-b border-gray-100 dark:border-gray-800">
        {/* avatar centered */}
        <div className="flex justify-center -mt-12 mb-3">
          <div className="relative w-24 h-24 rounded-xl border-4 border-white dark:border-gray-900 shadow-md">
            <UserAvatar
              src={user.avatar}
              fallback={displayName[0]}
              className="w-24 h-24"
              frameId={canUseVipFrame ? user.profileFrameId : null}
            />
          </div>
        </div>

        {/* name + online */}
        <div className="flex flex-col items-center mb-4 px-4">
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{displayName}</h1>
            {user.vipLevel && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-400" />}
            {user.vipLevel && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-gray-400"}`} />
            <span className="text-xs text-gray-400">
              {isOnline ? "ออนไลน์" : `${lastSeenText}ที่แล้ว`}
            </span>
          </div>
        </div>

        {/* stats: 3 equal columns */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 mb-4 mx-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden">
          {[
            { label: "โพสต์", value: user._count.posts },
            { label: "เพื่อน", value: user._count.followers },
            { label: "ติดตาม", value: user._count.followings },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center py-3">
              <span className="text-base font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</span>
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        {/* bio */}
        {user.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed px-5">{user.bio}</p>}

        {/* info chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-4 px-4">
          {user.age && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              <Users className="w-3 h-3" />
              {user.age} ปี · {GENDER_LABEL[user.gender ?? ""] ?? "ไม่ระบุ"}
            </span>
          )}
          {user.province && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              {user.province}
            </span>
          )}
          {user.relationship && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              <Heart className="w-3 h-3" />
              {RELATIONSHIP_LABEL[user.relationship] ?? user.relationship}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
            <FileText className="w-3 h-3" />
            {user._count.posts} โพสต์
          </span>
        </div>

        {/* action buttons */}
        {isOwn ? (
          <div className="flex gap-2 px-4">
            <Link href="/gifts" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Gift className="w-4 h-4" /> ของขวัญ
            </Link>
            <Link href="/coins" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Coins className="w-4 h-4" />
              {user.coins >= 1000 ? `${(user.coins / 1000).toFixed(1)}K` : user.coins.toLocaleString()}
            </Link>
            <Link href={`/profile/${userId}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
              <Edit className="w-4 h-4" /> แก้ไข
            </Link>
          </div>
        ) : (
          <div className="flex gap-2 px-4">
            <Link href={`/gifts?to=${userId}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Gift className="w-4 h-4" /> ของขวัญ
            </Link>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                followed
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  : user.followPrice && user.followPrice > 0
                    ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600"
                    : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100"
              }`}
            >
              {followLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : followed
                  ? <><UserCheck className="w-4 h-4" /> ส่งแล้ว</>
                  : user.followPrice && user.followPrice > 0
                    ? <><Coins className="w-4 h-4" /> {user.followPrice} เหรียญ</>
                    : <><UserPlus className="w-4 h-4" /> เพิ่มเพื่อน</>
              }
            </button>
            <Link href={`/chat/${userId}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
              <MessageCircle className="w-4 h-4" /> แชท
            </Link>
          </div>
        )}
      </div>

      {/* ─── Heart card ─── */}
      <div className="mx-4 mt-4 mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* score row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">เดือนนี้</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{user.voteMonthScore.toLocaleString()}</p>
          </div>
          <Heart className="w-8 h-8 fill-rose-100 text-rose-400 dark:fill-rose-900/40" />
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">ทั้งหมด</p>
            <p ref={scoreRef} className="text-xl font-bold text-gray-800 dark:text-white">{user.voteTotalScore.toLocaleString()}</p>
          </div>
        </div>

        {/* progress bar */}
        <div className="px-5 pt-3 pb-1">
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (user.starScore / HEART_MAX) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 mb-3">
            <span className="text-xs text-gray-400">{user.starScore.toLocaleString()} คะแนน</span>
            <span className="text-xs text-gray-400">{HEART_MAX.toLocaleString()}</span>
          </div>
        </div>

        {/* interactive hearts */}
        <div className="flex justify-center pb-5">
          <HeartLevel
            score={user.starScore}
            canGive={!isOwn && !!session?.user?.id}
            votedToday={votedToday}
            onGive={giveHearts}
          />
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 mb-4">
        <button
          onClick={() => setProfileTab("posts")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${profileTab === "posts" ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-600"}`}
        >
          โพสต์ {posts.length > 0 && <span className="text-xs text-gray-400">({posts.length})</span>}
        </button>
        <button
          onClick={() => setProfileTab("clips")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${profileTab === "clips" ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400" : "text-gray-400 hover:text-gray-600"}`}
        >
          <Film className="w-3.5 h-3.5" /> คลิป
        </button>
        {isOwn && (
          <button
            onClick={() => setProfileTab("dash")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${profileTab === "dash" ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-600"}`}
          >
            ภาพรวม
          </button>
        )}
      </div>

      {/* ─── Tab: Posts ─── */}
      {profileTab === "posts" && (
        <div className="mb-6">
          {posts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีโพสต์</div>
          ) : (
            <div>
              {posts.some((p) => p.mediaUrls) && (
                <div className="grid grid-cols-3 gap-0.5 mb-4">
                  {posts.filter((p) => p.mediaUrls).map((post) => (
                    <div key={post.id} className="relative">
                      <Link href={`/board/${post.id}`}>
                        <PostMedia items={parseMedia(post.mediaUrls)} />
                      </Link>
                      {isOwn && (
                        <button
                          type="button"
                          disabled={pinLoadingId === post.id}
                          onClick={async (e) => {
                            e.preventDefault();
                            setPinLoadingId(post.id);
                            const res = await fetch(`/api/posts/${post.id}/pin`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ pinned: !post.isPinned }),
                            });
                            setPinLoadingId(null);
                            if (res.ok) fetchUser();
                          }}
                          className={`absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            post.isPinned ? "bg-orange-500 text-white" : "bg-black/40 text-white"
                          }`}
                        >
                          {post.isPinned ? "📌 ปักหมุด" : "ปักหมุด"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {posts.filter((p) => !p.mediaUrls).length > 0 && (
                <div className="px-4 space-y-3">
                  {posts.filter((p) => !p.mediaUrls).map((post) => (
                    <div key={post.id} className="relative">
                      <Link href={`/board/${post.id}`}>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors">
                          {post.isPinned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full mb-2">
                              📌 ปักหมุด
                            </span>
                          )}
                          <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-1 mb-1">{post.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post._count.comments}</span>
                            <span className="ml-auto">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: th })}</span>
                          </div>
                        </div>
                      </Link>
                      {isOwn && (
                        <button
                          type="button"
                          disabled={pinLoadingId === post.id}
                          onClick={async (e) => {
                            e.preventDefault();
                            setPinLoadingId(post.id);
                            const res = await fetch(`/api/posts/${post.id}/pin`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ pinned: !post.isPinned }),
                            });
                            setPinLoadingId(null);
                            if (res.ok) fetchUser();
                          }}
                          className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            post.isPinned ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {post.isPinned ? "ถอนหมุด" : "ปักหมุด"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Clips ─── */}
      {profileTab === "clips" && (
        <div className="mb-6 px-1">
          {/* Own profile — not a creator yet */}
          {isOwn && creatorProfile === null && (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
                <Film className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">เริ่มต้นเป็น Creator</p>
              <p className="text-xs text-gray-400">อัปโหลดคลิปและรับเหรียญจากสมาชิก</p>
              <Link href="/clips/upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow">
                <Plus className="w-4 h-4" /> เปิด Creator Mode
              </Link>
            </div>
          )}

          {/* Own profile — is creator */}
          {isOwn && creatorProfile && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{clips.length} คลิป</span>
                <Link href="/clips/upload"
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl shadow">
                  <Plus className="w-3.5 h-3.5" /> อัปโหลดคลิป
                </Link>
              </div>
              {clips.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีคลิป กดอัปโหลดเพื่อเริ่ม</div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {clips.map((clip) => (
                    <Link key={clip.id} href={`/creator/${userId}`} className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
                      {clip.thumbnailUrl
                        ? <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Play className="w-5 h-5 text-gray-600" /></div>
                      }
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                      <div className="absolute top-1 left-1">
                        {clip.isSubscriberOnly
                          ? <span className="bg-purple-600/90 text-white text-[9px] px-1 py-0.5 rounded font-bold flex items-center gap-0.5"><Lock className="w-2 h-2" />สมาชิก</span>
                          : <span className="bg-green-600/90 text-white text-[9px] px-1 py-0.5 rounded font-bold flex items-center gap-0.5"><Globe className="w-2 h-2" />ฟรี</span>
                        }
                      </div>
                      <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-white text-[9px]">
                        <Eye className="w-2.5 h-2.5" />{clip.views}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other user's profile */}
          {!isOwn && (
            clips.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีคลิป</div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {clips.map((clip) => (
                  <Link key={clip.id} href={`/creator/${userId}`} className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
                    {clip.thumbnailUrl
                      ? <img src={clip.thumbnailUrl} alt={clip.title} className={`w-full h-full object-cover ${!clip.hasAccess ? "blur-sm" : ""}`} />
                      : <div className="w-full h-full flex items-center justify-center"><Play className="w-5 h-5 text-gray-600" /></div>
                    }
                    {!clip.hasAccess && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-white drop-shadow" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-white text-[9px]">
                      <Eye className="w-2.5 h-2.5" />{clip.views}
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ─── Tab: Dashboard (เจ้าของเท่านั้น) ─── */}
      {profileTab === "dash" && isOwn && (
        <div className="px-4 mb-6 space-y-3">
          {!dash ? (
            <div className="text-center py-10 text-gray-400 text-sm">กำลังโหลด...</div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      เพื่อนออนไลน์ {dash.onlineFriends.length} / {dash.totalFriends} คน
                    </span>
                  </div>
                  <Link href="/favorites" className="text-xs text-gray-400 hover:text-gray-600">ดูทั้งหมด</Link>
                </div>
                {dash.onlineFriends.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">ไม่มีเพื่อนออนไลน์ขณะนี้</p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {dash.onlineFriends.map((f) => (
                      <Link key={f.id} href={`/profile/${f.id}`} className="flex flex-col items-center gap-1 shrink-0">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            {f.avatar
                              ? <img src={f.avatar} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">{(f.nickname || f.username)[0]?.toUpperCase()}</div>
                            }
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 max-w-[40px] truncate">{f.nickname || f.username}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Coins className="w-4 h-4" />, label: "เหรียญ", value: dash.stats.coins.toLocaleString(), href: "/coins" },
                  { icon: <Users className="w-4 h-4" />, label: "ผู้ติดตาม", value: `${dash.stats.followers} คน`, href: "/favorites" },
                  { icon: <MessageCircle className="w-4 h-4" />, label: "ข้อความที่ส่ง", value: `${dash.stats.messagesSent} ครั้ง` },
                  { icon: <Gift className="w-4 h-4" />, label: "ของขวัญที่รับ", value: `${dash.stats.giftsReceived} ชิ้น`, href: "/gifts" },
                ].map(({ icon, label, value, href }) => {
                  const inner = (
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">{icon}</div>
                      <div><p className="text-xs text-gray-400">{label}</p><p className="text-sm font-bold text-gray-800 dark:text-white">{value}</p></div>
                    </div>
                  );
                  return href ? <Link key={label} href={href}>{inner}</Link> : <div key={label}>{inner}</div>;
                })}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: <Bell className="w-4 h-4" />, label: "แจ้งเตือน", href: "/notifications", badge: dash.stats.unreadNotifications },
                  { icon: <Trophy className="w-4 h-4" />, label: "รางวัล", href: "/rewards" },
                  { icon: <Headphones className="w-4 h-4" />, label: "ดีเจ", href: "/dj" },
                ].map((s) => (
                  <Link key={s.href} href={s.href} className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 flex flex-col items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-gray-500 dark:text-gray-400">{s.icon}</span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{s.label}</span>
                    {!!s.badge && s.badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{s.badge > 9 ? "9+" : s.badge}</span>}
                  </Link>
                ))}
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"><Gamepad2 className="w-4 h-4" /> เกมส์</span>
                  <Link href="/games" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5">ทั้งหมด <ChevronRight className="w-3 h-3" /></Link>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {QUICK_LINKS.map((g) => (
                    <Link key={g.href} href={g.href} className={`${g.color} dark:bg-gray-800 rounded-xl p-2.5 flex flex-col items-center gap-1 hover:opacity-80 transition-opacity`}>
                      <span className="text-xl">{g.icon}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">{g.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {dash.recentTx.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"><Coins className="w-4 h-4" /> เหรียญล่าสุด</span>
                    <Link href="/coins" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5">ดูเพิ่ม <ChevronRight className="w-3 h-3" /></Link>
                  </div>
                  <div className="space-y-2">
                    {dash.recentTx.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-2 text-sm">
                        <span className={`font-bold w-14 text-right shrink-0 ${tx.amount > 0 ? "text-green-500" : "text-red-400"}`}>{tx.amount > 0 ? "+" : ""}{tx.amount}</span>
                        <span className="flex-1 text-gray-600 dark:text-gray-300 truncate text-xs">{tx.description}</span>
                        <span className="text-xs text-gray-300 shrink-0">{formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true, locale: th })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dash.recentMessages.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300"><MessageCircle className="w-4 h-4" /> แชทล่าสุด</div>
                  <div className="space-y-2">
                    {dash.recentMessages.map((m) => {
                      const other = m.sender.id === userId ? m.receiver : m.sender;
                      return (
                        <Link key={m.id} href={`/chat/${other.id}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-2 py-1.5 transition-colors">
                          <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                            {other.avatar ? <img src={other.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{(other.nickname || other.username)[0]?.toUpperCase()}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{other.nickname || other.username}</p>
                            <p className="text-xs text-gray-400 truncate">{m.content}</p>
                          </div>
                          <span className="text-xs text-gray-300 shrink-0">{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: th })}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── Floating hearts animation ─── */}
      <style>{`
        @keyframes floatHeart {
          0%   { transform: translate(0, 0) scale(1) rotate(var(--rot)); opacity: 1; }
          60%  { opacity: 0.9; }
          100% { transform: translate(var(--heart-tx), var(--heart-ty)) scale(0.3) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
      {floatingHearts.map((h) => (
        <Heart
          key={h.id}
          className="fixed pointer-events-none z-[60] w-8 h-8 fill-rose-500 text-rose-500"
          style={{
            left: h.x - 16,
            top: h.y - 16,
            ["--rot" as string]: `${h.rotate}deg`,
            animation: "floatHeart 0.95s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
          }}
        />
      ))}
    </div>
  );
}
