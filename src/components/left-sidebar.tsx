"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import {
  User, Coins, Edit, Gift, Heart, Users, Package, Star,
  RefreshCw, Moon, Sun, Globe, Smartphone, Bell, LogOut, ChevronRight, Trophy, X,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { useSidebar } from "@/lib/sidebar-store";

const menuItems = [
  { icon: User, label: "โปรไฟล์ของฉัน", hrefKey: "profile" },
  { icon: Coins, label: "บัญชีเหรียญ", href: "/coins" },
  { icon: Edit, label: "แก้ไขโปรไฟล์", hrefKey: "edit" },
  { icon: Gift, label: "ของขวัญของคุณ", href: "/gifts" },
  { icon: Heart, label: "เพื่อนคนโปรด", href: "/favorites" },
  { icon: Users, label: "แชทกลุ่ม", href: "/room" },
  { icon: Package, label: "แพ็กเกจของฉัน", href: "/packages" },
  { icon: Star, label: "ซื้อแพ็กเกจ VIP", href: "/vip", highlight: true },
  { icon: Trophy, label: "รางวัล", href: "/rewards" },
];

export function LeftSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [avatar, setAvatar] = useState<string | null>(null);
  const { open, close } = useSidebar();

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/users/${session.user.id}`)
      .then((r) => r.json())
      .then((u) => setAvatar(u.avatar ?? null))
      .catch(() => {});
  }, [session?.user?.id]);

  // Close drawer on route change
  useEffect(() => { close(); }, [pathname, close]);

  function getHref(item: typeof menuItems[0]) {
    if (item.hrefKey === "profile") return session?.user?.id ? `/profile/${session.user.id}` : "/login";
    if (item.hrefKey === "edit") return session?.user?.id ? `/profile/${session.user.id}/edit` : "/login";
    return item.href ?? "/";
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar — desktop: always visible, mobile: slide-in drawer */}
      <aside className={`
        w-[220px] shrink-0 bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        flex flex-col h-screen overflow-y-auto
        md:sticky md:top-0
        fixed top-0 left-0 z-50
        transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
      {/* Logo */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-app.png" alt="ThChat" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">ThChat</span>
        </Link>
        <button
          onClick={close}
          className="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="ปิด"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User profile */}
      {session?.user ? (
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserAvatar
              src={avatar ?? session.user.image}
              fallback={session.user.name?.[0] || "U"}
              className="w-10 h-10"
              online={true}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{session.user.name}</p>
              <p className="text-xs text-gray-400 truncate">@{session.user.email?.split("@")[0]}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 border-b border-gray-100 space-y-2">
          <Link href="/login" className="block w-full text-center bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 transition-colors">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="block w-full text-center border border-blue-500 text-blue-500 rounded-lg py-2 text-sm font-medium hover:bg-blue-50 transition-colors">
            สมัครสมาชิก
          </Link>
        </div>
      )}

      {/* Main menu */}
      <nav className="flex-1 py-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const href = getHref(item);
          const active = pathname === href;
          return (
            <Link
              key={item.label}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                active ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
              } ${item.highlight ? "text-yellow-600 font-semibold" : ""}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? "text-yellow-500" : active ? "text-blue-500" : "text-gray-400"}`} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
            </Link>
          );
        })}

        {/* Divider + bottom actions */}
        <div className="border-t border-gray-100 mt-1 pt-1">
          <button onClick={() => window.location.reload()} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4 shrink-0 text-gray-400" /><span>รีเฟรช</span>
          </button>
          <button onClick={toggle} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
            {theme === "dark"
              ? <Sun className="w-4 h-4 shrink-0 text-yellow-400" />
              : <Moon className="w-4 h-4 shrink-0 text-gray-400" />}
            <span>{theme === "dark" ? "โหมดสว่าง" : "โหมดกลางคืน"}</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Globe className="w-4 h-4 shrink-0 text-gray-400" /><span>English</span>
          </button>
          <Link href="/install" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Smartphone className="w-4 h-4 shrink-0 text-gray-400" /><span>ติดตั้งแอป</span>
          </Link>
          <Link href="/announcements" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Bell className="w-4 h-4 shrink-0 text-gray-400" /><span>ประกาศ</span>
          </Link>

          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" /><span>ออกจากระบบ</span>
            </button>
          )}
        </div>
      </nav>

      <div className="px-4 py-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">เวอร์ชัน 1.0.0</p>
      </div>
    </aside>
    </>
  );
}
