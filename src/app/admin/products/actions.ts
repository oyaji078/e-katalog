"use server";

import { revalidatePath } from "next/cache";

import type { ProductStatus, StockStatus } from "@/generated/prisma/client";
import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { getDb } from "@/lib/db";
import {
  normalizeProductPricingMode,
  resolveProductPricingFromForm,
  type ProductPricingMode,
} from "@/lib/pricing";
import { generateUniqueProductSku } from "@/lib/sku";
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

type ExistingImageRecord = { id: string; url: string };
type ExistingProductImageState = {
  primaryImageUrl: string | null;
  images: ExistingImageRecord[];
};
type GalleryImageInput = { url: string; sortOrder: number };

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SINGLE_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
const MAX_TOTAL_UPLOAD_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILE_COUNT = 8;

function validateImageFiles(files: File[]): string | null {
  if (files.length > MAX_FILE_COUNT) {
    return `Maksimal ${MAX_FILE_COUNT} gambar per produk.`;
  }

  let totalSize = 0;
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return "Format gambar harus JPG, PNG, atau WEBP.";
    }
    if (file.size > MAX_SINGLE_FILE_SIZE) {
      return "Ukuran satu gambar maksimal 3MB.";
    }
    const name = file.name.toLowerCase();
    if (name.endsWith(".svg") || name.endsWith(".exe") || name.endsWith(".js")) {
      return "Format gambar tidak valid.";
    }
    totalSize += file.size;
  }

  if (totalSize > MAX_TOTAL_UPLOAD_SIZE) {
    return "Ukuran total gambar terlalu besar. Maksimal 20MB.";
  }

  return null;
}

function getNewImageFiles(formData: FormData): File[] {
  return formData
    .getAll("newImages")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function getImageOrderRefs(formData: FormData) {
  return formData
    .getAll("imageOrder")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function appendUniqueImage(images: GalleryImageInput[], seenUrls: Set<string>, url: string) {
  if (!url || seenUrls.has(url)) return;
  images.push({ url, sortOrder: images.length });
  seenUrls.add(url);
}

async function saveNewImages(formData: FormData): Promise<string[]> {
  const savedUrls: string[] = [];

  try {
    for (const file of getNewImageFiles(formData)) {
      savedUrls.push(await saveProductImage(file));
    }
  } catch (error) {
    for (const url of savedUrls) deleteProductImage(url);
    throw error;
  }

  return savedUrls;
}

function cleanupProductImages(urls: Iterable<string>) {
  for (const url of new Set(urls)) {
    if (isLocalUploadPath(url)) deleteProductImage(url);
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function buildCreateGallery(formData: FormData, savedImageUrls: string[]) {
  const orderRefs = getImageOrderRefs(formData);
  const refs = orderRefs.length > 0 ? orderRefs : savedImageUrls.map((_, index) => `new:${index}`);
  const seenUrls = new Set<string>();
  const images: GalleryImageInput[] = [];

  for (const ref of refs) {
    if (!ref.startsWith("new:")) continue;
    const index = Number(ref.slice(4));
    const url = Number.isInteger(index) ? savedImageUrls[index] : undefined;
    if (url) appendUniqueImage(images, seenUrls, url);
  }

  const primaryRef = text(formData, "primaryImageRef");
  let primaryImageUrl: string | null = null;
  if (primaryRef.startsWith("new:")) {
    const index = Number(primaryRef.slice(4));
    primaryImageUrl = Number.isInteger(index) ? savedImageUrls[index] ?? null : null;
  }

  return {
    images,
    primaryImageUrl: primaryImageUrl ?? images[0]?.url ?? null,
  };
}

function buildUpdateGallery(
  formData: FormData,
  existingProduct: ExistingProductImageState,
  savedImageUrls: string[],
) {
  const existingById = new Map(existingProduct.images.map((image) => [image.id, image]));
  const oldUrls = new Set<string>();
  for (const image of existingProduct.images) oldUrls.add(image.url);
  if (existingProduct.primaryImageUrl) oldUrls.add(existingProduct.primaryImageUrl);

  const orderRefs = getImageOrderRefs(formData);
  const refs = orderRefs.length > 0
    ? orderRefs
    : [
        ...existingProduct.images.map((image) => `existing:${image.id}`),
        ...savedImageUrls.map((_, index) => `new:${index}`),
      ];

  const resolveRef = (ref: string): string | null => {
    if (ref.startsWith("existing:")) {
      return existingById.get(ref.slice(9))?.url ?? null;
    }

    if (ref.startsWith("legacy:")) {
      const legacyUrl = ref.slice(7);
      return legacyUrl === existingProduct.primaryImageUrl && isLocalUploadPath(legacyUrl)
        ? legacyUrl
        : null;
    }

    if (ref.startsWith("new:")) {
      const index = Number(ref.slice(4));
      return Number.isInteger(index) ? savedImageUrls[index] ?? null : null;
    }

    return null;
  };

  const seenUrls = new Set<string>();
  const images: GalleryImageInput[] = [];
  for (const ref of refs) {
    const url = resolveRef(ref);
    if (url) appendUniqueImage(images, seenUrls, url);
  }

  const primaryImageUrl = resolveRef(text(formData, "primaryImageRef")) ?? images[0]?.url ?? null;
  const retainedOldUrls = new Set(images.map((image) => image.url).filter((url) => oldUrls.has(url)));
  const removedOldUrls = Array.from(oldUrls).filter((url) => !retainedOldUrls.has(url));

  return { images, primaryImageUrl, removedOldUrls };
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
  const pricingResult = resolveProductPricingFromForm(formData);
  if (pricingResult.error || !pricingResult.pricing) {
    return failure(pricingResult.error ?? "Pengaturan harga tidak valid.");
  }
  const pricing = pricingResult.pricing;
  const specifications = parseSpecifications(text(formData, "specifications"));

  if (!name) return failure("Nama produk harus diisi.");
  if (!categoryId) return failure("Kategori harus dipilih.");
  if (!brandId) return failure("Merek harus dipilih.");
  if (!description) return failure("Deskripsi produk harus diisi.");

  // Generate SKU with retry
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { name: true } });
  const brand = await db.brand.findUnique({ where: { id: brandId }, select: { name: true } });
  if (!category) return failure("Kategori tidak ditemukan.");
  if (!brand) return failure("Merek tidak ditemukan.");

  let sku: string;
  try {
    sku = await generateUniqueProductSku(category.name, brand.name);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Gagal membuat kode produk unik. Coba simpan kembali.");
  }

  let slug = createProductSlug(name);
  const existingSlug = await db.product.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = createProductSlug(name, { sku, forceWithSuffix: true });
  }

  const newFiles = getNewImageFiles(formData);
  const validationError = validateImageFiles(newFiles);
  if (validationError) return failure(validationError);

  let savedImageUrls: string[] = [];
  try {
    savedImageUrls = await saveNewImages(formData);
  } catch (error) {
    return failure(errorMessage(error));
  }

  let product: { id: string; sku: string; slug: string | null; name: string };
  try {
    const gallery = buildCreateGallery(formData, savedImageUrls);
    product = await db.product.create({
      data: {
        name,
        sku,
        slug,
        description,
        warrantyInfo,
        specifications,
        primaryImageUrl: gallery.primaryImageUrl,
        pricingMode: pricing.pricingMode,
        costPrice: pricing.costPrice,
        publicMarginType: pricing.publicMarginType,
        publicMarginValue: pricing.publicMarginValue,
        retailMarginType: pricing.retailMarginType,
        retailMarginValue: pricing.retailMarginValue,
        publicPrice: pricing.publicPrice,
        retailPrice: pricing.retailPrice,
        stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
        stockStatus,
        status,
        categoryId,
        brandId,
        images: gallery.images.length > 0
          ? {
              create: gallery.images.map((image) => ({
                url: image.url,
                altText: name,
                sortOrder: image.sortOrder,
              })),
            }
          : undefined,
      },
      select: { id: true, sku: true, slug: true, name: true },
    });
  } catch {
    cleanupProductImages(savedImageUrls);
    return failure("Gagal menyimpan produk. Coba lagi.");
  }

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Product created",
    targetType: "Product",
    targetId: product.id,
    risk: "MEDIUM",
    metadata: { sku: product.sku, name: product.name },
  });

  revalidateProductPaths(product);
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
  const existingProduct = await db.product.findUnique({
    where: { id: productId },
    include: { images: { select: { id: true, url: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!existingProduct) return failure("Produk tidak ditemukan.");

  const name = text(formData, "name");
  const categoryId = text(formData, "categoryId");
  const brandId = text(formData, "brandId");
  const description = text(formData, "description");
  const warrantyInfo = nullableText(formData, "warrantyInfo");
  const stockQuantity = Number(text(formData, "stockQuantity") || "0");
  const stockStatus = parseStockStatus(formData.get("stockStatus"));
  const status = parseProductStatus(formData.get("status"));
  let fallbackPricingMode: ProductPricingMode = normalizeProductPricingMode(existingProduct.pricingMode);
  if (!text(formData, "pricingMode")) {
    const hargaJualField = text(formData, "hargaJual");
    const hargaPublikField = text(formData, "hargaPublik");
    if (hargaJualField || !hargaPublikField) {
      fallbackPricingMode = normalizeProductPricingMode(existingProduct.pricingMode);
    } else {
      fallbackPricingMode = "MANUAL_DUAL_PRICE";
    }
  }
  const pricingResult = resolveProductPricingFromForm(formData, fallbackPricingMode);
  if (pricingResult.error || !pricingResult.pricing) {
    return failure(pricingResult.error ?? "Pengaturan harga tidak valid.");
  }
  const pricing = pricingResult.pricing;
  const specifications = parseSpecifications(text(formData, "specifications"));

  if (!name) return failure("Nama produk harus diisi.");
  if (!categoryId) return failure("Kategori harus dipilih.");
  if (!brandId) return failure("Merek harus dipilih.");
  if (!description) return failure("Deskripsi produk harus diisi.");

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

  const newFiles = getNewImageFiles(formData);
  const validationError = validateImageFiles(newFiles);
  if (validationError) return failure(validationError);

  let savedImageUrls: string[] = [];
  try {
    savedImageUrls = await saveNewImages(formData);
  } catch (error) {
    return failure(errorMessage(error));
  }

  const gallery = buildUpdateGallery(formData, existingProduct, savedImageUrls);

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name,
          slug,
          description,
          warrantyInfo,
          specifications,
          primaryImageUrl: gallery.primaryImageUrl,
          pricingMode: pricing.pricingMode,
          costPrice: pricing.costPrice,
          publicMarginType: pricing.publicMarginType,
          publicMarginValue: pricing.publicMarginValue,
          retailMarginType: pricing.retailMarginType,
          retailMarginValue: pricing.retailMarginValue,
          publicPrice: pricing.publicPrice,
          retailPrice: pricing.retailPrice,
          stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
          stockStatus,
          status,
          categoryId,
          brandId,
        },
      });
      await tx.productImage.deleteMany({ where: { productId } });
      if (gallery.images.length > 0) {
        await tx.productImage.createMany({
          data: gallery.images.map((image) => ({
            productId,
            url: image.url,
            altText: name,
            sortOrder: image.sortOrder,
          })),
        });
      }
    });
  } catch {
    cleanupProductImages(savedImageUrls);
    return failure("Gagal menyimpan produk. Coba lagi.");
  }

  cleanupProductImages(gallery.removedOldUrls);

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Product updated",
    targetType: "Product",
    targetId: productId,
    risk: "MEDIUM",
    metadata: { sku: existingProduct.sku, name },
  });

  revalidateProductPaths(existingProduct);
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

  revalidateProductPaths(product);
  return { success: true, error: "" };
}

function revalidateProductPaths(product: { id: string; sku?: string | null; slug?: string | null }) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${product.id}`);
  if (product.slug) revalidatePath(`/products/${product.slug}`);
  if (product.sku) revalidatePath(`/products/${product.sku}`);
  revalidatePath("/admin/products");
}
