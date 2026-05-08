"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { Lock, Play, Eye, Coins, ShoppingBag, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

type Clip = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  isSubscriberOnly: boolean;
  lockedPrice: number | null;
  hasAccess: boolean;
  views: number;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    nickname: string | null;
    avatar: string | null;
    monthlyPrice: number;
  };
};

function ClipCard({ clip, onPurchased }: { clip: Clip; onPurchased: (id: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  function handlePlay() {
    if (!clip.hasAccess) return;
    setPlaying(true);
    setTimeout(() => videoRef.current?.play(), 50);
  }

  async function handlePurchase(e: React.MouseEvent) {
    e.preventDefault();
    setPurchasing(true);
    setPurchaseError("");
    const res = await fetch(`/api/clips/${clip.id}/purchase`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      onPurchased(clip.id);
    } else {
      setPurchaseError(data.error || "เกิดข้อผิดพลาด");
    }
    setPurchasing(false);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group">
      {/* Thumbnail / Video */}
      <div className="aspect-video bg-gray-900 relative">
        {playing && clip.videoUrl ? (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        ) : (
          <>
            {clip.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <Play className="w-12 h-12 text-gray-600" />
              </div>
            )}

            {/* Overlay */}
            {clip.hasAccess ? (
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-gray-900 ml-1" />
                </div>
              </button>
            ) : clip.lockedPrice && clip.lockedPrice > 0 ? (
              // PPV lock — ต้องซื้อรายคลิป
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-3">
                <ShoppingBag className="w-7 h-7 text-amber-400 mb-1.5" />
                <p className="text-white text-xs font-semibold mb-0.5">ปลดล็อครายคลิป</p>
                {purchaseError && <p className="text-red-400 text-[10px] mb-1">{purchaseError}</p>}
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="mt-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow flex items-center gap-1 hover:opacity-90 disabled:opacity-60"
                >
                  {purchasing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                  {clip.lockedPrice} เหรียญ
                </button>
              </div>
            ) : (
              // Subscriber lock — ต้องสมัครสมาชิก
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <Lock className="w-8 h-8 text-white mb-2" />
                <p className="text-white text-xs font-medium mb-3">เฉพาะสมาชิก</p>
                <Link
                  href={`/creator/${clip.creator.id}`}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  <Coins className="w-3 h-3" />
                  {clip.creator.monthlyPrice} เหรียญ/เดือน
                </Link>
              </div>
            )}

            {clip.isSubscriberOnly && clip.hasAccess && (
              <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> สมาชิก
              </span>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-2">
          {clip.title}
        </p>
        <div className="flex items-center gap-2">
          <Link href={`/creator/${clip.creator.id}`}>
            <UserAvatar
              src={clip.creator.avatar}
              fallback={(clip.creator.nickname || clip.creator.username)[0]}
              className="w-6 h-6"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/creator/${clip.creator.id}`} className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:underline truncate block">
              {clip.creator.nickname || clip.creator.username}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{clip.views.toLocaleString()}</span>
          <span>{formatDistanceToNow(new Date(clip.createdAt), { addSuffix: true, locale: th })}</span>
        </div>
      </div>
    </div>
  );
}

export default function ClipsPage() {
  const { data: session } = useSession();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clips?page=${page}`)
      .then((r) => r.json())
      .then((d: Clip[]) => {
        if (Array.isArray(d)) {
          setClips((prev) => page === 1 ? d : [...prev, ...d]);
          setHasMore(d.length === 20);
        }
        setLoading(false);
      });
  }, [page]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">คลิป</h1>
        <p className="text-xs text-gray-400">ติดตามคอนเทนต์ครีเอเตอร์ที่ชอบ</p>
      </div>

      {/* Grid */}
      {loading && clips.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">ยังไม่มีคลิป</p>
          {session?.user?.id && (
            <Link href={`/profile/${session.user.id}`} className="mt-3 inline-block text-indigo-500 text-sm hover:underline">
              อัปโหลดคลิปที่โปรไฟล์ของคุณ →
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                onPurchased={(id) =>
                  setClips((prev) => prev.map((c) => c.id === id ? { ...c, hasAccess: true } : c))
                }
              />
            ))}
          </div>
          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="px-6 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                {loading ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
