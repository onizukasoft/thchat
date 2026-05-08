"use client";
import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { GiftThumb } from "@/components/gift-thumb";
import { useRouter } from "next/navigation";

interface User {
  id: string; username: string; nickname: string | null; email: string;
  avatar: string | null; coverImage: string | null; bio: string | null;
  gender: string | null; age: number | null; province: string | null;
  relationship: string | null; role: string; isBanned: boolean; isOnline: boolean;
  coins: number; vipLevel: string | null; vipUntil: string | null;
  starScore: number; createdAt: string; lastSeen: string;
  _count: { posts: number; sentMessages: number; receivedGifts: number; followers: number; followings: number };
}
interface Post { id: string; title: string; category: string; views: number; createdAt: string; _count: { comments: number } }
interface Tx { id: string; amount: number; type: string; description: string; createdAt: string }
interface GiftRcv { id: string; giftType: string; coins: number; createdAt: string; sender: { username: string; nickname: string | null } }

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<{
    user: User;
    recentPosts: Post[];
    recentTx: Tx[];
    giftsReceived: GiftRcv[];
    heartsReceivedTotal?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editCoins, setEditCoins] = useState("");
  const [editingCoins, setEditingCoins] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleBan() {
    if (!data) return;
    setActionLoading(true);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !data.user.isBanned }),
    });
    const res = await fetch(`/api/admin/users/${id}`);
    setData(await res.json());
    setActionLoading(false);
  }

  async function changeRole(role: string) {
    if (!data) return;
    setActionLoading(true);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const res = await fetch(`/api/admin/users/${id}`);
    setData(await res.json());
    setActionLoading(false);
  }

  async function saveCoins() {
    if (!data || !editCoins) return;
    setActionLoading(true);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coins: Number(editCoins) }),
    });
    const res = await fetch(`/api/admin/users/${id}`);
    setData(await res.json());
    setEditingCoins(false);
    setEditCoins("");
    setActionLoading(false);
  }

  async function deleteUser() {
    if (!data) return;
    if (!confirm(`ลบ ${data.user.username} ออกจากระบบถาวร? ไม่สามารถย้อนกลับได้`)) return;
    setActionLoading(true);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    router.push("/admin/users");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-[#ebebeb]" />
        <div className="h-56 animate-pulse rounded-2xl bg-[#ebebeb]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#ebebeb]" />)}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-sm text-[#737373]">ไม่พบผู้ใช้</p>;

  const { user, recentPosts, recentTx, giftsReceived, heartsReceivedTotal = 0 } = data;
  const displayName = user.nickname ?? user.username;

  const statItems = [
    { label: "โพสต์", value: user._count.posts },
    { label: "ข้อความ", value: user._count.sentMessages },
    { label: "ผู้ติดตาม", value: user._count.followers },
    { label: "กำลังติดตาม", value: user._count.followings },
    { label: "ของขวัญรับ", value: user._count.receivedGifts },
    { label: "หัวใจที่ได้รับ", value: heartsReceivedTotal },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 rounded-full border border-[#e9e9e9] bg-white px-3 py-1.5 text-xs font-medium text-[#555] transition hover:bg-[#fafafa] hover:text-black"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
        </svg>
        กลับไปรายชื่อผู้ใช้
      </Link>

      {/* Hero profile */}
      <section className="overflow-hidden rounded-2xl border border-[#e9e9e9] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {/* Cover */}
        <div className="relative h-36 w-full bg-[#ebebeb] md:h-44">
          {user.coverImage ? (
            <Image src={user.coverImage} alt="" fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#f2f2f2_0%,#e6e6e6_50%,#ececec_100%)]" aria-hidden />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.06] to-transparent pointer-events-none" />
          <div className="absolute right-4 top-4">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md ${
                user.isOnline
                  ? "border-white/40 bg-white/90 text-black"
                  : "border-white/30 bg-black/40 text-white"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${user.isOnline ? "bg-black" : "bg-white/70"}`} />
              {user.isOnline ? "ออนไลน์" : "ออฟไลน์"}
            </span>
          </div>
        </div>

        <div className="relative px-5 pb-6 pt-0 md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="-mt-14 shrink-0">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-[#111] shadow-md md:h-28 md:w-28 md:rounded-[1.25rem]">
                  {user.avatar ? (
                    <Image src={user.avatar} alt="" fill className="object-cover" sizes="112px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white md:text-4xl">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 pb-1 pt-2 sm:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-black md:text-3xl">{displayName}</h1>
                  <span className="rounded-md border border-[#e5e5e5] bg-[#fafafa] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#444]">
                    {user.role}
                  </span>
                  {user.isBanned && (
                    <span className="rounded-md border border-[#e5e5e5] bg-black px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                      Banned
                    </span>
                  )}
                  {user.vipLevel && (
                    <span className="rounded-md border border-[#d4d4d4] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#333]">
                      VIP {user.vipLevel}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-[#737373]">
                  @{user.username}
                  <span className="mx-2 text-[#d4d4d4]">·</span>
                  <span className="truncate">{user.email}</span>
                </p>
                {user.bio && (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#525252]">{user.bio}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <select
                value={user.role}
                disabled={actionLoading}
                onChange={e => changeRole(e.target.value)}
                className="cursor-pointer rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-xs font-medium text-black outline-none transition hover:border-[#ccc] disabled:opacity-50"
              >
                <option value="user">Role · User</option>
                <option value="moderator">Role · Moderator</option>
                <option value="admin">Role · Admin</option>
              </select>
              <button
                onClick={toggleBan}
                disabled={actionLoading}
                className="rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#f5f5f5] disabled:opacity-50"
              >
                {user.isBanned ? "ปลดแบน" : "แบนผู้ใช้"}
              </button>
              <button
                onClick={deleteUser}
                disabled={actionLoading}
                className="rounded-lg border border-black bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#222] disabled:opacity-50"
              >
                ลบบัญชี
              </button>
            </div>
          </div>

          {/* Meta row */}
          <dl className="mt-6 grid gap-3 border-t border-[#efefef] pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-[#fafafa] px-3 py-2.5">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[#888]">สมัครเมื่อ</dt>
              <dd className="mt-0.5 text-sm font-medium text-black">{new Date(user.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}</dd>
            </div>
            <div className="rounded-xl bg-[#fafafa] px-3 py-2.5">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[#888]">เข้าล่าสุด</dt>
              <dd className="mt-0.5 text-sm font-medium text-black">{new Date(user.lastSeen).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</dd>
            </div>
            <div className="rounded-xl bg-[#fafafa] px-3 py-2.5 sm:col-span-2 lg:col-span-2">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[#888]">ข้อมูลโปรไฟล์</dt>
              <dd className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#404040]">
                {user.age != null && <span>{user.age} ปี</span>}
                {user.gender && <span className="capitalize">{user.gender}</span>}
                {user.province && <span>{user.province}</span>}
                {user.relationship && <span>{user.relationship}</span>}
                {!user.age && !user.gender && !user.province && !user.relationship && (
                  <span className="text-[#a3a3a3]">—</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Stats */}
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#888]">สถิติ</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statItems.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[#e9e9e9] bg-white px-4 py-4 text-center transition hover:border-[#d4d4d4]"
            >
              <p className="text-2xl font-bold tabular-nums tracking-tight text-black">{s.value.toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-[#737373]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Coins & VIP */}
        <section className="lg:col-span-5">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#888]">เหรียญและ VIP</h2>
          <div className="rounded-2xl border border-[#e9e9e9] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e9e9e9] bg-[#fafafa] text-black">
                  <CoinIcon />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#888]">Coins</p>
                  {editingCoins ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        value={editCoins}
                        onChange={e => setEditCoins(e.target.value)}
                        className="w-32 rounded-lg border border-[#e5e5e5] px-2.5 py-1.5 text-sm outline-none focus:border-black"
                      />
                      <button
                        onClick={saveCoins}
                        disabled={actionLoading}
                        className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        บันทึก
                      </button>
                    </div>
                  ) : (
                    <p className="mt-0.5 text-2xl font-bold tabular-nums text-black">{user.coins.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setEditingCoins(v => !v); setEditCoins(String(user.coins)); }}
                className="shrink-0 text-xs font-semibold text-black underline-offset-4 hover:underline"
              >
                {editingCoins ? "ยกเลิก" : "แก้ไข"}
              </button>
            </div>

            {user.vipLevel && (
              <div className="mt-5 rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-3">
                <p className="text-xs font-semibold text-black">VIP {user.vipLevel}</p>
                {user.vipUntil && (
                  <p className="mt-1 text-xs text-[#737373]">หมดอายุ {new Date(user.vipUntil).toLocaleDateString("th-TH", { dateStyle: "medium" })}</p>
                )}
              </div>
            )}

            <div className="mt-5 border-t border-[#efefef] pt-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#888]">Star score</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-black">{user.starScore.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Recent posts */}
        <section className="lg:col-span-7">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#888]">โพสต์ล่าสุด</h2>
          <div className="rounded-2xl border border-[#e9e9e9] bg-white p-5">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-[#a3a3a3]">ยังไม่มีโพสต์</p>
            ) : (
              <ul className="divide-y divide-[#f0f0f0]">
                {recentPosts.map(post => (
                  <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="font-medium text-black line-clamp-2">{post.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#737373]">
                      <span className="rounded border border-[#ececec] bg-[#fafafa] px-1.5 py-0.5 capitalize">{post.category}</span>
                      <span>{post.views.toLocaleString()} views</span>
                      <span>{post._count.comments} comments</span>
                      <span>{new Date(post.createdAt).toLocaleDateString("th-TH")}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gifts */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#888]">ของขวัญที่รับล่าสุด</h2>
          <div className="rounded-2xl border border-[#e9e9e9] bg-white p-5">
            {giftsReceived.length === 0 ? (
              <p className="text-sm text-[#a3a3a3]">ยังไม่ได้รับของขวัญ</p>
            ) : (
              <ul className="space-y-0 divide-y divide-[#f0f0f0]">
                {giftsReceived.map(g => (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <GiftThumb giftType={g.giftType} size="sm" />
                      <div className="min-w-0">
                      <p className="text-sm font-medium capitalize text-black">{g.giftType}</p>
                      <p className="truncate text-xs text-[#737373]">จาก {g.sender.nickname ?? g.sender.username}</p>
                      </div>
                    </div>
                    <span className="shrink-0 tabular-nums text-xs font-semibold text-black">{g.coins} coins</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Transactions */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#888]">ธุรกรรมคอยน์ล่าสุด</h2>
          <div className="rounded-2xl border border-[#e9e9e9] bg-white p-5">
            {recentTx.length === 0 ? (
              <p className="text-sm text-[#a3a3a3]">ไม่มีธุรกรรมล่าสุด</p>
            ) : (
              <ul className="space-y-0 divide-y divide-[#f0f0f0]">
                {recentTx.map(tx => {
                  const isPos = tx.type === "earn" || tx.type === "gift_receive";
                  return (
                    <li key={tx.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm text-[#262626]">{tx.description}</p>
                        <p className="mt-0.5 text-xs capitalize text-[#a3a3a3]">
                          {tx.type} · {new Date(tx.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      </div>
                      <span className={`shrink-0 tabular-nums text-sm font-semibold ${isPos ? "text-black" : "text-[#525252]"}`}>
                        {isPos ? "+" : "−"}{Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function CoinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 10h6M9 14h4" />
    </svg>
  );
}
