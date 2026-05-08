import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const packages = await prisma.vipPackageSetting.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(packages);
}
