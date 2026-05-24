"use server";

import { revalidatePath } from "next/cache";

import type { ProductStatus, StockStatus } from "@/generated/prisma/client";
import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { getDb } from "@/lib/db";
import { generateProductSku } from "@/lib/sku";
import { createProductSlug } from "@/lib/slug";
import { deleteProductImage, isLocalUploadPath, saveProductImage } from "@/lib/upload/storage";

export type ProductFormState = {
  success: boolean;
  message: string;
  error: string;
  productId: string;
};

const emptyState: ProductFormState = {
  success: false,
  message: "",
  error: "",
  productId: "",
};

function failure(error: string): ProductFormState {
  return { ...emptyState, error };
}

function ok(message: string, productId: string): ProductFormState {
  return { success: true, message, error: "", productId };
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? value : null;
}

function parseMoney(value: string): number {
  const cleaned = value.replace(/[Rr][Pp]\s*/g, "").replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseProductStatus(value: FormDataEntryValue | null): ProductStatus {
  if (value === "ACTIVE" || value === "ARCHIVED") return value;
  return "DRAFT";
}

function parseStockStatus(value: FormDataEntryValue | null): StockStatus {
  if (value === "LOW_STOCK" || value === "OUT_OF_STOCK" || value === "PREORDER") return value;
  return "READY";
}

function parseSpecifications(value: string) {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((acc, line) => {
        const [rawKey, ...rest] = line.split(":");
        const key = rawKey?.trim();
        const parsedValue = rest.join(":").trim();
        if (key && parsedValue) acc[key] = parsedValue;
        return acc;
      }, {});
  }
}

export async function createProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Tidak memiliki akses.");

  const db = getDb();

  const name = text(formData, "name");
  const categoryId = text(formData, "categoryId");
  const brandId = text(formData, "brandId");
  const description = text(formData, "description");
  const warrantyInfo = nullableText(formData, "warrantyInfo");
  const stockQuantity = Number(text(formData, "stockQuantity") || "0");
  const stockStatus = parseStockStatus(formData.get("stockStatus"));
  const status = parseProductStatus(formData.get("status"));
  const hargaBarang = parseMoney(text(formData, "hargaBarang"));
  const marginPublic = parseMoney(text(formData, "marginPublic"));
  const marginRitel = parseMoney(text(formData, "marginRitel"));
  const isRecommended = formData.get("isRecommended") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const specifications = parseSpecifications(text(formData, "specifications"));
  let primaryImageUrl = nullableText(formData, "primaryImageUrl");

  // Handle file upload
  const imageFile = formData.get("imageFile") as File | null;
  if (imageFile && imageFile.size > 0) {
    try {
      primaryImageUrl = await saveProductImage(imageFile);
    } catch (e) {
      return failure(String(e));
    }
  }

  if (!name) return failure("Nama produk harus diisi.");
  if (!categoryId) return failure("Kategori harus dipilih.");
  if (!brandId) return failure("Merek harus dipilih.");
  if (!description) return failure("Deskripsi produk harus diisi.");
  if (primaryImageUrl && !isLocalUploadPath(primaryImageUrl)) {
    return failure("Gambar produk harus memakai file unggahan lokal.");
  }
  if (hargaBarang < 0) return failure("Harga barang tidak boleh negatif.");
  if (marginPublic < 0) return failure("Margin publik tidak boleh negatif.");
  if (marginRitel < 0) return failure("Margin ritel tidak boleh negatif.");

  // Generate SKU
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { name: true } });
  const brand = await db.brand.findUnique({ where: { id: brandId }, select: { name: true } });
  if (!category) return failure("Kategori tidak ditemukan.");
  if (!brand) return failure("Merek tidak ditemukan.");

  let sku: string;
  try {
    sku = await generateProductSku(category.name, brand.name);
  } catch {
    return failure("Gagal menghasilkan SKU. Periksa kategori dan merek.");
  }

  const publicPrice = hargaBarang + marginPublic;
  const retailPrice = hargaBarang + marginRitel;

  let slug = createProductSlug(name);
  const existingSlug = await db.product.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = createProductSlug(name, { sku, forceWithSuffix: true });
  }

  const product = await db.product.create({
    data: {
      name,
      sku,
      slug,
      description,
      warrantyInfo,
      specifications,
      primaryImageUrl,
      costPrice: hargaBarang,
      publicMarginType: "FIXED_AMOUNT",
      publicMarginValue: marginPublic,
      retailMarginType: "FIXED_AMOUNT",
      retailMarginValue: marginRitel,
      publicPrice,
      retailPrice,
      stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
      stockStatus,
      status,
      isRecommended,
      isFeatured,
      categoryId,
      brandId,
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Product created",
    targetType: "Product",
    targetId: product.id,
    risk: "MEDIUM",
    metadata: { sku: product.sku, name: product.name },
  });

  revalidateProductPaths(product.id);
  return ok("Produk berhasil disimpan.", product.id);
}

export async function updateProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Tidak memiliki akses.");

  const productId = text(formData, "productId");
  if (!productId) return failure("ID produk diperlukan.");

  const db = getDb();
  const existingProduct = await db.product.findUnique({ where: { id: productId } });
  if (!existingProduct) return failure("Produk tidak ditemukan.");

  const name = text(formData, "name");
  const categoryId = text(formData, "categoryId");
  const brandId = text(formData, "brandId");
  const description = text(formData, "description");
  const warrantyInfo = nullableText(formData, "warrantyInfo");
  const stockQuantity = Number(text(formData, "stockQuantity") || "0");
  const stockStatus = parseStockStatus(formData.get("stockStatus"));
  const status = parseProductStatus(formData.get("status"));
  const hargaBarang = parseMoney(text(formData, "hargaBarang"));
  const marginPublic = parseMoney(text(formData, "marginPublic"));
  const marginRitel = parseMoney(text(formData, "marginRitel"));
  const isRecommended = formData.get("isRecommended") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const specifications = parseSpecifications(text(formData, "specifications"));
  let primaryImageUrl = nullableText(formData, "primaryImageUrl");

  // Handle file upload
  const imageFile = formData.get("imageFile") as File | null;
  if (imageFile && imageFile.size > 0) {
    try {
      primaryImageUrl = await saveProductImage(imageFile);
      // Delete old local image if present
      if (existingProduct.primaryImageUrl && isLocalUploadPath(existingProduct.primaryImageUrl)) {
        deleteProductImage(existingProduct.primaryImageUrl);
      }
    } catch (e) {
      return failure(String(e));
    }
  }

  // Handle image removal
  if (formData.get("removeImage") === "1" && existingProduct.primaryImageUrl) {
    if (isLocalUploadPath(existingProduct.primaryImageUrl)) {
      deleteProductImage(existingProduct.primaryImageUrl);
    }
    primaryImageUrl = null;
  }

  if (!name) return failure("Nama produk harus diisi.");
  if (!categoryId) return failure("Kategori harus dipilih.");
  if (!brandId) return failure("Merek harus dipilih.");
  if (!description) return failure("Deskripsi produk harus diisi.");
  if (primaryImageUrl && !isLocalUploadPath(primaryImageUrl)) {
    return failure("Gambar produk harus memakai file unggahan lokal.");
  }
  if (hargaBarang < 0) return failure("Harga barang tidak boleh negatif.");
  if (marginPublic < 0) return failure("Margin publik tidak boleh negatif.");
  if (marginRitel < 0) return failure("Margin ritel tidak boleh negatif.");

  const publicPrice = hargaBarang + marginPublic;
  const retailPrice = hargaBarang + marginRitel;

  let slug = existingProduct.slug;
  if (name !== existingProduct.name) {
    slug = createProductSlug(name);
    const existingSlug = await db.product.findFirst({
      where: { slug, NOT: { id: productId } },
    });
    if (existingSlug) {
      slug = createProductSlug(name, { sku: existingProduct.sku, forceWithSuffix: true });
    }
  }

  await db.product.update({
    where: { id: productId },
    data: {
      name,
      slug,
      description,
      warrantyInfo,
      specifications,
      primaryImageUrl,
      costPrice: hargaBarang,
      publicMarginType: "FIXED_AMOUNT",
      publicMarginValue: marginPublic,
      retailMarginType: "FIXED_AMOUNT",
      retailMarginValue: marginRitel,
      publicPrice,
      retailPrice,
      stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
      stockStatus,
      status,
      isRecommended,
      isFeatured,
      categoryId,
      brandId,
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Product updated",
    targetType: "Product",
    targetId: productId,
    risk: "MEDIUM",
    metadata: { sku: existingProduct.sku, name },
  });

  revalidateProductPaths(productId);
  return ok("Produk berhasil disimpan.", productId);
}

export async function deleteProductAction(productId: string): Promise<{ success: boolean; error: string }> {
  const session = await getAdminSession();
  if (!session) return { success: false, error: "Tidak memiliki akses." };

  if (!productId) return { success: false, error: "ID produk diperlukan." };

  const db = getDb();
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { images: { select: { id: true, url: true } } },
  });

  if (!product) return { success: false, error: "Produk tidak ditemukan." };

  // Delete local uploaded product images
  if (product.primaryImageUrl && isLocalUploadPath(product.primaryImageUrl)) {
    deleteProductImage(product.primaryImageUrl);
  }
  for (const img of product.images) {
    if (isLocalUploadPath(img.url)) {
      deleteProductImage(img.url);
    }
  }

  // Delete product (cascades to ProductImage, ProductVoucher, etc.)
  await db.product.delete({ where: { id: productId } });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Product deleted",
    targetType: "Product",
    targetId: productId,
    risk: "HIGH",
    metadata: { sku: product.sku, name: product.name },
  });

  revalidateProductPaths(productId);
  return { success: true, error: "" };
}

function revalidateProductPaths(productId: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/admin/products");
}
