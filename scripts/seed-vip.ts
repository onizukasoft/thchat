import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const pkgs = [
  { id: "vip_silver", name: "VIP Silver", icon: "🥈", level: "silver", price: 9900, coins: 500_000, days: 30, features: JSON.stringify(["แสดงป้าย VIP Silver", "ไม่มีโฆษณา 30 วัน", "เหรียญ 500,000", "ฟิลเตอร์พิเศษ"]), isActive: true, sortOrder: 1 },
  { id: "vip_gold", name: "VIP Gold", icon: "🥇", level: "gold", price: 29900, coins: 2_000_000, days: 30, features: JSON.stringify(["แสดงป้าย VIP Gold", "ไม่มีโฆษณา 30 วัน", "เหรียญ 2,000,000", "ฟิลเตอร์พิเศษ", "โปรไฟล์ติดอันดับต้น"]), isActive: true, sortOrder: 2 },
  { id: "vip_diamond", name: "VIP Diamond", icon: "💎", level: "diamond", price: 59900, coins: 5_000_000, days: 30, features: JSON.stringify(["แสดงป้าย VIP Diamond", "ไม่มีโฆษณาตลอดกาล", "เหรียญ 5,000,000", "ฟิลเตอร์พิเศษทั้งหมด", "โปรไฟล์ติดอันดับต้น", "แชทก่อนใคร"]), isActive: true, sortOrder: 3 },
];

async function main() {
  for (const p of pkgs) {
    await prisma.vipPackageSetting.upsert({ where: { id: p.id }, update: {}, create: p });
    console.log(`✓ ${p.name}`);
  }
  console.log("done");
}

main().catch(console.error).finally(() => prisma.$disconnect());
