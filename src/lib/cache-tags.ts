// Cross-request cache tags for public catalog data that changes rarely but is
// read on (almost) every page. Each tag is invalidated from the matching admin
// mutation via updateTag(...) (Next 16 server actions) so edits show instantly,
// with a short `revalidate` backstop on the unstable_cache wrappers.

export const CATEGORIES_CACHE_TAG = "active-categories";
export const HERO_BANNER_CACHE_TAG = "hero-banner";
