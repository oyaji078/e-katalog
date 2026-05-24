"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import {
  deletePromoBannerImage,
  isLocalPromoBannerUploadPath,
  isSafePromoBannerImageUrl,
  savePromoBannerImage,
} from "@/lib/upload/storage";

export type BannerFormFields = {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  status: string;
  startsAt: string;
  endsAt: string;
  sortOrder: string;
  showForPublic: string;
  showForRetail: string;
  voucherCode: string;
};

export type BannerFormState = {
  success: boolean;
  message: string;
  error: string;
  fieldErrors: Partial<Record<keyof BannerFormFields, string>>;
  fields: BannerFormFields;
};

type DeleteResult = { success: boolean; error: string };

class BannerValidationError extends Error {}

const emptyFields: BannerFormFields = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "",
  ctaHref: "",
  status: "ACTIVE",
  startsAt: "",
  endsAt: "",
  sortOrder: "0",
  showForPublic: "1",
  showForRetail: "0",
  voucherCode: "",
};

const initialBannerFormState: BannerFormState = {
  success: false,
  message: "",
  error: "",
  fieldErrors: {},
  fields: emptyFields,
};

function text(formData: FormData, key: keyof BannerFormFields): string {
  return String(formData.get(key) ?? "").trim();
}

function readFields(formData: FormData): BannerFormFields {
  return {
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle"),
    imageUrl: text(formData, "imageUrl"),
    ctaLabel: text(formData, "ctaLabel"),
    ctaHref: text(formData, "ctaHref"),
    status: text(formData, "status"),
    startsAt: text(formData, "startsAt"),
    endsAt: text(formData, "endsAt"),
    sortOrder: text(formData, "sortOrder"),
    showForPublic: text(formData, "showForPublic"),
    showForRetail: text(formData, "showForRetail"),
    voucherCode: text(formData, "voucherCode"),
  };
}

function nullableText(value: string): string | null {
  return value || null;
}

function parseOptionalDate(value: string, boundary: "start" | "end"): Date | null {
  if (!value) return null;

  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnlyMatch
    ? new Date(`${value}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}`)
    : new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return date;
}

function parseSortOrder(value: string): number | null {
  if (!value) return 0;
  if (!/^-?\d+$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseAudienceBoolean(value: string): boolean {
  return value === "1" || value === "on" || value === "true";
}

function parseStatus(value: string): boolean | null {
  if (value === "ACTIVE") return true;
  if (value === "INACTIVE") return false;
  return null;
}

function hasBlockedProtocol(value: string): boolean {
  const normalized = value.trim().toLowerCase().replace(/[\u0000-\u001f\u007f\s]+/g, "");
  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("vbscript:")
  );
}

function isSafeCtaHref(value: string): boolean {
  if (!value) return true;
  if (hasBlockedProtocol(value)) return false;

  if (value.startsWith("/")) {
    return !value.startsWith("//") && !value.includes("\\");
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildErrorState(
  fields: BannerFormFields,
  fieldErrors: BannerFormState["fieldErrors"],
  fallback = "Periksa kembali data banner promo.",
): BannerFormState {
  return {
    success: false,
    message: "",
    error: Object.values(fieldErrors)[0] ?? fallback,
    fieldErrors,
    fields,
  };
}

function validateFields(fields: BannerFormFields): {
  fieldErrors: BannerFormState["fieldErrors"];
  showForPublic: boolean;
  showForRetail: boolean;
  isActive: boolean | null;
  sortOrder: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
} {
  const fieldErrors: BannerFormState["fieldErrors"] = {};
  const showForPublic = parseAudienceBoolean(fields.showForPublic);
  const showForRetail = parseAudienceBoolean(fields.showForRetail);
  const isActive = parseStatus(fields.status);
  const sortOrder = parseSortOrder(fields.sortOrder);
  const startsAt = parseOptionalDate(fields.startsAt, "start");
  const endsAt = parseOptionalDate(fields.endsAt, "end");

  if (!fields.title) {
    fieldErrors.title = "Judul Banner wajib diisi.";
  }

  if (isActive === null) {
    fieldErrors.status = "Status wajib dipilih.";
  }

  if (!showForPublic && !showForRetail) {
    fieldErrors.showForPublic = "Pilih minimal satu target audiens.";
  }

  if (sortOrder === null) {
    fieldErrors.sortOrder = "Urutan Tampilan harus berupa angka.";
  }

  if (fields.startsAt && !startsAt) {
    fieldErrors.startsAt = "Tanggal Mulai tidak valid.";
  }

  if (fields.endsAt && !endsAt) {
    fieldErrors.endsAt = "Tanggal Berakhir tidak valid.";
  }

  if (startsAt && endsAt && endsAt <= startsAt) {
    fieldErrors.endsAt = "Tanggal Berakhir harus setelah Tanggal Mulai.";
  }

  if (!isSafeCtaHref(fields.ctaHref)) {
    fieldErrors.ctaHref =
      "Link Tombol hanya boleh memakai path internal yang diawali / atau URL https://.";
  }

  if (fields.imageUrl && !isSafePromoBannerImageUrl(fields.imageUrl)) {
    fieldErrors.imageUrl =
      "Gambar Banner hanya boleh memakai file /uploads/... yang tersedia.";
  }

  return { fieldErrors, showForPublic, showForRetail, isActive, sortOrder, startsAt, endsAt };
}

async function requireAdminMutation(): Promise<BannerFormState | null> {
  const session = await getAdminSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return {
      ...initialBannerFormState,
      error: "Anda tidak memiliki akses untuk mengelola banner promo.",
    };
  }

  return null;
}

async function resolveImageUrl(formData: FormData, fields: BannerFormFields): Promise<string | null> {
  const uploadedFile = formData.get("imageFile");

  if (uploadedFile instanceof File && uploadedFile.size > 0) {
    try {
      return await savePromoBannerImage(uploadedFile);
    } catch (error) {
      if (error instanceof Error) {
        throw new BannerValidationError(error.message);
      }

      throw new BannerValidationError("Gambar Banner gagal diunggah.");
    }
  }

  if (formData.get("removeImage") === "1") {
    return null;
  }

  return nullableText(fields.imageUrl);
}

export async function createPromoBannerAction(formData: FormData): Promise<BannerFormState> {
  const fields = readFields(formData);
  const accessError = await requireAdminMutation();
  if (accessError) return { ...accessError, fields };

  const { fieldErrors, showForPublic, showForRetail, isActive, sortOrder, startsAt, endsAt } = validateFields(fields);
  if (Object.keys(fieldErrors).length > 0 || isActive === null || sortOrder === null) {
    return buildErrorState(fields, fieldErrors);
  }

  try {
    const imageUrl = await resolveImageUrl(formData, fields);
    const db = getDb();

    await db.promoBanner.create({
      data: {
        title: fields.title,
        subtitle: nullableText(fields.subtitle),
        imageUrl,
        linkUrl: nullableText(fields.ctaHref),
        ctaLabel: nullableText(fields.ctaLabel),
        showForPublic,
        showForRetail,
        isActive,
        startsAt,
        endsAt,
        sortOrder,
        voucherCode: nullableText(fields.voucherCode),
      },
    });
  } catch (error) {
    if (error instanceof BannerValidationError) {
      return buildErrorState(fields, { imageUrl: error.message });
    }

    return {
      success: false,
      message: "",
      error: "Banner promo gagal disimpan. Silakan coba lagi.",
      fieldErrors: {},
      fields,
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/promo-banners");
  redirect("/admin/promo-banners");
}

export async function updatePromoBannerAction(id: string, formData: FormData): Promise<BannerFormState> {
  const fields = readFields(formData);
  const accessError = await requireAdminMutation();
  if (accessError) return { ...accessError, fields };

  if (!id) {
    return {
      ...initialBannerFormState,
      fields,
      error: "ID banner promo tidak valid.",
    };
  }

  const { fieldErrors, showForPublic, showForRetail, isActive, sortOrder, startsAt, endsAt } = validateFields(fields);
  if (Object.keys(fieldErrors).length > 0 || isActive === null || sortOrder === null) {
    return buildErrorState(fields, fieldErrors);
  }

  try {
    const db = getDb();
    const existing = await db.promoBanner.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });

    if (!existing) {
      return {
        success: false,
        message: "",
        error: "Banner promo tidak ditemukan.",
        fieldErrors: {},
        fields,
      };
    }

    const imageUrl = await resolveImageUrl(formData, fields);

    await db.promoBanner.update({
      where: { id },
      data: {
        title: fields.title,
        subtitle: nullableText(fields.subtitle),
        imageUrl,
        linkUrl: nullableText(fields.ctaHref),
        ctaLabel: nullableText(fields.ctaLabel),
        showForPublic,
        showForRetail,
        isActive,
        startsAt,
        endsAt,
        sortOrder,
        voucherCode: nullableText(fields.voucherCode),
      },
    });

    if (
      existing.imageUrl &&
      existing.imageUrl !== imageUrl &&
      isLocalPromoBannerUploadPath(existing.imageUrl)
    ) {
      deletePromoBannerImage(existing.imageUrl);
    }
  } catch (error) {
    if (error instanceof BannerValidationError) {
      return buildErrorState(fields, { imageUrl: error.message });
    }

    return {
      success: false,
      message: "",
      error: "Banner promo gagal diperbarui. Silakan coba lagi.",
      fieldErrors: {},
      fields,
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/promo-banners");
  redirect("/admin/promo-banners");
}

export async function toggleBannerAction(
  id: string,
  formData: FormData,
): Promise<BannerFormState> {
  const session = await getAdminSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { ...initialBannerFormState, error: "Tidak memiliki akses." };
  }

  if (!id) return { ...initialBannerFormState, error: "ID banner tidak valid." };

  const actionValue = String(formData.get("action") ?? "").trim();
  if (actionValue !== "activate" && actionValue !== "deactivate") {
    return { ...initialBannerFormState, error: "Aksi tidak valid." };
  }

  let isActive = false;
  try {
    const db = getDb();
    isActive = actionValue === "activate";
    await db.promoBanner.update({ where: { id }, data: { isActive } });
  } catch {
    return { ...initialBannerFormState, error: "Gagal memperbarui status banner." };
  }

  revalidatePath("/");
  revalidatePath("/admin/promo-banners");
  return { success: true, message: isActive ? "Banner diaktifkan." : "Banner dinonaktifkan.", error: "", fieldErrors: {}, fields: emptyFields };
}

export async function deletePromoBannerAction(id: string): Promise<DeleteResult> {
  const session = await getAdminSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { success: false, error: "Anda tidak memiliki akses untuk menghapus banner promo." };
  }

  if (!id) {
    return { success: false, error: "ID banner promo tidak valid." };
  }

  try {
    const db = getDb();
    const existing = await db.promoBanner.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });

    if (!existing) {
      return { success: false, error: "Banner promo tidak ditemukan." };
    }

    await db.promoBanner.delete({ where: { id } });

    if (existing.imageUrl && isLocalPromoBannerUploadPath(existing.imageUrl)) {
      deletePromoBannerImage(existing.imageUrl);
    }
  } catch {
    return { success: false, error: "Banner promo gagal dihapus. Silakan coba lagi." };
  }

  revalidatePath("/");
  revalidatePath("/admin/promo-banners");
  return { success: true, error: "" };
}
