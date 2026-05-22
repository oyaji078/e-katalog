import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prismaClient?: PrismaClient;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required before using the database client.");
  }

  const adapter = new PrismaMariaDb(databaseUrl, { useTextProtocol: true });
  return new PrismaClient({ adapter });
}

export function getDb() {
  if (!globalForPrisma.prismaClient) {
    globalForPrisma.prismaClient = createPrismaClient();
  }

  return globalForPrisma.prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const db = getDb();
    const value = db[property as keyof PrismaClient];

    if (typeof value === "function") {
      return value.bind(db);
    }

    return value;
  },
});
