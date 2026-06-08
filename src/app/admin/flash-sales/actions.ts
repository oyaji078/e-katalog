"use server";

import { revalidatePath } from "next/cache";

import { logAdminActivity } from "@/lib/activity-log";
import { getAdminSession, toUserRole } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export type FlashSaleFormState = {
  success: boolean;
  message: string;
  error?: string;
};

function failure(message: string): FlashSaleFormState {
  return { success: false, message, error: message };
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isChecked(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "1" || value === "true";
}

type FlashSaleProductInput = {
  productId: string;
  flashSalePublicPrice: number | null;
  flashSaleRetailPrice: number | null;
  flashSaleStock: number;
  sortOrder: number;
};

type ValidFlashSaleInput = {
  name: string;
  startDate: Date;
  endDate: Date;
  showForPublic: boolean;
  showForRetail: boolean;
  products: FlashSaleProductInput[];
};

type DbClient = ReturnType<typeof getDb>;

type NumberParseResult = { value: number } | { error: string };

function parseRequiredNumber(value: FormDataEntryValue | undefined, label: string): NumberParseResult {
  const raw = String(value ?? "").trim();
  if (!raw) return { error: `${label} harus diisi.` };

  const cleaned = raw.replace(/\./g, "");
  const numberValue = Number(cleaned);
  if (!Number.isFinite(numberValue)) return { error: `${label} harus berupa angka valid.` };

  return { value: numberValue };
}

function validateFlashPrice(price: number, sourcePrice: number, label: string): string | null {
  if (price <= 0) return `${label} harus lebih dari 0.`;
  if (price >= sourcePrice) return `${label} harus lebih rendah dari harga normal.`;
  return null;
}

async function validateFlashSaleInput(db: DbClient, formData: FormData): Promise<
  | { success: true; data: ValidFlashSaleInput }
  | { success: false; state: FlashSaleFormState }
> {
  const name = text(formData, "name");
  const startsAt = text(formData, "startsAt");
  const durationDaysRaw = text(formData, "durationDays");
  const showForPublic = isChecked(formData.get("showForPublic"));
  const showForRetail = isChecked(formData.get("showForRetail"));
  const useFlatDiscount = isChecked(formData.get("useFlatDiscount"));

  if (!name) return { success: false, state: failure("Nama flash sale harus diisi.") };
  if (!startsAt) return { success: false, state: failure("Tanggal mulai harus diisi.") };
  if (!showForPublic && !showForRetail) {
    return { success: false, state: failure("Pilih minimal satu audience flash sale.") };
  }

  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) {
    return { success: false, state: failure("Tanggal mulai tidak valid.") };
  }

  const durationDays = Number(durationDaysRaw);
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    return { success: false, state: failure("Durasi hari harus lebih dari 0.") };
  }

  const productIds = formData.getAll("productIds").map((value) => String(value).trim()).filter(Boolean);
  const flashSalePublicPrices = formData.getAll("flashSalePublicPrices");
  const flashSaleRetailPrices = formData.getAll("flashSaleRetailPrices");
  const flashSaleStocks = formData.getAll("flashSaleStocks");

  if (productIds.length === 0) {
    return { success: false, state: failure("Minimal satu produk harus dipilih.") };
  }

  let flatDiscount = 0;
  if (useFlatDiscount) {
    const discountResult = parseRequiredNumber(formData.get("potonganRata") ?? undefined, "Potongan Pukul Rata");
    if ("error" in discountResult) return { success: false, state: failure(discountResult.error) };
    if (discountResult.value <= 0) {
      return { success: false, state: failure("Potongan Pukul Rata harus lebih dari 0.") };
    }
    flatDiscount = discountResult.value;
  }

  const uniqueProductIds = Array.from(new Set(productIds));
  const products = await db.product.findMany({
    where: { id: { in: uniqueProductIds } },
    select: { id: true, name: true, publicPrice: true, retailPrice: true, status: true },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const productInputs: FlashSaleProductInput[] = [];

  for (let index = 0; index < productIds.length; index += 1) {
    const productId = productIds[index];
    const product = productById.get(productId);

    if (!product) {
      return { success: false, state: failure("Produk yang dipilih tidak ditemukan.") };
    }
    if (product.status !== "ACTIVE") {
      return { success: false, state: failure(`Produk "${product.name}" harus aktif untuk flash sale.`) };
    }

    let publicPrice: number | null = null;
    if (showForPublic) {
      const sourcePrice = Number(product.publicPrice);
      if (useFlatDiscount) {
        if (flatDiscount >= sourcePrice) {
          return { success: false, state: failure(`Potongan untuk "${product.name}" tidak boleh melebihi harga public.`) };
        }
        publicPrice = sourcePrice - flatDiscount;
      } else {
        const priceResult = parseRequiredNumber(
          flashSalePublicPrices[index],
          `Harga Flash Sale Public untuk "${product.name}"`,
        );
        if ("error" in priceResult) return { success: false, state: failure(priceResult.error) };
        publicPrice = priceResult.value;
      }

      const publicError = validateFlashPrice(publicPrice, sourcePrice, `Harga Flash Sale Public untuk "${product.name}"`);
      if (publicError) return { success: false, state: failure(publicError) };
    }

    let retailPrice: number | null = null;
    if (showForRetail) {
      if (!product.retailPrice) {
        return { success: false, state: failure(`Produk "${product.name}" belum memiliki Harga Jual Ritel.`) };
      }

      const sourcePrice = Number(product.retailPrice);
      if (useFlatDiscount) {
        if (flatDiscount >= sourcePrice) {
          return { success: false, state: failure(`Potongan untuk "${product.name}" tidak boleh melebihi harga ritel.`) };
        }
        retailPrice = sourcePrice - flatDiscount;
      } else {
        const priceResult = parseRequiredNumber(
          flashSaleRetailPrices[index],
          `Harga Flash Sale Ritel untuk "${product.name}"`,
        );
        if ("error" in priceResult) return { success: false, state: failure(priceResult.error) };
        retailPrice = priceResult.value;
      }

      const retailError = validateFlashPrice(retailPrice, sourcePrice, `Harga Flash Sale Ritel untuk "${product.name}"`);
      if (retailError) return { success: false, state: failure(retailError) };
    }

    const stockResult = parseRequiredNumber(flashSaleStocks[index], `Stok flash sale untuk "${product.name}"`);
    if ("error" in stockResult) return { success: false, state: failure(stockResult.error) };
    if (!Number.isInteger(stockResult.value) || stockResult.value <= 0) {
      return { success: false, state: failure(`Stok flash sale untuk "${product.name}" harus lebih dari 0.`) };
    }

    productInputs.push({
      productId,
      flashSalePublicPrice: publicPrice,
      flashSaleRetailPrice: retailPrice,
      flashSaleStock: stockResult.value,
      sortOrder: index,
    });
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);

  return {
    success: true,
    data: {
      name,
      startDate,
      endDate,
      showForPublic,
      showForRetail,
      products: productInputs,
    },
  };
}

export async function createFlashSaleAction(
  _prevState: FlashSaleFormState,
  formData: FormData,
): Promise<FlashSaleFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Tidak memiliki akses.");

  const db = getDb();
  const validation = await validateFlashSaleInput(db, formData);
  if (!validation.success) return validation.state;

  const flashSale = await db.flashSale.create({
    data: {
      name: validation.data.name,
      startsAt: validation.data.startDate,
      endsAt: validation.data.endDate,
      isActive: false,
      showForPublic: validation.data.showForPublic,
      showForRetail: validation.data.showForRetail,
    },
  });

  await db.flashSaleProduct.createMany({
    data: validation.data.products.map((product) => ({
      ...product,
      flashSaleId: flashSale.id,
    })),
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Flash sale created",
    targetType: "FlashSale",
    targetId: flashSale.id,
    risk: "MEDIUM",
    metadata: { name: validation.data.name, productCount: validation.data.products.length },
  });

  revalidateFlashSalePaths();
  return { success: true, message: "Flash sale berhasil dibuat." };
}

export async function updateFlashSaleAction(
  _prevState: FlashSaleFormState,
  formData: FormData,
): Promise<FlashSaleFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Tidak memiliki akses.");

  const db = getDb();
  const id = text(formData, "id");
  if (!id) return failure("ID flash sale diperlukan.");

  const validation = await validateFlashSaleInput(db, formData);
  if (!validation.success) return validation.state;

  await db.flashSale.update({
    where: { id },
    data: {
      name: validation.data.name,
      startsAt: validation.data.startDate,
      endsAt: validation.data.endDate,
      showForPublic: validation.data.showForPublic,
      showForRetail: validation.data.showForRetail,
    },
  });

  await db.flashSaleProduct.deleteMany({ where: { flashSaleId: id } });
  await db.flashSaleProduct.createMany({
    data: validation.data.products.map((product) => ({
      ...product,
      flashSaleId: id,
    })),
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Flash sale updated",
    targetType: "FlashSale",
    targetId: id,
    risk: "MEDIUM",
    metadata: { name: validation.data.name, productCount: validation.data.products.length },
  });

  revalidateFlashSalePaths();
  return { success: true, message: "Flash sale berhasil diperbarui." };
}

export async function toggleFlashSaleAction(
  _prevState: FlashSaleFormState,
  formData: FormData,
): Promise<FlashSaleFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Tidak memiliki akses.");

  const db = getDb();
  const id = text(formData, "id");
  if (!id) return failure("ID flash sale diperlukan.");

  const action = text(formData, "action");
  if (action !== "activate" && action !== "deactivate") return failure("Aksi tidak valid.");

  await db.flashSale.update({
    where: { id },
    data: { isActive: action === "activate" },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: action === "activate" ? "Flash sale activated" : "Flash sale deactivated",
    targetType: "FlashSale",
    targetId: id,
    risk: "MEDIUM",
    metadata: { isActive: action === "activate" },
  });

  revalidateFlashSalePaths();
  return {
    success: true,
    message: action === "activate" ? "Flash sale diaktifkan." : "Flash sale dinonaktifkan.",
  };
}

export async function deleteFlashSaleAction(
  _prevState: FlashSaleFormState,
  formData: FormData,
): Promise<FlashSaleFormState> {
  const session = await getAdminSession();
  if (!session) return failure("Tidak memiliki akses.");

  const db = getDb();
  const id = text(formData, "id");
  if (!id) return failure("ID flash sale diperlukan.");

  await db.flashSale.delete({ where: { id } });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "Flash sale deleted",
    targetType: "FlashSale",
    targetId: id,
    risk: "HIGH",
  });

  revalidateFlashSalePaths();
  return { success: true, message: "Flash sale berhasil dihapus." };
}

function revalidateFlashSalePaths() {
  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  revalidatePath("/products");
}
