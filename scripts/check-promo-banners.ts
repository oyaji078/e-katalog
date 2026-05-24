/**
 * Phase 20: Check all promo banners in DB.
 * Prints id, title, isActive, audience, imageUrl, startsAt, endsAt, sortOrder, createdAt.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL!;
const adapter = new PrismaMariaDb(dbUrl, { useTextProtocol: true });
const prisma = new PrismaClient({ adapter });

async function main() {
  const banners = await prisma.promoBanner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  console.log(`\n=== ALL PROMO BANNERS (${banners.length}) ===\n`);

  for (const b of banners) {
    console.log(`- id:        ${b.id}`);
    console.log(`  title:     ${b.title}`);
    console.log(`  isActive:  ${b.isActive}`);
    console.log(`  audience:  ${b.audience}`);
    console.log(`  imageUrl:  ${b.imageUrl ?? "(null)"}`);
    console.log(`  linkUrl:   ${b.linkUrl ?? "(null)"}`);
    console.log(`  ctaLabel:  ${b.ctaLabel ?? "(null)"}`);
    console.log(`  startsAt:  ${b.startsAt?.toISOString() ?? "(null)"}`);
    console.log(`  endsAt:    ${b.endsAt?.toISOString() ?? "(null)"}`);
    console.log(`  sortOrder: ${b.sortOrder}`);
    console.log(`  createdAt: ${b.createdAt.toISOString()}`);
    console.log("");
  }

  const active = banners.filter((b) => b.isActive);
  console.log(`--- Active banners: ${active.length} ---`);
  for (const b of active) {
    console.log(`  - ${b.title} (${b.audience}, sortOrder: ${b.sortOrder})`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
