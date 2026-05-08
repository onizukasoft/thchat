"use client";
import { useEffect, useState, useCallback } from "react";

interface Tx {
  id: string; amount: number; type: string; description: string; createdAt: string;
  user: { id: string; username: string; nickname: string | null; avatar: string | null };
}

const typeStyle: Record<string, { bg: string; color: string; label: string }> = {
  earn: { bg: "#ecfdf5", color: "#059669", label: "Earn" },
  spend: { bg: "#fef2f2", color: "#dc2626", label: "Spend" },
  gift_send: { bg: "#fef3c7", color: "#d97706", label: "Gift Send" },
  gift_receive: { bg: "#f0fdf4", color: "#16a34a", label: "Gift Rcv" },
};

export default function AdminCoinsPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback((p: number, t: string) => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(p), type: t });
    fetch(`/api/admin/coins?${q}`)
      .then(r => r.json())
      .then(d => { setTxs(d.transactions ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, type); }, [page, type, load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Coin Transactions</h2>
          <p className="mt-0.5 text-sm text-gray-500">ธุรกรรมคอยน์ทั้งหมด {total.toLocaleString()} รายการ</p>
        </div>
        <select
          className="rounded-lg bg-white px-3 py-2 text-sm text-gray-700 outline-none"
          style={{ border: "1px solid #e5e7eb" }}
          value={type}
          onChange={e => { setType(e.target.value); setPage(1); }}
        >
          <option value="">ทุกประเภท</option>
          <option value="earn">Earn</option>
          <option value="spend">Spend</option>
          <option value="gift_send">Gift Send</option>
          <option value="gift_receive">Gift Receive</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">กำลังโหลด...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((tx, i) => {
                const ts = typeStyle[tx.type] ?? { bg: "#f3f4f6", color: "#6b7280", label: tx.type };
                const isPositive = tx.type === "earn" || tx.type === "gift_receive";
                return (
                  <tr key={tx.id} className="transition-colors hover:bg-gray-50" style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : undefined }}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                          {(tx.user.nickname ?? tx.user.username).slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{tx.user.nickname ?? tx.user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: ts.bg, color: ts.color }}>
                        {ts.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold" style={{ color: isPositive ? "#059669" : "#dc2626" }}>
                        {isPositive ? "+" : "-"}{Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-sm text-gray-500 max-w-xs truncate">{tx.description}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleString("th-TH")}
                    </td>
                  </tr>
                );
              })}
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
