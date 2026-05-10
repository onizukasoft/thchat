"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

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

function calcAge(dob: string): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : undefined;
}

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dob, setDob] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const age = calcAge(dob);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (age === undefined || age < 18) {
      setError("ต้องมีอายุ 18 ปีขึ้นไปจึงจะสมัครได้");
      setLoading(false);
      return;
    }

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        email,
        password,
        nickname: form.get("nickname"),
        gender: form.get("gender"),
        age,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "เกิดข้อผิดพลาด");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: `/register/avatar?uid=${data.id}`,
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — decoration */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 p-10 text-white">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ThChat" className="w-9 h-9 object-contain" />
          <span className="font-bold text-lg tracking-tight">ThChat</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-snug mb-3">เชื่อมต่อกับคนรอบข้าง<br />ได้ทุกที่ทุกเวลา</h2>
          <p className="text-white/70 text-sm leading-relaxed">แชท แชร์ และสร้างความสัมพันธ์ใหม่ๆ<br />ในชุมชนที่อบอุ่นของเรา</p>
        </div>
        <p className="text-white/40 text-xs">© 2026 ThChat</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-5 bg-[#fafafa]">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-7 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ThChat" className="w-16 h-16 object-contain mb-2" />
            <span className="font-bold text-xl text-purple-700">ThChat</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">สมัครสมาชิก</h1>
          <p className="text-sm text-gray-400 mb-6">กรอกข้อมูลเพื่อสร้างบัญชีใหม่</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username + Nickname */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">ชื่อผู้ใช้ *</label>
                <input
                  name="username"
                  placeholder="username"
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-300 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">ชื่อที่แสดง</label>
                <input
                  name="nickname"
                  placeholder="ชื่อเล่น"
                  maxLength={30}
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-300 bg-white transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">อีเมล *</label>
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                required
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-300 bg-white transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">รหัสผ่าน *</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 pr-10 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-300 bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
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

            {/* Gender + DOB */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">เพศ</label>
                <select
                  name="gender"
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-300 bg-white transition appearance-none"
                >
                  <option value="other">ไม่ระบุ</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  วันเกิด <span className="text-red-500">*</span>
                  {age !== undefined && (
                    <span className={`ml-1.5 font-bold ${age < 18 ? "text-red-500" : "text-purple-600"}`}>
                      ({age} ปี{age < 18 ? " — ต้องอายุ 18+" : ""})
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                  required
                  className={`w-full h-10 px-3 text-sm border rounded-xl outline-none focus:ring-2 bg-white transition ${age !== undefined && age < 18 ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-purple-300"}`}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2.5 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || age === undefined || age < 18}
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-purple-200 mt-1"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  กำลังสมัคร...
                </>
              ) : "สมัครสมาชิก"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            มีบัญชีแล้ว?{" "}
            <Link href="/login" className="text-purple-600 hover:underline font-semibold">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
