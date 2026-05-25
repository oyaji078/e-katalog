"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import {
  DEFAULT_SITE_SETTINGS,
  SITE_SETTING_SINGLETON_KEY,
  isSafeSiteUploadPath,
  isValidHttpsUrl,
  normalizeHexColor,
  normalizeWhatsappNumber,
} from "@/lib/site-settings";
import {
  deleteSiteImage,
  isLocalSiteUploadPath,
  saveSiteImage,
} from "@/lib/upload/storage";

export type WebIdentityFields = {
  siteName: string;
  storeName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  whatsappNumber: string;
  email: string;
  address: string;
  googleMapsUrl: string;
  businessHours: string;
  footerDescription: string;
};

export type WebIdentityFormState = {
  success: boolean;
  message: string;
  error: string;
  fieldErrors: Partial<Record<keyof WebIdentityFields, string>>;
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
  whatsappNumber: "",
  email: "",
  address: "",
  googleMapsUrl: "",
  businessHours: "",
  footerDescription: "",
};

export const initialWebIdentityState: WebIdentityFormState = {
  success: false,
  message: "",
  error: "",
  fieldErrors: {},
  fields: emptyFields,
};

function text(formData: FormData, key: keyof WebIdentityFields) {
  return String(formData.get(key) ?? "").trim();
}

function readFields(formData: FormData): WebIdentityFields {
  const resetColors = formData.get("intent") === "reset-colors";

  return {
    siteName: text(formData, "siteName"),
    storeName: text(formData, "storeName"),
    tagline: text(formData, "tagline"),
    logoUrl: text(formData, "logoUrl"),
    faviconUrl: text(formData, "faviconUrl"),
    primaryColor: resetColors ? DEFAULT_SITE_SETTINGS.primaryColor : text(formData, "primaryColor"),
    secondaryColor: resetColors ? DEFAULT_SITE_SETTINGS.secondaryColor : text(formData, "secondaryColor"),
    accentColor: resetColors ? DEFAULT_SITE_SETTINGS.accentColor : text(formData, "accentColor"),
    whatsappNumber: text(formData, "whatsappNumber"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    googleMapsUrl: text(formData, "googleMapsUrl"),
    businessHours: text(formData, "businessHours"),
    footerDescription: text(formData, "footerDescription"),
  };
}

function optionalText(value: string) {
  return value.trim() || null;
}

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildErrorState(
  fields: WebIdentityFields,
  fieldErrors: WebIdentityFormState["fieldErrors"],
  fallback = "Periksa kembali pengaturan web.",
): WebIdentityFormState {
  return {
    success: false,
    message: "",
    error: Object.values(fieldErrors)[0] ?? fallback,
    fieldErrors,
    fields,
  };
}

function validateFields(fields: WebIdentityFields) {
  const fieldErrors: WebIdentityFormState["fieldErrors"] = {};
  const primaryColor = normalizeHexColor(fields.primaryColor);
  const secondaryColor = normalizeHexColor(fields.secondaryColor);
  const accentColor = normalizeHexColor(fields.accentColor);
  const whatsappNumber = normalizeWhatsappNumber(fields.whatsappNumber);

  if (!fields.siteName) fieldErrors.siteName = "Nama website wajib diisi.";
  if (!fields.storeName) fieldErrors.storeName = "Nama toko wajib diisi.";
  if (!fields.tagline) fieldErrors.tagline = "Tagline wajib diisi.";
  if (!fields.footerDescription) {
    fieldErrors.footerDescription = "Deskripsi footer singkat wajib diisi.";
  }
  if (!primaryColor) fieldErrors.primaryColor = "Warna utama harus berupa hex, contoh #1A3D6A.";
  if (!secondaryColor) {
    fieldErrors.secondaryColor = "Warna sekunder harus berupa hex, contoh #2E4E79.";
  }
  if (!accentColor) fieldErrors.accentColor = "Warna aksen harus berupa hex, contoh #C8A91E.";
  if (!whatsappNumber) {
    fieldErrors.whatsappNumber =
      "Nomor WhatsApp wajib memakai format Indonesia, contoh 08123456789 atau 628123456789.";
  }
  if (!isValidEmail(fields.email)) fieldErrors.email = "Format email toko tidak valid.";
  if (fields.googleMapsUrl && !isValidHttpsUrl(fields.googleMapsUrl)) {
    fieldErrors.googleMapsUrl = "Link Google Maps harus memakai URL https://.";
  }
  if (fields.logoUrl && !isSafeSiteUploadPath(fields.logoUrl)) {
    fieldErrors.logoUrl = "Logo harus memakai file /uploads/site/logo-xxx.webp.";
  }
  if (fields.faviconUrl && !isSafeSiteUploadPath(fields.faviconUrl)) {
    fieldErrors.faviconUrl = "Favicon harus memakai file /uploads/site/favicon-xxx.webp.";
  }

  return { fieldErrors, primaryColor, secondaryColor, accentColor, whatsappNumber };
}

async function resolveUploadedImage(
  formData: FormData,
  fields: WebIdentityFields,
  key: "logo" | "favicon",
) {
  const file = formData.get(`${key}File`);
  const remove = formData.get(key === "logo" ? "removeLogo" : "removeFavicon") === "1";
  const existingPath = key === "logo" ? fields.logoUrl : fields.faviconUrl;

  if (file instanceof File && file.size > 0) {
    return saveSiteImage(file, key);
  }

  if (remove) return null;

  return optionalText(existingPath);
}

function revalidateSettingsSurfaces() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");
  revalidatePath("/login");
  revalidatePath("/register");
  revalidatePath("/vouchers");
  revalidatePath("/admin");
  revalidatePath("/admin/store-settings");
  revalidatePath("/super-admin");
}

export async function updateWebIdentityAction(
  _previousState: WebIdentityFormState,
  formData: FormData,
): Promise<WebIdentityFormState> {
  const fields = readFields(formData);
  const session = await getAdminSession();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return {
      ...initialWebIdentityState,
      fields,
      error: "Anda tidak memiliki akses untuk mengubah pengaturan web.",
    };
  }

  const { fieldErrors, primaryColor, secondaryColor, accentColor, whatsappNumber } =
    validateFields(fields);

  if (
    Object.keys(fieldErrors).length > 0 ||
    !primaryColor ||
    !secondaryColor ||
    !accentColor ||
    !whatsappNumber
  ) {
    return buildErrorState(fields, fieldErrors);
  }

  let logoUrl: string | null = null;
  let faviconUrl: string | null = null;

  try {
    logoUrl = await resolveUploadedImage(formData, fields, "logo");
    faviconUrl = await resolveUploadedImage(formData, fields, "favicon");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gambar gagal diunggah.";
    return buildErrorState(fields, { logoUrl: message }, message);
  }

  try {
    const db = getDb();
    const existing = await db.siteSetting.findUnique({
      where: { singletonKey: SITE_SETTING_SINGLETON_KEY },
      select: { logoUrl: true, faviconUrl: true },
    });

    await db.siteSetting.upsert({
      where: { singletonKey: SITE_SETTING_SINGLETON_KEY },
      update: {
        siteName: fields.siteName,
        storeName: fields.storeName,
        tagline: fields.tagline,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        whatsappNumber,
        email: optionalText(fields.email),
        address: optionalText(fields.address),
        googleMapsUrl: optionalText(fields.googleMapsUrl),
        businessHours: optionalText(fields.businessHours),
        footerDescription: fields.footerDescription,
      },
      create: {
        singletonKey: SITE_SETTING_SINGLETON_KEY,
        siteName: fields.siteName,
        storeName: fields.storeName,
        tagline: fields.tagline,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        whatsappNumber,
        email: optionalText(fields.email),
        address: optionalText(fields.address),
        googleMapsUrl: optionalText(fields.googleMapsUrl),
        businessHours: optionalText(fields.businessHours),
        footerDescription: fields.footerDescription,
      },
    });

    if (existing?.logoUrl && existing.logoUrl !== logoUrl && isLocalSiteUploadPath(existing.logoUrl)) {
      deleteSiteImage(existing.logoUrl);
    }
    if (
      existing?.faviconUrl &&
      existing.faviconUrl !== faviconUrl &&
      isLocalSiteUploadPath(existing.faviconUrl)
    ) {
      deleteSiteImage(existing.faviconUrl);
    }
  } catch {
    return {
      success: false,
      message: "",
      error: "Pengaturan web gagal disimpan. Silakan coba lagi.",
      fieldErrors: {},
      fields,
    };
  }

  revalidateSettingsSurfaces();

  return {
    success: true,
    message: "Pengaturan web berhasil disimpan.",
    error: "",
    fieldErrors: {},
    fields: {
      ...fields,
      logoUrl: logoUrl ?? "",
      faviconUrl: faviconUrl ?? "",
      primaryColor,
      secondaryColor,
      accentColor,
      whatsappNumber,
    },
  };
}
