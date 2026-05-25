import type { Prisma } from "@/generated/prisma/client";
import { getVisibleVouchers } from "@/lib/catalog";
import { serializeBannerVoucher, type BannerVoucherSource } from "@/lib/banner-voucher";

export const publicPromoBannerSelect = {
  id: true,
  title: true,
  subtitle: true,
  imageUrl: true,
  linkUrl: true,
  ctaLabel: true,
  linkType: true,
  voucherId: true,
} satisfies Prisma.PromoBannerSelect;

export type PublicPromoBannerSource = Prisma.PromoBannerGetPayload<{
  select: typeof publicPromoBannerSelect;
}>;

export type PublicPromoBanner = Pick<
  PublicPromoBannerSource,
  "id" | "title" | "subtitle" | "imageUrl" | "linkUrl" | "ctaLabel"
> & {
  linkedVoucher?: ReturnType<typeof serializeBannerVoucher> | null;
};

export function toPublicPromoBanners(
  banners: PublicPromoBannerSource[],
  voucherById: Map<string, BannerVoucherSource>,
  options: {
    publicVoucherEnabled: boolean;
    retailVoucherEnabled: boolean;
    canSeeRetailVoucher: boolean;
  },
): PublicPromoBanner[] {
  return banners.flatMap((banner) => {
    if (banner.linkType !== "VOUCHER") {
      const row: PublicPromoBanner = {
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
        ctaLabel: banner.ctaLabel,
        linkedVoucher: null,
      };
      return [row];
    }

    if (!banner.voucherId) return [];
    const voucher = voucherById.get(banner.voucherId);
    if (!voucher) return [];

    const [visibleVoucher] = getVisibleVouchers([voucher], {
      publicVoucherEnabled: options.publicVoucherEnabled,
      retailVoucherEnabled: options.retailVoucherEnabled,
      canSeeRetail: options.canSeeRetailVoucher,
    });

    if (!visibleVoucher) return [];

    const linkedVoucher = serializeBannerVoucher(visibleVoucher);
    if (!linkedVoucher.isLive) return [];

    const row: PublicPromoBanner = {
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl,
      linkUrl: null,
      ctaLabel: null,
      linkedVoucher,
    };
    return [row];
  });
}
