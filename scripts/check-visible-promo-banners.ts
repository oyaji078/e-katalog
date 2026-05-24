/**
 * Phase 20: Check which promo banners are visible to guest and retail users.
 * Simulates the exact queries used in src/app/page.tsx.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import type { PromoBannerAudience } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL!;
const adapter = new PrismaMariaDb(dbUrl, { useTextProtocol: true });
const prisma = new PrismaClient({ adapter });

async function main() {
  const now = new Date();

  // ALL BANNERS
  const allBanners = await prisma.promoBanner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  console.log(`\n=== ALL BANNERS (${allBanners.length}) ===\n`);
  for (const b of allBanners) {
    console.log(`- id: ${b.id}`);
    console.log(`  title:      ${b.title}`);
    console.log(`  isActive:   ${b.isActive}`);
    console.log(`  audience:   ${b.audience}`);
    console.log(`  imageUrl:   ${b.imageUrl ?? "(null)"}`);
    console.log(`  startsAt:   ${b.startsAt?.toISOString() ?? "(null)"}`);
    console.log(`  endsAt:     ${b.endsAt?.toISOString() ?? "(null)"}`);
    console.log(`  sortOrder:  ${b.sortOrder}`);
    console.log(`  createdAt:  ${b.createdAt.toISOString()}`);
    console.log("");
  }

  // GUEST (PUBLIC only)
  const guestAudiences: PromoBannerAudience[] = ["PUBLIC"];
  const guestBanners = await prisma.promoBanner.findMany({
    where: {
      isActive: true,
      audience: { in: guestAudiences },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 10,
  });

  console.log(`=== VISIBLE TO GUEST (${guestBanners.length}) ===\n`);
  if (guestBanners.length === 0) {
    console.log("  (none — banner section will be hidden)\n");
  } else {
    for (const b of guestBanners) {
      console.log(`- ${b.title} (audience: ${b.audience}, imageUrl: ${b.imageUrl ?? "(null)"})`);
    }
    console.log("");
  }

  // RETAIL
  const retailAudiences: PromoBannerAudience[] = ["PUBLIC", "AUTHENTICATED", "RETAIL"];
  const retailBanners = await prisma.promoBanner.findMany({
    where: {
      isActive: true,
      audience: { in: retailAudiences },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 10,
  });

  console.log(`=== VISIBLE TO RETAIL (${retailBanners.length}) ===\n`);
  if (retailBanners.length === 0) {
    console.log("  (none — banner section will be hidden)\n");
  } else {
    for (const b of retailBanners) {
      console.log(`- ${b.title} (audience: ${b.audience}, imageUrl: ${b.imageUrl ?? "(null)"})`);
    }
    console.log("");
  }

  console.log("=== CONCLUSION ===\n");
  if (guestBanners.length === 0) {
    console.log("Guest banner section: HIDDEN (no active eligible banners)\n");
  } else {
    console.log(`Guest banner section: VISIBLE (${guestBanners.length} banner(s))\n`);
    for (const b of guestBanners) {
      console.log(`  - "${b.title}" imageUrl: ${b.imageUrl ?? "NO IMAGE (gradient only)"}`);
    }
    console.log("");
  }

  if (retailBanners.length === 0) {
    console.log("Retail banner section: HIDDEN (no active eligible banners)\n");
  } else {
    console.log(`Retail banner section: VISIBLE (${retailBanners.length} banner(s))\n`);
    for (const b of retailBanners) {
      console.log(`  - "${b.title}" imageUrl: ${b.imageUrl ?? "NO IMAGE (gradient only)"}`);
    }
    console.log("");
  }

  // Check if any banner has a potentially stale local image
  for (const b of allBanners) {
    if (b.imageUrl?.startsWith("/uploads/promo-banners/")) {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const publicPath = path.resolve(process.cwd(), "public", b.imageUrl.replace(/^\//, ""));
      const exists = fs.existsSync(publicPath);
      if (!exists) {
        console.log(`  WARNING: Banner "${b.title}" has local image but file NOT FOUND at ${b.imageUrl}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
