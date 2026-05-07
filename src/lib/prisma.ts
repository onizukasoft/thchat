import { PrismaClient } from "@prisma/client";

function createPrisma() {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    // Production: PostgreSQL — ไม่ต้องใช้ adapter
    return new PrismaClient({ log: ["error"] });
  }

  // Development: SQLite via libsql adapter
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const adapter = new PrismaLibSql({ url: url || `file:${process.cwd()}/dev.db` });
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrisma> };
export const prisma = globalForPrisma.prisma || createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
