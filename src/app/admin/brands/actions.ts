"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { getDb } from "@/lib/db";

export type BrandState = {
  success: boolean;
  message: string;
  error: string;
};

const fail = (error: string): BrandState => ({ success: false, message: "", error });
const ok = (message: string): BrandState => ({ success: true, message, error: "" });

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

export async function createBrandAction(
  _previousState: BrandState,
  formData: FormData,
): Promise<BrandState> {
  const session = await getAdminSession();
  if (!session) return fail("Unauthorized.");

  const name = text(formData, "name");
  if (!name) return fail("Brand name is required.");

  const brand = await getDb().brand.create({
    data: {
      name,
      slug: slugify(text(formData, "slug") || name),
      description: text(formData, "description") || null,
      logoUrl: text(formData, "logoUrl") || null,
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(text(formData, "sortOrder") || 0),
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Brand created",
    targetType: "Brand",
    targetId: brand.id,
    risk: "LOW",
    metadata: { name: brand.name, slug: brand.slug },
  });

  revalidateBrandPaths();
  return ok("Brand created.");
}

export async function updateBrandAction(
  _previousState: BrandState,
  formData: FormData,
): Promise<BrandState> {
  const session = await getAdminSession();
  if (!session) return fail("Unauthorized.");

  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!id || !name) return fail("Brand id and name are required.");

  const brand = await getDb().brand.update({
    where: { id },
    data: {
      name,
      slug: slugify(text(formData, "slug") || name),
      description: text(formData, "description") || null,
      logoUrl: text(formData, "logoUrl") || null,
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(text(formData, "sortOrder") || 0),
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Brand updated",
    targetType: "Brand",
    targetId: brand.id,
    risk: "MEDIUM",
    metadata: { name: brand.name, slug: brand.slug },
  });

  revalidateBrandPaths();
  return ok("Brand updated.");
}

export async function disableBrandAction(
  _previousState: BrandState,
  formData: FormData,
): Promise<BrandState> {
  const session = await getAdminSession();
  if (!session) return fail("Unauthorized.");

  const id = text(formData, "id");
  if (!id) return fail("Brand id is required.");

  const brand = await getDb().brand.update({
    where: { id },
    data: { isActive: false },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Brand disabled",
    targetType: "Brand",
    targetId: brand.id,
    risk: "HIGH",
    metadata: { name: brand.name, slug: brand.slug },
  });

  revalidateBrandPaths();
  return ok("Brand disabled.");
}

function revalidateBrandPaths() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/brands");
}
