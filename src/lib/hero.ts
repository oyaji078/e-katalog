import { cache } from "react";
import { unstable_cache } from "next/cache";

import { getDb } from "@/lib/db";
import { HERO_BANNER_CACHE_TAG } from "@/lib/cache-tags";
import { isRenderablePromoBannerImageUrl } from "@/lib/promo-banner-url";

export type HeroBannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  sortOrder: number;
  updatedAt: Date;
};

export type ResolvedHeroBanner = {
  title: string;
  subtitle: string | null;
  image: string | null;
};

/**
 * A hero banner is *scheduled-active* when the manual switch is on AND the
 * current moment falls inside its window. A null start means "since forever";
 * a null end means "no expiry". This single predicate is the source of truth
 * shared by the public homepage and the admin status badge so they can never
 * disagree. Expired banners (endsAt < now) are always excluded.
 */
function toTime(value: Date | string | null): number | null {
  if (!value) return null;
  // unstable_cache serializes its result to JSON, so Date columns come back as
  // ISO strings on cache hits while a fresh DB read (admin page) yields real
  // Date objects. Coerce both so the predicate never calls .getTime() on a string.
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function isHeroBannerActiveNow(
  banner: { isActive: boolean; startsAt: Date | string | null; endsAt: Date | string | null },
  now: Date = new Date(),
): boolean {
  if (!banner.isActive) return false;
  const nowTime = now.getTime();
  const start = toTime(banner.startsAt);
  const end = toTime(banner.endsAt);
  if (start !== null && start > nowTime) return false;
  if (end !== null && end < nowTime) return false;
  return true;
}

/**
 * Load every manually-active hero banner once and cache the row set across
 * requests (tag-invalidated on admin edits). The date filtering that decides
 * which banner is live RIGHT NOW happens in JS at request time — so a banner
 * scheduled for the future activates automatically when its window opens,
 * without waiting for the cache to expire and without a DB hit per request.
 */
const loadActiveHeroBanners = async (): Promise<HeroBannerRow[]> => {
  const db = getDb();
  return db.heroBanner.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      subtitle: true,
      imageUrl: true,
      isActive: true,
      startsAt: true,
      endsAt: true,
      sortOrder: true,
      updatedAt: true,
    },
  });
};

const loadActiveHeroBannersCached = unstable_cache(loadActiveHeroBanners, ["active-hero-banners"], {
  tags: [HERO_BANNER_CACHE_TAG],
  revalidate: 300,
});

/**
 * Resolve the single hero banner to display, or null when none is live (the
 * caller then renders the static fallback hero). Date filtering is evaluated
 * per request for automatic schedule-based activation.
 */
export const getActiveHeroBanner = cache(async (now: Date = new Date()): Promise<ResolvedHeroBanner | null> => {
  const banners = await loadActiveHeroBannersCached();
  const selected = banners.find((b) => isHeroBannerActiveNow(b, now)) ?? null;
  if (!selected) return null;

  const image =
    selected.imageUrl && isRenderablePromoBannerImageUrl(selected.imageUrl)
      ? selected.imageUrl
      : null;

  return { title: selected.title, subtitle: selected.subtitle, image };
});
