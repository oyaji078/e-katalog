import { getDb } from "@/lib/db";
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
export async function getStoreWhatsappNumberFromDB(): Promise<string> {
  return resolveStoreWhatsappNumber(getDb());
}

/**
 * Get store name with fallback to environment.
 */
export async function getStoreNameFromDB(): Promise<string> {
  const dbValue = await getStoreSetting("store_name");
  if (dbValue) return dbValue;
  return process.env.STORE_NAME ?? "Rama Computer";
}

/**
 * Get store announcement text with fallback.
 */
export async function getStoreAnnouncementFromDB(): Promise<string> {
  const dbValue = await getStoreSetting("store_announcement_text");
  if (dbValue) return dbValue;
  return "Katalog komputer & aksesoris — tanya harga via WhatsApp";
}

/**
 * Get store address with fallback.
 */
export async function getStoreAddressFromDB(): Promise<string | null> {
  return await getStoreSetting("store_address");
}
