import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/thchat.db" });
const prisma = new PrismaClient({ adapter } as any);

const users = [
  { username: "narak_girl",    nickname: "น้ำตาล", email: "namtan@thchat.com",  gender: "female", age: 21, province: "กรุงเทพมหานคร", bio: "รักการท่องเที่ยว ชอบถ่ายรูป",          coins: 12500,  avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
  { username: "big_benz",      nickname: "บิ๊ก",   email: "big@thchat.com",     gender: "male",   age: 27, province: "เชียงใหม่",       bio: "นักดนตรี ชอบกีตาร์",                  coins: 8200,   avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
  { username: "ploy_cute",     nickname: "พลอย",  email: "ploy@thchat.com",    gender: "female", age: 19, province: "ขอนแก่น",        bio: "นักศึกษา ชอบดูซีรีส์",               coins: 31000,  avatar: "https://randomuser.me/api/portraits/women/2.jpg" },
  { username: "arm_cool",      nickname: "อาร์ม", email: "arm@thchat.com",     gender: "male",   age: 24, province: "ชลบุรี",          bio: "ชอบเล่นเกมส์ ดูบอล",                  coins: 5500,   avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
  { username: "fern_lovely",   nickname: "เฟิร์น", email: "fern@thchat.com",   gender: "female", age: 23, province: "ภูเก็ต",          bio: "รักทะเล ชอบดำน้ำ",                    coins: 45000,  avatar: "https://randomuser.me/api/portraits/women/3.jpg" },
  { username: "bank_handsome", nickname: "แบงค์", email: "bank@thchat.com",    gender: "male",   age: 29, province: "กรุงเทพมหานคร", bio: "พนักงานบริษัท ชอบออกกำลังกาย",      coins: 9800,   avatar: "https://randomuser.me/api/portraits/men/3.jpg" },
  { username: "mint_fresh",    nickname: "มิ้นท์", email: "mint@thchat.com",   gender: "female", age: 20, province: "เชียงราย",        bio: "ชอบทำขนม เปิด IG สอนทำเค้ก",         coins: 22000,  avatar: "https://randomuser.me/api/portraits/women/4.jpg" },
  { username: "top_strong",    nickname: "ท็อป",  email: "top@thchat.com",     gender: "male",   age: 26, province: "นครราชสีมา",     bio: "ชาวไร่ ชอบธรรมชาติ",                  coins: 3400,   avatar: "https://randomuser.me/api/portraits/men/4.jpg" },
  { username: "prim_angel",    nickname: "พริม",  email: "prim@thchat.com",    gender: "female", age: 22, province: "อุดรธานี",        bio: "ชอบอ่านนิยาย ฟังเพลง indie",          coins: 67000,  avatar: "https://randomuser.me/api/portraits/women/5.jpg" },
  { username: "joe_rider",     nickname: "โจ้",   email: "joe@thchat.com",     gender: "male",   age: 31, province: "สุราษฎร์ธานี",   bio: "ชอบขี่มอไซค์ท่องเที่ยว",             coins: 11200,  avatar: "https://randomuser.me/api/portraits/men/5.jpg" },
  { username: "yui_dance",     nickname: "ยุ้ย",  email: "yui@thchat.com",     gender: "female", age: 18, province: "กรุงเทพมหานคร", bio: "เต้น k-pop ชอบทำคอนเทนต์",           coins: 88000,  avatar: "https://randomuser.me/api/portraits/women/6.jpg" },
  { username: "nut_smart",     nickname: "หนัท",  email: "nut@thchat.com",     gender: "male",   age: 25, province: "สงขลา",           bio: "ไอทีซอฟต์แวร์ ชอบ coding",            coins: 7700,   avatar: "https://randomuser.me/api/portraits/men/6.jpg" },
  { username: "gift_pretty",   nickname: "กิ๊ฟ",  email: "gift@thchat.com",   gender: "female", age: 24, province: "ลำปาง",           bio: "ชอบตกแต่งห้อง ดูคอนเทนต์ DIY",       coins: 19500,  avatar: "https://randomuser.me/api/portraits/women/7.jpg" },
  { username: "mark_funny",    nickname: "มาร์ค", email: "mark@thchat.com",    gender: "male",   age: 22, province: "เชียงใหม่",       bio: "ตลกโปกฮา ชอบดูสแตนด์อัพ",            coins: 4100,   avatar: "https://randomuser.me/api/portraits/men/7.jpg" },
  { username: "pang_cheerful", nickname: "แป้ง",  email: "pang@thchat.com",    gender: "female", age: 26, province: "ระยอง",           bio: "ชอบทำอาหาร เปิด TikTok สอนทำกับข้าว", coins: 34000,  avatar: "https://randomuser.me/api/portraits/women/8.jpg" },
  { username: "film_quiet",    nickname: "ฟิล์ม", email: "film@thchat.com",   gender: "male",   age: 28, province: "พิษณุโลก",       bio: "ชอบถ่ายภาพ Landscape",                 coins: 6600,   avatar: "https://randomuser.me/api/portraits/men/8.jpg" },
  { username: "view_bright",   nickname: "วิว",   email: "view@thchat.com",    gender: "female", age: 21, province: "นนทบุรี",         bio: "นักศึกษาพยาบาล ชอบออกกำลังกาย",     coins: 15300,  avatar: "https://randomuser.me/api/portraits/women/9.jpg" },
  { username: "keng_chill",    nickname: "เก่ง",  email: "keng@thchat.com",    gender: "male",   age: 30, province: "กาญจนบุรี",      bio: "ชอบตั้งแคมป์ ดูดาว",                  coins: 2900,   avatar: "https://randomuser.me/api/portraits/men/9.jpg" },
  { username: "jaa_warm",      nickname: "จ๋า",   email: "jaa@thchat.com",     gender: "female", age: 25, province: "กรุงเทพมหานคร", bio: "ชอบช้อปปิ้ง ดูซีรีส์ฝรั่ง",          coins: 52000,  avatar: "https://randomuser.me/api/portraits/women/10.jpg" },
  { username: "pom_leader",    nickname: "ปอม",   email: "pom@thchat.com",     gender: "male",   age: 33, province: "สมุทรปราการ",    bio: "เจ้าของธุรกิจ ชอบเล่น golf",           coins: 120000, avatar: "https://randomuser.me/api/portraits/men/10.jpg" },
];

async function main() {
  const password = await bcrypt.hash("password123", 10);
  let count = 0;

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { avatar: u.avatar, nickname: u.nickname, coins: u.coins },
      create: { ...u, password, relationship: "single", starScore: Math.floor(Math.random() * 500), isOnline: false },
    });
    console.log(`✓ ${u.nickname} (${u.username})`);
    count++;
  }

  console.log(`\n✅ ${count} user เสร็จแล้ว — รหัสผ่าน: password123`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
