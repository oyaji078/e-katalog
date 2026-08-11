import { cache } from "react";
import { unstable_cache } from "next/cache";

import { getDb } from "@/lib/db";
import { SITE_SETTINGS_CACHE_TAG } from "@/lib/site-settings-constants";
import { resolveStoreWhatsappNumber } from "@/lib/whatsapp";

/**
 * Get a single store setting by key.
 * Returns null if not found or on error.
 */
export async function getStoreSetting(key: string): Promise<string | null> {
  try {
    const db = getDb();
    const setting = await db.storeSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Get store WhatsApp number from database with fallback to env.
 * Resolves: SiteSetting.whatsappNumber (Web Identity form) → StoreSetting key
 * → env var → default dummy number. Matches the per-product inquiry route so
 * public catalog links and inquiry links use the same number.
 */
const loadStoreWhatsappNumberCached = unstable_cache(
  () => resolveStoreWhatsappNumber(getDb()),
  ["store-whatsapp-number"],
  { tags: [SITE_SETTINGS_CACHE_TAG], revalidate: 300 },
);

export const getStoreWhatsappNumberFromDB = cache(
  (): Promise<string> => loadStoreWhatsappNumberCached(),
);

/**
 * Get store address with fallback.
 */
export async function getStoreAddressFromDB(): Promise<string | null> {
  return await getStoreSetting("store_address");
}
