"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Loader2, MessageCircle, Heart } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

type OnlineUser = {
  id: string;
  username: string;
  nickname: string | null;
  avatar: string | null;
  gender: string | null;
  age: number | null;
  province: string | null;
  isOnline: boolean;
};

type Post = {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  mediaUrls: string | null;
  user: {
    id: string;
    username: string;
    nickname: string | null;
    avatar: string | null;
  };
  _count: { comments: number };
};

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);
}

function PostCard({
  post,
  activeVideoRef,
  scrollRoot,
}: {
  post: Post;
  activeVideoRef: { current: HTMLVideoElement | null };
  scrollRoot: HTMLDivElement | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const mediaUrls: string[] = useMemo(() => {
    try { return JSON.parse(post.mediaUrls ?? "[]"); } catch { return []; }
  }, [post.mediaUrls]);

  const firstMedia = mediaUrls[0] ?? null;
  const isVideo = firstMedia ? isVideoUrl(firstMedia) : false;
  const isImage = firstMedia && !isVideo;

  useEffect(() => {
    if (!isVideo || !videoRef.current || !scrollRoot) return;
    const video = videoRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (activeVideoRef.current && activeVideoRef.current !== video) {
            activeVideoRef.current.pause();
          }
          activeVideoRef.current = video;
          video.play().catch(() => {});
        } else {
          video.pause();
          if (activeVideoRef.current === video) activeVideoRef.current = null;
        }
      },
      { root: scrollRoot, threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [isVideo, activeVideoRef, scrollRoot]);

  return (
    <div className="flex gap-3 items-start">
      <UserAvatar
        src={post.user.avatar}
        fallback={(post.user.nickname ?? post.user.username)[0]?.toUpperCase() ?? "?"}
        className="w-8 h-8 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">
          {post.user.nickname ?? post.user.username}
        </p>
        {(post.title ?? post.content) && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {post.title ?? post.content}
          </p>
        )}
        {isVideo && firstMedia && (
          <video
            ref={videoRef}
            src={firstMedia}
            muted
            playsInline
            loop
            className="w-full rounded-lg mt-2 max-h-52 object-cover bg-black"
          />
        )}
        {isImage && firstMedia && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstMedia}
            alt=""
            className="w-full rounded-lg mt-2 max-h-52 object-cover"
          />
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <Heart className="w-2.5 h-2.5" />
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <MessageCircle className="w-2.5 h-2.5" />
            {post._count.comments}
          </span>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetch("/api/users?onlineOnly=1")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOnlineUsers(data.slice(0, 12));
          setOnlineCount(data.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));

    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data.slice(0, 20));
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-semibold text-gray-800">
            ออนไลน์ตอนนี้ {onlineCount > 0 ? `(${onlineCount})` : ""}
          </span>
        </div>
        <p className="text-xs text-gray-400">เข้าร่วมและพูดคุยกับพวกเขา</p>
      </div>

      {/* Online users grid */}
      <div className="grid grid-cols-4 gap-3">
        {loadingUsers
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-10 h-2 bg-gray-100 rounded animate-pulse" />
              </div>
            ))
          : onlineUsers.length === 0
          ? <p className="col-span-4 text-xs text-gray-400 text-center py-2">ยังไม่มีผู้ใช้ออนไลน์</p>
          : onlineUsers.map((u) => (
              <div key={u.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <UserAvatar
                    src={u.avatar}
                    fallback={(u.nickname ?? u.username)[0]?.toUpperCase() ?? "?"}
                    className="w-12 h-12"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                </div>
                <span className="text-xs text-gray-600 truncate w-full text-center max-w-[56px]">
                  {u.nickname ?? u.username}
                </span>
              </div>
            ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Recent posts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-800">โพสต์ล่าสุด</span>
        </div>
        <div ref={setScrollContainer} className="flex flex-col gap-4 overflow-y-auto max-h-[480px] pr-1">
          {loadingPosts
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            : posts.length === 0
            ? <p className="text-xs text-gray-400 text-center py-2">ยังไม่มีโพสต์</p>
            : posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  activeVideoRef={activeVideoRef}
                  scrollRoot={scrollContainer}
                />
              ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <p className="text-xs text-center text-gray-400">
          มีสมาชิกกว่า{" "}
          <span className="text-purple-600 font-semibold">หลายร้อยคน</span>{" "}
          รอพูดคุยกับคุณอยู่
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (res?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-stretch">

        {/* Social proof panel — bottom on mobile, left on desktop */}
        <div className="flex flex-col flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 order-2 lg:order-1">
          <PreviewPanel />
        </div>

        {/* Login form — top on mobile, right on desktop */}
        <div className="w-full lg:w-96 flex flex-col shrink-0 order-1 lg:order-2">
          {/* Logo */}
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ThChat" className="w-50 h-50 object-contain mx-auto mb-0" />
            <p className="text-gray-500 text-sm mt-1">หาเพื่อน พูดคุย สนุกสนาน</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">เข้าสู่ระบบ</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">อีเมล</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
                  <Link href="/forgot-password" className="text-xs text-purple-600 hover:text-purple-700">
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังเข้าสู่ระบบ...</> : "เข้าสู่ระบบ"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="text-purple-600 hover:text-purple-700 font-medium">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
