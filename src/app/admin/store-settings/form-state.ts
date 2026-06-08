import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings-constants";

export type WebIdentityFields = {
  siteName: string;
  storeName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  supportColor: string;
  whatsappColor: string;
  whatsappNumber: string;
  email: string;
  address: string;
  googleMapsUrl: string;
  businessHours: string;
  footerDescription: string;
  announcementEnabled: string;
  announcementText: string;
  announcementSpeed: string;
  announcementLink: string;
};

export type WebIdentityFormState = {
  success: boolean;
  message: string;
  error: string;
  fieldErrors: Partial<Record<keyof WebIdentityFields, string | string[]>>;
  fields: WebIdentityFields;
};

const emptyFields: WebIdentityFields = {
  siteName: "",
  storeName: "",
  tagline: "",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: DEFAULT_SITE_SETTINGS.primaryColor,
  secondaryColor: DEFAULT_SITE_SETTINGS.secondaryColor,
  accentColor: DEFAULT_SITE_SETTINGS.accentColor,
  textColor: DEFAULT_SITE_SETTINGS.textColor,
  mutedColor: DEFAULT_SITE_SETTINGS.mutedColor,
  borderColor: DEFAULT_SITE_SETTINGS.borderColor,
  supportColor: DEFAULT_SITE_SETTINGS.supportColor,
  whatsappColor: DEFAULT_SITE_SETTINGS.whatsappColor,
  whatsappNumber: "",
  email: "",
  address: "",
  googleMapsUrl: "",
  businessHours: "",
  footerDescription: "",
  announcementEnabled: "on",
  announcementText: DEFAULT_SITE_SETTINGS.announcementText,
  announcementSpeed: String(DEFAULT_SITE_SETTINGS.announcementSpeed),
  announcementLink: "",
};

export const initialWebIdentityState: WebIdentityFormState = {
  success: false,
  message: "",
  error: "",
  fieldErrors: {},
  fields: emptyFields,
};
