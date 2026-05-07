"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, Shield, ShieldOff, Trash2, Coins, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

type AdminUser = {
  id: string; username: string; nickname: string | null; email: string; avatar: string | null;
  gender: string | null; age: number | null; role: string; isBanned: boolean; isOnline: boolean;
  coins: number; createdAt: string; lastSeen: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editCoins, setEditCoins] = useState<{ id: string; value: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function toggleBan(u: AdminUser) {
    await fetch(`/api/admin/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isBanned: !u.isBanned }) });
    fetchUsers();
  }

  async function toggleAdmin(u: AdminUser) {
    const role = u.role === "admin" ? "user" : "admin";
    await fetch(`/api/admin/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    fetchUsers();
  }

  async function deleteUser(u: AdminUser) {
    if (!confirm(`ลบ ${u.nickname || u.username} จริงๆ ไหม?`)) return;
    await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    fetchUsers();
  }

  async function saveCoins() {
    if (!editCoins) return;
    await fetch(`/api/admin/users/${editCoins.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coins: Number(editCoins.value) }) });
    setEditCoins(null);
    fetchUsers();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">ผู้ใช้ทั้งหมด <span className="text-lg font-normal text-gray-500">({total})</span></h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="ค้นหา username, ชื่อ, อีเมล..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["ผู้ใช้", "อีเมล", "เพศ/อายุ", "เหรียญ", "สถานะ", "สมัครเมื่อ", "จัดการ"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">กำลังโหลด...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 ${u.isBanned ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                          {u.avatar && <img src={u.avatar} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${u.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{u.nickname || u.username}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                      {u.role === "admin" && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">Admin</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.gender === "female" ? "♀" : u.gender === "male" ? "♂" : "-"} {u.age ?? "-"}</td>
                  <td className="px-4 py-3">
                    {editCoins?.id === u.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={editCoins.value} onChange={e => setEditCoins({ id: u.id, value: e.target.value })}
                          className="w-24 border rounded px-2 py-1 text-xs" />
                        <button onClick={saveCoins} className="text-xs text-green-600 hover:underline">บันทึก</button>
                        <button onClick={() => setEditCoins(null)} className="text-xs text-gray-400 hover:underline">ยกเลิก</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditCoins({ id: u.id, value: String(u.coins) })} className="flex items-center gap-1 text-yellow-600 hover:underline">
                        <Coins className="w-3.5 h-3.5" />{u.coins.toLocaleString()}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isBanned ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                      {u.isBanned ? "แบน" : "ปกติ"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true, locale: th })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleBan(u)} title={u.isBanned ? "ปลดแบน" : "แบน"}
                        className={`p-1.5 rounded-lg transition-colors ${u.isBanned ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-red-50 text-red-500 hover:bg-red-100"}`}>
                        <ShieldOff className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleAdmin(u)} title={u.role === "admin" ? "ถอด Admin" : "ตั้งเป็น Admin"}
                        className={`p-1.5 rounded-lg transition-colors ${u.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}>
                        <Shield className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteUser(u)} title="ลบผู้ใช้"
                        className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>หน้า {page} / {pages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border hover:bg-gray-50 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded border hover:bg-gray-50 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
