import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f7]">
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-2xl p-8 bg-white border border-[#e9e9e9]">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-[#f4f4f4] text-[#666]">
            <span className="h-1.5 w-1.5 rounded-full bg-black inline-block" />
            ThChat Platform
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-black">
            Admin Panel
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#666]">
            ระบบจัดการหลังบ้านของ ThChat — ใช้สำหรับแอดมินและทีมงานเท่านั้น
            เข้าถึงได้เฉพาะผู้ที่ได้รับสิทธิ์
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl p-4 bg-[#fafafa] border border-[#efefef]">
            {[
              { label: "Users", value: "12.5K" },
              { label: "Posts", value: "89K" },
              { label: "Online", value: "534" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-black">{s.value}</p>
                <p className="text-xs mt-0.5 text-[#777]">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 bg-black"
            >
              เข้า Dashboard
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <span className="rounded-full px-3 py-1.5 text-xs font-medium bg-[#f4f4f4] text-[#777]">
              v0.1 beta
            </span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[#888]">
          ThChat Administration · Restricted Access
        </p>
      </div>
    </main>
  );
}
