"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navGroups = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.85" /></svg>,
      },
      {
        href: "/admin/posts",
        label: "Posts",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
      },
      {
        href: "/admin/rooms",
        label: "Chat Rooms",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
      },
    ],
  },
  {
    label: "Members",
    items: [
      {
        href: "/admin/vip",
        label: "VIP",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
      },
    ],
  },
  {
    label: "Creator",
    items: [
      {
        href: "/admin/clips",
        label: "Clips",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></svg>,
      },
      {
        href: "/admin/withdrawals",
        label: "Withdrawals",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
      },
    ],
  },
  {
    label: "Economy",
    items: [
      {
        href: "/admin/coins",
        label: "Coin Transactions",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
      },
      {
        href: "/admin/gifts",
        label: "Gifts",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>,
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        href: "/admin/partners",
        label: "Partners",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/admin/announcements",
        label: "Announcements",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
      },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [lang, setLang] = useState<"th" | "en">("th");

  const segments = pathname.replace("/admin", "").split("/").filter(Boolean);
  const crumb = segments.length > 0 ? segments[segments.length - 1] : "dashboard";

  useEffect(() => {
    fetch("/api/auth").then((r) => { if (!r.ok) router.replace("/login"); });
  }, [router]);

  useEffect(() => {
    const saved = window.localStorage.getItem("admin_lang");
    if (saved === "th" || saved === "en") setLang(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("admin_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f7f7f7]">
      <aside
        className="hidden lg:flex flex-col sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r border-[#e9e9e9] bg-white"
      >
        <div className="px-5 pt-6 pb-5 border-b border-[#efefef]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0 bg-black text-white">
              TC
            </div>
            <div>
              <p className="text-sm font-semibold text-black leading-none">ThChat</p>
              <p className="text-xs mt-0.5 text-[#7a7a7a]">{lang === "th" ? "ระบบหลังบ้าน" : "Admin Console"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
                {translateLabel(group.label, lang)}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? "bg-black text-white" : "text-[#5c5c5c] hover:bg-[#f5f5f5]"
                      }`}
                    >
                      <span className={active ? "text-white" : "text-[#9a9a9a]"}>{item.icon}</span>
                      {translateLabel(item.label, lang)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#efefef]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-[#6b6b6b] hover:bg-[#f4f4f4]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            {lang === "th" ? "ออกจากระบบ" : "Logout"}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 shrink-0 border-b border-[#e9e9e9] bg-white/90 backdrop-blur">
          <div>
            <p className="text-xs text-[#9a9a9a]">
              {lang === "th" ? "แอดมิน" : "Admin"} /&nbsp;
              {segments.map((s, i) => (
                <span key={i} className="capitalize">{s}{i < segments.length - 1 ? " / " : ""}</span>
              ))}
              {segments.length === 0 && <span>{lang === "th" ? "แดชบอร์ด" : "Dashboard"}</span>}
            </p>
            <h1 className="text-base font-semibold text-black capitalize">{crumb}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang((prev) => (prev === "th" ? "en" : "th"))}
              className="rounded-full border border-[#e2e2e2] bg-white px-3 py-1 text-xs font-semibold text-[#555] hover:bg-[#f6f6f6]"
            >
              {lang === "th" ? "TH" : "EN"}
            </button>
            <span className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-[#f5f5f5] text-[#6b6b6b]">
              <span className="h-1.5 w-1.5 rounded-full bg-black inline-block" />
              {lang === "th" ? "ระบบทำงานปกติ" : "All systems operational"}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function translateLabel(label: string, lang: "th" | "en") {
  const dict: Record<string, { th: string; en: string }> = {
    Overview: { th: "ภาพรวม", en: "Overview" },
    Dashboard: { th: "แดชบอร์ด", en: "Dashboard" },
    Community: { th: "ชุมชน", en: "Community" },
    Users: { th: "ผู้ใช้", en: "Users" },
    Posts: { th: "โพสต์", en: "Posts" },
    "Chat Rooms": { th: "ห้องแชท", en: "Chat Rooms" },
    Economy: { th: "เศรษฐกิจ", en: "Economy" },
    "Coin Transactions": { th: "ธุรกรรมเหรียญ", en: "Coin Transactions" },
    Gifts: { th: "ของขวัญ", en: "Gifts" },
    System: { th: "ระบบ", en: "System" },
    Announcements: { th: "ประกาศ", en: "Announcements" },
    Withdrawals: { th: "ถอนเงิน", en: "Withdrawals" },
    Creator: { th: "Creator", en: "Creator" },
    Clips: { th: "คลิป", en: "Clips" },
    Members: { th: "สมาชิก", en: "Members" },
    VIP: { th: "VIP", en: "VIP" },
    Business: { th: "ธุรกิจ", en: "Business" },
    Partners: { th: "หุ้นส่วน", en: "Partners" },
  };
  return dict[label]?.[lang] ?? label;
}
