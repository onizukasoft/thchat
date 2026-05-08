import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const rows = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { title, content } = await req.json();
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "title และ content ต้องระบุ" }, { status: 400 });
  }
  const row = await prisma.announcement.create({ data: { title: title.trim(), content: content.trim() } });
  return NextResponse.json(row);
}
