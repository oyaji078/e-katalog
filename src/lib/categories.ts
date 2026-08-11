import { cache } from "react";
import { unstable_cache } from "next/cache";

import { CATEGORIES_CACHE_TAG } from "@/lib/cache-tags";
import { getDb } from "@/lib/db";

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
};

const loadActiveCategories = async (): Promise<CategoryItem[]> => {
  const db = getDb();
  const rows = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
  return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
};

/**
 * Active categories are read on (almost) every public page — navbar menu,
 * homepage grid, footer, catalog filters. They change rarely, so the query is
 * cached across requests (tag-invalidated when admin edits a category) and
 * wrapped again in React.cache() for per-request deduplication.
 */
const loadActiveCategoriesCached = unstable_cache(loadActiveCategories, ["active-categories"], {
  tags: [CATEGORIES_CACHE_TAG],
  revalidate: 300,
});

export const getActiveCategories = cache(loadActiveCategoriesCached);
