import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/thchat.db" });
const prisma = new PrismaClient({ adapter } as any);

// จุดกลางของแต่ละจังหวัด (lat, lng)
const PROVINCE_COORDS: Record<string, [number, number]> = {
  "กรุงเทพมหานคร": [13.7563, 100.5018],
  "เชียงใหม่":      [18.7883,  98.9853],
  "ภูเก็ต":         [ 7.8804,  98.3923],
  "ขอนแก่น":        [16.4419, 102.8360],
  "ชลบุรี":         [13.3611, 100.9847],
  "เชียงราย":       [19.9105,  99.8406],
  "นครราชสีมา":    [14.9799, 102.0978],
  "อุดรธานี":       [17.4138, 102.7872],
  "สุราษฎร์ธานี":   [ 9.1382,  99.3214],
  "สงขลา":          [ 7.1895, 100.5950],
  "ลำปาง":          [18.2888,  99.4930],
  "พิษณุโลก":      [16.8213, 100.2659],
  "นนทบุรี":        [13.8591, 100.5216],
  "กาญจนบุรี":      [14.0020,  99.5470],
  "ระยอง":          [12.6814, 101.2816],
  "สมุทรปราการ":   [13.5991, 100.5998],
};

function jitter(coord: [number, number], radiusKm = 15): [number, number] {
  const latOff = (Math.random() - 0.5) * 2 * (radiusKm / 111);
  const lngOff = (Math.random() - 0.5) * 2 * (radiusKm / 111);
  return [coord[0] + latOff, coord[1] + lngOff];
}

async function main() {
  const users = await prisma.user.findMany({
    where: { latitude: null, province: { not: null } },
    select: { id: true, username: true, province: true },
  });

  let updated = 0;
  for (const u of users) {
    const base = PROVINCE_COORDS[u.province!];
    if (!base) continue;
    const [lat, lng] = jitter(base);
    await prisma.user.update({
      where: { id: u.id },
      data: { latitude: lat, longitude: lng },
    });
    console.log(`✓ ${u.username} → ${u.province} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    updated++;
  }
  console.log(`\n✅ อัปเดต ${updated} user`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
