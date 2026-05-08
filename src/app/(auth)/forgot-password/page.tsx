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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-950 via-purple-900 to-pink-900 p-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <Link href="/login" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            กลับไปเข้าสู่ระบบ
          </Link>

          {!sent ? (
            <>
              <div className="mb-6">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-purple-300" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">ลืมรหัสผ่าน?</h1>
                <p className="text-white/60 text-sm">กรอกอีเมลของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="อีเมลของคุณ"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                  />
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังส่ง...</> : "ส่งลิงก์รีเซ็ต"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">ส่งอีเมลแล้ว!</h2>
              <p className="text-white/60 text-sm mb-6">
                ตรวจสอบอีเมล <span className="text-white font-medium">{email}</span><br />
                ลิงก์จะหมดอายุใน 1 ชั่วโมง
              </p>
              <Link href="/login" className="text-purple-300 hover:text-white text-sm transition-colors">
                กลับไปเข้าสู่ระบบ
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
