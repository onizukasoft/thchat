"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "th" | "en";

type LangContextType = { lang: Lang; setLang: (l: Lang) => void };

const LangContext = createContext<LangContextType>({ lang: "th", setLang: () => {} });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("th");

  useEffect(() => {
    const saved = localStorage.getItem("app_lang");
    if (saved === "th" || saved === "en") {
      setLangState(saved);
      document.documentElement.lang = saved === "en" ? "en" : "th";
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("app_lang", l);
    document.documentElement.lang = l === "en" ? "en" : "th";
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

// ─── Translations ───────────────────────────────────────────────────────────

const dict: Record<string, { th: string; en: string }> = {
  // Sidebar menu
  myProfile:       { th: "โปรไฟล์ของฉัน",    en: "My Profile" },
  coinAccount:     { th: "บัญชีเหรียญ",        en: "Coin Account" },
  editProfile:     { th: "แก้ไขโปรไฟล์",      en: "Edit Profile" },
  gifts:           { th: "ของขวัญของคุณ",      en: "Your Gifts" },
  favorites:       { th: "เพื่อนคนโปรด",       en: "Friends" },
  groupChat:       { th: "แชทกลุ่ม",           en: "Group Chat" },
  myPackages:      { th: "แพ็กเกจของฉัน",     en: "My Packages" },
  buyVip:          { th: "ซื้อแพ็กเกจ VIP",   en: "Buy VIP" },
  rewards:         { th: "รางวัล",             en: "Rewards" },
  refresh:         { th: "รีเฟรช",             en: "Refresh" },
  darkMode:        { th: "โหมดกลางคืน",       en: "Dark Mode" },
  lightMode:       { th: "โหมดสว่าง",          en: "Light Mode" },
  language:        { th: "ภาษา",              en: "Language" },
  installApp:      { th: "ติดตั้งแอป",         en: "Install App" },
  announcements:   { th: "ประกาศ",             en: "Announcements" },
  logout:          { th: "ออกจากระบบ",         en: "Log Out" },
  login:           { th: "เข้าสู่ระบบ",        en: "Log In" },
  register:        { th: "สมัครสมาชิก",        en: "Register" },
  // Bottom nav
  home:            { th: "หน้าหลัก",           en: "Home" },
  post:            { th: "โพสต์",              en: "Post" },
  notifications:   { th: "แจ้งเตือน",          en: "Alerts" },
  chat:            { th: "แชท",               en: "Chat" },
  profile:         { th: "โปรไฟล์",            en: "Profile" },
  // Post menu
  createPost:      { th: "สร้างโพสต์",         en: "Create Post" },
  uploadClip:      { th: "อัปโหลดคลิป",        en: "Upload Clip" },
  // Common
  online:          { th: "ออนไลน์",            en: "Online" },
  offline:         { th: "ออฟไลน์",            en: "Offline" },
  search:          { th: "ค้นหา",              en: "Search" },
  cancel:          { th: "ยกเลิก",             en: "Cancel" },
  save:            { th: "บันทึก",             en: "Save" },
  back:            { th: "กลับ",               en: "Back" },
  version:         { th: "เวอร์ชัน",           en: "Version" },
};

export function t(key: string, lang: Lang): string {
  return dict[key]?.[lang] ?? dict[key]?.th ?? key;
}
