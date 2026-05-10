export const COIN_PACKAGES = [
  { id: "c200k",   coins: 200_000,      bonus: 0,           price: 2000,    label: "200,000" },
  { id: "c500k",   coins: 500_000,      bonus: 100_000,     price: 5000,    label: "500,000" },
  { id: "c1m",     coins: 1_000_000,    bonus: 200_000,     price: 10000,   label: "1,000,000" },
  { id: "c2m",     coins: 2_000_000,    bonus: 300_000,     price: 20000,   label: "2,000,000" },
  { id: "c3m",     coins: 3_000_000,    bonus: 700_000,     price: 30000,   label: "3,000,000" },
  { id: "c5m",     coins: 5_000_000,    bonus: 1_500_000,   price: 50000,   label: "5,000,000" },
  { id: "c10m",    coins: 10_000_000,   bonus: 3_300_000,   price: 100000,  label: "10,000,000" },
  { id: "c30m",    coins: 30_000_000,   bonus: 11_000_000,  price: 300000,  label: "30,000,000" },
  { id: "c50m",    coins: 50_000_000,   bonus: 20_000_000,  price: 500000,  label: "50,000,000" },
  { id: "c100m",   coins: 100_000_000,  bonus: 50_000_000,  price: 1000000, label: "100,000,000" },
] as const;

export type CoinPackageId = typeof COIN_PACKAGES[number]["id"];

export const VIP_PACKAGES = [
  {
    id: "vip_silver",
    name: "VIP Silver",
    icon: "🥈",
    level: "silver",
    price: 9900,
    coins: 500_000,
    days: 30,
    color: "from-gray-400 to-gray-500",
    features: ["แสดงป้าย VIP Silver", "ไม่มีโฆษณา 30 วัน", "เหรียญ 500,000", "ฟิลเตอร์พิเศษ"],
    popular: false,
  },
  {
    id: "vip_gold",
    name: "VIP Gold",
    icon: "🥇",
    level: "gold",
    price: 29900,
    coins: 2_000_000,
    days: 30,
    color: "from-yellow-400 to-orange-500",
    features: ["แสดงป้าย VIP Gold", "ไม่มีโฆษณา 30 วัน", "เหรียญ 2,000,000", "ฟิลเตอร์พิเศษ", "โปรไฟล์ติดอันดับต้น"],
    popular: true,
  },
  {
    id: "vip_diamond",
    name: "VIP Diamond",
    icon: "💎",
    level: "diamond",
    price: 59900,
    coins: 5_000_000,
    days: 30,
    color: "from-blue-400 to-purple-600",
    features: ["แสดงป้าย VIP Diamond", "ไม่มีโฆษณาตลอดกาล", "เหรียญ 5,000,000", "ฟิลเตอร์พิเศษทั้งหมด", "โปรไฟล์ติดอันดับต้น", "แชทก่อนใคร"],
    popular: false,
  },
] as const;

export type VipPackageId = typeof VIP_PACKAGES[number]["id"];

// ข้อกำหนดสิทธิ์ตามระดับ VIP
export const PACKAGE_LIMITS = {
  free: {
    chatPerDay: 5,
    chatPhotos: 0,
    chatVideos: 0,
    profilePhotos: 1,
    pinPosts: 0,
    coinSpinMinutes: 0,
    dailyCoins: 0,
    maxPendingFriendRequests: 10,
    label: "ฟรี",
  },
  vip_basic: {
    chatPerDay: 50,
    chatPhotos: 300,
    chatVideos: 40,
    profilePhotos: 30,
    pinPosts: 5,
    coinSpinMinutes: 55,
    dailyCoins: 5000,
    maxPendingFriendRequests: 30,
    label: "VIP BASIC",
  },
  silver: {
    chatPerDay: 100,
    chatPhotos: 500,
    chatVideos: 80,
    profilePhotos: 50,
    pinPosts: 10,
    coinSpinMinutes: 40,
    dailyCoins: 10000,
    maxPendingFriendRequests: 50,
    label: "VIP Silver",
  },
  gold: {
    chatPerDay: 200,
    chatPhotos: 1000,
    chatVideos: 200,
    profilePhotos: 100,
    pinPosts: 15,
    coinSpinMinutes: 25,
    dailyCoins: 20000,
    maxPendingFriendRequests: 100,
    label: "VIP Gold",
  },
  diamond: {
    chatPerDay: 99999,
    chatPhotos: 99999,
    chatVideos: 99999,
    profilePhotos: 99999,
    pinPosts: 99999,
    coinSpinMinutes: 10,
    dailyCoins: 100000,
    maxPendingFriendRequests: 9999,
    label: "VIP Diamond",
  },
} as const;

export type PackageLevel = keyof typeof PACKAGE_LIMITS;

export function getPackageLimits(vipLevel: string | null | undefined, vipUntil: Date | string | null | undefined) {
  const isActive = vipUntil ? new Date(vipUntil) > new Date() : false;
  if (!isActive || !vipLevel) return PACKAGE_LIMITS.free;
  const key = vipLevel.toLowerCase().replace(/\s/g, "_").replace("vip_", "") as PackageLevel;
  return (PACKAGE_LIMITS as any)[key] ?? PACKAGE_LIMITS.free;
}

export const ADDON_PACKAGES = [
  {
    id: "addon_boost",
    name: "โบนัสเหรียญ 7 วัน",
    icon: "⚡",
    price: 4900,
    desc: "รับเหรียญโบนัสจากทุกกิจกรรม +50% เป็นเวลา 7 วัน",
  },
  {
    id: "addon_gift",
    name: "กล่องสุ่มของขวัญ",
    icon: "🎁",
    price: 1900,
    desc: "สุ่มรับของขวัญพิเศษจากกล่องลึกลับ",
  },
  {
    id: "addon_frame",
    name: "กรอบโปรไฟล์พิเศษ",
    icon: "🖼️",
    price: 2900,
    desc: "กรอบโปรไฟล์แอนิเมชันพิเศษ 30 วัน",
  },
] as const;
