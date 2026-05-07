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
  title: "ThChat - หาเพื่อนคุย",
  description: "เว็บแชทสังคมออนไลน์ภาษาไทย หาเพื่อน พูดคุย สนุกสนาน",
  manifest: "/manifest.json",
  themeColor: "#7c3aed",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ThChat",
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
