import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrisma() {
  const url = process.env.DATABASE_URL ?? `file:${process.cwd()}/../dev.db`;
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter } as never);
}

const g = globalThis as unknown as { prisma?: ReturnType<typeof createPrisma> };
export const prisma = g.prisma ?? createPrisma();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
