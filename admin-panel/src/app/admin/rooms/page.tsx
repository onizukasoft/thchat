"use client";
import { useEffect, useState, useCallback } from "react";

interface Room {
  id: string; name: string; description: string | null; isPublic: boolean; createdAt: string;
  _count: { members: number; messages: number };
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback((p: number, s: string) => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(p), search: s });
    fetch(`/api/admin/rooms?${q}`)
      .then(r => r.json())
      .then(d => { setRooms(d.rooms ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, search); }, [page, search, load]);

  async function deleteRoom(room: Room) {
    if (!confirm(`ลบห้อง "${room.name}"? ข้อความในห้องทั้งหมดจะหายด้วย`)) return;
    setActionLoading(room.id);
    await fetch("/api/admin/rooms", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: room.id }),
    });
    load(page, search);
    setActionLoading(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat Rooms</h2>
          <p className="mt-0.5 text-sm text-gray-500">ห้องแชทในระบบ {total.toLocaleString()} ห้อง</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 max-w-sm" style={{ border: "1px solid #e5e7eb" }}>
        <SearchIcon />
        <input
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
          placeholder="ค้นหาชื่อห้อง..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-200" />)
        ) : rooms.map((room) => (
          <div key={room.id} className="rounded-xl bg-white p-5 shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: room.isPublic ? "#eff6ff" : "#f5f3ff" }}>
                  <RoomIcon color={room.isPublic ? "#2563eb" : "#7c3aed"} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 leading-snug">{room.name}</p>
                  <span
                    className="text-xs font-medium rounded-full px-1.5 py-0.5"
                    style={room.isPublic
                      ? { background: "#eff6ff", color: "#2563eb" }
                      : { background: "#f5f3ff", color: "#7c3aed" }}
                  >
                    {room.isPublic ? "Public" : "Private"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteRoom(room)}
                disabled={actionLoading === room.id}
                className="rounded border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>

            {room.description && (
              <p className="mt-3 text-xs text-gray-500 line-clamp-2">{room.description}</p>
            )}

            <div className="mt-4 flex gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{room._count.members.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Members</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{room._count.messages.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Messages</p>
              </div>
              <div className="text-center text-xs text-gray-400 self-end ml-auto">
                {new Date(room.createdAt).toLocaleDateString("th-TH")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">หน้า {page} / {pages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40">← ก่อนหน้า</button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="rounded border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40">ถัดไป →</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function RoomIcon({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
