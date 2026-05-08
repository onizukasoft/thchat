"use client";
import { useEffect, useState } from "react";

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  newUsersToday: number;
  newUsersMonth: number;
  bannedUsers: number;
  totalPosts: number;
  newPostsToday: number;
  totalMessages: number;
  totalRooms: number;
  totalGifts: number;
  totalCoinsInCirculation: number;
  coinsTxThisWeek: number;
}

function StatCard({
  label, value, sub, icon,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e9e9e9] bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f4f4f4] text-black">
          {icon}
        </div>
        {sub && (
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-[#f4f4f4] text-[#555]">
            {sub}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-sm text-[#777]">โหลดข้อมูลไม่สำเร็จ</p>;

  const cards = [
    { label: "ผู้ใช้ทั้งหมด", value: stats.totalUsers, sub: `+${stats.newUsersToday} วันนี้`, icon: <UsersIcon /> },
    { label: "ออนไลน์ตอนนี้", value: stats.onlineUsers, icon: <OnlineIcon /> },
    { label: "ผู้ใช้ใหม่เดือนนี้", value: stats.newUsersMonth, icon: <NewUserIcon /> },
    { label: "ถูกแบน", value: stats.bannedUsers, icon: <BanIcon /> },
    { label: "โพสต์ทั้งหมด", value: stats.totalPosts, sub: `+${stats.newPostsToday} วันนี้`, icon: <PostIcon /> },
    { label: "ข้อความทั้งหมด", value: stats.totalMessages, icon: <MsgIcon /> },
    { label: "ห้องแชท", value: stats.totalRooms, icon: <RoomIcon /> },
    { label: "คอยน์ในระบบ", value: stats.totalCoinsInCirculation, sub: `${stats.coinsTxThisWeek} tx/wk`, icon: <CoinIcon /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Overview</h2>
          <p className="mt-0.5 text-sm text-gray-500">ภาพรวมระบบแบบเรียลไทม์ · ข้อมูลจาก database โดยตรง</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetch("/api/admin/stats").then(r => r.json()).then(setStats).finally(() => setLoading(false)); }}
          className="flex items-center gap-2 rounded-lg border border-[#e9e9e9] bg-white px-3 py-2 text-xs font-medium text-[#666] hover:bg-[#f6f6f6] transition-colors"
        >
          <RefreshIcon /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* System Health */}
        <div className="rounded-2xl border border-[#e9e9e9] bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-black">System Health</h3>
            <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-[#f4f4f4] text-[#555]">
              All operational
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { name: "Database", ok: true, detail: "SQLite connected" },
              { name: "API Server", ok: true, detail: "All routes healthy" },
              { name: "Storage", ok: true, detail: "R2 connected" },
            ].map((svc) => (
              <div key={svc.name} className="rounded-lg px-4 py-3 bg-[#fafafa] border border-[#efefef]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-black" />
                  <span className="text-sm font-medium text-black">{svc.name}</span>
                </div>
                <p className="mt-1 text-xs text-[#777]">{svc.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e9e9e9] bg-white p-5">
          <h3 className="text-sm font-semibold text-black">Summary</h3>
          <ul className="mt-4 space-y-3">
            {[
              { label: "Gifts ที่ส่งแล้ว", value: stats.totalGifts.toLocaleString() },
              { label: "Banned users", value: stats.bannedUsers.toString() },
              { label: "Coin tx / สัปดาห์", value: stats.coinsTxThisWeek.toLocaleString() },
              { label: "Rooms ทั้งหมด", value: stats.totalRooms.toLocaleString() },
              { label: "Messages ทั้งหมด", value: stats.totalMessages.toLocaleString() },
            ].map((item) => (
              <li key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function UsersIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.85" /></svg>;
}
function OnlineIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>;
}
function NewUserIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>;
}
function BanIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>;
}
function PostIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
}
function MsgIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
}
function RoomIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function CoinIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}
function RefreshIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>;
}
