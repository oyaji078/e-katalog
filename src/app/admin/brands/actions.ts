"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { getDb } from "@/lib/db";
import { saveBrandImage, deleteBrandImage } from "@/lib/upload/storage";

export type BrandFormState = {
  success: boolean;
  message: string;
  error: string;
  fieldErrors: Partial<Record<"name" | "slug" | "sortOrder", string>>;
};

export type BrandStatusState = {
  success: boolean;
  message: string;
  error: string;
};

export type BrandDeleteState = {
  success: boolean;
  message: string;
  error: string;
};

const formInitial: BrandFormState = { success: false, message: "", error: "", fieldErrors: {} };
const statusInitial: BrandStatusState = { success: false, message: "", error: "" };
const deleteInitial: BrandDeleteState = { success: false, message: "", error: "" };

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) return "Anda tidak memiliki akses.";
  return null;
}

function revalidateBrandPaths() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/brands");
}

export async function createBrandAction(
  _previousState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const authError = await requireAdmin();
  if (authError) return { ...formInitial, error: authError };

  const name = text(formData, "name");
  const rawSlug = text(formData, "slug");
  const slug = slugify(rawSlug || name);
  const description = text(formData, "description") || null;
  const isActive = formData.get("isActive") === "1" || formData.get("isActive") === "on";
  const sortOrder = parseInt(text(formData, "sortOrder") || "0", 10);
  const logoFile = formData.get("logoUrl") as File | null;
  let logoUrl: string | null = null;

  const fieldErrors: BrandFormState["fieldErrors"] = {};

  if (!name) fieldErrors.name = "Nama merek wajib diisi.";
  if (!slug) fieldErrors.slug = "Slug tidak valid.";
  if (Number.isNaN(sortOrder) || sortOrder < 0) fieldErrors.sortOrder = "Urutan harus angka positif.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ...formInitial, error: fieldErrors.name ?? fieldErrors.slug ?? fieldErrors.sortOrder ?? "Periksa kembali data.", fieldErrors };
  }

  const db = getDb();

  const existing = await db.brand.findUnique({ where: { slug } });
  if (existing) {
    return { ...formInitial, error: "Slug sudah digunakan oleh merek lain.", fieldErrors: { slug: "Slug sudah digunakan." } };
  }

  if (logoFile && logoFile.size > 0) {
    try {
      logoUrl = await saveBrandImage(logoFile);
    } catch (error) {
      return {
        ...formInitial,
        error: error instanceof Error ? error.message : "Gagal mengupload logo merek.",
        fieldErrors: {},
      };
    }
  }

  const brand = await db.brand.create({
    data: { name, slug, logoUrl, description, isActive, sortOrder },
  });

  await logAdminActivity({
    actorId: (await getAdminSession())!.user.id,
    actorRole: toUserRole((await getAdminSession())!.user.role),
    action: "Brand created",
    targetType: "Brand",
    targetId: brand.id,
    risk: "LOW",
    metadata: { name: brand.name, slug: brand.slug },
  });

  revalidateBrandPaths();
  return { success: true, message: "Merek berhasil dibuat.", error: "", fieldErrors: {} };
}

export async function updateBrandAction(
  _previousState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const authError = await requireAdmin();
  if (authError) return { ...formInitial, error: authError };

  const id = text(formData, "id");
  const name = text(formData, "name");
  const rawSlug = text(formData, "slug");
  const slug = slugify(rawSlug || name);
  const description = text(formData, "description") || null;
  const sortOrder = parseInt(text(formData, "sortOrder") || "0", 10);
  const logoFile = formData.get("logoUrl") as File | null;
  const removeLogo = formData.get("removeLogo") === "1";

  if (!id) return { ...formInitial, error: "ID merek tidak valid." };

  const fieldErrors: BrandFormState["fieldErrors"] = {};

  if (!name) fieldErrors.name = "Nama merek wajib diisi.";
  if (!slug) fieldErrors.slug = "Slug tidak valid.";
  if (Number.isNaN(sortOrder) || sortOrder < 0) fieldErrors.sortOrder = "Urutan harus angka positif.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ...formInitial, error: fieldErrors.name ?? fieldErrors.slug ?? fieldErrors.sortOrder ?? "Periksa kembali data.", fieldErrors };
  }

  const db = getDb();

  const slugConflict = await db.brand.findFirst({
    where: { slug, id: { not: id } },
  });
  if (slugConflict) {
    return { ...formInitial, error: "Slug sudah digunakan oleh merek lain.", fieldErrors: { slug: "Slug sudah digunakan." } };
  }

  let logoUrl: string | null | undefined = undefined;

  if (removeLogo) {
    const current = await db.brand.findUnique({ where: { id }, select: { logoUrl: true } });
    if (current?.logoUrl) deleteBrandImage(current.logoUrl);
    logoUrl = null;
  } else if (logoFile && logoFile.size > 0) {
    try {
      const current = await db.brand.findUnique({ where: { id }, select: { logoUrl: true } });
      if (current?.logoUrl) deleteBrandImage(current.logoUrl);
      logoUrl = await saveBrandImage(logoFile);
    } catch (error) {
      return {
        ...formInitial,
        error: error instanceof Error ? error.message : "Gagal mengupload logo merek.",
        fieldErrors: {},
      };
    }
  }

  const brand = await db.brand.update({
    where: { id },
    data: { name, slug, description, sortOrder, ...(logoUrl !== undefined ? { logoUrl } : {}) },
  });

  await logAdminActivity({
    actorId: (await getAdminSession())!.user.id,
    actorRole: toUserRole((await getAdminSession())!.user.role),
    action: "Brand updated",
    targetType: "Brand",
    targetId: brand.id,
    risk: "MEDIUM",
    metadata: { name: brand.name, slug: brand.slug },
  });

  revalidateBrandPaths();
  return { success: true, message: "Merek berhasil diperbarui.", error: "", fieldErrors: {} };
}

export async function toggleBrandStatusAction(
  _previousState: BrandStatusState,
  formData: FormData,
): Promise<BrandStatusState> {
  const authError = await requireAdmin();
  if (authError) return { ...statusInitial, error: authError };

  const id = text(formData, "id");
  const activate = formData.get("activate") === "1";

  if (!id) return { ...statusInitial, error: "ID merek tidak valid." };

  const db = getDb();

  const existing = await db.brand.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, isActive: true, _count: { select: { products: true } } },
  });

  if (!existing) return { ...statusInitial, error: "Merek tidak ditemukan." };

  const brand = await db.brand.update({
    where: { id },
    data: { isActive: activate },
  });

  await logAdminActivity({
    actorId: (await getAdminSession())!.user.id,
    actorRole: toUserRole((await getAdminSession())!.user.role),
    action: activate ? "Brand activated" : "Brand deactivated",
    targetType: "Brand",
    targetId: brand.id,
    risk: "HIGH",
    metadata: { name: brand.name, slug: brand.slug, isActive: brand.isActive },
  });

  revalidateBrandPaths();
  return {
    success: true,
    message: activate ? "Merek diaktifkan." : "Merek dinonaktifkan.",
    error: "",
  };
}

export async function deleteBrandAction(
  _previousState: BrandDeleteState,
  formData: FormData,
): Promise<BrandDeleteState> {
  const authError = await requireAdmin();
  if (authError) return { ...deleteInitial, error: authError };

  const id = text(formData, "id");
  if (!id) return { ...deleteInitial, error: "ID merek tidak valid." };

  const db = getDb();

  const existing = await db.brand.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
  });

  if (!existing) return { ...deleteInitial, error: "Merek tidak ditemukan." };

  if (existing._count.products > 0) {
    return {
      ...deleteInitial,
      error: "Merek masih memiliki produk. Nonaktifkan merek jika ingin menyembunyikannya dari katalog.",
    };
  }

  const brandData = await db.brand.findUnique({ where: { id }, select: { logoUrl: true } });
  if (brandData?.logoUrl) deleteBrandImage(brandData.logoUrl);

  await db.brand.delete({ where: { id } });

  await logAdminActivity({
    actorId: (await getAdminSession())!.user.id,
    actorRole: toUserRole((await getAdminSession())!.user.role),
    action: "Brand deleted",
    targetType: "Brand",
    targetId: id,
    risk: "HIGH",
    metadata: { name: existing.name, slug: existing.slug },
  });

  revalidateBrandPaths();
  return { success: true, message: "Merek berhasil dihapus.", error: "" };
}
