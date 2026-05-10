import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createToken, verifyToken, createPartnerToken, verifyPin } from "@/lib/token";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.ADMIN_SECRET;
const COOKIE = "admin_token";
const PARTNER_COOKIE = "partner_token";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

if (!SECRET) throw new Error("ADMIN_SECRET environment variable is not set");
const ADMIN_SECRET: string = SECRET;

const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export async function GET() {
  const jar = await cookies();
  const adminToken = jar.get(COOKIE)?.value;
  if (adminToken && (await verifyToken(ADMIN_SECRET, adminToken))) {
    return NextResponse.json({ ok: true, role: "admin" });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "ลองใหม่ใน 15 นาที" }, { status: 429 });
  }

  const body = await req.json();

  // Partner login: email + pin
  if (body.email && body.pin) {
    const partner = await prisma.partner.findFirst({
      where: { email: body.email, isActive: true },
      select: { id: true, pin: true, name: true },
    });
    if (!partner || !partner.pin || !(await verifyPin(body.pin, partner.pin))) {
      return NextResponse.json({ error: "อีเมลหรือ PIN ไม่ถูกต้อง" }, { status: 401 });
    }
    const sessionToken = await createPartnerToken(ADMIN_SECRET, partner.id);
    const res = NextResponse.json({ ok: true, role: "partner", name: partner.name });
    res.cookies.set(PARTNER_COOKIE, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  // Admin login: password only
  if (body.password !== ADMIN_SECRET) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const sessionToken = await createToken(ADMIN_SECRET);
  const res = NextResponse.json({ ok: true, role: "admin" });
  res.cookies.set(COOKIE, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  res.cookies.delete(PARTNER_COOKIE);
  return res;
}
