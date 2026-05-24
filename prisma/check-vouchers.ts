import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL!;
const adapter = new PrismaMariaDb(dbUrl, { useTextProtocol: true });
const prisma = new PrismaClient({ adapter });

async function main() {
  const vs = await prisma.voucher.findMany({
    select: { code: true, status: true, isActive: true, minimumPurchase: true, title: true },
  });
  for (const v of vs) {
    console.log(`${v.code} | ${v.status} | active: ${v.isActive} | min: ${v.minimumPurchase} | ${v.title}`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
