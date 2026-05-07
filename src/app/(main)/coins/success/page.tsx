"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Coins } from "lucide-react";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    // Poll balance so it reflects the credited coins (webhook may take a moment)
    let attempts = 0;
    const poll = setInterval(() => {
      fetch("/api/coins").then((r) => r.json()).then((d) => {
        if (d.balance !== undefined) setBalance(d.balance);
      });
      if (++attempts >= 6) clearInterval(poll);
    }, 1500);
    return () => clearInterval(poll);
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-2xl border shadow-sm p-8 text-center space-y-5">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-green-700">ชำระเงินสำเร็จ!</h1>
          <p className="text-gray-500 mt-1 text-sm">เหรียญกำลังถูกเติมเข้าบัญชีของคุณ</p>
        </div>

        {balance !== null && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-center gap-2">
            <Coins className="w-5 h-5 text-yellow-600" />
            <span className="font-bold text-yellow-700 text-lg">{balance.toLocaleString()} เหรียญ</span>
            <span className="text-yellow-600 text-sm">ยอดคงเหลือ</span>
          </div>
        )}

        {sessionId && (
          <p className="text-xs text-gray-400 break-all">รหัสรายการ: {sessionId}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/coins" className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            ดูบัญชีเหรียญ
          </Link>
          <Link href="/" className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CoinsSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
