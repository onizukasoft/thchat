"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Coins, Edit, Gift, Heart, Users, Package, Star,
  RefreshCw, Moon, Sun, Globe, Smartphone, Bell, LogOut, ChevronRight, Trophy, LayoutDashboard,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
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

  function getHref(item: typeof menuItems[0]) {
    if (item.hrefKey === "profile") return session?.user?.id ? `/profile/${session.user.id}` : "/login";
    if (item.hrefKey === "edit") return session?.user?.id ? `/profile/${session.user.id}/edit` : "/login";
    return item.href ?? "/";
  }

  return (
    <aside className="w-[220px] shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="ThChat" className="w-8 h-8 rounded-lg shadow-sm" />
          <span className="font-bold text-lg bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">ThChat</span>
        </Link>
      </div>

      {/* User profile */}
      {session?.user ? (
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={session.user.image || ""} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-bold">
                  {session.user.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            </div>
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
  );
}
