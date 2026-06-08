import type { SiteSetting } from "@/generated/prisma/client";
import { cache } from "react";
import { unstable_cache } from "next/cache";

import { getDb } from "@/lib/db";
import {
  DEFAULT_SITE_SETTINGS,
  DEFAULT_PAGE_BG,
  DEFAULT_CARD_BG,
  DEFAULT_SOFT_SECTION,
  DEFAULT_TEXT_DARK,
  DEFAULT_TEXT_MUTED,
  SITE_SETTINGS_CACHE_TAG,
  type PublicSiteSettings,
} from "@/lib/site-settings-constants";
import { isSafeSiteImageUrl } from "@/lib/upload/storage";

export const SITE_SETTING_SINGLETON_KEY = "default";
export { DEFAULT_SITE_SETTINGS };
export type { PublicSiteSettings };

type StoreSettingReader = {
  storeSetting: {
    findUnique: (args: { where: { key: string } }) => Promise<{ value: string } | null>;
  };
};

type SiteSettingReader = {
  siteSetting: {
    findUnique: (args: { where: { singletonKey: string } }) => Promise<SiteSetting | null>;
    create: (args: { data: SiteSettingCreateData }) => Promise<SiteSetting>;
  };
};

type SiteSettingCreateData = {
  singletonKey: string;
  siteName: string;
  storeName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor?: string;
  mutedColor?: string;
  supportColor?: string;
  whatsappColor?: string;
  whatsappNumber: string;
  footerDescription: string;
  announcementEnabled?: boolean;
  announcementText?: string | null;
  announcementSpeed?: number;
  announcementLink?: string | null;
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const SITE_UPLOAD_PATTERN = /^\/uploads\/site\/(?:logo|favicon)-[a-f0-9]{8}\.webp$/;
const LEGACY_DEFAULT_COLORS = {
  primaryColor: "#0A0A0A",
  secondaryColor: "#141414",
  accentColor: "#C41E3A",
  legacyPrimary: "#F3E3D0",
  legacySecondary: "#AACDDC",
  legacyAccent: "#81A6C6",
} as const;

function cleanText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function cleanOptionalText(value: string | null | undefined) {
  return value?.trim() || "";
}

export function isValidHexColor(value: string) {
  return HEX_COLOR_PATTERN.test(value.trim());
}

export function normalizeHexColor(value: string, fallback?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback ?? null;
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    return "#" + raw.slice(1).split("").map(c => c + c).join("").toUpperCase();
  }
  return null;
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(value: string) {
  const clean = value.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mixHexColor(from: string, to: string, amount: number) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

function isDefaultPrimary(primaryColor: string) {
  return primaryColor.toUpperCase() === DEFAULT_SITE_SETTINGS.primaryColor;
}

function normalizeThemeColor(
  value: string | null | undefined,
  fallback: string,
  ...legacyDefaults: string[]
) {
  const normalized = normalizeHexColor(value ?? "");
  if (!normalized) return fallback;
  for (const legacy of legacyDefaults) {
    if (legacy && normalized === legacy) return fallback;
  }
  return normalized;
}

function clampAnnouncementSpeed(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) return DEFAULT_SITE_SETTINGS.announcementSpeed;
  return Math.max(10, Math.min(120, Math.round(value ?? DEFAULT_SITE_SETTINGS.announcementSpeed)));
}

export function normalizeWhatsappNumber(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  let digits = compact;

  if (compact.startsWith("+")) {
    digits = compact.slice(1);
  }

  if (!/^\d+$/.test(digits)) return null;

  if (digits.startsWith("08")) {
    digits = `62${digits.slice(1)}`;
  }

  if (!/^628\d{8,13}$/.test(digits)) return null;

  return digits;
}

export function isValidHttpsUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidAnnouncementLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  return isValidHttpsUrl(trimmed);
}

export function isSafeSiteUploadPath(
  value: string | null | undefined,
  kind?: "logo" | "favicon",
) {
  if (!value) return true;
  const trimmed = value.trim();
  if (!SITE_UPLOAD_PATTERN.test(trimmed)) return false;
  return kind ? trimmed.startsWith(`/uploads/site/${kind}-`) : true;
}

function withDerivedColors(settings: Omit<PublicSiteSettings, "primaryDarkColor" | "hoverColor" | "accentHoverColor" | "accentDarkColor">) {
  const primaryDarkColor = isDefaultPrimary(settings.primaryColor)
    ? DEFAULT_SITE_SETTINGS.primaryDarkColor
    : mixHexColor(settings.primaryColor, "#000000", 0.35);

  return {
    ...settings,
    primaryDarkColor,
    hoverColor: settings.supportColor,
    supportColor: settings.supportColor,
    accentHoverColor: mixHexColor(settings.accentColor, "#000000", 0.08),
    accentDarkColor: mixHexColor(settings.accentColor, "#000000", 0.28),
  };
}

function toPublicSiteSettings(setting: SiteSetting | null): PublicSiteSettings {
  const primaryColor =
    normalizeThemeColor(
      setting?.primaryColor,
      DEFAULT_SITE_SETTINGS.primaryColor,
      LEGACY_DEFAULT_COLORS.primaryColor,
      LEGACY_DEFAULT_COLORS.legacyPrimary,
    );
  const secondaryColor =
    normalizeThemeColor(
      setting?.secondaryColor,
      DEFAULT_SITE_SETTINGS.secondaryColor,
      LEGACY_DEFAULT_COLORS.secondaryColor,
      LEGACY_DEFAULT_COLORS.legacySecondary,
    );
  const accentColor =
    normalizeThemeColor(
      setting?.accentColor,
      DEFAULT_SITE_SETTINGS.accentColor,
      LEGACY_DEFAULT_COLORS.accentColor,
      LEGACY_DEFAULT_COLORS.legacyAccent,
    );
  const textColor =
    normalizeThemeColor(setting?.textColor, DEFAULT_SITE_SETTINGS.textColor);
  const mutedColor =
    normalizeThemeColor(setting?.mutedColor, DEFAULT_SITE_SETTINGS.mutedColor);
  const supportColor =
    normalizeThemeColor(setting?.supportColor, DEFAULT_SITE_SETTINGS.supportColor);
  const whatsappColor =
    normalizeThemeColor(setting?.whatsappColor, DEFAULT_SITE_SETTINGS.whatsappColor);
  const whatsappNumber =
    normalizeWhatsappNumber(setting?.whatsappNumber ?? "") ?? DEFAULT_SITE_SETTINGS.whatsappNumber;
  const logoUrl =
    setting?.logoUrl &&
    isSafeSiteUploadPath(setting.logoUrl, "logo") &&
    isSafeSiteImageUrl(setting.logoUrl)
      ? setting.logoUrl
      : null;
  const faviconUrl =
    setting?.faviconUrl &&
    isSafeSiteUploadPath(setting.faviconUrl, "favicon") &&
    isSafeSiteImageUrl(setting.faviconUrl)
      ? setting.faviconUrl
      : null;

  return withDerivedColors({
    siteName: cleanText(setting?.siteName, DEFAULT_SITE_SETTINGS.siteName),
    storeName: cleanText(setting?.storeName, DEFAULT_SITE_SETTINGS.storeName),
    tagline: cleanText(setting?.tagline, DEFAULT_SITE_SETTINGS.tagline),
    logoUrl,
    faviconUrl,
    primaryColor,
    secondaryColor,
    accentColor,
    supportColor,
    backgroundColor: primaryColor,
    cardColor: DEFAULT_SITE_SETTINGS.cardColor,
    textColor,
    mutedColor,
    borderColor: normalizeThemeColor(setting?.borderColor, DEFAULT_SITE_SETTINGS.borderColor),
    softWhiteColor: DEFAULT_SITE_SETTINGS.softWhiteColor,
    whatsappColor,
    whatsappNumber,
    email: cleanOptionalText(setting?.email),
    address: cleanOptionalText(setting?.address),
    googleMapsUrl: isValidHttpsUrl(setting?.googleMapsUrl ?? "")
      ? cleanOptionalText(setting?.googleMapsUrl)
      : "",
    businessHours: cleanOptionalText(setting?.businessHours),
    footerDescription: cleanText(setting?.footerDescription, DEFAULT_SITE_SETTINGS.footerDescription),
    announcementEnabled: setting?.announcementEnabled ?? DEFAULT_SITE_SETTINGS.announcementEnabled,
    announcementText: cleanText(setting?.announcementText, DEFAULT_SITE_SETTINGS.announcementText),
    announcementSpeed: clampAnnouncementSpeed(setting?.announcementSpeed),
    announcementLink: isValidAnnouncementLink(setting?.announcementLink ?? "")
      ? cleanOptionalText(setting?.announcementLink)
      : "",
    pageBgColor: DEFAULT_PAGE_BG,
    cardBgColor: DEFAULT_CARD_BG,
    softSectionColor: DEFAULT_SOFT_SECTION,
    textDarkColor: DEFAULT_TEXT_DARK,
    textMutedColor: DEFAULT_TEXT_MUTED,
  });
}

async function getLegacyStoreSettings(db: StoreSettingReader) {
  const [storeName, whatsappNumber] = await Promise.all([
    db.storeSetting.findUnique({ where: { key: "store_name" } }),
    db.storeSetting.findUnique({ where: { key: "store_whatsapp_number" } }),
  ]);

  const normalizedWhatsapp = normalizeWhatsappNumber(whatsappNumber?.value ?? "");

  return withDerivedColors({
    siteName: storeName?.value || DEFAULT_SITE_SETTINGS.siteName,
    storeName: storeName?.value || DEFAULT_SITE_SETTINGS.storeName,
    tagline: DEFAULT_SITE_SETTINGS.tagline,
    logoUrl: null,
    faviconUrl: null,
    primaryColor: DEFAULT_SITE_SETTINGS.primaryColor,
    secondaryColor: DEFAULT_SITE_SETTINGS.secondaryColor,
    accentColor: DEFAULT_SITE_SETTINGS.accentColor,
    supportColor: DEFAULT_SITE_SETTINGS.supportColor,
    backgroundColor: DEFAULT_SITE_SETTINGS.primaryColor,
    cardColor: DEFAULT_SITE_SETTINGS.cardColor,
    textColor: DEFAULT_SITE_SETTINGS.textColor,
    mutedColor: DEFAULT_SITE_SETTINGS.mutedColor,
    borderColor: DEFAULT_SITE_SETTINGS.borderColor,
    softWhiteColor: DEFAULT_SITE_SETTINGS.softWhiteColor,
    whatsappColor: DEFAULT_SITE_SETTINGS.whatsappColor,
    whatsappNumber: normalizedWhatsapp ?? DEFAULT_SITE_SETTINGS.whatsappNumber,
    email: "",
    address: "",
    googleMapsUrl: "",
    businessHours: "",
    footerDescription: DEFAULT_SITE_SETTINGS.footerDescription,
    announcementEnabled: DEFAULT_SITE_SETTINGS.announcementEnabled,
    announcementText: DEFAULT_SITE_SETTINGS.announcementText,
    announcementSpeed: DEFAULT_SITE_SETTINGS.announcementSpeed,
    announcementLink: DEFAULT_SITE_SETTINGS.announcementLink,
    pageBgColor: DEFAULT_PAGE_BG,
    cardBgColor: DEFAULT_CARD_BG,
    softSectionColor: DEFAULT_SOFT_SECTION,
    textDarkColor: DEFAULT_TEXT_DARK,
    textMutedColor: DEFAULT_TEXT_MUTED,
  });
}

async function loadPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const db = getDb();
    const setting = await db.siteSetting.findUnique({
      where: { singletonKey: SITE_SETTING_SINGLETON_KEY },
    });

    if (setting) return toPublicSiteSettings(setting);

    return getLegacyStoreSettings(db);
  } catch {
    return toPublicSiteSettings(null);
  }
}

/**
 * Cross-request cache for the site-settings singleton (read on every page via
 * the root layout + footer). Invalidated explicitly via revalidateTag("site-settings")
 * whenever settings are saved (see src/app/admin/store-settings/actions.ts);
 * the 300s revalidate is only a backstop. Wrapped again in React cache() for
 * per-request deduplication.
 */
const loadPublicSiteSettingsCached = unstable_cache(
  loadPublicSiteSettings,
  ["public-site-settings"],
  { tags: [SITE_SETTINGS_CACHE_TAG], revalidate: 300 },
);

export const getPublicSiteSettings = cache(loadPublicSiteSettingsCached);

export async function getOrCreateSiteSettings(db: SiteSettingReader & StoreSettingReader = getDb()) {
  const existing = await db.siteSetting.findUnique({
    where: { singletonKey: SITE_SETTING_SINGLETON_KEY },
  });

  if (existing) return toPublicSiteSettings(existing);

  const legacy = await getLegacyStoreSettings(db);

  const created = await db.siteSetting.create({
    data: {
      singletonKey: SITE_SETTING_SINGLETON_KEY,
      siteName: legacy.siteName,
      storeName: legacy.storeName,
      tagline: legacy.tagline,
      primaryColor: legacy.primaryColor,
      secondaryColor: legacy.secondaryColor,
      accentColor: legacy.accentColor,
      supportColor: legacy.supportColor,
      textColor: legacy.textColor,
      mutedColor: legacy.mutedColor,
      whatsappColor: legacy.whatsappColor,
      whatsappNumber: legacy.whatsappNumber,
      footerDescription: legacy.footerDescription,
      announcementEnabled: legacy.announcementEnabled,
      announcementText: legacy.announcementText,
      announcementSpeed: legacy.announcementSpeed,
      announcementLink: legacy.announcementLink || null,
    },
  });

  return toPublicSiteSettings(created);
}

export function buildSiteThemeStyle(settings: PublicSiteSettings) {
  return {
    "--store-color-base": settings.primaryColor,
    "--store-color-surface": settings.secondaryColor,
    "--store-color-support": settings.supportColor,
    "--store-color-accent": settings.accentColor,
    "--store-color-text-on-dark": settings.textColor,
    "--store-color-muted-on-dark": settings.mutedColor,
    "--store-color-text-on-light": "#111827",
    "--store-color-muted-on-light": "#5B6472",
    "--store-color-text-on-accent": "#0D0B61",
    "--store-color-border-dark": "rgba(255,255,255,0.08)",
    "--store-color-border-light": "rgba(13,11,97,0.12)",
    "--store-color-soft-dark": "rgba(255,255,255,0.04)",
    "--store-color-soft-light": "rgba(255,255,255,0.92)",
    "--store-page-bg": settings.pageBgColor,
    "--store-card-bg": settings.cardBgColor,
    "--store-soft-section": settings.softSectionColor,
    "--store-border": settings.borderColor,
    "--store-text": settings.textDarkColor,
    "--store-muted": settings.textMutedColor,
    "--brand-primary": settings.primaryColor,
    "--brand-primary-dark": settings.primaryDarkColor,
    "--brand-secondary": settings.secondaryColor,
    "--brand-hover": settings.hoverColor,
    "--brand-support": settings.supportColor,
    "--brand-accent": settings.accentColor,
    "--brand-accent-hover": settings.accentHoverColor,
    "--brand-accent-dark": settings.accentDarkColor ?? "#A4971D",
    "--brand-accent-text": "#0D0B61",
    "--brand-bg": settings.backgroundColor,
    "--brand-card": settings.cardColor,
    "--brand-text": settings.textColor,
    "--brand-muted": settings.mutedColor,
    "--brand-on-dark": settings.textColor,
    "--brand-muted-on-dark": settings.mutedColor,
    "--brand-on-light": "#111827",
    "--brand-muted-on-light": "#5B6472",
    "--brand-on-accent": "#0D0B61",
    "--brand-border": "rgba(255,255,255,0.08)",
    "--brand-border-light": "rgba(13,11,97,0.12)",
    "--brand-neutral": "rgba(255,255,255,0.08)",
    "--brand-soft": "rgba(255,255,255,0.04)",
    "--brand-soft-white": "rgba(255,255,255,0.92)",
    "--whatsapp-green": settings.whatsappColor,
    "--public-base": settings.primaryColor,
    "--public-surface": settings.secondaryColor,
    "--public-accent": settings.accentColor,
    "--public-text": settings.textColor,
    "--public-muted": settings.mutedColor,
    "--public-card": settings.cardColor,
    "--public-border": "rgba(255,255,255,0.08)",
    "--public-text-on-accent": "#0D0B61",
  } as React.CSSProperties;
}
