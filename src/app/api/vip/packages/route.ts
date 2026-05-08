import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const packages = await prisma.vipPackageSetting.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(
    packages.map((p) => ({
      ...p,
      features: (() => { try { return JSON.parse(p.features); } catch { return []; } })(),
    }))
  );
}
