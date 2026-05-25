import type { SiteSetting } from "@/generated/prisma/client";

import { getDb } from "@/lib/db";
import {
  DEFAULT_SITE_SETTINGS,
  type PublicSiteSettings,
} from "@/lib/site-settings-constants";

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
  whatsappNumber: string;
  footerDescription: string;
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const SITE_UPLOAD_PATTERN = /^\/uploads\/site\/[a-z0-9][a-z0-9-]*\.webp$/;

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

export function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  return isValidHexColor(trimmed) ? trimmed.toUpperCase() : null;
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

export function isSafeSiteUploadPath(value: string | null | undefined) {
  if (!value) return true;
  return SITE_UPLOAD_PATTERN.test(value.trim());
}

function withDerivedColors(settings: Omit<PublicSiteSettings, "primaryDarkColor" | "hoverColor" | "accentHoverColor">) {
  const primaryDarkColor = isDefaultPrimary(settings.primaryColor)
    ? DEFAULT_SITE_SETTINGS.primaryDarkColor
    : mixHexColor(settings.primaryColor, "#000000", 0.35);
  const hoverColor = isDefaultPrimary(settings.primaryColor)
    ? DEFAULT_SITE_SETTINGS.hoverColor
    : mixHexColor(settings.primaryColor, "#FFFFFF", 0.22);

  return {
    ...settings,
    primaryDarkColor,
    hoverColor,
    accentHoverColor: mixHexColor(settings.accentColor, "#FFFFFF", 0.16),
  };
}

function toPublicSiteSettings(setting: SiteSetting | null): PublicSiteSettings {
  const primaryColor = normalizeHexColor(setting?.primaryColor ?? "") ?? DEFAULT_SITE_SETTINGS.primaryColor;
  const secondaryColor = normalizeHexColor(setting?.secondaryColor ?? "") ?? DEFAULT_SITE_SETTINGS.secondaryColor;
  const accentColor = normalizeHexColor(setting?.accentColor ?? "") ?? DEFAULT_SITE_SETTINGS.accentColor;
  const whatsappNumber =
    normalizeWhatsappNumber(setting?.whatsappNumber ?? "") ?? DEFAULT_SITE_SETTINGS.whatsappNumber;

  return withDerivedColors({
    siteName: cleanText(setting?.siteName, DEFAULT_SITE_SETTINGS.siteName),
    storeName: cleanText(setting?.storeName, DEFAULT_SITE_SETTINGS.storeName),
    tagline: cleanText(setting?.tagline, DEFAULT_SITE_SETTINGS.tagline),
    logoUrl: isSafeSiteUploadPath(setting?.logoUrl) ? setting?.logoUrl ?? null : null,
    faviconUrl: isSafeSiteUploadPath(setting?.faviconUrl) ? setting?.faviconUrl ?? null : null,
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor: DEFAULT_SITE_SETTINGS.backgroundColor,
    cardColor: DEFAULT_SITE_SETTINGS.cardColor,
    textColor: DEFAULT_SITE_SETTINGS.textColor,
    mutedColor: DEFAULT_SITE_SETTINGS.mutedColor,
    borderColor: DEFAULT_SITE_SETTINGS.borderColor,
    whatsappNumber,
    email: cleanOptionalText(setting?.email),
    address: cleanOptionalText(setting?.address),
    googleMapsUrl: isValidHttpsUrl(setting?.googleMapsUrl ?? "")
      ? cleanOptionalText(setting?.googleMapsUrl)
      : "",
    businessHours: cleanOptionalText(setting?.businessHours),
    footerDescription: cleanText(setting?.footerDescription, DEFAULT_SITE_SETTINGS.footerDescription),
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
    backgroundColor: DEFAULT_SITE_SETTINGS.backgroundColor,
    cardColor: DEFAULT_SITE_SETTINGS.cardColor,
    textColor: DEFAULT_SITE_SETTINGS.textColor,
    mutedColor: DEFAULT_SITE_SETTINGS.mutedColor,
    borderColor: DEFAULT_SITE_SETTINGS.borderColor,
    whatsappNumber: normalizedWhatsapp ?? DEFAULT_SITE_SETTINGS.whatsappNumber,
    email: "",
    address: "",
    googleMapsUrl: "",
    businessHours: "",
    footerDescription: DEFAULT_SITE_SETTINGS.footerDescription,
  });
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
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
      whatsappNumber: legacy.whatsappNumber,
      footerDescription: legacy.footerDescription,
    },
  });

  return toPublicSiteSettings(created);
}

export function buildSiteThemeStyle(settings: PublicSiteSettings) {
  return {
    "--brand-primary": settings.primaryColor,
    "--brand-primary-dark": settings.primaryDarkColor,
    "--brand-secondary": settings.secondaryColor,
    "--brand-hover": settings.hoverColor,
    "--brand-accent": settings.accentColor,
    "--brand-accent-hover": settings.accentHoverColor,
    "--brand-bg": settings.backgroundColor,
    "--brand-card": settings.cardColor,
    "--brand-text": settings.textColor,
    "--brand-muted": settings.mutedColor,
    "--brand-border": settings.borderColor,
  } as React.CSSProperties;
}
