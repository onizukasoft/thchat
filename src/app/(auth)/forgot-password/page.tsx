"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-sm flex flex-col">

        {/* Logo */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ThChat" className="w-50 h-50 object-contain mx-auto mb-0" />
          <p className="text-gray-500 text-sm mt-1">หาเพื่อน พูดคุย สนุกสนาน</p>
        </div>

        {!sent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Link>

            <h2 className="text-lg font-semibold text-gray-800 mb-1">ลืมรหัสผ่าน</h2>
            <p className="text-sm text-gray-400 mb-6">กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์รีเซ็ตให้</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">อีเมล</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังส่ง...</> : "ส่งลิงก์รีเซ็ต"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">ส่งอีเมลแล้ว!</h2>
            <p className="text-sm text-gray-500 mb-1">ตรวจสอบกล่องข้อความของ</p>
            <p className="text-sm font-medium text-gray-800 mb-1">{email}</p>
            <p className="text-xs text-gray-400 mb-6">ลิงก์หมดอายุใน 1 ชั่วโมง</p>
            <Link href="/login" className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
              กลับไปเข้าสู่ระบบ
            </Link>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          จำรหัสผ่านได้แล้ว?{" "}
          <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
            เข้าสู่ระบบ
          </Link>
        </p>

      </div>
    </div>
  );
}
