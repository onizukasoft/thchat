import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken, verifyPartnerToken } from "./token";

const COOKIE = "admin_token";
const PARTNER_COOKIE = "partner_token";

export async function requireAuth(): Promise<{ error: NextResponse } | { ok: true }> {
  const secret = process.env.ADMIN_SECRET;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!secret || !token || !(await verifyToken(secret, token))) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true };
}

export async function requirePartner(): Promise<{ error: NextResponse } | { ok: true; partnerId: string }> {
  const secret = process.env.ADMIN_SECRET;
  const jar = await cookies();
  const token = jar.get(PARTNER_COOKIE)?.value;
  if (!secret || !token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const partnerId = await verifyPartnerToken(secret, token);
  if (!partnerId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, partnerId };
}

export async function isAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  return !!secret && !!token && verifyToken(secret, token);
}

export async function getPartnerSession(): Promise<string | null> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;
  const jar = await cookies();
  const token = jar.get(PARTNER_COOKIE)?.value;
  if (!token) return null;
  return verifyPartnerToken(secret, token);
}

export function cookieName() { return COOKIE; }
export function partnerCookieName() { return PARTNER_COOKIE; }
