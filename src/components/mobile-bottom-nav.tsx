"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, PlusSquare, Bell, MessageCircle, User, Video, PenLine, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { playMessageSound } from "@/lib/sounds";
import { useSidebar } from "@/lib/sidebar-store";
import { setPendingCreate } from "@/lib/pending-create";
import { useLang, t } from "@/lib/lang";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [menuBottom, setMenuBottom] = useState(80);
  const postBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    function fetchUnread() {
      fetch("/api/messages/unread-count")
        .then((r) => r.json())
        .then((d) => setUnread(d.count ?? 0))
        .catch(() => {});
    }
    function fetchUnreadNotif() {
      fetch("/api/notifications?count=unread")
        .then((r) => r.json())
        .then((d) => setUnreadNotif(d.count ?? 0))
        .catch(() => {});
    }

    fetchUnread();
    fetchUnreadNotif();

    const socket = getSocket();
    const onMsg = () => { fetchUnread(); playMessageSound(); };
    const onNotif = () => setUnreadNotif((n) => n + 1);

    socket.on("message:receive", onMsg);
    socket.on("notification:new", onNotif);
    socket.on("connect", fetchUnread);
    return () => {
      socket.off("message:receive", onMsg);
      socket.off("notification:new", onNotif);
      socket.off("connect", fetchUnread);
    };
  }, [session?.user?.id]);

  // re-fetch count on every navigation so it's always accurate
  useEffect(() => {
    setShowPostMenu(false);
    if (!session?.user?.id) return;
    if (pathname === "/notifications") {
      setUnreadNotif(0);
      return;
    }
    if (pathname.startsWith("/chat")) {
      setUnread(0);
      return;
    }
    fetch("/api/messages/unread-count")
      .then((r) => r.json())
      .then((d) => setUnread(d.count ?? 0))
      .catch(() => {});
  }, [pathname, session?.user?.id]);

  const { open } = useSidebar();
  const { lang } = useLang();
  const inChat = /^\/chat\/.+/.test(pathname);
  const profileHref = session?.user?.id ? `/profile/${session.user.id}` : "/login";

  function handleCreate(mode: "video" | "post") {
    setShowPostMenu(false);
    if (mode === "video") {
      router.push("/post/clip");
    } else {
      setPendingCreate("post");
      router.push("/board");
    }
  }

  const items: { href: string; icon: React.ElementType; label: string; badge?: number; exact: boolean; special?: boolean }[] = [
    { href: "/", icon: Home, label: t("home", lang), exact: true },
    { href: "/board", icon: PlusSquare, label: t("post", lang), exact: false, special: true },
    { href: "/notifications", icon: Bell, label: t("notifications", lang), badge: unreadNotif || undefined, exact: false },
    { href: "/chat", icon: MessageCircle, label: t("chat", lang), badge: unread || undefined, exact: false },
    { href: profileHref, icon: User, label: t("profile", lang), exact: false },
  ];

  return (
    <>
      {/* Post type menu */}
      {showPostMenu && (
        <>
          <div
            className="fixed inset-0 z-[110]"
            onClick={() => setShowPostMenu(false)}
          />
          <div
            className="fixed left-4 right-4 z-[120] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800"
            style={{ bottom: menuBottom }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("createPost", lang)}</span>
              <button onClick={() => setShowPostMenu(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
            <button
              onClick={() => handleCreate("video")}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">โพสต์คลิป</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">แชร์วิดีโอให้เพื่อนดู</p>
              </div>
            </button>
            <button
              onClick={() => handleCreate("post")}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <PenLine className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">โพสต์ธรรมดา</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">ข้อความ รูปภาพ หรือมิกซ์</p>
              </div>
            </button>
          </div>
        </>
      )}

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

              if (item.special) {
                return (
                  <button
                    key={item.label}
                    ref={postBtnRef}
                    onClick={() => {
                      if (postBtnRef.current) {
                        const rect = postBtnRef.current.getBoundingClientRect();
                        setMenuBottom(window.innerHeight - rect.top + 8);
                      }
                      setShowPostMenu((v) => !v);
                    }}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90"
                  >
                    <div className={`relative flex items-center justify-center w-10 h-9 rounded-xl transition-all duration-200 ${
                      showPostMenu
                        ? "bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_4px_14px_rgba(139,92,246,0.45)]"
                        : ""
                    }`}>
                      <Icon
                        size={20}
                        strokeWidth={showPostMenu ? 2.5 : 1.8}
                        className={showPostMenu ? "text-white" : "text-gray-400 dark:text-gray-500"}
                      />
                    </div>
                    <span className={`text-[9px] leading-tight font-medium transition-colors duration-200 ${
                      showPostMenu ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-500"
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              }

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
                        {(item.badge ?? 0) > 99 ? "99+" : item.badge}
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
    </>
  );
}
