"use client";
import { useEffect } from "react";

declare global {
  interface Window { adsbygoogle: unknown[] }
}

type AdFormat = "auto" | "rectangle" | "vertical" | "horizontal";

type Props = {
  slot: string;
  format?: AdFormat;
  responsive?: boolean;
  className?: string;
};

export function AdBanner({ slot, format = "auto", responsive = true, className = "" }: Props) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  if (!publisherId) return null;

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
