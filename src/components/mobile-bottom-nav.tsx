"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, LayoutGrid, Bell, MessageCircle, User } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { useSidebar } from "@/lib/sidebar-store";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/messages/unread-count")
      .then((r) => r.json())
      .then((d) => setUnread(d.count ?? 0))
      .catch(() => {});
    const socket = getSocket();
    const onMsg = () => setUnread((n) => n + 1);
    socket.on("message:receive", onMsg);
    return () => { socket.off("message:receive", onMsg); };
  }, [session?.user?.id]);

  const { open } = useSidebar();
  const inChat = /^\/chat\/.+/.test(pathname);
  const profileHref = session?.user?.id ? `/profile/${session.user.id}` : "/login";

  const items: { href: string; icon: React.ElementType; label: string; badge?: number; exact: boolean }[] = [
    { href: "/", icon: Home, label: "หน้าหลัก", exact: true },
    { href: "/board", icon: LayoutGrid, label: "กระดาน", exact: false },
    { href: "/notifications", icon: Bell, label: "แจ้งเตือน", badge: unread || undefined, exact: false },
    { href: "/chat", icon: MessageCircle, label: "แชท", exact: false },
    { href: profileHref, icon: User, label: "โปรไฟล์", exact: false },
  ];

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] px-3 transition-transform duration-300 ease-in-out ${open || inChat ? "translate-y-full" : "translate-y-0"}`}
      style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-[0_-1px_0_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.14)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-gray-100/80 dark:border-gray-800/80">
        <div className="flex items-center h-[58px] px-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== "/";
            const isHome = item.href === "/" && pathname === "/";
            const isActive = active || isHome;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90"
              >
                <div className={`relative flex items-center justify-center w-10 h-9 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_4px_14px_rgba(79,70,229,0.45)]"
                    : ""
                }`}>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? "text-white" : "text-gray-400 dark:text-gray-500"}
                  />
                  {(item.badge ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm">
                      {(item.badge ?? 0) > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] leading-tight font-medium transition-colors duration-200 ${
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
