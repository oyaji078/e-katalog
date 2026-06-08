import type { Prisma } from "@/generated/prisma/client";
import { productCardSelect } from "@/lib/catalog";

export const activeFlashSaleProductSelect = {
  productId: true,
  flashSalePublicPrice: true,
  flashSaleRetailPrice: true,
  flashSaleStock: true,
  sortOrder: true,
  flashSale: { select: { showForPublic: true, showForRetail: true, endsAt: true } },
  product: { select: productCardSelect },
} satisfies Prisma.FlashSaleProductSelect;

export type ActiveFlashSaleItem = {
  productId: string;
  flashSalePublicPrice: unknown | null;
  flashSaleRetailPrice: unknown | null;
  flashSaleStock: number;
  sortOrder?: number | null;
  flashSale: {
    showForPublic: boolean;
    showForRetail: boolean;
    endsAt?: Date;
  };
};

export type FlashSaleDisplay = {
  price: number;
  stock: number;
};

export function getFlashSaleDisplayForViewer(
  item: ActiveFlashSaleItem | undefined,
  canSeeRetailPrice: boolean,
): FlashSaleDisplay | undefined {
  if (!item) return undefined;

  if (canSeeRetailPrice && item.flashSale.showForRetail && item.flashSaleRetailPrice !== null) {
    return {
      price: Number(item.flashSaleRetailPrice),
      stock: item.flashSaleStock,
    };
  }

  if (item.flashSale.showForPublic && item.flashSalePublicPrice !== null) {
    return {
      price: Number(item.flashSalePublicPrice),
      stock: item.flashSaleStock,
    };
  }

  return undefined;
}

export function buildActiveFlashSaleMap(items: ActiveFlashSaleItem[]) {
  const map = new Map<string, ActiveFlashSaleItem>();

  for (const item of items) {
    if (!map.has(item.productId)) {
      map.set(item.productId, item);
    }
  }

  return map;
}
