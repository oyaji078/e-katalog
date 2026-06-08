import type { MarginType } from "@/generated/prisma/client";

export type ProductPricingMode = "ONE_PRICE" | "MANUAL_DUAL_PRICE" | "MARGIN_BASED";

export type ResolvedProductPricing = {
  pricingMode: ProductPricingMode;
  costPrice: number;
  publicMarginType: MarginType;
  publicMarginValue: number;
  retailMarginType: MarginType;
  retailMarginValue: number;
  publicPrice: number;
  retailPrice: number;
};

export function calculatePrice(costPrice: number, marginType: MarginType, marginValue: number) {
  if (marginType === "PERCENTAGE") {
    return costPrice + (costPrice * marginValue) / 100;
  }

  return costPrice + marginValue;
}

export function parseMoney(value: FormDataEntryValue | string | null, fallback = 0) {
  const normalized = String(value ?? "")
    .replace(/[Rr][Pp]\s*/g, "")
    .replace(/\s/g, "")
    .replace(/[^0-9,.-]/g, "");
  const cleaned = normalized.includes(",")
    ? normalized.replace(/\./g, "").replace(/,/g, ".")
    : normalizeDotSeparatedNumber(normalized);
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDotSeparatedNumber(value: string) {
  const parts = value.split(".");
  if (parts.length <= 1) return value;

  const [first, ...rest] = parts;
  if (first && rest.every((part) => part.length === 3)) {
    return parts.join("");
  }

  return value;
}

export function parseInteger(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseMarginType(value: FormDataEntryValue | null): MarginType {
  return value === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE";
}

export function normalizeProductPricingMode(
  value: FormDataEntryValue | string | null,
  fallback: ProductPricingMode = "ONE_PRICE",
): ProductPricingMode {
  if (value === "MANUAL_DUAL_PRICE" || value === "MARGIN_BASED" || value === "ONE_PRICE") {
    return value;
  }
  return fallback;
}

export function resolveProductPricingFromForm(
  formData: FormData,
  fallbackMode: ProductPricingMode = "ONE_PRICE",
): { pricing?: ResolvedProductPricing; error?: string } {
  const pricingMode = normalizeProductPricingMode(formData.get("pricingMode"), fallbackMode);

  if (pricingMode === "ONE_PRICE") {
    const hargaJual = parseMoney(formData.get("hargaJual"));
    if (hargaJual <= 0) return { error: "Harga jual harus lebih dari 0." };

    return {
      pricing: {
        pricingMode,
        costPrice: 0,
        publicMarginType: "FIXED_AMOUNT",
        publicMarginValue: 0,
        retailMarginType: "FIXED_AMOUNT",
        retailMarginValue: 0,
        publicPrice: hargaJual,
        retailPrice: hargaJual,
      },
    };
  }

  if (pricingMode === "MANUAL_DUAL_PRICE") {
    const publicPrice = parseMoney(formData.get("hargaPublik"));
    const retailPrice = parseMoney(formData.get("hargaRitel"));
    if (publicPrice <= 0) return { error: "Harga publik harus lebih dari 0." };
    if (retailPrice <= 0) return { error: "Harga ritel harus lebih dari 0." };

    return {
      pricing: {
        pricingMode,
        costPrice: 0,
        publicMarginType: "FIXED_AMOUNT",
        publicMarginValue: 0,
        retailMarginType: "FIXED_AMOUNT",
        retailMarginValue: 0,
        publicPrice,
        retailPrice,
      },
    };
  }

  const costPrice = parseMoney(formData.get("hargaBarang"));
  const publicMarginValue = parseMoney(formData.get("marginPublic"));
  const retailMarginValue = parseMoney(formData.get("marginRitel"));

  if (costPrice < 0) return { error: "Harga modal tidak boleh negatif." };
  if (publicMarginValue < 0) return { error: "Margin publik tidak boleh negatif." };
  if (retailMarginValue < 0) return { error: "Margin ritel tidak boleh negatif." };

  const publicPrice = calculatePrice(costPrice, "FIXED_AMOUNT", publicMarginValue);
  const retailPrice = calculatePrice(costPrice, "FIXED_AMOUNT", retailMarginValue);

  if (publicPrice <= 0) return { error: "Harga publik (harga modal + margin publik) harus lebih dari 0." };
  if (retailPrice <= 0) return { error: "Harga ritel (harga modal + margin ritel) harus lebih dari 0." };

  return {
    pricing: {
      pricingMode,
      costPrice,
      publicMarginType: "FIXED_AMOUNT",
      publicMarginValue,
      retailMarginType: "FIXED_AMOUNT",
      retailMarginValue,
      publicPrice,
      retailPrice,
    },
  };
}
