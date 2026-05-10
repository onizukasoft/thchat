import { PrismaClient } from "@prisma/client";

function createPrisma() {
  const url = process.env.DATABASE_URL ?? "";

  // PostgreSQL — use built-in driver
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    return new PrismaClient({ log: ["error"] });
  }

  // SQLite (file: or libsql:// or https://) — use libsql adapter
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const adapter = new PrismaLibSql({ url: url || "file:./prisma/dev.db" });
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrisma> };
export const prisma = globalForPrisma.prisma || createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
