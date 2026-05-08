"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Request = {
  id: string;
  amount: number;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  createdAt: string;
  creator: {
    userId: string;
    withdrawable: number;
    user: { id: string; username: string; nickname: string | null; avatar: string | null };
  };
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  approved: "bg-green-50 text-green-700 border border-green-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "รอดำเนินการ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
};

export default function WithdrawalsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/withdrawals");
    setRequests(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setProcessing(id);
    await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: note }),
    });
    setProcessing(null);
    setExpanded(null);
    setNote("");
    load();
  }

  const pending = requests.filter((r) => r.status === "pending");
  const done = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Withdrawal Requests</h1>
        <p className="text-sm text-[#888] mt-0.5">คำขอถอนเงินจาก Creator</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#aaa] text-sm">กำลังโหลด...</div>
      ) : (
        <div className="space-y-6">
          {/* Pending */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-black">รอดำเนินการ</h2>
              {pending.length > 0 && (
                <span className="bg-yellow-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              )}
            </div>
            {pending.length === 0 ? (
              <div className="text-sm text-[#aaa] py-8 text-center bg-white rounded-xl border border-[#efefef]">
                ไม่มีคำขอที่รอดำเนินการ
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((req) => (
                  <RequestRow
                    key={req.id}
                    req={req}
                    expanded={expanded === req.id}
                    note={note}
                    processing={processing === req.id}
                    onToggle={() => { setExpanded(expanded === req.id ? null : req.id); setNote(""); }}
                    onNote={setNote}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </section>

          {/* History */}
          {done.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-black mb-3">ประวัติ</h2>
              <div className="bg-white rounded-xl border border-[#efefef] divide-y divide-[#f5f5f5]">
                {done.map((req) => (
                  <div key={req.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {req.creator.user.nickname || req.creator.user.username}
                        <span className="text-[#aaa] font-normal ml-1">@{req.creator.user.username}</span>
                      </p>
                      {req.note && <p className="text-xs text-[#999] truncate mt-0.5">{req.note}</p>}
                      {req.adminNote && <p className="text-xs text-blue-500 truncate">↳ {req.adminNote}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-black">{req.amount.toLocaleString()} เหรียญ</p>
                      <p className="text-[11px] text-[#bbb]">{format(new Date(req.createdAt), "d MMM yy", { locale: th })}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[req.status]}`}>
                      {STATUS_LABEL[req.status]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function RequestRow({
  req, expanded, note, processing, onToggle, onNote, onAction,
}: {
  req: Request;
  expanded: boolean;
  note: string;
  processing: boolean;
  onToggle: () => void;
  onNote: (v: string) => void;
  onAction: (id: string, action: "approve" | "reject") => void;
}) {
  const displayName = req.creator.user.nickname || req.creator.user.username;

  return (
    <div className="bg-white rounded-xl border border-[#efefef] overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center text-sm font-bold text-[#555] shrink-0">
          {displayName[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-black">{displayName}
            <span className="text-[#aaa] font-normal ml-1 text-xs">@{req.creator.user.username}</span>
          </p>
          {req.note && <p className="text-xs text-[#999] truncate mt-0.5">{req.note}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-black">{req.amount.toLocaleString()}</p>
          <p className="text-[11px] text-[#bbb]">เหรียญ · {format(new Date(req.createdAt), "d MMM", { locale: th })}</p>
        </div>
        <button
          onClick={onToggle}
          className="ml-2 px-3 py-1.5 text-xs font-semibold bg-black text-white rounded-lg hover:bg-[#222] transition-colors shrink-0"
        >
          {expanded ? "ยุบ" : "ดำเนินการ"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#f5f5f5] px-4 py-3 bg-[#fafafa] space-y-3">
          <input
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="หมายเหตุ (เช่น โอนแล้ว PromptPay 0812345678)"
            className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onAction(req.id, "approve")}
              disabled={processing}
              className="flex-1 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-[#222] disabled:opacity-40 transition-colors"
            >
              {processing ? "กำลังดำเนินการ..." : "✓ อนุมัติ"}
            </button>
            <button
              onClick={() => onAction(req.id, "reject")}
              disabled={processing}
              className="flex-1 py-2 bg-white text-red-600 border border-red-200 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
            >
              ✕ ปฏิเสธ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
