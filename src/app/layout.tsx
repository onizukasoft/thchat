import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const BASE_URL = "https://thchat.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      "name": "ThChat",
      "alternateName": ["ไทยแชท", "ThChat แชทออนไลน์"],
      "url": BASE_URL,
      "description": "แชทออนไลน์ภาษาไทย หาเพื่อนคุย หาแฟน ฟรี! พูดคุยแบบเรียลไทม์ แลกเปลี่ยนของขวัญ และร่วมกิจกรรมสนุกๆ กับเพื่อนๆ ทั่วไทย",
      "inLanguage": ["th", "en"],
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${BASE_URL}/?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": "ThChat",
      "url": BASE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/logo.png`,
        "width": 512,
        "height": 512,
      },
      "sameAs": [`${BASE_URL}`],
    },
    {
      "@type": "ItemList",
      "name": "หน้าหลักของ ThChat",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "แชทออนไลน์ คุยสด หาเพื่อน", "url": `${BASE_URL}/` },
        { "@type": "ListItem", "position": 2, "name": "เข้าสู่ระบบ", "url": `${BASE_URL}/login` },
        { "@type": "ListItem", "position": 3, "name": "สมัครสมาชิกฟรี", "url": `${BASE_URL}/register` },
        { "@type": "ListItem", "position": 4, "name": "กระดาน โพสต์ข้อความ", "url": `${BASE_URL}/board` },
        { "@type": "ListItem", "position": 5, "name": "ห้องแชทกลุ่ม", "url": `${BASE_URL}/room` },
        { "@type": "ListItem", "position": 6, "name": "VIP แพ็กเกจพิเศษ", "url": `${BASE_URL}/vip` },
        { "@type": "ListItem", "position": 7, "name": "ดาวดวงเด่น อันดับสตาร์", "url": `${BASE_URL}/superstar` },
        { "@type": "ListItem", "position": 8, "name": "ติดตั้งแอป ThChat", "url": `${BASE_URL}/install` },
      ],
    },
  ],
};

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "ThChat - แชทออนไลน์ หาเพื่อนคุย หาแฟน ฟรี!",
    template: "%s | ThChat",
  },
  description: "แชทออนไลน์ภาษาไทย หาเพื่อนคุย หาแฟน ฟรี! แชทเรียลไทม์ 24 ชั่วโมง แลกเปลี่ยนของขวัญ รับเหรียญ พร้อมกิจกรรมสนุกๆ กับเพื่อนๆ ทั่วไทยใน ThChat",
  keywords: [
    "แชทออนไลน์", "แชทฟรี", "หาเพื่อนคุย", "หาแฟน", "แชทภาษาไทย",
    "คุยสด", "ห้องแชท", "thchat", "ไทยแชท", "แชทหาแฟน", "แชทหาเพื่อน",
    "chat online thai", "thai dating", "thai chat",
  ],
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
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    alternateLocale: "en_US",
    url: BASE_URL,
    siteName: "ThChat",
    title: "ThChat - แชทออนไลน์ หาเพื่อนคุย หาแฟน ฟรี!",
    description: "แชทออนไลน์ภาษาไทย หาเพื่อนคุย หาแฟน ฟรี! แชทเรียลไทม์ 24 ชั่วโมง แลกเปลี่ยนของขวัญ รับเหรียญ พร้อมกิจกรรมสนุกๆ กับเพื่อนๆ ทั่วไทยใน ThChat",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "ThChat - แชทออนไลน์ภาษาไทย" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ThChat - แชทออนไลน์ หาเพื่อนคุย หาแฟน ฟรี!",
    description: "แชทออนไลน์ภาษาไทย หาเพื่อนคุย หาแฟน ฟรี! แชทเรียลไทม์ 24 ชั่วโมง",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-[family-name:var(--font-sarabun)] bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
