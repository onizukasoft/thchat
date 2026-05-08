import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.ADMIN_SECRET ?? "thchat-admin-panel-secret-2026";
const COOKIE = "admin_token";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== SECRET) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, SECRET, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_token");
  return res;
}
