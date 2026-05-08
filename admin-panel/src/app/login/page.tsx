"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      const d = await res.json();
      setError(d.error ?? "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{ background: "linear-gradient(135deg,#0f1117 0%,#1a1030 50%,#0f1117 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "#7c3aed" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center gap-2.5 mb-6">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              TC
            </div>
            <div>
              <p className="text-sm font-semibold text-white">ThChat Admin</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>Backoffice Login</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#9ca3af" }}>
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            {error && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#fef2f2", color: "#dc2626" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
