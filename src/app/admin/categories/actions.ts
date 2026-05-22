"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { getDb } from "@/lib/db";

export type CategoryState = {
  success: boolean;
  message: string;
  error: string;
};

const initialFailure = (error: string): CategoryState => ({ success: false, message: "", error });
const ok = (message: string): CategoryState => ({ success: true, message, error: "" });

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

export async function createCategoryAction(
  _previousState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await getAdminSession();
  if (!session) return initialFailure("Unauthorized.");

  const name = text(formData, "name");
  if (!name) return initialFailure("Category name is required.");

  const db = getDb();
  const category = await db.category.create({
    data: {
      name,
      slug: slugify(text(formData, "slug") || name),
      description: text(formData, "description") || null,
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(text(formData, "sortOrder") || 0),
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Category created",
    targetType: "Category",
    targetId: category.id,
    risk: "LOW",
    metadata: { name: category.name, slug: category.slug },
  });

  revalidateCategoryPaths(category.slug);
  return ok("Category created.");
}

export async function updateCategoryAction(
  _previousState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await getAdminSession();
  if (!session) return initialFailure("Unauthorized.");

  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!id || !name) return initialFailure("Category id and name are required.");

  const db = getDb();
  const category = await db.category.update({
    where: { id },
    data: {
      name,
      slug: slugify(text(formData, "slug") || name),
      description: text(formData, "description") || null,
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(text(formData, "sortOrder") || 0),
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Category updated",
    targetType: "Category",
    targetId: category.id,
    risk: "MEDIUM",
    metadata: { name: category.name, slug: category.slug },
  });

  revalidateCategoryPaths(category.slug);
  return ok("Category updated.");
}

export async function disableCategoryAction(
  _previousState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await getAdminSession();
  if (!session) return initialFailure("Unauthorized.");

  const id = text(formData, "id");
  if (!id) return initialFailure("Category id is required.");

  const category = await getDb().category.update({
    where: { id },
    data: { isActive: false },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Category disabled",
    targetType: "Category",
    targetId: category.id,
    risk: "HIGH",
    metadata: { name: category.name, slug: category.slug },
  });

  revalidateCategoryPaths(category.slug);
  return ok("Category disabled.");
}

function revalidateCategoryPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/categories/${slug}`);
  revalidatePath("/admin/categories");
}
