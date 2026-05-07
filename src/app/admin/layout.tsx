"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, FileText, Megaphone, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "ผู้ใช้", icon: Users },
  { href: "/admin/posts", label: "โพสต์", icon: FileText },
  { href: "/admin/announcements", label: "ประกาศ", icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (!session?.user?.id) return;
    fetch(`/api/users/${session.user.id}`).then(r => r.json()).then(u => {
      if (u.role !== "admin") { router.push("/"); return; }
      setRole("admin");
    });
  }, [session, status, router]);

  if (status === "loading" || role === null) {
    return <div className="flex h-screen items-center justify-center text-gray-400">กำลังตรวจสิทธิ์...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-gray-900 text-white flex flex-col transition-transform duration-200 ${sideOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <span className="font-bold text-lg text-purple-400">ThChat Admin</span>
          <button className="lg:hidden" onClick={() => setSideOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setSideOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-purple-700 text-white" : "text-gray-300 hover:bg-gray-800"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 pb-4">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800">
            <LogOut className="w-4 h-4" />ออกจากหลังบ้าน
          </Link>
        </div>
      </aside>

      {sideOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSideOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 flex items-center gap-3 px-4 h-14 shrink-0">
          <button className="lg:hidden" onClick={() => setSideOpen(true)}><Menu className="w-5 h-5 text-gray-600" /></button>
          <span className="text-sm text-gray-500">ยินดีต้อนรับ, <strong>{session?.user?.name}</strong></span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
