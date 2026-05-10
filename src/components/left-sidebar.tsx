"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import {
  User, Coins, Edit, Gift, Heart, Users, Package, Star,
  RefreshCw, Moon, Sun, Globe, Smartphone, Bell, LogOut, ChevronRight, Trophy, X, Check,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useEffect, useRef, useState } from "react";
import { useSidebar } from "@/lib/sidebar-store";
import { useLang, t, type Lang } from "@/lib/lang";

const menuItems = [
  { icon: User,    labelKey: "myProfile",   hrefKey: "profile" },
  { icon: Coins,   labelKey: "coinAccount", href: "/coins" },
  { icon: Edit,    labelKey: "editProfile", hrefKey: "edit" },
  { icon: Gift,    labelKey: "gifts",       href: "/gifts" },
  { icon: Heart,   labelKey: "favorites",   href: "/favorites" },
  { icon: Users,   labelKey: "groupChat",   href: "/room" },
  { icon: Package, labelKey: "myPackages",  href: "/packages" },
  { icon: Star,    labelKey: "buyVip",      href: "/vip", highlight: true },
  { icon: Trophy,  labelKey: "rewards",     href: "/rewards" },
];

const LANG_OPTIONS: { code: Lang; flag: string; label: string }[] = [
  { code: "th", flag: "🇹🇭", label: "ภาษาไทย" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

export function LeftSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLang();
  const [avatar, setAvatar] = useState<string | null>(null);
  const { open, close } = useSidebar();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/users/${session.user.id}`)
      .then((r) => r.json())
      .then((u) => setAvatar(u.avatar ?? null))
      .catch(() => {});
  }, [session?.user?.id]);

  useEffect(() => { close(); }, [pathname, close]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangPicker(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function getHref(item: typeof menuItems[0]) {
    if (item.hrefKey === "profile") return session?.user?.id ? `/profile/${session.user.id}` : "/login";
    if (item.hrefKey === "edit") return session?.user?.id ? `/profile/${session.user.id}/edit` : "/login";
    return item.href ?? "/";
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={close} />}

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
          <button onClick={close} className="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" aria-label="ปิด">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User profile */}
        {session?.user ? (
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <UserAvatar src={avatar ?? session.user.image} fallback={session.user.name?.[0] || "U"} className="w-10 h-10" online={true} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{session.user.name}</p>
                <p className="text-xs text-gray-400 truncate">@{session.user.email?.split("@")[0]}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-3 py-3 border-b border-gray-100 space-y-2">
            <Link href="/login" className="block w-full text-center bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 transition-colors">
              {t("login", lang)}
            </Link>
            <Link href="/register" className="block w-full text-center border border-blue-500 text-blue-500 rounded-lg py-2 text-sm font-medium hover:bg-blue-50 transition-colors">
              {t("register", lang)}
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
                key={item.labelKey}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                  active ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                } ${item.highlight ? "text-yellow-600 font-semibold" : ""}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? "text-yellow-500" : active ? "text-blue-500" : "text-gray-400"}`} />
                <span className="flex-1">{t(item.labelKey, lang)}</span>
                <ChevronRight className="w-3 h-3 text-gray-300" />
              </Link>
            );
          })}

          {/* Bottom actions */}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button onClick={() => window.location.reload()} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4 shrink-0 text-gray-400" />
              <span>{t("refresh", lang)}</span>
            </button>

            <button onClick={toggle} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
              {theme === "dark"
                ? <Sun className="w-4 h-4 shrink-0 text-yellow-400" />
                : <Moon className="w-4 h-4 shrink-0 text-gray-400" />}
              <span>{theme === "dark" ? t("lightMode", lang) : t("darkMode", lang)}</span>
            </button>

            {/* Language picker */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setShowLangPicker((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-4 h-4 shrink-0 text-gray-400" />
                <span className="flex-1 text-left">{t("language", lang)}</span>
                <span className="text-xs font-semibold text-gray-400 uppercase">{lang}</span>
              </button>

              {showLangPicker && (
                <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
                  {LANG_OPTIONS.map(({ code, flag, label }) => (
                    <button
                      key={code}
                      onClick={() => { setLang(code); setShowLangPicker(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-base">{flag}</span>
                      <span className="flex-1 text-left">{label}</span>
                      {lang === code && <Check className="w-4 h-4 text-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/install" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Smartphone className="w-4 h-4 shrink-0 text-gray-400" />
              <span>{t("installApp", lang)}</span>
            </Link>
            <Link href="/announcements" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Bell className="w-4 h-4 shrink-0 text-gray-400" />
              <span>{t("announcements", lang)}</span>
            </Link>

            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{t("logout", lang)}</span>
              </button>
            )}
          </div>
        </nav>

        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">{t("version", lang)} 1.0.0</p>
        </div>
      </aside>
    </>
  );
}
