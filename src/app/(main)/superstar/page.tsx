"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Sparkles, Trophy, ChevronRight } from "lucide-react";

type User = { id: string; username: string; nickname: string | null; avatar: string | null; coins: number; isOnline: boolean };
type Tab = "month" | "gift" | "dj" | "tip";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function monthLabel() {
  const d = new Date();
  return `${MONTHS_TH[d.getMonth()]} ${d.getFullYear()}`;
}

const FRAME: Record<number, { ring: string; shadow: string; badge: string; stars: number; starFill: string }> = {
  1: {
    ring: "ring-2 ring-amber-400/90 ring-offset-2 ring-offset-white dark:ring-offset-gray-950",
    shadow: "shadow-[0_12px_40px_-12px_rgba(245,158,11,0.45)]",
    badge: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    stars: 5,
    starFill: "text-amber-400",
  },
  2: {
    ring: "ring-2 ring-slate-300 dark:ring-slate-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-950",
    shadow: "shadow-[0_12px_36px_-14px_rgba(148,163,184,0.55)]",
    badge: "bg-gradient-to-r from-slate-500 to-slate-600 text-white",
    stars: 3,
    starFill: "text-slate-400 dark:text-slate-400",
  },
  3: {
    ring: "ring-2 ring-rose-400/80 ring-offset-2 ring-offset-white dark:ring-offset-gray-950",
    shadow: "shadow-[0_12px_36px_-14px_rgba(244,63,94,0.35)]",
    badge: "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
    stars: 3,
    starFill: "text-rose-400",
  },
};

function frame(rank: number) {
  return (
    FRAME[rank] ?? {
      ring: "ring-1 ring-pink-300/80 dark:ring-pink-500/40 ring-offset-2 ring-offset-white dark:ring-offset-gray-950",
      shadow: "shadow-lg shadow-pink-500/10",
      badge: "bg-gradient-to-r from-pink-400 to-fuchsia-500 text-white",
      stars: 2,
      starFill: "text-pink-300 dark:text-pink-400",
    }
  );
}

function StarsRow({ count, fill }: { count: number; fill: string }) {
  return (
    <div className="flex justify-center gap-px">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className={`h-3 w-3 fill-current sm:h-3.5 sm:w-3.5 ${fill}`} />
      ))}
    </div>
  );
}

function UserCard({ user, rank }: { user: User; rank: number }) {
  const f = frame(rank);
  return (
    <div className="flex w-full max-w-[148px] flex-col items-center gap-2 sm:max-w-[156px]">
      <StarsRow count={f.stars} fill={f.starFill} />
      <Link href={`/profile/${user.id}`} className="group relative block w-full outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 rounded-[1.35rem] dark:focus-visible:ring-offset-gray-950">
        <div
          className={`relative aspect-[4/5] w-full overflow-hidden rounded-[1.35rem] bg-gray-200 transition duration-300 dark:bg-gray-700 ${f.ring} ${f.shadow} group-hover:-translate-y-1 group-hover:shadow-xl`}
        >
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 text-4xl font-bold text-gray-400 dark:from-gray-600 dark:to-gray-800 dark:text-gray-500">
              {(user.nickname || user.username).slice(0, 1).toUpperCase()}
            </div>
          )}
          {/* Rank ribbon */}
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-md backdrop-blur-sm sm:text-[11px] bg-black/55 text-white">
            <Trophy className="h-3 w-3 text-amber-300" />
            #{rank}
          </div>
          {user.isOnline && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 shadow-sm dark:border-gray-900" title="ออนไลน์" />
          )}
          {/* Score chip */}
          <div className="absolute inset-x-2 top-10 rounded-lg bg-black/45 px-2 py-1 text-center backdrop-blur-[2px]">
            <p className="text-[9px] font-medium uppercase tracking-wide text-white/70">คะแนน</p>
            <p className="text-[11px] font-bold tabular-nums text-white drop-shadow-sm sm:text-xs">{user.coins.toLocaleString()}</p>
          </div>
          {/* Footer */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pb-2 pt-10">
            <div className="flex items-end justify-between gap-1">
              <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold shadow-sm shrink-0 sm:text-[10px] ${f.badge}`}>SUPTA</span>
              <span className="min-w-0 truncate text-right text-[11px] font-semibold text-white drop-shadow-md sm:text-xs">
                {user.nickname || user.username}
              </span>
            </div>
          </div>
        </div>
        <span className="mt-1.5 flex items-center justify-center gap-0.5 text-[11px] font-medium text-pink-600 opacity-0 transition group-hover:opacity-100 dark:text-pink-400">
          โปรไฟล์ <ChevronRight className="h-3 w-3" />
        </span>
      </Link>
    </div>
  );
}

function RankDivider({ n }: { n: number }) {
  const big = n <= 3;
  return (
    <div className="flex flex-col items-center justify-center px-1">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl border bg-white text-lg font-black tabular-nums shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:h-12 sm:w-12 sm:text-xl ${
          n === 1
            ? "border-amber-200 text-amber-600 dark:border-amber-900/50 dark:text-amber-400"
            : n === 2
              ? "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              : n === 3
                ? "border-rose-200 text-rose-600 dark:border-rose-900/40 dark:text-rose-400"
                : "border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500"
        }`}
      >
        {n}
      </div>
      {big && <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-wider text-gray-400 sm:inline">TOP</span>}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-4 sm:gap-4">
      <div className="flex justify-center">
        <div className="h-[200px] w-[130px] animate-pulse rounded-[1.35rem] bg-gray-200 dark:bg-gray-800 sm:w-[148px]" />
      </div>
      <div className="h-11 w-11 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800 sm:h-12 sm:w-12" />
      <div className="flex justify-center">
        <div className="h-[200px] w-[130px] animate-pulse rounded-[1.35rem] bg-gray-200 dark:bg-gray-800 sm:w-[148px]" />
      </div>
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

  const tabs: { key: Tab; label: string; hint: string }[] = [
    { key: "month", label: ml, hint: "จัดอันดับจากเหรียญในกระเป๋า" },
    { key: "gift", label: "ของขวัญ", hint: "ยอดมูลค่าของขวัญที่ได้รับเดือนนี้" },
    { key: "dj", label: "ดีเจ", hint: "จัดอันดับจากเหรียญ" },
    { key: "tip", label: `ทิป ${ml}`, hint: "ของขวัญ / ทิปเดือนนี้" },
  ];

  const activeHint = tabs.find((t) => t.key === tab)?.hint ?? "";
  const rows = Math.max(female.length, male.length);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 pt-1">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-gradient-to-br from-white via-pink-50/40 to-violet-50/50 px-5 py-6 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pink-200/30 blur-3xl dark:bg-pink-600/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-violet-200/25 blur-3xl dark:bg-violet-600/10" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-pink-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-pink-700 shadow-sm backdrop-blur-sm dark:border-pink-500/20 dark:bg-gray-900/80 dark:text-pink-300">
              <Sparkles className="h-3.5 w-3.5" />
              Leaderboard
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">ซุปตาร์ประจำเดือน</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">{activeHint}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200/90 bg-white/90 px-4 py-3 text-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">อัปเดตล่าสุด</p>
              <p className="font-semibold text-gray-900 dark:text-white">{new Date().toLocaleDateString("th-TH", { dateStyle: "medium" })}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-0 z-10 -mx-1 border-b border-gray-100 bg-[color-mix(in_oklab,var(--background)_92%,transparent)] pb-3 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/85 px-1 pt-1">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === t.key
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-900/15 dark:bg-white dark:text-gray-900 dark:shadow-white/10"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-1">
        <p className="text-center text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 sm:text-sm">หญิง</p>
        <span className="w-11 sm:w-12" />
        <p className="text-center text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 sm:text-sm">ชาย</p>
      </div>

      {/* Rows */}
      {loading ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-2xl border border-gray-100 bg-white/50 px-2 dark:border-gray-800 dark:bg-gray-900/40">
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : rows === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-20 text-center dark:border-gray-700 dark:bg-gray-900/50">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-inner dark:bg-gray-800">
            <Star className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">ยังไม่มีข้อมูลจัดอันดับ</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">ลองเปลี่ยนแท็บด้านบน หรือกลับมาดูใหม่เมื่อมีผู้ใช้เข้าเงื่อนไขการจัดอันดับ</p>
        </div>
      ) : (
        <div className="space-y-1 rounded-2xl border border-gray-100 bg-white/60 p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900/35 sm:p-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-5 sm:gap-4 ${i > 0 ? "border-t border-gray-100 dark:border-gray-800/80" : ""}`}
            >
              <div className="flex justify-center">
                {female[i] ? <UserCard user={female[i]} rank={i + 1} /> : <div className="h-[220px] w-[130px] sm:w-[148px]" />}
              </div>
              <RankDivider n={i + 1} />
              <div className="flex justify-center">
                {male[i] ? <UserCard user={male[i]} rank={i + 1} /> : <div className="h-[220px] w-[130px] sm:w-[148px]" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
