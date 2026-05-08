/**
 * รูปของขวัญจาก CDN (รูปแบบ Soichat): …/bstatic/gifts/{โฟลเดอร์}/thumb.png
 * @see https://cloud2.soichat.com/bstatic/gifts/carsnew1/thumb.png
 */
export const GIFT_CDN_BASE = "https://cloud2.soichat.com/bstatic/gifts";

/** แม็ป giftType ในระบบ → ชื่อโฟลเดอร์บน CDN */
export const GIFT_TYPE_FOLDER: Record<string, string> = {
  flower: "flowersnew1",
  heart: "heartsnew1",
  candy: "candynew1",
  ring: "ringsnew1",
  car: "carsnew1",
  diamond: "diamondsnew1",
};

export const DEFAULT_GIFT_FOLDER = "carsnew1";

export function giftThumbUrl(giftType: string): string {
  const key = giftType.toLowerCase().trim();
  if (!key) return `${GIFT_CDN_BASE}/${DEFAULT_GIFT_FOLDER}/thumb.png`;

  const folder =
    GIFT_TYPE_FOLDER[key] ??
    // ถ้าเก็บเป็นชื่อโฟลเดอร์ CDN โดยตรง เช่น carsnew2
    (/^[a-z][a-z0-9_-]*$/i.test(key) ? key : DEFAULT_GIFT_FOLDER);

  return `${GIFT_CDN_BASE}/${folder}/thumb.png`;
}

export const GIFT_EMOJI_FALLBACK: Record<string, string> = {
  flower: "🌹",
  heart: "❤️",
  candy: "🍬",
  ring: "💍",
  car: "🚗",
  diamond: "💎",
};

export function giftEmojiFallback(giftType: string): string {
  return GIFT_EMOJI_FALLBACK[giftType.toLowerCase()] ?? "🎁";
}
