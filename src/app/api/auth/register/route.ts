import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร").max(20, "ชื่อผู้ใช้ยาวเกิน 20 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  nickname: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  age: z.number().int().min(13, "ต้องมีอายุ 13 ปีขึ้นไป").max(100, "อายุไม่ถูกต้อง").optional(),
});

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
