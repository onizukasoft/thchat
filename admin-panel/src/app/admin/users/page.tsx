"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface User {
  id: string; username: string; nickname: string | null; email: string;
  avatar: string | null; gender: string | null; age: number | null;
  province: string | null; role: string; isBanned: boolean; isOnline: boolean;
  coins: number; vipLevel: string | null; createdAt: string; lastSeen: string;
  _count: { posts: number; sentMessages: number; receivedGifts: number };
}

const TABS = [
  { key: "user",      label: "Players",    desc: "ผู้เล่นทั่วไป",    accent: "#111111", bg: "#f3f3f3" },
  { key: "moderator", label: "Moderators", desc: "ผู้ดูแลชุมชน",    accent: "#111111", bg: "#f3f3f3" },
  { key: "admin",     label: "Admins",     desc: "แอดมินระบบ",       accent: "#111111", bg: "#f3f3f3" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminUsersPage() {
  const [tab, setTab] = useState<TabKey>("user");
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback((p: number, s: string, r: string, st: string) => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(p), search: s, role: r, status: st });
    fetch(`/api/admin/users?${q}`)
      .then((res) => res.json())
      .then((d) => { setUsers(d.users ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
    setSearch("");
    setStatus("");
  }, [tab]);

  useEffect(() => { load(page, search, tab, status); }, [page, search, tab, status, load]);

  async function toggleBan(user: User) {
    setActionLoading(user.id);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !user.isBanned }),
    });
    load(page, search, tab, status);
    setActionLoading(null);
  }

  async function changeRole(user: User, newRole: string) {
    setActionLoading(user.id + "_role");
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    load(page, search, tab, status);
    setActionLoading(null);
  }

  async function deleteUser(user: User) {
    if (!confirm(`ลบ ${user.username} ออกจากระบบ? ไม่สามารถย้อนกลับได้`)) return;
    setActionLoading(user.id + "_del");
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    load(page, search, tab, status);
    setActionLoading(null);
  }

  const currentTab = TABS.find(t => t.key === tab)!;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <p className="mt-0.5 text-sm text-gray-500">จัดการผู้ใช้งานแยกตามประเภท</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 bg-[#f3f3f3]" style={{ width: "fit-content" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={tab === t.key
              ? { background: "#ffffff", color: t.accent, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }
              : { color: "#6b7280" }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: tab === t.key ? t.accent : "#d1d5db" }}
            />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab description + count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-1 rounded-full"
            style={{ background: currentTab.accent }}
          />
          <div>
            <p className="text-sm font-semibold" style={{ color: currentTab.accent }}>{currentTab.label}</p>
            <p className="text-xs text-gray-400">{currentTab.desc} · {total.toLocaleString()} คน</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2" style={{ border: "1px solid #e5e7eb" }}>
            <SearchIcon />
            <input
              className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-40"
              placeholder={`ค้นหา${currentTab.label}...`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="rounded-lg bg-white px-3 py-2 text-sm text-gray-700 outline-none"
            style={{ border: "1px solid #e5e7eb" }}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">ทุก Status</option>
            <option value="online">Online</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white border border-[#e9e9e9]">
        {/* Tab accent bar */}
        <div className="h-0.5 w-full bg-black" />

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">กำลังโหลด...</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            ไม่พบ{currentTab.label}ที่ค้นหา
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{currentTab.label}</th>
                {tab !== "user" && (
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Role</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Coins</th>
                {tab === "user" && (
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Posts</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50" style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : undefined }}>
                  {/* User info */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-9 shrink-0">
                        {user.avatar ? (
                          <Image src={user.avatar} alt="" fill className="rounded-full object-cover" />
                        ) : (
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: "#111111" }}
                          >
                            {(user.nickname ?? user.username).slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        {user.isOnline && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-black ring-2 ring-white" />
                        )}
                      </div>
                      <div>
                        <Link href={`/admin/users/${user.id}`} className="group inline-block">
                          <p className="font-medium text-gray-900 transition group-hover:underline">
                            {user.nickname ?? user.username}
                          </p>
                          <p className="text-xs text-gray-400 transition group-hover:text-gray-600">{user.email}</p>
                        </Link>
                      </div>
                    </div>
                  </td>

                  {/* Role dropdown — only for non-player tabs */}
                  {tab !== "user" && (
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <select
                        className="rounded-full px-2.5 py-1 text-xs font-medium capitalize outline-none cursor-pointer"
                        style={{ background: currentTab.bg, color: currentTab.accent, border: "none" }}
                        value={user.role}
                        disabled={actionLoading === user.id + "_role"}
                        onChange={(e) => changeRole(user, e.target.value)}
                      >
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  )}

                  {/* Coins */}
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-sm font-medium text-gray-700">{user.coins.toLocaleString()}</span>
                    {user.vipLevel && (
                      <span className="ml-1.5 text-xs font-medium text-amber-600">VIP{user.vipLevel}</span>
                    )}
                  </td>

                  {/* Posts — player tab only */}
                  {tab === "user" && (
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-500">
                      {user._count.posts}
                    </td>
                  )}

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={user.isBanned
                        ? { background: "#f3f3f3", color: "#666" }
                        : { background: "#111111", color: "#fff" }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: user.isBanned ? "#666" : "#fff" }} />
                      {user.isBanned ? "Banned" : "Active"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="rounded border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        View
                      </Link>
                      {tab === "user" && (
                        <button
                          onClick={() => changeRole(user, "moderator")}
                          disabled={!!actionLoading}
                          className="rounded border border-[#e1e1e1] px-2.5 py-1.5 text-xs font-medium text-[#555] hover:bg-[#f6f6f6] transition-colors disabled:opacity-50 hidden md:block"
                        >
                          → Mod
                        </button>
                      )}
                      <button
                        onClick={() => toggleBan(user)}
                        disabled={actionLoading === user.id}
                        className="rounded border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                        style={user.isBanned
                          ? { borderColor: "#e1e1e1", color: "#555" }
                          : { borderColor: "#111111", color: "#111111" }}
                      >
                        {user.isBanned ? "Unban" : "Ban"}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        disabled={actionLoading === user.id + "_del"}
                        className="rounded border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #f3f4f6" }}>
            <p className="text-xs text-gray-400">หน้า {page} / {pages} · {total.toLocaleString()} รายการ</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40">← ก่อนหน้า</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="rounded border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40">ถัดไป →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
