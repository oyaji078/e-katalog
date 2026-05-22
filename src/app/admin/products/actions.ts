"use server";

import { revalidatePath } from "next/cache";

import type { ProductStatus, StockStatus } from "@/generated/prisma/client";
import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { calculatePrice, parseInteger, parseMarginType, parseMoney } from "@/lib/pricing";
import { createProductSlug } from "@/lib/slug";

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

function parseStockStatus(value: FormDataEntryValue | null): StockStatus {
  if (value === "LOW_STOCK" || value === "OUT_OF_STOCK" || value === "PREORDER") {
    return value;
  }

  return "READY";
}

function parseProductStatus(value: FormDataEntryValue | null): ProductStatus {
  if (value === "ACTIVE" || value === "ARCHIVED") {
    return value;
  }

  return "DRAFT";
}

function imageLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
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

        if (key && parsedValue) {
          acc[key] = parsedValue;
        }

        return acc;
      }, {});
  }
}

function productData(formData: FormData) {
  const costPrice = parseMoney(formData.get("costPrice"));
  const publicMarginType = parseMarginType(formData.get("publicMarginType"));
  const publicMarginValue = parseMoney(formData.get("publicMarginValue"));
  const retailMarginType = parseMarginType(formData.get("retailMarginType"));
  const retailMarginValue = parseMoney(formData.get("retailMarginValue"));
  const manualPublicPrice = text(formData, "publicPrice");
  const manualRetailPrice = text(formData, "retailPrice");
  const calculatedPublicPrice = calculatePrice(costPrice, publicMarginType, publicMarginValue);
  const calculatedRetailPrice = calculatePrice(costPrice, retailMarginType, retailMarginValue);

  return {
    name: text(formData, "name"),
    sku: text(formData, "sku"),
    categoryId: text(formData, "categoryId"),
    brandId: text(formData, "brandId"),
    description: text(formData, "description"),
    shortSpecification: nullableText(formData, "shortSpecification"),
    warrantyInfo: nullableText(formData, "warrantyInfo"),
    primaryImageUrl: nullableText(formData, "primaryImageUrl"),
    specifications: parseSpecifications(text(formData, "specifications")),
    costPrice,
    publicMarginType,
    publicMarginValue,
    retailMarginType,
    retailMarginValue,
    publicPrice: manualPublicPrice ? parseMoney(formData.get("publicPrice")) : calculatedPublicPrice,
    retailPrice: manualRetailPrice ? parseMoney(formData.get("retailPrice")) : calculatedRetailPrice,
    stockQuantity: parseInteger(formData.get("stockQuantity")),
    stockStatus: parseStockStatus(formData.get("stockStatus")),
    status: parseProductStatus(formData.get("status")),
    isRecommended: formData.get("isRecommended") === "on",
    isNewArrival: formData.get("isNewArrival") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isPromo: formData.get("isPromo") === "on",
    imageUrls: imageLines(text(formData, "imageUrls")),
  };
}

function validateProductData(data: ReturnType<typeof productData>) {
  if (!data.name || !data.sku || !data.categoryId || !data.brandId) {
    return "Name, SKU, category, and brand are required.";
  }

  if (!data.description) {
    return "Description is required.";
  }

  if (data.costPrice < 0 || data.publicPrice < 0 || Number(data.retailPrice) < 0) {
    return "Prices cannot be negative.";
  }

  return null;
}

export async function createProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Unauthorized.");

  const marginEnabled = await isFeatureEnabled("enable_margin_management");
  if (!marginEnabled) return failure("Margin management is currently disabled.");

  const data = productData(formData);
  const validationError = validateProductData(data);
  if (validationError) return failure(validationError);

  const db = getDb();
  const existingSku = await db.product.findUnique({ where: { sku: data.sku } });
  if (existingSku) return failure("SKU is already used by another product.");

  // Generate slug with duplicate detection
  let slug = createProductSlug(data.name);
  const existingSlug = await db.product.findUnique({ where: { slug } });
  if (existingSlug) {
    // Slug conflict detected, append SKU suffix
    slug = createProductSlug(data.name, { sku: data.sku, forceWithSuffix: true });
  }

  const product = await db.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      slug,
      description: data.description,
      shortSpecification: data.shortSpecification,
      warrantyInfo: data.warrantyInfo,
      specifications: data.specifications,
      costPrice: data.costPrice,
      publicMarginType: data.publicMarginType,
      publicMarginValue: data.publicMarginValue,
      retailMarginType: data.retailMarginType,
      retailMarginValue: data.retailMarginValue,
      publicPrice: data.publicPrice,
      retailPrice: data.retailPrice,
      stockQuantity: data.stockQuantity,
      stockStatus: data.stockStatus,
      status: data.status,
      isRecommended: data.isRecommended,
      isNewArrival: data.isNewArrival,
      isFeatured: data.isFeatured,
      isPromo: data.isPromo,
      primaryImageUrl: data.primaryImageUrl,
      categoryId: data.categoryId,
      brandId: data.brandId,
      images: {
        create: data.imageUrls.map((url, index) => ({
          url,
          sortOrder: index,
          altText: data.name,
        })),
      },
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Product created",
    targetType: "Product",
    targetId: product.id,
    risk: "MEDIUM",
    metadata: {
      sku: product.sku,
      name: product.name,
    },
  });

  revalidateProductPaths(product.id);
  return ok("Product created.", product.id);
}

export async function updateProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Unauthorized.");

  const marginEnabled = await isFeatureEnabled("enable_margin_management");
  if (!marginEnabled) return failure("Margin management is currently disabled.");

  const productId = text(formData, "productId");
  if (!productId) return failure("Product id is required.");

  const data = productData(formData);
  const validationError = validateProductData(data);
  if (validationError) return failure(validationError);

  const db = getDb();
  const existingProduct = await db.product.findUnique({ where: { id: productId } });
  if (!existingProduct) return failure("Product not found.");

  const existingSku = await db.product.findFirst({
    where: {
      sku: data.sku,
      NOT: { id: productId },
    },
  });
  if (existingSku) return failure("SKU is already used by another product.");

  // Generate or update slug with duplicate detection
  let slug = existingProduct.slug;
  if (data.name !== existingProduct.name) {
    // Name changed, regenerate slug
    slug = createProductSlug(data.name);
    // Check for conflicts with other products (exclude current product)
    const existingSlug = await db.product.findFirst({
      where: {
        slug,
        NOT: { id: productId },
      },
    });
    if (existingSlug) {
      // Slug conflict detected, append SKU suffix
      slug = createProductSlug(data.name, { sku: data.sku, forceWithSuffix: true });
    }
  }

  await db.$transaction([
    db.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        sku: data.sku,
        slug,
        description: data.description,
        shortSpecification: data.shortSpecification,
        warrantyInfo: data.warrantyInfo,
        specifications: data.specifications,
        costPrice: data.costPrice,
        publicMarginType: data.publicMarginType,
        publicMarginValue: data.publicMarginValue,
        retailMarginType: data.retailMarginType,
        retailMarginValue: data.retailMarginValue,
        publicPrice: data.publicPrice,
        retailPrice: data.retailPrice,
        stockQuantity: data.stockQuantity,
        stockStatus: data.stockStatus,
        status: data.status,
        isRecommended: data.isRecommended,
        isNewArrival: data.isNewArrival,
        isFeatured: data.isFeatured,
        isPromo: data.isPromo,
        primaryImageUrl: data.primaryImageUrl,
        categoryId: data.categoryId,
        brandId: data.brandId,
      },
    }),
    db.productImage.deleteMany({ where: { productId } }),
    ...data.imageUrls.map((url, index) =>
      db.productImage.create({
        data: {
          productId,
          url,
          sortOrder: index,
          altText: data.name,
        },
      }),
    ),
  ]);

  const actorRole = toUserRole(session.user.role);
  const priceChanged =
    Number(existingProduct.publicPrice) !== data.publicPrice ||
    Number(existingProduct.retailPrice ?? 0) !== Number(data.retailPrice ?? 0) ||
    Number(existingProduct.costPrice) !== data.costPrice;
  const marginChanged =
    existingProduct.publicMarginType !== data.publicMarginType ||
    Number(existingProduct.publicMarginValue) !== data.publicMarginValue ||
    existingProduct.retailMarginType !== data.retailMarginType ||
    Number(existingProduct.retailMarginValue) !== data.retailMarginValue;

  await logAdminActivity({
    actorId: session.user.id,
    actorRole,
    action: "Product updated",
    targetType: "Product",
    targetId: productId,
    risk: "MEDIUM",
    metadata: {
      sku: data.sku,
      name: data.name,
    },
  });

  if (priceChanged) {
    await logAdminActivity({
      actorId: session.user.id,
      actorRole,
      action: "Product price changed",
      targetType: "Product",
      targetId: productId,
      risk: "HIGH",
      metadata: { sku: data.sku },
    });
  }

  if (marginChanged) {
    await logAdminActivity({
      actorId: session.user.id,
      actorRole,
      action: "Product margin changed",
      targetType: "Product",
      targetId: productId,
      risk: "HIGH",
      metadata: { sku: data.sku },
    });
  }

  revalidateProductPaths(productId);
  return ok("Product updated.", productId);
}

export async function archiveProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Unauthorized.");

  const productId = text(formData, "productId");
  if (!productId) return failure("Product id is required.");

  const product = await getDb().product.update({
    where: { id: productId },
    data: { status: "ARCHIVED" },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Product archived",
    targetType: "Product",
    targetId: productId,
    risk: "HIGH",
    metadata: {
      sku: product.sku,
      name: product.name,
    },
  });

  revalidateProductPaths(productId);
  return ok("Product archived.", productId);
}

function revalidateProductPaths(productId: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin/prices");
}
