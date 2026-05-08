import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "./token";

const COOKIE = "admin_token";

export async function requireAuth(): Promise<{ error: NextResponse } | { ok: true }> {
  const secret = process.env.ADMIN_SECRET;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!secret || !token || !(await verifyToken(secret, token))) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true };
}

export async function isAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  return !!secret && !!token && verifyToken(secret, token);
}

export function cookieName() {
  return COOKIE;
}
