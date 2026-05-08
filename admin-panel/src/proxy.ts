import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.ADMIN_SECRET ?? "thchat-admin-panel-secret-2026";
const COOKIE = "admin_token";
const PUBLIC = ["/login", "/api/auth"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get(COOKIE)?.value;
  if (token !== SECRET) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
