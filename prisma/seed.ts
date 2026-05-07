import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: `file:${process.cwd()}/dev.db` });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const users = [
    { username: "somchai", nickname: "สมชาย", email: "somchai@thchat.com", gender: "male", age: 25, bio: "ชอบดูหนัง ฟังเพลง" },
    { username: "malee", nickname: "มาลี", email: "malee@thchat.com", gender: "female", age: 22, bio: "รักการท่องเที่ยว" },
    { username: "wichai", nickname: "วิชัย", email: "wichai@thchat.com", gender: "male", age: 28, bio: "ชอบเล่นเกมส์" },
    { username: "noi", nickname: "น้อย", email: "noi@thchat.com", gender: "female", age: 20, bio: "นักศึกษา" },
    { username: "demo", nickname: "Demo User", email: "demo@thchat.com", gender: "other", age: 25, bio: "ทดสอบระบบ" },
  ];

  const password = await bcrypt.hash("password123", 10);

  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password, isOnline: Math.random() > 0.4 },
    });
    createdUsers.push(user);
  }

  const rooms = [
    { name: "ห้องทั่วไป", description: "คุยเรื่องทั่วไป" },
    { name: "ห้องความรัก", description: "แชร์เรื่องราวความรัก ❤️" },
    { name: "ห้องเกมส์", description: "คุยเรื่องเกมส์ 🎮" },
  ];

  for (const r of rooms) {
    await prisma.room.create({ data: r }).catch(() => {});
  }

  const postData = [
    { title: "ยินดีต้อนรับสู่ ThChat!", content: "เว็บนี้สร้างขึ้นเพื่อให้คนไทยได้มีพื้นที่พูดคุยกัน ยินดีต้อนรับทุกคนนะครับ 😊", category: "general" },
    { title: "มีใครชอบดูซีรีส์บ้างไหม?", content: "ตอนนี้กำลังดูซีรีส์เกาหลีอยู่ ใครมีเรื่องดีๆ แนะนำบ้างครับ", category: "general" },
    { title: "สารภาพรักออนไลน์ดีไหม?", content: "อยากถามเพื่อนๆ ว่าถ้าชอบใครที่รู้จักกันทางออนไลน์ ควรบอกรักทางแชทหรือรอเจอตัวจริงดีกว่า?", category: "love" },
  ];

  for (const p of postData) {
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    await prisma.post.create({ data: { ...p, userId: user.id } });
  }

  console.log("✅ Seed completed!");
  console.log("📧 ล็อกอิน: demo@thchat.com | รหัสผ่าน: password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
