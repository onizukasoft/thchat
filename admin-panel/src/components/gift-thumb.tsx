"use client";

import { useState } from "react";
import { giftEmojiFallback, giftThumbUrl } from "@/lib/gift-assets";

type Props = {
  giftType: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const wrap: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-10 w-10 rounded-lg",
  md: "h-14 w-14 rounded-xl",
  lg: "h-20 w-20 rounded-2xl",
};

const emojiSz: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
};

export function GiftThumb({ giftType, size = "md", className = "" }: Props) {
  const [broken, setBroken] = useState(false);
  const emoji = giftEmojiFallback(giftType);

  if (broken) {
    return (
      <span className={`flex shrink-0 items-center justify-center leading-none ${wrap[size]} ${emojiSz[size]} ${className}`} aria-hidden>
        {emoji}
      </span>
    );
  }

  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-gray-50 ${wrap[size]} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={giftThumbUrl(giftType)}
        alt=""
        className="h-full w-full object-contain p-0.5 sm:p-1"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </span>
  );
}
