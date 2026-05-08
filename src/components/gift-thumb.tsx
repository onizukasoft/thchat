"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { giftEmojiFallback, giftThumbUrl } from "@/lib/gift-assets";

type Props = {
  giftType: string;
  /** sm = การ์ดสรุป, md = รายการหลัก, lg = โชว์ใหญ่ */
  size?: "sm" | "md" | "lg";
  className?: string;
  imgClassName?: string;
};

const SIZE_WRAP: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-10 w-10 rounded-lg",
  md: "h-14 w-14 rounded-xl",
  lg: "h-20 w-20 rounded-2xl",
};

const SIZE_EMOJI: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
};

/**
 * แสดงรูปของขวัญจาก CDN cloud2.soichat.com — โหลดไม่ได้จะ fallback เป็น emoji
 */
export function GiftThumb({ giftType, size = "md", className, imgClassName }: Props) {
  const [broken, setBroken] = useState(false);
  const emoji = giftEmojiFallback(giftType);

  if (broken) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center leading-none",
          SIZE_WRAP[size],
          SIZE_EMOJI[size],
          className,
        )}
        aria-hidden
      >
        {emoji}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800/80",
        SIZE_WRAP[size],
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={giftThumbUrl(giftType)}
        alt=""
        className={cn("h-full w-full object-contain p-0.5 sm:p-1", imgClassName)}
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </span>
  );
}
