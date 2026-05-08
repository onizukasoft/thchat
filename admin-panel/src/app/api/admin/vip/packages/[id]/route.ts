import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.icon === "string") data.icon = body.icon.trim();
  if (typeof body.price === "number") data.price = Math.floor(body.price);
  if (typeof body.coins === "number") data.coins = Math.floor(body.coins);
  if (typeof body.days === "number") data.days = Math.floor(body.days);
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (Array.isArray(body.features)) data.features = JSON.stringify(body.features);

  const pkg = await prisma.vipPackageSetting.update({ where: { id }, data });
  return NextResponse.json(pkg);
}
