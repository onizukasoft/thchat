"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/theme";
import { LangProvider } from "@/lib/lang";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LangProvider>{children}</LangProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
