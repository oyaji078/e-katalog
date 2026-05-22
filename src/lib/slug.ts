/**
 * Slug generation utilities
 */

/**
 * Generate a URL-safe slug from a string
 * - Lowercase
 * - Trim spaces
 * - Replace spaces with hyphen
 * - Remove unsafe symbols
 *
 * @param value - The string to slugify
 * @returns The slugified string
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique product slug
 * If the base slug is already used, append a suffix based on SKU or ID
 *
 * @param baseSlug - The base slug (generated from product name)
 * @param sku - The product SKU (used as fallback suffix)
 * @param id - The product ID (used if SKU is not available)
 * @returns The final slug (possibly with suffix)
 */
export function generateProductSlug(
  baseSlug: string,
  sku?: string | null,
  id?: string | null,
): string {
  // If SKU is available, extract alphanumeric characters and use as suffix
  if (sku) {
    const skuSuffix = sku.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 10);
    if (skuSuffix) {
      return `${baseSlug}-${skuSuffix}`;
    }
  }

  // If ID is available, use it as suffix (cuid is already alphanumeric)
  if (id) {
    const idSuffix = id.substring(0, 8);
    return `${baseSlug}-${idSuffix}`;
  }

  return baseSlug;
}

/**
 * Create a slug from product name with optional SKU suffix for duplicates
 *
 * @param name - Product name
 * @param options - Optional SKU and ID for duplicate handling
 * @returns The generated slug
 */
export function createProductSlug(
  name: string,
  options?: {
    sku?: string | null;
    id?: string | null;
    forceWithSuffix?: boolean;
  },
): string {
  const baseSlug = slugify(name);

  // If forceWithSuffix is true (indicating a duplicate), always add suffix
  if (options?.forceWithSuffix) {
    return generateProductSlug(baseSlug, options?.sku, options?.id);
  }

  // Otherwise, use base slug (caller will handle duplicate detection)
  return baseSlug;
}
