import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/token";

const COOKIE = "admin_token";
const PUBLIC = ["/login", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const secret = process.env.ADMIN_SECRET;
  const token = request.cookies.get(COOKIE)?.value;

  if (!secret || !token || !(await verifyToken(secret, token))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
