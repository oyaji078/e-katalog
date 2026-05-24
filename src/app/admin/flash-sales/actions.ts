"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession } from "@/lib/admin-auth";
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

type FlashSaleProductInput = {
  productId: string;
  flashSalePrice: number;
  flashSaleStock: number;
  sortOrder: number;
};

type ValidFlashSaleInput = {
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
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

async function validateFlashSaleInput(db: DbClient, formData: FormData): Promise<
  | { success: true; data: ValidFlashSaleInput }
  | { success: false; state: FlashSaleFormState }
> {
  const name = text(formData, "name");
  const startsAt = text(formData, "startsAt");
  const durationDaysRaw = text(formData, "durationDays");
  const isActive = formData.get("isActive") === "on";

  if (!name) return { success: false, state: failure("Nama flash sale harus diisi.") };
  if (!startsAt) return { success: false, state: failure("Tanggal mulai harus diisi.") };

  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) {
    return { success: false, state: failure("Tanggal mulai tidak valid.") };
  }

  const durationDays = Number(durationDaysRaw);
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    return { success: false, state: failure("Durasi hari harus lebih dari 0.") };
  }

  const productIds = formData.getAll("productIds").map((value) => String(value).trim()).filter(Boolean);
  const flashSalePrices = formData.getAll("flashSalePrices");
  const flashSaleStocks = formData.getAll("flashSaleStocks");

  if (productIds.length === 0) {
    return { success: false, state: failure("Minimal satu produk harus dipilih.") };
  }

  const uniqueProductIds = Array.from(new Set(productIds));
  const products = await db.product.findMany({
    where: { id: { in: uniqueProductIds } },
    select: { id: true, name: true, publicPrice: true, status: true },
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

    const priceResult = parseRequiredNumber(flashSalePrices[index], `Harga flash sale untuk "${product.name}"`);
    if ("error" in priceResult) return { success: false, state: failure(priceResult.error) };
    if (priceResult.value <= 0) {
      return { success: false, state: failure(`Harga flash sale untuk "${product.name}" harus lebih dari 0.`) };
    }
    if (priceResult.value >= Number(product.publicPrice)) {
      return {
        success: false,
        state: failure(`Harga flash sale untuk "${product.name}" harus lebih rendah dari harga normal.`),
      };
    }

    const stockResult = parseRequiredNumber(flashSaleStocks[index], `Stok flash sale untuk "${product.name}"`);
    if ("error" in stockResult) return { success: false, state: failure(stockResult.error) };
    if (!Number.isInteger(stockResult.value) || stockResult.value <= 0) {
      return { success: false, state: failure(`Stok flash sale untuk "${product.name}" harus lebih dari 0.`) };
    }

    productInputs.push({
      productId,
      flashSalePrice: priceResult.value,
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
      isActive,
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
      isActive: validation.data.isActive,
    },
  });

  await db.flashSaleProduct.createMany({
    data: validation.data.products.map((product) => ({
      ...product,
      flashSaleId: flashSale.id,
    })),
  });

  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
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
      isActive: validation.data.isActive,
    },
  });

  await db.flashSaleProduct.deleteMany({ where: { flashSaleId: id } });
  await db.flashSaleProduct.createMany({
    data: validation.data.products.map((product) => ({
      ...product,
      flashSaleId: id,
    })),
  });

  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  return { success: true, message: "Flash sale berhasil diperbarui." };
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

  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  return { success: true, message: "Flash sale berhasil dihapus." };
}
