"use client";
import { useEffect, useState, useCallback } from "react";
import { Trash2, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

type Post = { id: string; title: string; category: string; views: number; createdAt: string; user: { username: string; nickname: string | null } };

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/posts?page=${page}&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setPosts(data.posts ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function deletePost(id: string, title: string) {
    if (!confirm(`ลบโพสต์ "${title}" จริงๆ ไหม?`)) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    fetchPosts();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">โพสต์ทั้งหมด <span className="text-lg font-normal text-gray-500">({total})</span></h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="ค้นหาหัวข้อโพสต์..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["หัวข้อ", "หมวดหมู่", "โดย", "การดู", "เผยแพร่เมื่อ", "จัดการ"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">กำลังโหลด...</td></tr>
                : posts.length === 0
                ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">ไม่พบโพสต์</td></tr>
                : posts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{p.title}</td>
                    <td className="px-4 py-3"><span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{p.category}</span></td>
                    <td className="px-4 py-3 text-gray-500">{p.user.nickname || p.user.username}</td>
                    <td className="px-4 py-3 text-gray-500 flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{p.views}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: th })}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deletePost(p.id, p.title)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
