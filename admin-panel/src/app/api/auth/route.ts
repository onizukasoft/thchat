import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createToken, verifyToken } from "@/lib/token";

const SECRET = process.env.ADMIN_SECRET;
const COOKIE = "admin_token";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

if (!SECRET) throw new Error("ADMIN_SECRET environment variable is not set");

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
  const token = jar.get(COOKIE)?.value;
  if (!token || !SECRET || !(await verifyToken(SECRET, token))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "ลองใหม่ใน 15 นาที" }, { status: 429 });
  }

  const { password } = await req.json();
  if (password !== SECRET) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const sessionToken = await createToken(SECRET);
  const res = NextResponse.json({ ok: true });
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
  return res;
}
