"use server";

import { revalidatePath } from "next/cache";

import type {
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

function isChecked(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "1" || value === "true";
}

function voucherData(formData: FormData) {
  const scope = parseScope(formData.get("scope"));

  return {
    title: text(formData, "title"),
    description: text(formData, "description") || null,
    showForPublic: isChecked(formData.get("showForPublic")),
    showForRetail: isChecked(formData.get("showForRetail")),
    status: parseStatus(formData.get("status")),
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

function generateCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `VCR-${year}${month}-`;
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${randomPart}`;
}

async function generateUniqueCode(db: ReturnType<typeof getDb>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const existing = await db.voucher.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return `VCR-${Date.now().toString(36).toUpperCase()}`;
}

async function ensureVoucherFeature(showForRetail: boolean) {
  const key = showForRetail ? "enable_retail_voucher" : "enable_public_voucher";
  return isFeatureEnabled(key);
}

function validateVoucherData(data: ReturnType<typeof voucherData>) {
  if (!data.title) return "Judul voucher harus diisi.";
  if (!data.showForPublic && !data.showForRetail) return "Pilih minimal satu target audiens.";
  if (data.discountValue <= 0) return "Jumlah diskon harus lebih dari 0.";
  if (!data.startsAt || !data.endsAt) return "Tanggal mulai dan berakhir harus diisi.";
  if (data.endsAt <= data.startsAt) return "Tanggal berakhir harus setelah tanggal mulai.";
  if (data.scope === "PRODUCTS" && data.productIds.length === 0) {
    return "Pilih minimal satu produk.";
  }
  if (data.scope === "CATEGORIES" && data.categoryIds.length === 0) {
    return "Pilih minimal satu kategori.";
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

  const featureEnabled = await ensureVoucherFeature(data.showForRetail);
  if (!featureEnabled) return failure("Voucher feature flag is disabled for this audience.");

  const db = getDb();
  const code = await generateUniqueCode(db);

  const voucher = await db.voucher.create({
    data: {
      code,
      title: data.title,
      description: data.description,
      showForPublic: data.showForPublic,
      showForRetail: data.showForRetail,
      status: data.status,
      discountType: "FIXED_AMOUNT",
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
      showForPublic: voucher.showForPublic,
      showForRetail: voucher.showForRetail,
      scope: voucher.scope,
    },
  });

  revalidateVoucherPaths(voucher.id);
  return ok("Voucher berhasil dibuat.", voucher.id);
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

  const featureEnabled = await ensureVoucherFeature(data.showForRetail);
  if (!featureEnabled) return failure("Voucher feature flag is disabled for this audience.");

  const db = getDb();
  const existingVoucher = await db.voucher.findUnique({ where: { id: voucherId } });
  if (!existingVoucher) return failure("Voucher not found.");

  const voucher = await db.voucher.update({
    where: { id: voucherId },
    data: {
      title: data.title,
      description: data.description,
      showForPublic: data.showForPublic,
      showForRetail: data.showForRetail,
      status: data.status,
      discountType: "FIXED_AMOUNT",
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
      showForPublic: voucher.showForPublic,
      showForRetail: voucher.showForRetail,
      previousStatus: existingVoucher.status,
      status: voucher.status,
    },
  });

  revalidateVoucherPaths(voucher.id);
  return ok("Voucher updated.", voucher.id);
}

export async function toggleVoucherAction(
  _previousState: VoucherFormState,
  formData: FormData,
): Promise<VoucherFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Tidak memiliki akses.");

  const voucherId = text(formData, "voucherId");
  if (!voucherId) return failure("ID voucher diperlukan.");

  const action = text(formData, "action");
  if (action !== "activate" && action !== "deactivate") return failure("Aksi tidak valid.");

  const db = getDb();
  const existing = await db.voucher.findUnique({ where: { id: voucherId }, select: { isActive: true } });
  if (!existing) return failure("Voucher tidak ditemukan.");

  const isActive = action === "activate";
  const status = isActive ? "ACTIVE" : "DISABLED";

  const voucher = await db.voucher.update({
    where: { id: voucherId },
    data: { isActive, status },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: isActive ? "Voucher activated" : "Voucher deactivated",
    targetType: "Voucher",
    targetId: voucher.id,
    risk: "HIGH",
    metadata: { code: voucher.code },
  });

  revalidateVoucherPaths(voucher.id);
  return ok(isActive ? "Voucher diaktifkan." : "Voucher dinonaktifkan.", voucher.id);
}

export async function deleteVoucherAction(
  _previousState: VoucherFormState,
  formData: FormData,
): Promise<VoucherFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Tidak memiliki akses.");

  const voucherId = text(formData, "voucherId");
  if (!voucherId) return failure("ID voucher diperlukan.");

  const db = getDb();
  const voucher = await db.voucher.findUnique({ where: { id: voucherId }, select: { id: true, code: true } });
  if (!voucher) return failure("Voucher tidak ditemukan.");

  await db.voucher.delete({ where: { id: voucherId } });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Voucher deleted",
    targetType: "Voucher",
    targetId: voucherId,
    risk: "HIGH",
    metadata: { code: voucher.code },
  });

  revalidateVoucherPaths(voucherId);
  return ok("Voucher berhasil dihapus.", voucherId);
}

function revalidateVoucherPaths(voucherId: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/vouchers");
  revalidatePath(`/admin/vouchers/${voucherId}/edit`);
  revalidatePath("/admin/vouchers");
  revalidatePath("/admin/promo-vouchers");
}
