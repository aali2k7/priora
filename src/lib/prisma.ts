import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function getNormalizedDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const parsed = new URL(rawUrl);
    const sslmode = parsed.searchParams.get("sslmode");
    if (sslmode && ["require", "prefer", "verify-ca"].includes(sslmode)) {
      if (!parsed.searchParams.has("uselibpqcompat")) {
        parsed.searchParams.set("uselibpqcompat", "true");
        return parsed.toString();
      }
    }
  } catch {
    if (
      rawUrl.includes("sslmode=require") &&
      !rawUrl.includes("uselibpqcompat")
    ) {
      const sep = rawUrl.includes("?") ? "&" : "?";
      return `${rawUrl}${sep}uselibpqcompat=true`;
    }
  }
  return rawUrl;
}

const connectionString = getNormalizedDatabaseUrl(process.env.DATABASE_URL);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
