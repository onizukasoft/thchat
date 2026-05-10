import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร").max(20, "ชื่อผู้ใช้ยาวเกิน 20 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
    .regex(/[a-z]/, "ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
    .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว"),
  nickname: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  age: z.number().int().min(18, "ต้องมีอายุ 18 ปีขึ้นไป").max(100, "อายุไม่ถูกต้อง"),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(`register:${getClientIp(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "ลองใหม่ใน 1 ชั่วโมง" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });

    if (exists) {
      return NextResponse.json(
        { error: "อีเมลหรือชื่อผู้ใช้นี้ถูกใช้แล้ว" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashed,
        nickname: data.nickname || data.username,
        gender: data.gender,
        age: data.age,
      },
      select: { id: true, username: true, email: true, nickname: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    }
    console.error("[register]", e);
    return NextResponse.json({ error: (e as any)?.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
