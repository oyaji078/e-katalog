"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { getDb } from "@/lib/db";

export type CategoryFormState = {
  success: boolean;
  message: string;
  error: string;
  fieldErrors: Partial<Record<"name" | "slug" | "sortOrder", string>>;
};

export type CategoryStatusState = {
  success: boolean;
  message: string;
  error: string;
};

export type CategoryDeleteState = {
  success: boolean;
  message: string;
  error: string;
};

const formInitial: CategoryFormState = { success: false, message: "", error: "", fieldErrors: {} };
const statusInitial: CategoryStatusState = { success: false, message: "", error: "" };
const deleteInitial: CategoryDeleteState = { success: false, message: "", error: "" };

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

function revalidateCategoryPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/categories/${slug}`);
  revalidatePath("/admin/categories");
}

function buildFieldError(
  state: CategoryFormState,
  fieldErrors: CategoryFormState["fieldErrors"],
  fallback?: string,
): CategoryFormState {
  return {
    ...state,
    error: fieldErrors.name ?? fieldErrors.slug ?? fieldErrors.sortOrder ?? fallback ?? "Periksa kembali data.",
    fieldErrors,
  };
}

export async function createCategoryAction(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const authError = await requireAdmin();
  if (authError) return { ...formInitial, error: authError };

  const name = text(formData, "name");
  const rawSlug = text(formData, "slug");
  const slug = slugify(rawSlug || name);
  const icon = text(formData, "icon") || null;
  const description = text(formData, "description") || null;
  const isActive = formData.get("isActive") === "1" || formData.get("isActive") === "on";
  const sortOrder = parseInt(text(formData, "sortOrder") || "0", 10);

  const fieldErrors: CategoryFormState["fieldErrors"] = {};

  if (!name) fieldErrors.name = "Nama kategori wajib diisi.";
  if (!slug) fieldErrors.slug = "Slug tidak valid.";
  if (Number.isNaN(sortOrder)) fieldErrors.sortOrder = "Urutan harus berupa angka.";
  if (Number.isNaN(sortOrder) || sortOrder < 0) fieldErrors.sortOrder = "Urutan harus angka positif.";

  if (Object.keys(fieldErrors).length > 0) {
    return buildFieldError({ ...formInitial }, fieldErrors);
  }

  const db = getDb();

  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) {
    return buildFieldError({ ...formInitial }, { slug: "Slug sudah digunakan oleh kategori lain." });
  }

  const category = await db.category.create({
    data: { name, slug, icon, description, isActive, sortOrder },
  });

  await logAdminActivity({
    actorId: (await getAdminSession())!.user.id,
    actorRole: toUserRole((await getAdminSession())!.user.role),
    action: "Category created",
    targetType: "Category",
    targetId: category.id,
    risk: "LOW",
    metadata: { name: category.name, slug: category.slug },
  });

  revalidateCategoryPaths(category.slug);
  return { success: true, message: "Kategori berhasil dibuat.", error: "", fieldErrors: {} };
}

export async function updateCategoryAction(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const authError = await requireAdmin();
  if (authError) return { ...formInitial, error: authError };

  const id = text(formData, "id");
  const name = text(formData, "name");
  const rawSlug = text(formData, "slug");
  const slug = slugify(rawSlug || name);
  const icon = text(formData, "icon") || null;
  const description = text(formData, "description") || null;
  const sortOrder = parseInt(text(formData, "sortOrder") || "0", 10);

  if (!id) return { ...formInitial, error: "ID kategori tidak valid." };

  const fieldErrors: CategoryFormState["fieldErrors"] = {};

  if (!name) fieldErrors.name = "Nama kategori wajib diisi.";
  if (!slug) fieldErrors.slug = "Slug tidak valid.";
  if (Number.isNaN(sortOrder) || sortOrder < 0) fieldErrors.sortOrder = "Urutan harus angka positif.";

  if (Object.keys(fieldErrors).length > 0) {
    return buildFieldError({ ...formInitial }, fieldErrors);
  }

  const db = getDb();

  const slugConflict = await db.category.findFirst({
    where: { slug, id: { not: id } },
  });
  if (slugConflict) {
    return buildFieldError({ ...formInitial }, { slug: "Slug sudah digunakan oleh kategori lain." });
  }

  const category = await db.category.update({
    where: { id },
    data: { name, slug, icon, description, sortOrder },
  });

  await logAdminActivity({
    actorId: (await getAdminSession())!.user.id,
    actorRole: toUserRole((await getAdminSession())!.user.role),
    action: "Category updated",
    targetType: "Category",
    targetId: category.id,
    risk: "MEDIUM",
    metadata: { name: category.name, slug: category.slug },
  });

  revalidateCategoryPaths(category.slug);
  return { success: true, message: "Kategori berhasil diperbarui.", error: "", fieldErrors: {} };
}

export async function toggleCategoryStatusAction(
  _previousState: CategoryStatusState,
  formData: FormData,
): Promise<CategoryStatusState> {
  const authError = await requireAdmin();
  if (authError) return { ...statusInitial, error: authError };

  const id = text(formData, "id");
  const activate = formData.get("activate") === "1";

  if (!id) return { ...statusInitial, error: "ID kategori tidak valid." };

  const db = getDb();

  const existing = await db.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, isActive: true, _count: { select: { products: true } } },
  });

  if (!existing) return { ...statusInitial, error: "Kategori tidak ditemukan." };

  if (!activate && existing._count.products > 0) {
    return {
      ...statusInitial,
      error: "Kategori masih memiliki produk. Nonaktifkan kategori ini?",
    };
  }

  const category = await db.category.update({
    where: { id },
    data: { isActive: activate },
  });

  await logAdminActivity({
    actorId: (await getAdminSession())!.user.id,
    actorRole: toUserRole((await getAdminSession())!.user.role),
    action: activate ? "Category activated" : "Category deactivated",
    targetType: "Category",
    targetId: category.id,
    risk: "HIGH",
    metadata: { name: category.name, slug: category.slug, isActive: category.isActive },
  });

  revalidateCategoryPaths(category.slug);
  return {
    success: true,
    message: activate ? "Kategori diaktifkan." : "Kategori dinonaktifkan.",
    error: "",
  };
}

export async function deleteCategoryAction(
  _previousState: CategoryDeleteState,
  formData: FormData,
): Promise<CategoryDeleteState> {
  const authError = await requireAdmin();
  if (authError) return { ...deleteInitial, error: authError };

  const id = text(formData, "id");
  if (!id) return { ...deleteInitial, error: "ID kategori tidak valid." };

  const db = getDb();

  const existing = await db.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
  });

  if (!existing) return { ...deleteInitial, error: "Kategori tidak ditemukan." };

  if (existing._count.products > 0) {
    return {
      ...deleteInitial,
      error: "Kategori tidak dapat dihapus karena masih digunakan oleh produk. Gunakan Nonaktifkan sebagai gantinya.",
    };
  }

  await db.category.delete({ where: { id } });

  await logAdminActivity({
    actorId: (await getAdminSession())!.user.id,
    actorRole: toUserRole((await getAdminSession())!.user.role),
    action: "Category deleted",
    targetType: "Category",
    targetId: id,
    risk: "HIGH",
    metadata: { name: existing.name, slug: existing.slug },
  });

  revalidateCategoryPaths(existing.slug);
  return { success: true, message: "Kategori berhasil dihapus.", error: "" };
}
