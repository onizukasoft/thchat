"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-3 sm:p-4 md:bottom-4 md:left-4 md:right-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4 text-purple-600" />
            </div>
            <span className="font-bold text-sm text-gray-800 dark:text-white">ThChat ใช้คุกกี้</span>
          </div>
          <button
            onClick={decline}
            className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          เราใช้คุกกี้เพื่อให้บริการทำงานได้ดีขึ้น วิเคราะห์การใช้งาน และปรับปรุงประสบการณ์ของคุณ
          อ่านเพิ่มเติมได้ที่{" "}
          <Link href="/privacy" className="text-purple-600 hover:underline">
            นโยบายความเป็นส่วนตัว
          </Link>
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={decline}
            className="flex-1 h-9 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            ปฏิเสธ
          </button>
          <button
            onClick={accept}
            className="flex-1 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-purple-200"
          >
            ยอมรับทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
}
