"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";

function pwStrength(pw: string) {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const level = score <= 2 ? "weak" : score === 3 ? "fair" : score === 4 ? "good" : "strong";
  return { checks, score, level };
}

const STRENGTH_LABEL: Record<string, { label: string; color: string; bar: string }> = {
  weak:   { label: "อ่อนแอ",   color: "text-red-500",    bar: "bg-red-400"    },
  fair:   { label: "พอใช้",    color: "text-orange-500", bar: "bg-orange-400" },
  good:   { label: "ดี",       color: "text-yellow-600", bar: "bg-yellow-400" },
  strong: { label: "แข็งแกร่ง", color: "text-green-600",  bar: "bg-green-500"  },
};

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    setTimeout(() => router.push("/login"), 2500);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-3 text-sm">ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว</p>
          <Link href="/forgot-password" className="text-sm font-medium text-gray-900 underline underline-offset-4">
            ขอลิงก์ใหม่
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">

        {!done ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            {/* Icon + heading */}
            <div className="mb-7">
              <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center mb-5">
                <KeyRound className="w-5 h-5 text-gray-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">ตั้งรหัสผ่านใหม่</h1>
              <p className="text-sm text-gray-400">ต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลขอย่างน้อย 8 ตัว</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่านใหม่"
                    required
                    minLength={8}
                    className="w-full h-11 px-3 pr-10 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all placeholder-gray-300 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (() => {
                  const { checks, score, level } = pwStrength(password);
                  const s = STRENGTH_LABEL[level];
                  return (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? s.bar : "bg-gray-100"}`} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
                        <div className="flex gap-2.5">
                          {[
                            { ok: checks.length,  label: "8+ ตัว" },
                            { ok: checks.upper,   label: "A-Z" },
                            { ok: checks.lower,   label: "a-z" },
                            { ok: checks.number,  label: "0-9" },
                          ].map(({ ok, label }) => (
                            <span key={label} className={`text-[10px] ${ok ? "text-green-600 font-semibold" : "text-gray-300"}`}>
                              {ok ? "✓" : "○"} {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Confirm */}
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  required
                  className="w-full h-11 px-3 pr-10 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all placeholder-gray-300 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-500 px-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</> : "บันทึกรหัสผ่านใหม่"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-gray-700" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">เปลี่ยนรหัสผ่านแล้ว</h2>
            <p className="text-sm text-gray-400">กำลังพาคุณไปหน้าเข้าสู่ระบบ...</p>
          </div>
        )}

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
