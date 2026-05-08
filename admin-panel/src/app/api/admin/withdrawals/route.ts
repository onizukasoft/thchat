import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const requests = await prisma.withdrawalRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      creator: {
        include: {
          user: { select: { id: true, username: true, nickname: true, avatar: true } },
        },
      },
    },
  });

  return NextResponse.json(requests);
}
