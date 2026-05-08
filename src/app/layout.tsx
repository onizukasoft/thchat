import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "ThChat - แชท หาเพื่อนคุย หาแฟน ออนไลน์ฟรี!",
  description: "แชท หาเพื่อนคุย หาแฟน ฟรี! แชทออนไลน์ 24 ชั่วโมง พูดคุย แลกเปลี่ยน รับเหรียญ พร้อมกิจกรรมสนุกๆ กับเพื่อนๆ ใน ThChat",
  keywords: ["แชท", "chat", "หาเพื่อนคุย", "หาแฟน", "แชทออนไลน์", "ห้องแชท", "คุยออนไลน์", "thchat", "ไทยแชท"],
  manifest: "/manifest.json",
  themeColor: "#7c3aed",
  icons: {
    icon: "/icon-app.png",
    apple: "/icon-app.png",
    shortcut: "/icon-app.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ThChat",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    alternateLocale: "en_US",
    url: "https://thchat.com",
    siteName: "ThChat",
    title: "ThChat - แชท หาเพื่อนคุย หาแฟน ออนไลน์ฟรี!",
    description: "แชท หาเพื่อนคุย หาแฟน ฟรี! แชทออนไลน์ 24 ชั่วโมง พูดคุย แลกเปลี่ยน รับเหรียญ พร้อมกิจกรรมสนุกๆ กับเพื่อนๆ ใน ThChat",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "ThChat - แชทออนไลน์ภาษาไทย",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ThChat - แชท หาเพื่อนคุย หาแฟน ออนไลน์ฟรี!",
    description: "แชท หาเพื่อนคุย หาแฟน ฟรี! แชทออนไลน์ 24 ชั่วโมง พูดคุย แลกเปลี่ยน รับเหรียญ พร้อมกิจกรรมสนุกๆ กับเพื่อนๆ ใน ThChat",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="font-[family-name:var(--font-sarabun)] bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
