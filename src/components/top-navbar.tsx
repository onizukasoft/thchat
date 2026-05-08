"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Headphones, Star, Gamepad2, LayoutGrid, Users, Film, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { useSidebar } from "@/lib/sidebar-store";

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function TopNavbar() {
  const pathname = usePathname();
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const { toggle } = useSidebar();

  useEffect(() => {
    fetch("/api/online-count")
      .then((r) => r.json())
      .then((d) => setOnlineCount(d.count))
      .catch(() => {});

    const socket = getSocket();
    const handler = (ids: string[]) => setOnlineCount(ids.length);
    socket.on("users:online", handler);
    return () => { socket.off("users:online", handler); };
  }, []);

  const tabs = [
    { href: "/board", label: "กระดาน", icon: LayoutGrid },
    { href: "/", label: "ออนไลน์", icon: Users, badge: onlineCount !== null ? formatCount(onlineCount) : null },
    { href: "/notifications", label: "แจ้งเตือน", icon: Bell },
    { href: "/clips", label: "คลิป", icon: Film },
    { href: "/dj", label: "ดีเจ", icon: Headphones },
    { href: "/superstar", label: "ซุปตาร์", icon: Star },
    { href: "/games", label: "เกมส์", icon: Gamepad2 },
  ];

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 text-white flex items-center h-13 shrink-0 shadow-md">
      {/* Hamburger: mobile only */}
      <button
        onClick={toggle}
        className="md:hidden flex items-center justify-center w-11 h-full shrink-0 hover:bg-white/10 transition-colors"
        aria-label="เมนู"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Tabs */}
      <div className="flex-1 flex items-center h-full sm:overflow-x-auto sm:scrollbar-hide sm:gap-1 sm:px-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex-1 sm:flex-none sm:shrink-0 h-full flex flex-col sm:flex-row items-center justify-center transition-all duration-200 active:opacity-60"
            >
              {/* Mobile active indicator */}
              <span className={`absolute bottom-0 left-[20%] right-[20%] h-[3px] rounded-t-full transition-all duration-200 sm:hidden ${active ? "bg-white" : "bg-transparent"}`} />

              {/* Icon container */}
              <div className={`relative flex items-center justify-center sm:gap-1.5 sm:px-3 sm:py-2 sm:rounded-xl transition-all duration-200 ${
                active
                  ? "text-white sm:bg-white/20 sm:shadow-inner"
                  : "text-white/55 hover:text-white/90 sm:hover:bg-white/10"
              }`}>
                <Icon className={`w-[19px] h-[19px] shrink-0 transition-transform duration-200 ${active ? "scale-110" : ""}`} />
                <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">{tab.label}</span>
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 sm:top-0.5 sm:right-0.5 bg-emerald-400 text-white text-[9px] font-bold min-w-[14px] h-3.5 flex items-center justify-center rounded-full px-0.5 leading-none shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Mobile label */}
              <span className={`text-[9px] sm:hidden leading-none font-medium mt-0.5 transition-all duration-200 ${active ? "text-white" : "text-white/50"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
