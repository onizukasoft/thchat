"use client";
import { useEffect, useState, useCallback } from "react";

interface Post {
  id: string; title: string; category: string; views: number; isPinned: boolean; createdAt: string;
  user: { id: string; username: string; nickname: string | null };
  _count: { comments: number };
}

const categoryColors: Record<string, { bg: string; color: string }> = {
  general: { bg: "#f3f3f3", color: "#666666" },
  activity: { bg: "#f3f3f3", color: "#666666" },
  food: { bg: "#f3f3f3", color: "#666666" },
  sale: { bg: "#f3f3f3", color: "#666666" },
  spam: { bg: "#f3f3f3", color: "#666666" },
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback((p: number, s: string) => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(p), search: s });
    fetch(`/api/admin/posts?${q}`)
      .then(r => r.json())
      .then(d => { setPosts(d.posts ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, search); }, [page, search, load]);

  async function togglePin(post: Post) {
    setActionLoading(post.id + "_pin");
    await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !post.isPinned }),
    });
    load(page, search);
    setActionLoading(null);
  }

  async function deletePost(post: Post) {
    if (!confirm(`ลบโพสต์ "${post.title}"? ไม่สามารถย้อนกลับได้`)) return;
    setActionLoading(post.id + "_del");
    await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
    load(page, search);
    setActionLoading(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Posts</h2>
          <p className="mt-0.5 text-sm text-gray-500">โพสต์ทั้งหมด {total.toLocaleString()} รายการ</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 max-w-sm" style={{ border: "1px solid #e5e7eb" }}>
        <SearchIcon />
        <input
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
          placeholder="ค้นหาชื่อโพสต์..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white border border-[#e9e9e9]">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">กำลังโหลด...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">โพสต์</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Views</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Comments</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">วันที่</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => {
                const cs = categoryColors[post.category] ?? categoryColors.general;
                return (
                  <tr key={post.id} className="transition-colors hover:bg-gray-50" style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : undefined }}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-start gap-2">
                        {post.isPinned && (
                          <span className="mt-0.5 shrink-0 text-black">
                            <PinIcon />
                          </span>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 leading-snug line-clamp-1">{post.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">โดย {post.user.nickname ?? post.user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="rounded px-2 py-0.5 text-xs font-medium capitalize" style={{ background: cs.bg, color: cs.color }}>
                        {post.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-500">{post.views.toLocaleString()}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-500">{post._count.comments}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => togglePin(post)}
                          disabled={actionLoading === post.id + "_pin"}
                          className="rounded border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                          style={post.isPinned
                            ? { borderColor: "#111111", color: "#111111" }
                            : { borderColor: "#e5e7eb", color: "#6b7280" }}
                        >
                          {post.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={() => deletePost(post)}
                          disabled={actionLoading === post.id + "_del"}
                          className="rounded border border-[#e1e1e1] px-2.5 py-1.5 text-xs font-medium text-[#555] hover:bg-[#f6f6f6] transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

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
function PinIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>;
}
