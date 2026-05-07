"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Headphones, Star, Gamepad2, LayoutGrid, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function TopNavbar() {
  const pathname = usePathname();
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

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
    { href: "/notifications", label: "แจ้งเดือน", icon: Bell },
    { href: "/dj", label: "ดีเจ", icon: Headphones },
    { href: "/superstar", label: "ซุปตาร์", icon: Star },
    { href: "/games", label: "เกมส์", icon: Gamepad2 },
  ];

  return (
    <header className="bg-blue-500 text-white px-4 flex items-center gap-1 h-12 shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors relative whitespace-nowrap ${
              active
                ? "bg-white/20 text-white"
                : "text-blue-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="absolute -top-1 -right-1 bg-white text-blue-600 text-[10px] font-bold px-1 rounded-full leading-4">
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </header>
  );
}
