"use client";
import Link from "next/link";
import { XCircle } from "lucide-react";

export default function CoinsCancelPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-2xl border shadow-sm p-8 text-center space-y-5">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-700">ยกเลิกการชำระเงิน</h1>
          <p className="text-gray-400 mt-1 text-sm">ไม่มีการตัดเงินจากบัญชีของคุณ</p>
        </div>
        <div className="flex gap-3 pt-2">
          <Link href="/coins" className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors">
            ลองซื้ออีกครั้ง
          </Link>
          <Link href="/" className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
