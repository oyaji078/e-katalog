"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAdminActivity } from "@/lib/activity-log";
import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import {
  deletePromoBannerImage,
  isLocalPromoBannerUploadPath,
  isSafePromoBannerImageUrl,
  savePromoBannerImage,
} from "@/lib/upload/storage";

export type HeroBannerFormFields = {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  status: string;
  startsAt: string;
  endsAt: string;
  sortOrder: string;
};

export type HeroBannerFormState = {
  success: boolean;
  message: string;
  error: string;
  fieldErrors: Partial<Record<keyof HeroBannerFormFields, string>>;
  fields: HeroBannerFormFields;
};

type DeleteResult = { success: boolean; error: string };

class HeroBannerValidationError extends Error {}

const emptyFields: HeroBannerFormFields = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "",
  ctaHref: "",
  status: "ACTIVE",
  startsAt: "",
  endsAt: "",
  sortOrder: "0",
};

const initialFormState: HeroBannerFormState = {
  success: false,
  message: "",
  error: "",
  fieldErrors: {},
  fields: emptyFields,
};

function text(formData: FormData, key: keyof HeroBannerFormFields): string {
  return String(formData.get(key) ?? "").trim();
}

function readFields(formData: FormData): HeroBannerFormFields {
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
  fields: HeroBannerFormFields,
  fieldErrors: HeroBannerFormState["fieldErrors"],
  fallback = "Periksa kembali data hero banner.",
): HeroBannerFormState {
  return {
    success: false,
    message: "",
    error: Object.values(fieldErrors)[0] ?? fallback,
    fieldErrors,
    fields,
  };
}

function validateFields(fields: HeroBannerFormFields): {
  fieldErrors: HeroBannerFormState["fieldErrors"];
  isActive: boolean | null;
  sortOrder: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
} {
  const fieldErrors: HeroBannerFormState["fieldErrors"] = {};
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

  return { fieldErrors, isActive, sortOrder, startsAt, endsAt };
}

async function requireAdminMutation(): Promise<HeroBannerFormState | null> {
  const session = await getAdminSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return {
      ...initialFormState,
      error: "Anda tidak memiliki akses untuk mengelola hero banner.",
    };
  }

  return null;
}

async function resolveImageUrl(formData: FormData, fields: HeroBannerFormFields): Promise<string | null> {
  const uploadedFile = formData.get("imageFile");

  if (uploadedFile instanceof File && uploadedFile.size > 0) {
    try {
      return await savePromoBannerImage(uploadedFile);
    } catch (error) {
      if (error instanceof Error) {
        throw new HeroBannerValidationError(error.message);
      }

      throw new HeroBannerValidationError("Gambar Banner gagal diunggah.");
    }
  }

  if (formData.get("removeImage") === "1") {
    return null;
  }

  return nullableText(fields.imageUrl);
}

export async function createHeroBannerAction(formData: FormData): Promise<HeroBannerFormState> {
  const fields = readFields(formData);
  const accessError = await requireAdminMutation();
  if (accessError) return { ...accessError, fields };

  const { fieldErrors, isActive, sortOrder, startsAt, endsAt } = validateFields(fields);
  if (Object.keys(fieldErrors).length > 0 || isActive === null || sortOrder === null) {
    return buildErrorState(fields, fieldErrors);
  }

  const session = await getAdminSession();

  try {
    const imageUrl = await resolveImageUrl(formData, fields);
    const db = getDb();

    const created = await db.heroBanner.create({
      data: {
        title: fields.title,
        subtitle: nullableText(fields.subtitle),
        imageUrl,
        linkUrl: nullableText(fields.ctaHref),
        ctaLabel: nullableText(fields.ctaLabel),
        isActive,
        startsAt,
        endsAt,
        sortOrder,
      },
    });

    await logAdminActivity({
      actorId: session?.user.id ?? null,
      actorRole: toUserRole(session?.user.role ?? null),
      action: "Hero banner created",
      targetType: "HeroBanner",
      targetId: created.id,
      risk: "MEDIUM",
      metadata: { title: fields.title },
    });
  } catch (error) {
    if (error instanceof HeroBannerValidationError) {
      return buildErrorState(fields, { imageUrl: error.message });
    }

    return {
      success: false,
      message: "",
      error: "Hero banner gagal disimpan. Silakan coba lagi.",
      fieldErrors: {},
      fields,
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/hero-banners");
  redirect("/admin/hero-banners");
}

export async function updateHeroBannerAction(id: string, formData: FormData): Promise<HeroBannerFormState> {
  const fields = readFields(formData);
  const accessError = await requireAdminMutation();
  if (accessError) return { ...accessError, fields };

  if (!id) {
    return {
      ...initialFormState,
      fields,
      error: "ID hero banner tidak valid.",
    };
  }

  const { fieldErrors, isActive, sortOrder, startsAt, endsAt } = validateFields(fields);
  if (Object.keys(fieldErrors).length > 0 || isActive === null || sortOrder === null) {
    return buildErrorState(fields, fieldErrors);
  }

  const session = await getAdminSession();

  try {
    const db = getDb();
    const existing = await db.heroBanner.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });

    if (!existing) {
      return {
        success: false,
        message: "",
        error: "Hero banner tidak ditemukan.",
        fieldErrors: {},
        fields,
      };
    }

    const imageUrl = await resolveImageUrl(formData, fields);

    await db.heroBanner.update({
      where: { id },
      data: {
        title: fields.title,
        subtitle: nullableText(fields.subtitle),
        imageUrl,
        linkUrl: nullableText(fields.ctaHref),
        ctaLabel: nullableText(fields.ctaLabel),
        isActive,
        startsAt,
        endsAt,
        sortOrder,
      },
    });

    if (
      existing.imageUrl &&
      existing.imageUrl !== imageUrl &&
      isLocalPromoBannerUploadPath(existing.imageUrl)
    ) {
      deletePromoBannerImage(existing.imageUrl);
    }

    await logAdminActivity({
      actorId: session?.user.id ?? null,
      actorRole: toUserRole(session?.user.role ?? null),
      action: "Hero banner updated",
      targetType: "HeroBanner",
      targetId: id,
      risk: "MEDIUM",
      metadata: { title: fields.title },
    });
  } catch (error) {
    if (error instanceof HeroBannerValidationError) {
      return buildErrorState(fields, { imageUrl: error.message });
    }

    return {
      success: false,
      message: "",
      error: "Hero banner gagal diperbarui. Silakan coba lagi.",
      fieldErrors: {},
      fields,
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/hero-banners");
  redirect("/admin/hero-banners");
}

export async function deleteHeroBannerAction(id: string): Promise<DeleteResult> {
  const session = await getAdminSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { success: false, error: "Anda tidak memiliki akses untuk menghapus hero banner." };
  }

  if (!id) {
    return { success: false, error: "ID hero banner tidak valid." };
  }

  try {
    const db = getDb();
    const existing = await db.heroBanner.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });

    if (!existing) {
      return { success: false, error: "Hero banner tidak ditemukan." };
    }

    await db.heroBanner.delete({ where: { id } });

    if (existing.imageUrl && isLocalPromoBannerUploadPath(existing.imageUrl)) {
      deletePromoBannerImage(existing.imageUrl);
    }

    await logAdminActivity({
      actorId: session.user.id,
      actorRole: toUserRole(session.user.role),
      action: "Hero banner deleted",
      targetType: "HeroBanner",
      targetId: id,
      risk: "HIGH",
    });
  } catch {
    return { success: false, error: "Hero banner gagal dihapus. Silakan coba lagi." };
  }

  revalidatePath("/");
  revalidatePath("/admin/hero-banners");
  return { success: true, error: "" };
}
