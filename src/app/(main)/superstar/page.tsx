"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

type User = { id: string; username: string; nickname: string | null; avatar: string | null; coins: number; isOnline: boolean };
type Tab = "month" | "gift" | "dj" | "tip";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function monthLabel() {
  const d = new Date();
  return `${MONTHS_TH[d.getMonth()]} ${d.getFullYear()}`;
}

const FRAME: Record<number, { border: string; glow: string; badge: string; stars: number; starColor: string }> = {
  1: { border: "border-[3px] border-yellow-400", glow: "shadow-[0_0_18px_4px_rgba(250,204,21,0.55)]", badge: "bg-yellow-500", stars: 5, starColor: "text-yellow-400" },
  2: { border: "border-[3px] border-slate-300", glow: "shadow-[0_0_14px_3px_rgba(203,213,225,0.6)]", badge: "bg-slate-400", stars: 3, starColor: "text-slate-300" },
  3: { border: "border-[3px] border-rose-400", glow: "shadow-[0_0_14px_3px_rgba(251,113,133,0.55)]", badge: "bg-rose-500", stars: 3, starColor: "text-rose-400" },
};
function frame(rank: number) {
  return FRAME[rank] ?? { border: "border-2 border-pink-300", glow: "", badge: "bg-pink-400", stars: 2, starColor: "text-pink-300" };
}

function Stars({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 fill-current ${color}`} />
      ))}
    </div>
  );
}

function UserCard({ user, rank }: { user: User; rank: number }) {
  const f = frame(rank);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Stars count={f.stars} color={f.starColor} />
      <Link href={`/profile/${user.id}`} className="block">
        <div className={`relative w-[130px] h-[160px] rounded-2xl overflow-hidden ${f.border} ${f.glow} transition-transform hover:scale-105`}>
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
          )}
          {/* coins overlay top */}
          <div className="absolute inset-x-0 top-0 pt-1 text-center pointer-events-none">
            <span className="text-white text-[11px] font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {user.coins.toLocaleString()}
            </span>
          </div>
          {/* bottom gradient + badge */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-6 pb-1.5 px-1.5 flex items-end justify-between gap-1">
            <span className={`${f.badge} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0`}>
              SUPTA#{rank}
            </span>
            <span className="text-white text-[10px] font-semibold truncate drop-shadow-sm">
              {user.nickname || user.username}
            </span>
          </div>
          {/* online dot */}
          {user.isOnline && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-400 rounded-full border border-white" />
          )}
        </div>
      </Link>
    </div>
  );
}

export default function SuperstarPage() {
  const [female, setFemale] = useState<User[]>([]);
  const [male, setMale] = useState<User[]>([]);
  const [tab, setTab] = useState<Tab>("month");
  const [loading, setLoading] = useState(false);
  const ml = monthLabel();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/superstar?tab=${tab}`)
      .then((r) => r.json())
      .then((d) => {
        setFemale(Array.isArray(d.female) ? d.female : []);
        setMale(Array.isArray(d.male) ? d.male : []);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "month", label: ml },
    { key: "gift", label: "ของขวัญ" },
    { key: "dj", label: "ดีเจ" },
    { key: "tip", label: `ทิป ${ml}` },
  ];

  const rows = Math.max(female.length, male.length);

  return (
    <div className="space-y-4 pb-8">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              tab === t.key
                ? "border-pink-400 text-pink-500 bg-pink-50 dark:bg-pink-950/30"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_48px_1fr]">
        <p className="text-center font-bold text-gray-700 dark:text-gray-200">หญิง</p>
        <div />
        <p className="text-center font-bold text-gray-700 dark:text-gray-200">ชาย</p>
      </div>

      {/* Ranking rows */}
      {loading ? (
        <div className="text-center text-gray-400 py-16 text-sm">กำลังโหลด...</div>
      ) : rows === 0 ? (
        <div className="text-center text-gray-400 py-16 text-sm">ยังไม่มีข้อมูล</div>
      ) : (
        <div className="space-y-5">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_48px_1fr] items-center">
              <div className="flex justify-center">
                {female[i] ? <UserCard user={female[i]} rank={i + 1} /> : <div className="w-[130px] h-[160px]" />}
              </div>
              <div className="text-center font-bold text-2xl text-gray-400 dark:text-gray-500">{i + 1}</div>
              <div className="flex justify-center">
                {male[i] ? <UserCard user={male[i]} rank={i + 1} /> : <div className="w-[130px] h-[160px]" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
