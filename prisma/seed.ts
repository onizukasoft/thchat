import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: `file:${process.cwd()}/dev.db` });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const PROVINCES = ["กรุงเทพมหานคร","เชียงใหม่","ภูเก็ต","ขอนแก่น","นครราชสีมา","อุบลราชธานี","สงขลา","ชลบุรี","นนทบุรี","เชียงราย"];

const USERS = [
  { username: "demo",    nickname: "Demo User", email: "demo@thchat.com",    gender: "male",   age: 25, bio: "ทดสอบระบบ",                          coins: 500, avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
  { username: "somchai", nickname: "สมชาย",     email: "somchai@thchat.com", gender: "male",   age: 27, bio: "ชอบดูหนัง ฟังเพลง เที่ยวกลางคืน",  coins: 100, avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
  { username: "malee",   nickname: "มาลี",       email: "malee@thchat.com",   gender: "female", age: 22, bio: "รักการท่องเที่ยว ชอบถ่ายรูป",       coins: 320, avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
  { username: "wichai",  nickname: "วิชัย",      email: "wichai@thchat.com",  gender: "male",   age: 28, bio: "เล่นเกมส์ Pro Player",               coins: 150, avatar: "https://randomuser.me/api/portraits/men/3.jpg" },
  { username: "noi",     nickname: "น้อย",       email: "noi@thchat.com",     gender: "female", age: 20, bio: "นักศึกษาปี 2 ชอบอ่านการ์ตูน",       coins: 80,  avatar: "https://randomuser.me/api/portraits/women/2.jpg" },
  { username: "pim",     nickname: "พิม",        email: "pim@thchat.com",     gender: "female", age: 23, bio: "ชอบทำขนม เปิดร้านเล็กๆ",            coins: 430, avatar: "https://randomuser.me/api/portraits/women/3.jpg" },
  { username: "arm",     nickname: "อาร์ม",      email: "arm@thchat.com",     gender: "male",   age: 26, bio: "นักดนตรี เล่นกีต้าร์",              coins: 210, avatar: "https://randomuser.me/api/portraits/men/4.jpg" },
  { username: "fah",     nickname: "ฟ้า",        email: "fah@thchat.com",     gender: "female", age: 24, bio: "ครูสอนภาษาอังกฤษ ชอบท่องเที่ยว",   coins: 660, avatar: "https://randomuser.me/api/portraits/women/4.jpg" },
  { username: "tan",     nickname: "ตั้น",        email: "tan@thchat.com",     gender: "male",   age: 30, bio: "นักธุรกิจ ชอบออกกำลังกาย",         coins: 890, avatar: "https://randomuser.me/api/portraits/men/5.jpg" },
  { username: "ploy",    nickname: "พลอย",       email: "ploy@thchat.com",    gender: "female", age: 21, bio: "นักศึกษาแพทย์ ชอบวาดรูป",          coins: 120, avatar: "https://randomuser.me/api/portraits/women/5.jpg" },
  { username: "bank",    nickname: "แบงค์",      email: "bank@thchat.com",    gender: "male",   age: 29, bio: "โปรแกรมเมอร์ ชอบกาแฟ",             coins: 340, avatar: "https://randomuser.me/api/portraits/men/6.jpg" },
  { username: "mint",    nickname: "มิ้นท์",     email: "mint@thchat.com",    gender: "female", age: 25, bio: "นักออกแบบกราฟิก",                   coins: 520, avatar: "https://randomuser.me/api/portraits/women/6.jpg" },
  { username: "pop",     nickname: "ป๊อป",       email: "pop@thchat.com",     gender: "male",   age: 22, bio: "ชอบฟุตบอล แมนยู",                  coins: 75,  avatar: "https://randomuser.me/api/portraits/men/7.jpg" },
  { username: "bow",     nickname: "โบว์",       email: "bow@thchat.com",     gender: "female", age: 27, bio: "พยาบาล ชอบทำอาหาร",                coins: 290, avatar: "https://randomuser.me/api/portraits/women/7.jpg" },
  { username: "keng",    nickname: "เก่ง",       email: "keng@thchat.com",    gender: "male",   age: 31, bio: "วิศวกร ชอบปั่นจักรยาน",            coins: 410, avatar: "https://randomuser.me/api/portraits/men/8.jpg" },
  { username: "aom",     nickname: "อ้อม",       email: "aom@thchat.com",     gender: "female", age: 19, bio: "ม.ปลาย ชอบ K-pop",                 coins: 60,  avatar: "https://randomuser.me/api/portraits/women/8.jpg" },
  { username: "nat",     nickname: "แนท",        email: "nat@thchat.com",     gender: "female", age: 26, bio: "นักแสดง ชอบอ่านหนังสือ",           coins: 750, avatar: "https://randomuser.me/api/portraits/women/9.jpg" },
  { username: "big",     nickname: "บิ๊ก",       email: "big@thchat.com",     gender: "male",   age: 33, bio: "เจ้าของร้านอาหาร",                 coins: 980, avatar: "https://randomuser.me/api/portraits/men/9.jpg" },
  { username: "gift",    nickname: "กิ๊ฟ",       email: "gift@thchat.com",    gender: "female", age: 28, bio: "นักบัญชี ชอบดูซีรีส์",             coins: 180, avatar: "https://randomuser.me/api/portraits/women/10.jpg" },
  { username: "james",   nickname: "เจมส์",      email: "james@thchat.com",   gender: "male",   age: 24, bio: "ช่างภาพ ชอบเที่ยวป่า",             coins: 630, avatar: "https://randomuser.me/api/portraits/men/10.jpg" },
];

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const createdUsers = [];
  for (const u of USERS) {
    const province = PROVINCES[Math.floor(Math.random() * PROVINCES.length)];
    const lat = 13.0 + Math.random() * 5;
    const lng = 100.0 + Math.random() * 5;
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { avatar: u.avatar },
      create: {
        ...u,
        password,
        coins: u.coins ?? Math.floor(Math.random() * 200),
        province,
        latitude: lat,
        longitude: lng,
        isOnline: Math.random() > 0.4,
      },
    });
    createdUsers.push(user);
    console.log(`✅ ${u.nickname}`);
  }

  // Rooms
  const rooms = [
    { name: "ห้องทั่วไป", description: "คุยเรื่องทั่วไป" },
    { name: "ห้องความรัก", description: "แชร์เรื่องราวความรัก ❤️" },
    { name: "ห้องเกมส์", description: "คุยเรื่องเกมส์ 🎮" },
  ];
  for (const r of rooms) {
    await prisma.room.upsert({ where: { name: r.name } as any, update: {}, create: r }).catch(() => {});
  }

  // Posts
  const posts = [
    { title: "ยินดีต้อนรับสู่ ThChat!", content: "เว็บนี้สร้างขึ้นเพื่อให้คนไทยได้มีพื้นที่พูดคุยกัน 😊", category: "general" },
    { title: "มีใครชอบดูซีรีส์บ้างไหม?", content: "ตอนนี้กำลังดูซีรีส์เกาหลีอยู่ แนะนำหน่อยครับ", category: "general" },
    { title: "สารภาพรักออนไลน์ดีไหม?", content: "ชอบใครที่รู้จักออนไลน์ ควรบอกทางแชทหรือรอเจอตัวจริง?", category: "love" },
    { title: "ใครชอบเที่ยวภูเก็ตบ้าง?", content: "กำลังจะไปเที่ยวภูเก็ต ใครมีที่แนะนำบ้าง?", category: "travel" },
    { title: "แนะนำเกมส์มือถือหน่อย", content: "เบื่อเกมส์เก่าแล้ว หาเกมส์ใหม่เล่น แนะนำหน่อยครับ", category: "game" },
  ];
  for (const p of posts) {
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    await prisma.post.create({ data: { ...p, userId: user.id } }).catch(() => {});
  }

  console.log("\n✅ Seed completed! 20 users added");
  console.log("📧 demo@thchat.com | password123");
  console.log("📧 somchai@thchat.com | password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
