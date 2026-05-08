"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-950 via-purple-900 to-pink-900 p-4">
        <div className="text-center text-white">
          <p className="text-white/60 mb-4">ลิงก์ไม่ถูกต้อง</p>
          <Link href="/forgot-password" className="text-purple-300 hover:text-white text-sm">ขอลิงก์ใหม่</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-950 via-purple-900 to-pink-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {!done ? (
            <>
              <div className="mb-6">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <KeyRound className="w-7 h-7 text-purple-300" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">ตั้งรหัสผ่านใหม่</h1>
                <p className="text-white/60 text-sm">กรอกรหัสผ่านใหม่ของคุณ</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                    required
                    minLength={6}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="ยืนยันรหัสผ่านใหม่"
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
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</> : "บันทึกรหัสผ่านใหม่"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">เปลี่ยนรหัสผ่านแล้ว!</h2>
              <p className="text-white/60 text-sm">กำลังพาคุณไปหน้าเข้าสู่ระบบ...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
