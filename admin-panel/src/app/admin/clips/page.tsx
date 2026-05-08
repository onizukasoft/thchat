"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Clip = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  videoUrl: string;
  isSubscriberOnly: boolean;
  lockedPrice: number | null;
  views: number;
  createdAt: string;
  creator: {
    userId: string;
    user: { id: string; username: string; nickname: string | null };
  };
  _count: { purchases: number };
};

export default function AdminClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Clip | null>(null);

  const load = useCallback((p: number, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), search: q });
    fetch(`/api/admin/clips?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setClips(d.clips ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, query); }, [page, query, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบคลิปนี้?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/clips/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load(page, query);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black">Clips</h1>
          <p className="text-sm text-[#888] mt-0.5">คลิปทั้งหมด {total.toLocaleString()} รายการ</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อคลิป..."
            className="text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 w-52"
          />
          <button type="submit" className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-[#222]">
            ค้นหา
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-[#efefef] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f0f0f0] text-[#888] text-xs font-semibold uppercase tracking-wide">
              <th className="text-left px-4 py-3">คลิป</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Creator</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">ประเภท</th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">Views</th>
              <th className="text-right px-4 py-3 hidden lg:table-cell">ซื้อ</th>
              <th className="text-right px-4 py-3 hidden md:table-cell">วันที่</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f8f8f8]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 bg-[#f5f5f5] rounded animate-pulse w-3/4" />
                  </td>
                </tr>
              ))
            ) : clips.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#bbb] text-sm">
                  ไม่พบคลิป
                </td>
              </tr>
            ) : (
              clips.map((clip) => {
                const creator = clip.creator.user;
                const displayName = creator.nickname || creator.username;
                return (
                  <tr key={clip.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {clip.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={clip.thumbnailUrl} alt="" className="w-14 h-9 rounded object-cover shrink-0 bg-[#f0f0f0]" />
                        ) : (
                          <div className="w-14 h-9 rounded bg-[#f0f0f0] shrink-0 flex items-center justify-center text-[#bbb] text-xs">▶</div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-black truncate max-w-[180px]">{clip.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[#555]">{displayName}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {clip.lockedPrice ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          PPV {clip.lockedPrice}฿
                        </span>
                      ) : clip.isSubscriberOnly ? (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          สมาชิก
                        </span>
                      ) : (
                        <span className="bg-green-50 text-green-700 border border-green-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          ฟรี
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#555] hidden sm:table-cell">{clip.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-[#555] hidden lg:table-cell">{clip._count.purchases}</td>
                    <td className="px-4 py-3 text-right text-[#aaa] hidden md:table-cell text-xs">
                      {format(new Date(clip.createdAt), "d MMM yy", { locale: th })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreview(clip)}
                          className="text-xs text-[#555] border border-[#e5e5e5] px-2.5 py-1 rounded-lg hover:bg-[#f5f5f5] transition-colors"
                        >
                          ดู
                        </button>
                        <button
                          onClick={() => handleDelete(clip.id)}
                          disabled={deletingId === clip.id}
                          className="text-xs text-red-600 border border-red-100 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {deletingId === clip.id ? "..." : "ลบ"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg disabled:opacity-40 hover:bg-[#f5f5f5]"
          >
            ← ก่อนหน้า
          </button>
          <span className="text-sm text-[#888]">หน้า {page} / {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg disabled:opacity-40 hover:bg-[#f5f5f5]"
          >
            ถัดไป →
          </button>
        </div>
      )}

      {/* Video preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
              <p className="font-semibold text-black truncate">{preview.title}</p>
              <button onClick={() => setPreview(null)} className="text-[#aaa] hover:text-black text-xl leading-none">✕</button>
            </div>
            <video
              src={preview.videoUrl}
              controls
              autoPlay
              className="w-full aspect-video bg-black"
            />
            <div className="px-4 py-3 text-xs text-[#888] flex gap-4">
              <span>👁 {preview.views.toLocaleString()} views</span>
              <span>🛒 {preview._count.purchases} purchases</span>
              <span>📅 {format(new Date(preview.createdAt), "d MMM yyyy HH:mm", { locale: th })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
