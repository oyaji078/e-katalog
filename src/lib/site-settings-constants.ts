// Cache tag for the site-settings singleton. Used by getPublicSiteSettings
// (unstable_cache) and revalidateTag(...) in the store-settings save actions.
export const SITE_SETTINGS_CACHE_TAG = "site-settings";

export const DEFAULT_SITE_SETTINGS = {
  siteName: "RAMA COMPUTER",
  storeName: "RAMA COMPUTER",
  tagline: "Katalog komputer dan aksesoris elektronik dengan alur inquiry WhatsApp.",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#0D0B61",
  primaryDarkColor: "#080735",
  secondaryColor: "#1A1A2E",
  hoverColor: "#2A2A4A",
  supportColor: "#2A2A4A",
  accentColor: "#E4D329",
  accentHoverColor: "#D2BE25",
  accentDarkColor: "#A4971D",
  backgroundColor: "#0D0B61",
  cardColor: "#14161E",
  textColor: "#F0F0F5",
  mutedColor: "#8A8A9E",
  borderColor: "#2A2A38",
  softWhiteColor: "#1C1E26",
  whatsappColor: "#22C55E",
  whatsappNumber: "6280000000000",
  email: "",
  address: "",
  googleMapsUrl: "",
  businessHours: "",
  footerDescription: "Katalog komputer dan aksesoris elektronik dengan alur inquiry WhatsApp.",
  announcementEnabled: true,
  announcementText: "Katalog komputer dan aksesoris premium - cek stok dan konsultasi via WhatsApp",
  announcementSpeed: 30,
  announcementLink: "",
} as const;

export type PublicSiteSettings = {
  siteName: string;
  storeName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  primaryDarkColor: string;
  secondaryColor: string;
  hoverColor: string;
  supportColor: string;
  accentColor: string;
  accentHoverColor: string;
  accentDarkColor?: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  softWhiteColor?: string;
  whatsappColor: string;
  whatsappNumber: string;
  email: string;
  address: string;
  googleMapsUrl: string;
  businessHours: string;
  footerDescription: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementSpeed: number;
  announcementLink: string;
  pageBgColor: string;
  cardBgColor: string;
  softSectionColor: string;
  textDarkColor: string;
  textMutedColor: string;
};

export const DEFAULT_PAGE_BG = "#0A0A0F";
export const DEFAULT_CARD_BG = "#14161E";
export const DEFAULT_SOFT_SECTION = "#1C1E26";
export const DEFAULT_TEXT_DARK = "#111827";
export const DEFAULT_TEXT_MUTED = "#5B6472";
