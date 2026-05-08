import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SECRET = process.env.ADMIN_SECRET ?? "thchat-admin-panel-secret-2026";
const COOKIE = "admin_token";

export async function requireAuth(): Promise<{ error: NextResponse } | { ok: true }> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token !== SECRET) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true };
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === SECRET;
}

export function cookieName() {
  return COOKIE;
}
