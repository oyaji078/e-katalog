export const DEFAULT_SITE_SETTINGS = {
  siteName: "Rama Computer Katalog",
  storeName: "Rama Komputer",
  tagline: "Katalog komputer dan aksesoris elektronik dengan alur inquiry WhatsApp.",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#1A3D6A",
  primaryDarkColor: "#102A4C",
  secondaryColor: "#2E4E79",
  hoverColor: "#3B6FA3",
  accentColor: "#C8A91E",
  accentHoverColor: "#E0C02A",
  backgroundColor: "#F5F8FC",
  cardColor: "#FFFFFF",
  textColor: "#1F2933",
  mutedColor: "#6B7280",
  borderColor: "#D8DEE8",
  whatsappNumber: "6280000000000",
  email: "",
  address: "",
  googleMapsUrl: "",
  businessHours: "",
  footerDescription: "Katalog komputer dan aksesoris elektronik dengan alur inquiry WhatsApp.",
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
  accentColor: string;
  accentHoverColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  whatsappNumber: string;
  email: string;
  address: string;
  googleMapsUrl: string;
  businessHours: string;
  footerDescription: string;
};
