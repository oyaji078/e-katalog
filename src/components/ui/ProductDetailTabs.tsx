"use client";

import { useState } from "react";

import VoucherClaimButton from "@/components/ui/VoucherClaimButton";

type SpecRow = {
  label: string;
  value: string;
};

type PromoItem = {
  id: string;
  code: string;
  title: string;
  label: string;
  endsAt: string;
  isClaimed: boolean;
  isAuthenticated: boolean;
  canClaim: boolean;
  disabledReason?: string;
};

type ProductDetailTabsProps = {
  description: string;
  specs: SpecRow[];
  promos: PromoItem[];
};

type TabKey = "description" | "specs" | "promos";

export default function ProductDetailTabs({
  description,
  specs,
  promos,
}: ProductDetailTabsProps) {
  const [active, setActive] = useState<TabKey>("description");
  const tabs: Array<{ key: TabKey; label: string; show: boolean }> = [
    { key: "description", label: "Deskripsi Produk", show: true },
    { key: "specs", label: "Spesifikasi Teknis", show: true },
    { key: "promos", label: "Promo/Voucher", show: promos.length > 0 },
  ];
  const visibleTabs = tabs.filter((tab) => tab.show);

  return (
    <section className="rounded-3xl border border-[#D7DEE8] bg-white p-4 text-[#111827] shadow-sm sm:p-6">
      <div className="flex min-w-0 gap-2 overflow-x-auto border-b border-[#E5E7EB] pb-3 [scrollbar-width:none]">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
              active === tab.key
                ? "bg-[#0D0B61] text-white"
                : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#111827]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-5">
        {active === "description" ? (
          <div className="whitespace-pre-line text-sm leading-7 text-[#334155]">
            {description}
          </div>
        ) : null}

        {active === "specs" ? (
          specs.length > 0 ? (
            <dl className="grid gap-2 text-sm">
              {specs.map((item) => (
                <div
                  key={item.label}
                  className="grid gap-1 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 sm:grid-cols-[160px_1fr] sm:gap-4"
                >
                  <dt className="font-black text-[#111827]">{item.label}</dt>
                  <dd className="text-[#475569]">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm font-semibold text-[#475569]">Spesifikasi belum tersedia.</p>
          )
        ) : null}

        {active === "promos" ? (
          promos.length > 0 ? (
            <div className="grid gap-3">
              {promos.map((promo) => (
                <div
                  key={promo.id}
                  className="grid gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#111827]">
                      {promo.isClaimed ? `${promo.code} - ` : ""}
                      {promo.title}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#475569]">
                      {promo.label} berlaku sampai {promo.endsAt}
                    </p>
                  </div>
                  <VoucherClaimButton
                    voucherId={promo.id}
                    isAuthenticated={promo.isAuthenticated}
                    isClaimed={promo.isClaimed}
                    canClaim={promo.canClaim}
                    disabledReason={promo.disabledReason}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0D0B61]/20 bg-[#0D0B61] px-4 py-2 text-xs font-black text-white transition hover:bg-[#294669] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              ))}
            </div>
          ) : null
        ) : null}
      </div>
    </section>
  );
}
