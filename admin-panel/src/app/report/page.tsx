"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Payment = { id: string; amount: number; note: string | null; createdAt: string };
type Partner = {
  id: string;
  name: string;
  email: string | null;
  sharePercent: number;
  totalPaid: number;
  bankAccount: string | null;
  bankName: string | null;
  payments: Payment[];
};
type Stats = {
  totalUsers: number;
  totalCoinsBought: number;
  totalVipRevenue: number;
};

export default function PartnerReportPage() {
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/partner")
      .then(async (r) => {
        if (r.status === 401) { router.replace("/login"); return; }
        const data = await r.json();
        setPartner(data.partner);
        setStats(data.stats);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-sm text-[#aaa]">กำลังโหลด...</div>
      </div>
    );
  }

  if (!partner || !stats) return null;

  const estimatedShare = (stats.totalCoinsBought * partner.sharePercent) / 100;
  const remaining = estimatedShare - partner.totalPaid;

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <header className="bg-white border-b border-[#e9e9e9] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-white text-xs font-bold">TC</div>
          <div>
            <p className="text-sm font-semibold text-black leading-none">ThChat</p>
            <p className="text-xs text-[#888] mt-0.5">รายงานหุ้นส่วน</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-black">{partner.name}</span>
          <button
            onClick={logout}
            className="text-xs text-[#888] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#e5e5e5] hover:bg-[#f5f5f5]"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-black">สวัสดี, {partner.name}</h1>
          <p className="text-sm text-[#888] mt-1">ข้อมูลสัดส่วนและรายรับของคุณใน ThChat</p>
        </div>

        {/* Share info */}
        <div className="bg-black rounded-2xl p-5 text-white">
          <p className="text-sm text-white/60 mb-1">สัดส่วนหุ้น</p>
          <p className="text-5xl font-bold">{partner.sharePercent}%</p>
          {partner.bankName && (
            <p className="text-sm text-white/50 mt-3">
              {partner.bankName} · {partner.bankAccount ?? "-"}
            </p>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="ผู้ใช้ทั้งหมด" value={stats.totalUsers.toLocaleString()} unit="คน" />
          <StatCard label="เหรียญที่ขายได้" value={stats.totalCoinsBought.toLocaleString()} unit="เหรียญ" />
        </div>

        {/* Revenue breakdown */}
        <div className="bg-white rounded-2xl border border-[#efefef] divide-y divide-[#f5f5f5]">
          <div className="px-5 py-4">
            <p className="text-xs text-[#999] font-medium uppercase tracking-wider mb-3">สัดส่วนรายรับของคุณ</p>
            <div className="space-y-3">
              <RevenueRow label="รายรับแพลตฟอร์ม (เหรียญขาย)" value={stats.totalCoinsBought} />
              <RevenueRow
                label={`ส่วนแบ่งของคุณ (${partner.sharePercent}%)`}
                value={estimatedShare}
                highlight
              />
              <RevenueRow label="จ่ายแล้ว" value={partner.totalPaid} sub />
              <div className="pt-2 border-t border-[#f0f0f0]">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-black">คงเหลือ (ยังไม่จ่าย)</span>
                  <span className={`text-base font-bold ${remaining > 0 ? "text-green-600" : "text-[#aaa]"}`}>
                    ฿{remaining.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div className="bg-white rounded-2xl border border-[#efefef] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f5f5f5]">
            <p className="text-xs text-[#999] font-medium uppercase tracking-wider">ประวัติการรับเงิน</p>
          </div>
          {partner.payments.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#bbb]">ยังไม่มีประวัติการรับเงิน</div>
          ) : (
            <div className="divide-y divide-[#f8f8f8]">
              {partner.payments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-black">
                      ฿{pay.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {pay.note && <p className="text-xs text-[#999] mt-0.5">{pay.note}</p>}
                  </div>
                  <p className="text-xs text-[#bbb]">
                    {format(new Date(pay.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#ccc] pb-4">
          ข้อมูล ณ วันที่ {format(new Date(), "d MMMM yyyy", { locale: th })}
        </p>
      </main>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#efefef] p-4">
      <p className="text-xs text-[#999] mb-1">{label}</p>
      <p className="text-xl font-bold text-black">{value}</p>
      <p className="text-xs text-[#bbb] mt-0.5">{unit}</p>
    </div>
  );
}

function RevenueRow({ label, value, highlight, sub }: { label: string; value: number; highlight?: boolean; sub?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${sub ? "text-[#999] pl-3" : "text-[#555]"}`}>{sub ? "↳ " : ""}{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-black" : sub ? "text-[#999]" : "text-[#555]"}`}>
        ฿{value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}
