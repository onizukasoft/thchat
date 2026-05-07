"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Gift, MoreVertical, CheckCircle2, Star, CircleDollarSign, Info, Edit } from "lucide-react";
import { getSocket } from "@/lib/socket-client";

type UserProfile = {
  id: string; username: string; nickname: string | null; avatar: string | null;
  coverImage: string | null; bio: string | null; gender: string | null; age: number | null;
  province: string | null; relationship: string | null; coins: number;
  starScore: number; voteMonthScore: number; voteTotalScore: number;
  vipLevel: string | null; isOnline: boolean; lastSeen: string; createdAt: string;
  _count: { followers: number; followings: number; posts: number };
};

const RELATIONSHIP_LABEL: Record<string, string> = {
  single: "โสด", taken: "คบแล้ว", complicated: "ซับซ้อน",
};
const GENDER_LABEL: Record<string, string> = {
  male: "ชาย", female: "หญิง", other: "ไม่ระบุ",
};

const STAR_MAX = 600;

function StarLevel({ score }: { score: number }) {
  const level = score >= 500 ? 5 : score >= 400 ? 4 : score >= 300 ? 3 : score >= 200 ? 2 : score >= 100 ? 1 : 0;
  return (
    <div className="flex gap-1 justify-end">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-7 h-7 ${i < level ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
      ))}
    </div>
  );
}

function ScoreBar({ icon, score, max, color }: { icon: React.ReactNode; score: number; max: number; color: string }) {
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 relative h-7 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
        {score > 0 && (
          <span className="absolute inset-0 flex items-center px-3 text-xs font-bold text-white drop-shadow">
            {score.toLocaleString()}
          </span>
        )}
      </div>
      <button className="shrink-0 text-gray-400 hover:text-gray-600">
        <Info className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchUser = useCallback(async () => {
    const res = await fetch(`/api/users/${userId}`);
    const data = await res.json();
    setUser(data);
    setIsOnline(data.isOnline ?? false);
  }, [userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    const socket = getSocket();
    const handler = (ids: string[]) => setIsOnline(ids.includes(userId));
    socket.on("users:online", handler);
    socket.emit("request:online");
    return () => { socket.off("users:online", handler); };
  }, [userId]);

  if (!user) return <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>;

  const isOwn = session?.user?.id === userId;
  const displayName = user.nickname || user.username;
  const lastSeenText = formatDistanceToNow(new Date(user.lastSeen), { addSuffix: false, locale: th });

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 min-h-screen">
      {/* Top bar */}
      <div className="flex items-start justify-between px-4 pt-3 pb-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold truncate max-w-[220px]">{displayName}</h1>
            {user.vipLevel && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
            <span className="text-xs text-gray-500">
              {isOnline ? "ออนไลน์อยู่" : lastSeenText}
            </span>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-lg z-10 py-1 w-36">
              {isOwn ? (
                <Link href={`/profile/${userId}/edit`} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Edit className="w-4 h-4" /> แก้ไขโปรไฟล์
                </Link>
              ) : (
                <>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">รายงาน</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700">บล็อก</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Banner + Avatar */}
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-600 overflow-hidden">
          {user.coverImage && (
            <img src={user.coverImage} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 translate-y-1/2 flex justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-200 shadow-lg">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-14 grid grid-cols-4 border-b dark:border-gray-700">
        {isOwn ? (
          <>
            <Link href="/gifts" className="flex flex-col items-center py-3 gap-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Gift className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">ของขวัญ</span>
            </Link>
            <Link href="/coins" className="flex flex-col items-center py-3 gap-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <span className="text-lg font-bold text-gray-700 dark:text-gray-200 leading-none">{user.coins >= 1000 ? `${(user.coins / 1000).toFixed(0)}K` : user.coins.toLocaleString()}</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">เหรียญ</span>
            </Link>
            <Link href="/games" className="flex flex-col items-center py-3 gap-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <span className="text-2xl leading-none">🎡</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">หมุนวงล้อ</span>
            </Link>
            <Link href={`/profile/${userId}/edit`} className="flex flex-col items-center py-3 gap-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Edit className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">แก้ไข</span>
            </Link>
          </>
        ) : (
          <>
            <Link href={`/gifts?to=${userId}`} className="flex flex-col items-center py-3 gap-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Gift className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">ของขวัญ</span>
            </Link>
            <div className="flex flex-col items-center py-3 gap-1">
              <span className="text-lg font-bold text-gray-700 dark:text-gray-200 leading-none">{user.coins >= 1000 ? `${(user.coins / 1000).toFixed(0)}K` : user.coins.toLocaleString()}</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">เหรียญ</span>
            </div>
            <Link href="/games" className="flex flex-col items-center py-3 gap-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <span className="text-2xl leading-none">🎡</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">หมุนวงล้อ</span>
            </Link>
            <Link href={`/chat/${userId}`} className="flex flex-col items-center py-3 gap-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <span className="text-2xl leading-none">💬</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">แชท</span>
            </Link>
          </>
        )}
      </div>

      {/* Info section */}
      <div className="px-5 py-4 space-y-2 border-b dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">อายุ {user.age ?? "ไม่ระบุ"}</span>
          <span className="text-gray-700 dark:text-gray-300">{GENDER_LABEL[user.gender ?? ""] ?? "ไม่ระบุ"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">สถานะ</span>
          <span className="text-gray-700 dark:text-gray-300">{RELATIONSHIP_LABEL[user.relationship ?? ""] ?? "ไม่ระบุ"}</span>
        </div>
        {user.bio && <p className="text-sm text-gray-600 dark:text-gray-400 pt-1">{user.bio}</p>}
      </div>

      {/* Score bars */}
      <div className="px-5 py-4 space-y-3 border-b dark:border-gray-700">
        <ScoreBar
          icon={<Star className="w-7 h-7 fill-yellow-400 text-yellow-400" />}
          score={user.starScore}
          max={STAR_MAX}
          color="bg-blue-400"
        />
        <ScoreBar
          icon={<CircleDollarSign className="w-7 h-7 fill-purple-500 text-white" />}
          score={user.coins}
          max={STAR_MAX}
          color="bg-gray-400"
        />
        <div className="flex justify-between text-xs text-gray-400 pl-9 pr-7">
          <span>0</span><span>{STAR_MAX.toLocaleString()}</span>
        </div>
      </div>

      {/* Vote scores */}
      <div className="px-5 py-4 space-y-2 border-b dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">คะแนนโหวตเดือนนี้</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{user.voteMonthScore}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">คะแนนโหวตรวม</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{user.voteTotalScore}</span>
        </div>
      </div>

      {/* Star level */}
      <div className="px-5 py-5">
        <StarLevel score={user.starScore} />
      </div>
    </div>
  );
}
