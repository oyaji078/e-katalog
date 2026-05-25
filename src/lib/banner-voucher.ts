import type { Prisma } from "@/generated/prisma/client";
import { formatRupiah, voucherLabel } from "@/lib/catalog";

export type SerializedBannerVoucher = {
  id: string;
  code: string;
  title: string;
  discountLabel: string;
  minimumLabel: string;
  audienceLabel: string;
  scheduleLabel: string;
  isLive: boolean;
};

export const bannerVoucherSelect = {
  id: true,
  code: true,
  title: true,
  discountType: true,
  discountValue: true,
  minimumPurchase: true,
  showForPublic: true,
  showForRetail: true,
  startsAt: true,
  endsAt: true,
  isActive: true,
  status: true,
} satisfies Prisma.VoucherSelect;

export type BannerVoucherSource = Prisma.VoucherGetPayload<{
  select: typeof bannerVoucherSelect;
}>;

export function serializeBannerVoucher(voucher: BannerVoucherSource): SerializedBannerVoucher {
  const now = new Date();

  return {
    id: voucher.id,
    code: voucher.code,
    title: voucher.title,
    discountLabel: voucherLabel(voucher),
    minimumLabel: voucher.minimumPurchase ? formatRupiah(voucher.minimumPurchase) : "-",
    audienceLabel: audienceLabel(voucher.showForPublic, voucher.showForRetail),
    scheduleLabel: `${dateLabel(voucher.startsAt)} - ${dateLabel(voucher.endsAt)}`,
    isLive:
      voucher.isActive &&
      voucher.status === "ACTIVE" &&
      voucher.startsAt <= now &&
      voucher.endsAt >= now,
  };
}

export function audienceLabel(showForPublic: boolean, showForRetail: boolean) {
  if (showForPublic && showForRetail) return "Public & Retail";
  if (showForRetail) return "Retail";
  return "Public";
}

export function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
