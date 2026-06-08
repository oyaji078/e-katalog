const POPULAR_INTERACTION_THRESHOLD = 50;
const RECOMMENDED_INTERACTION_THRESHOLD = 10;

export type ProductLabel = "Promo" | "Baru" | "Populer" | "Rekomendasi" | undefined;

export function isNewArrival(createdAt: Date | string): boolean {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);
  return new Date(createdAt) > cutoff;
}

export function computePrimaryLabel(
  product: {
    createdAt?: Date | string | null;
    viewCount?: number;
    clickCount?: number;
    inquiryCount?: number;
  },
  hasPromo: boolean,
): ProductLabel {
  if (hasPromo) return "Promo";

  if (product.createdAt && isNewArrival(product.createdAt)) return "Baru";

  const totalInteractions =
    (product.viewCount ?? 0) + (product.clickCount ?? 0) + (product.inquiryCount ?? 0);

  if (totalInteractions >= POPULAR_INTERACTION_THRESHOLD) return "Populer";

  if (totalInteractions >= RECOMMENDED_INTERACTION_THRESHOLD) return "Rekomendasi";

  return undefined;
}
