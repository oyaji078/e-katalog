"use server";

import { revalidatePath, updateTag } from "next/cache";

import { requireAdmin } from "@/lib/access-control";
import { logAdminActivity } from "@/lib/activity-log";
import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { DEFAULT_SITE_SETTINGS, SITE_SETTINGS_CACHE_TAG } from "@/lib/site-settings-constants";
import {
  SITE_SETTING_SINGLETON_KEY,
  isValidAnnouncementLink,
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
import type { WebIdentityFields, WebIdentityFormState } from "./form-state";
import { initialWebIdentityState } from "./form-state";

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
    textColor: resetColors ? DEFAULT_SITE_SETTINGS.textColor : text(formData, "textColor"),
    mutedColor: resetColors ? DEFAULT_SITE_SETTINGS.mutedColor : text(formData, "mutedColor"),
    borderColor: resetColors ? DEFAULT_SITE_SETTINGS.borderColor : text(formData, "borderColor"),
    supportColor: resetColors ? DEFAULT_SITE_SETTINGS.supportColor : text(formData, "supportColor"),
    whatsappColor: resetColors ? DEFAULT_SITE_SETTINGS.whatsappColor : text(formData, "whatsappColor"),
    whatsappNumber: text(formData, "whatsappNumber"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    googleMapsUrl: text(formData, "googleMapsUrl"),
    businessHours: text(formData, "businessHours"),
    footerDescription: text(formData, "footerDescription"),
    announcementEnabled: formData.get("announcementEnabled") === "on" ? "on" : "",
    announcementText: text(formData, "announcementText"),
    announcementSpeed: text(formData, "announcementSpeed"),
    announcementLink: text(formData, "announcementLink"),
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
  const firstError = Object.values(fieldErrors)[0];

  return {
    success: false,
    message: "",
    error: Array.isArray(firstError) ? firstError[0] ?? fallback : firstError ?? fallback,
    fieldErrors: fieldErrors ?? {},
    fields,
  };
}

function hasNewFile(formData: FormData, key: string): boolean {
  const file = formData.get(key);
  return file instanceof File && file.size > 0;
}

function isRemoved(formData: FormData, key: "logo" | "favicon"): boolean {
  return formData.get(key === "logo" ? "removeLogo" : "removeFavicon") === "1";
}

function normalizeColorWithFallback(
  value: string,
  fallback: string,
  fieldKey: keyof WebIdentityFields,
  label: string,
  fieldErrors: WebIdentityFormState["fieldErrors"],
): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const normalized = normalizeHexColor(raw);
  if (!normalized) {
    fieldErrors[fieldKey] = `${label} harus berupa hex, contoh ${fallback}.`;
    return fallback;
  }
  return normalized;
}

function validateFields(fields: WebIdentityFields, formData: FormData) {
  const fieldErrors: WebIdentityFormState["fieldErrors"] = {};

  if (!fields.siteName) fieldErrors.siteName = "Nama website wajib diisi.";
  if (!fields.storeName) fieldErrors.storeName = "Nama toko wajib diisi.";
  if (!fields.tagline) fieldErrors.tagline = "Tagline wajib diisi.";
  if (!fields.footerDescription) {
    fieldErrors.footerDescription = "Deskripsi footer singkat wajib diisi.";
  }

  const primaryColor = normalizeColorWithFallback(
    fields.primaryColor, DEFAULT_SITE_SETTINGS.primaryColor,
    "primaryColor", "Warna Utama 60%", fieldErrors,
  );
  const secondaryColor = normalizeColorWithFallback(
    fields.secondaryColor, DEFAULT_SITE_SETTINGS.secondaryColor,
    "secondaryColor", "Warna Sekunder 30%", fieldErrors,
  );
  const accentColor = normalizeColorWithFallback(
    fields.accentColor, DEFAULT_SITE_SETTINGS.accentColor,
    "accentColor", "Warna Aksen 10%", fieldErrors,
  );
  const textColor = normalizeColorWithFallback(
    fields.textColor, DEFAULT_SITE_SETTINGS.textColor,
    "textColor", "Warna Teks Utama", fieldErrors,
  );
  const mutedColor = normalizeColorWithFallback(
    fields.mutedColor, DEFAULT_SITE_SETTINGS.mutedColor,
    "mutedColor", "Warna Teks Redup", fieldErrors,
  );
  const whatsappColor = normalizeColorWithFallback(
    fields.whatsappColor, DEFAULT_SITE_SETTINGS.whatsappColor,
    "whatsappColor", "Warna WhatsApp", fieldErrors,
  );
  const borderColor = normalizeColorWithFallback(
    fields.borderColor, DEFAULT_SITE_SETTINGS.borderColor,
    "borderColor", "Warna Netral / Border", fieldErrors,
  );
  const supportColor = normalizeColorWithFallback(
    fields.supportColor, DEFAULT_SITE_SETTINGS.supportColor,
    "supportColor", "Warna Pendukung", fieldErrors,
  );
  const whatsappNumber = normalizeWhatsappNumber(fields.whatsappNumber) ?? DEFAULT_SITE_SETTINGS.whatsappNumber;
  const announcementSpeed = Number.parseInt(fields.announcementSpeed, 10);

  if (!normalizeWhatsappNumber(fields.whatsappNumber)) {
    fieldErrors.whatsappNumber =
      "Nomor WhatsApp wajib memakai format Indonesia, contoh 08123456789 atau 628123456789.";
  }
  if (!isValidEmail(fields.email)) fieldErrors.email = "Format email toko tidak valid.";
  if (fields.googleMapsUrl && !isValidHttpsUrl(fields.googleMapsUrl)) {
    fieldErrors.googleMapsUrl = "Link Google Maps harus memakai URL https://.";
  }
  if (!Number.isFinite(announcementSpeed) || announcementSpeed < 10 || announcementSpeed > 120) {
    fieldErrors.announcementSpeed = "Kecepatan tulisan harus 10-120 detik.";
  }
  if (fields.announcementLink && !isValidAnnouncementLink(fields.announcementLink)) {
    fieldErrors.announcementLink = "Link tujuan harus berupa path situs atau URL https://.";
  }
  if (
    fields.logoUrl &&
    !hasNewFile(formData, "logoFile") &&
    !isRemoved(formData, "logo") &&
    !isSafeSiteUploadPath(fields.logoUrl, "logo")
  ) {
    fieldErrors.logoUrl = "Logo harus memakai file /uploads/site/logo-xxx.webp.";
  }
  if (
    fields.faviconUrl &&
    !hasNewFile(formData, "faviconFile") &&
    !isRemoved(formData, "favicon") &&
    !isSafeSiteUploadPath(fields.faviconUrl, "favicon")
  ) {
    fieldErrors.faviconUrl = "Favicon harus memakai file /uploads/site/favicon-xxx.webp.";
  }

  return {
    fieldErrors,
    primaryColor,
    secondaryColor,
    accentColor,
    textColor,
    mutedColor,
    whatsappColor,
    borderColor,
    supportColor,
    whatsappNumber,
    announcementSpeed,
  };
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
  // Invalidate the cross-request site-settings cache (see getPublicSiteSettings).
  // Next 16: updateTag = immediate, read-your-own-writes invalidation from a Server Action.
  updateTag(SITE_SETTINGS_CACHE_TAG);
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

  const {
    fieldErrors,
    primaryColor,
    secondaryColor,
    accentColor,
    textColor,
    mutedColor,
    whatsappColor,
    borderColor,
    supportColor,
    whatsappNumber,
    announcementSpeed,
  } =
    validateFields(fields, formData);

  if (
    Object.keys(fieldErrors).length > 0 ||
    !primaryColor ||
    !secondaryColor ||
    !accentColor ||
    !textColor ||
    !mutedColor ||
    !whatsappColor ||
    !borderColor ||
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
        textColor,
        mutedColor,
        borderColor,
        supportColor,
        whatsappColor,
        whatsappNumber,
        email: optionalText(fields.email),
        address: optionalText(fields.address),
        googleMapsUrl: optionalText(fields.googleMapsUrl),
        businessHours: optionalText(fields.businessHours),
        footerDescription: fields.footerDescription,
        announcementEnabled: fields.announcementEnabled === "on",
        announcementText: fields.announcementText,
        announcementSpeed,
        announcementLink: optionalText(fields.announcementLink),
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
        textColor,
        mutedColor,
        borderColor,
        supportColor,
        whatsappColor,
        whatsappNumber,
        email: optionalText(fields.email),
        address: optionalText(fields.address),
        googleMapsUrl: optionalText(fields.googleMapsUrl),
        businessHours: optionalText(fields.businessHours),
        footerDescription: fields.footerDescription,
        announcementEnabled: fields.announcementEnabled === "on",
        announcementText: fields.announcementText,
        announcementSpeed,
        announcementLink: optionalText(fields.announcementLink),
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

    await logAdminActivity({
      actorId: session.user.id,
      actorRole: toUserRole(session.user.role),
      action: "Web identity settings updated",
      targetType: "SiteSetting",
      targetId: SITE_SETTING_SINGLETON_KEY,
      risk: "MEDIUM",
      metadata: { siteName: fields.siteName, storeName: fields.storeName },
    });
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
      textColor,
      mutedColor,
      borderColor,
      supportColor,
      whatsappColor,
      whatsappNumber,
      announcementEnabled: fields.announcementEnabled === "on" ? "on" : "",
      announcementSpeed: String(announcementSpeed),
    },
  };
}

export async function updateStoreSetting(key: string, value: string) {
  await requireAdmin();
  const session = await getAdminSession();
  const db = getDb();

  await db.storeSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  await logAdminActivity({
    actorId: session?.user.id ?? null,
    actorRole: toUserRole(session?.user.role ?? null),
    action: "Store setting updated",
    targetType: "StoreSetting",
    targetId: key,
    risk: "MEDIUM",
    metadata: { key },
  });

  revalidatePath("/admin/store-settings");
  updateTag(SITE_SETTINGS_CACHE_TAG);

  return { success: true };
}
