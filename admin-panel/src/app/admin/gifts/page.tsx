"use client";
import { useEffect, useState, useCallback } from "react";
import { GiftThumb } from "@/components/gift-thumb";
import { giftEmojiFallback } from "@/lib/gift-assets";

interface Gift {
  id: string; giftType: string; coins: number; message: string | null; createdAt: string;
  sender: { id: string; username: string; nickname: string | null };
  receiver: { id: string; username: string; nickname: string | null };
}

interface GiftSummary { giftType: string; _count: number; _sum: { coins: number | null } }

const GIFT_TYPES = ["flower", "heart", "candy", "ring", "car", "diamond"] as const;

export default function AdminGiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [summary, setSummary] = useState<GiftSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback((p: number, t: string) => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(p), type: t });
    fetch(`/api/admin/gifts?${q}`)
      .then(r => r.json())
      .then(d => { setGifts(d.gifts ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); setSummary(d.summary ?? []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, type); }, [page, type, load]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gifts</h2>
        <p className="mt-0.5 text-sm text-gray-500">ของขวัญที่ส่งทั้งหมด {total.toLocaleString()} รายการ</p>
      </div>

      {/* Gift type summary */}
      {summary.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {summary.map(s => (
            <div key={s.giftType} className="rounded-xl bg-white p-4 text-center shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex justify-center">
                <GiftThumb giftType={s.giftType} size="lg" className="mx-auto" />
              </div>
              <p className="mt-1 text-xs font-semibold text-gray-900 capitalize">{s.giftType}</p>
              <p className="text-xs text-gray-400">{s._count} ครั้ง</p>
              <p className="text-xs font-medium text-amber-600">{(s._sum.coins ?? 0).toLocaleString()} coins</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <select
        className="rounded-lg bg-white px-3 py-2 text-sm text-gray-700 outline-none"
        style={{ border: "1px solid #e5e7eb" }}
        value={type}
        onChange={e => { setType(e.target.value); setPage(1); }}
      >
        <option value="">ทุกประเภท</option>
        {GIFT_TYPES.map((t) => (
          <option key={t} value={t}>
            {giftEmojiFallback(t)} {t}
          </option>
        ))}
      </select>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">กำลังโหลด...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ผู้ส่ง</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ของขวัญ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ผู้รับ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Coins</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((gift, i) => (
                <tr key={gift.id} className="transition-colors hover:bg-gray-50" style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : undefined }}>
                  <td className="px-4 py-3.5 font-medium text-gray-900">{gift.sender.nickname ?? gift.sender.username}</td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-2">
                      <GiftThumb giftType={gift.giftType} size="sm" />
                      <span className="text-sm capitalize text-gray-700">{gift.giftType}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-900">{gift.receiver.nickname ?? gift.receiver.username}</td>
                  <td className="px-4 py-3.5 font-semibold text-amber-600">{gift.coins.toLocaleString()}</td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-400">
                    {new Date(gift.createdAt).toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #f3f4f6" }}>
            <p className="text-xs text-gray-400">หน้า {page} / {pages}</p>
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
