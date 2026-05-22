import type { MarginType } from "@/generated/prisma/client";

export function calculatePrice(costPrice: number, marginType: MarginType, marginValue: number) {
  if (marginType === "PERCENTAGE") {
    return costPrice + (costPrice * marginValue) / 100;
  }

  return costPrice + marginValue;
}

export function parseMoney(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseInteger(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseMarginType(value: FormDataEntryValue | null): MarginType {
  return value === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE";
}
