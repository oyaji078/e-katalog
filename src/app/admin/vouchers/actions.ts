"use server";

import { revalidatePath } from "next/cache";

import type {
  VoucherAudience,
  VoucherDiscountType,
  VoucherScope,
  VoucherStatus,
} from "@/generated/prisma/client";
import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { parseInteger, parseMoney } from "@/lib/pricing";

export type VoucherFormState = {
  success: boolean;
  message: string;
  error: string;
  voucherId: string;
};

const emptyState: VoucherFormState = {
  success: false,
  message: "",
  error: "",
  voucherId: "",
};

function failure(error: string): VoucherFormState {
  return { ...emptyState, error };
}

function ok(message: string, voucherId: string): VoucherFormState {
  return { success: true, message, error: "", voucherId };
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableMoney(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? parseMoney(value) : null;
}

function selectedIds(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function parseAudience(value: FormDataEntryValue | null): VoucherAudience {
  return value === "RETAIL" ? "RETAIL" : "PUBLIC";
}

function parseDiscountType(value: FormDataEntryValue | null): VoucherDiscountType {
  return value === "PERCENTAGE" ? "PERCENTAGE" : "FIXED_AMOUNT";
}

function parseScope(value: FormDataEntryValue | null): VoucherScope {
  if (value === "PRODUCTS" || value === "CATEGORIES") return value;
  return "ALL";
}

function parseStatus(value: FormDataEntryValue | null): VoucherStatus {
  if (value === "ACTIVE" || value === "EXPIRED" || value === "DISABLED") return value;
  return "DRAFT";
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function voucherData(formData: FormData) {
  const scope = parseScope(formData.get("scope"));

  return {
    code: text(formData, "code").toUpperCase(),
    title: text(formData, "title"),
    description: text(formData, "description") || null,
    audience: parseAudience(formData.get("audience")),
    status: parseStatus(formData.get("status")),
    discountType: parseDiscountType(formData.get("discountType")),
    discountValue: parseMoney(formData.get("discountValue")),
    minimumPurchase: nullableMoney(formData, "minimumPurchase"),
    startsAt: parseDate(text(formData, "startsAt")),
    endsAt: parseDate(text(formData, "endsAt")),
    isActive: formData.get("isActive") === "on",
    usageQuota: parseInteger(formData.get("usageQuota")),
    scope,
    productIds: scope === "PRODUCTS" ? selectedIds(formData, "productIds") : [],
    categoryIds: scope === "CATEGORIES" ? selectedIds(formData, "categoryIds") : [],
  };
}

async function ensureVoucherFeature(audience: VoucherAudience) {
  const key = audience === "RETAIL" ? "enable_retail_voucher" : "enable_public_voucher";
  return isFeatureEnabled(key);
}

function validateVoucherData(data: ReturnType<typeof voucherData>) {
  if (!data.code || !data.title) return "Voucher code and title are required.";
  if (data.discountValue <= 0) return "Discount value must be greater than 0.";
  if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
    return "Percentage discount cannot be above 100.";
  }
  if (!data.startsAt || !data.endsAt) return "Start and end dates are required.";
  if (data.endsAt <= data.startsAt) return "End date must be after start date.";
  if (data.scope === "PRODUCTS" && data.productIds.length === 0) {
    return "Select at least one product for product vouchers.";
  }
  if (data.scope === "CATEGORIES" && data.categoryIds.length === 0) {
    return "Select at least one category for category vouchers.";
  }

  return null;
}

export async function createVoucherAction(
  _previousState: VoucherFormState,
  formData: FormData,
): Promise<VoucherFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Unauthorized.");

  const data = voucherData(formData);
  const validationError = validateVoucherData(data);
  if (validationError) return failure(validationError);

  const featureEnabled = await ensureVoucherFeature(data.audience);
  if (!featureEnabled) return failure("Voucher feature flag is disabled for this audience.");

  const db = getDb();
  const existingCode = await db.voucher.findUnique({ where: { code: data.code } });
  if (existingCode) return failure("Voucher code is already used.");

  const voucher = await db.voucher.create({
    data: {
      code: data.code,
      title: data.title,
      description: data.description,
      audience: data.audience,
      status: data.status,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minimumPurchase: data.minimumPurchase,
      startsAt: data.startsAt!,
      endsAt: data.endsAt!,
      isActive: data.isActive,
      usageQuota: data.usageQuota,
      scope: data.scope,
      categories: {
        connect: data.categoryIds.map((id) => ({ id })),
      },
      products: {
        create: data.productIds.map((productId) => ({
          product: { connect: { id: productId } },
        })),
      },
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Voucher created",
    targetType: "Voucher",
    targetId: voucher.id,
    risk: "MEDIUM",
    metadata: {
      code: voucher.code,
      audience: voucher.audience,
      scope: voucher.scope,
    },
  });

  revalidateVoucherPaths(voucher.id);
  return ok("Voucher created.", voucher.id);
}

export async function updateVoucherAction(
  _previousState: VoucherFormState,
  formData: FormData,
): Promise<VoucherFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Unauthorized.");

  const voucherId = text(formData, "voucherId");
  if (!voucherId) return failure("Voucher id is required.");

  const data = voucherData(formData);
  const validationError = validateVoucherData(data);
  if (validationError) return failure(validationError);

  const featureEnabled = await ensureVoucherFeature(data.audience);
  if (!featureEnabled) return failure("Voucher feature flag is disabled for this audience.");

  const db = getDb();
  const existingVoucher = await db.voucher.findUnique({ where: { id: voucherId } });
  if (!existingVoucher) return failure("Voucher not found.");

  const existingCode = await db.voucher.findFirst({
    where: {
      code: data.code,
      NOT: { id: voucherId },
    },
  });
  if (existingCode) return failure("Voucher code is already used.");

  const voucher = await db.voucher.update({
    where: { id: voucherId },
    data: {
      code: data.code,
      title: data.title,
      description: data.description,
      audience: data.audience,
      status: data.status,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minimumPurchase: data.minimumPurchase,
      startsAt: data.startsAt!,
      endsAt: data.endsAt!,
      isActive: data.isActive,
      usageQuota: data.usageQuota,
      scope: data.scope,
      categories: {
        set: data.categoryIds.map((id) => ({ id })),
      },
      products: {
        deleteMany: {},
        create: data.productIds.map((productId) => ({
          product: { connect: { id: productId } },
        })),
      },
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Voucher updated",
    targetType: "Voucher",
    targetId: voucher.id,
    risk: "MEDIUM",
    metadata: {
      code: voucher.code,
      audience: voucher.audience,
      previousStatus: existingVoucher.status,
      status: voucher.status,
    },
  });

  revalidateVoucherPaths(voucher.id);
  return ok("Voucher updated.", voucher.id);
}

export async function disableVoucherAction(
  _previousState: VoucherFormState,
  formData: FormData,
): Promise<VoucherFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Unauthorized.");

  const voucherId = text(formData, "voucherId");
  if (!voucherId) return failure("Voucher id is required.");

  const voucher = await getDb().voucher.update({
    where: { id: voucherId },
    data: {
      isActive: false,
      status: "DISABLED",
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Voucher disabled",
    targetType: "Voucher",
    targetId: voucher.id,
    risk: "HIGH",
    metadata: {
      code: voucher.code,
      audience: voucher.audience,
    },
  });

  revalidateVoucherPaths(voucher.id);
  return ok("Voucher disabled.", voucher.id);
}

function revalidateVoucherPaths(voucherId: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/vouchers");
  revalidatePath(`/admin/vouchers/${voucherId}/edit`);
  revalidatePath("/admin/vouchers");
}
