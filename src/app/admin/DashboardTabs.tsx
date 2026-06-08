"use client";

import Link from "next/link";
import { useState } from "react";

type KPIData = {
  totalProducts: number;
  totalInquiries: number;
  pendingRetail: number;
  activeVouchers: number;
  lowStockProducts: number;
  totalCategories: number;
  totalBrands: number;
};

type RecentProduct = {
  id: string;
  name: string;
  slug: string | null;
  createdAt: string;
  stockStatus: string;
};

type RecentInquiry = {
  id: string;
  customerName: string | null;
  sourcePage: string | null;
  status: string;
  createdAt: string;
};

type Props = {
  kpi: KPIData;
  recentProducts: RecentProduct[];
  recentInquiries: RecentInquiry[];
};

const TABS = ["Ringkasan", "Produk", "Retail", "Laporan"];

export default function DashboardTabs({ kpi, recentProducts, recentInquiries }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(i)}
            className={`border-b-2 px-4 py-2.5 text-[13px] transition ${
              active === i
                ? "border-[var(--color-accent)] font-semibold text-[var(--color-accent)]"
                : "border-transparent font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === 0 ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard label="Produk Aktif" value={kpi.totalProducts} href="/admin/products" accent="#3B82F6" icon="📦" />
            <KPICard label="Inquiry WhatsApp" value={kpi.totalInquiries} href="/admin/inquiries" accent="#16A34A" icon="💬" />
            <KPICard label="Pending Retail" value={kpi.pendingRetail} href="/admin/retail-users" accent="#D97706" icon="⏳" urgent={kpi.pendingRetail > 0} />
            <KPICard label="Voucher Aktif" value={kpi.activeVouchers} href="/admin/vouchers" accent="#7C3AED" icon="🎟" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Produk Terbaru</h3>
                <Link href="/admin/products" className="text-xs font-medium text-[var(--color-accent)]">
                  Lihat semua
                </Link>
              </div>
              <div>
                {recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3 transition last:border-0 hover:bg-[var(--color-page)]"
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-medium text-[var(--color-text)]">{product.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                        {new Date(product.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <StockBadge status={product.stockStatus} />
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Inquiry Terbaru</h3>
                <Link href="/admin/inquiries" className="text-xs font-medium text-[var(--color-accent)]">
                  Lihat semua
                </Link>
              </div>
              <div>
                {recentInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3 transition last:border-0 hover:bg-[var(--color-page)]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {inquiry.customerName ?? "Guest"}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                        {inquiry.sourcePage ?? "-"}
                      </p>
                    </div>
                    <InquiryBadge status={inquiry.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {active === 1 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <KPICard label="Total Aktif" value={kpi.totalProducts} href="/admin/products" accent="#3B82F6" icon="📦" />
            <KPICard label="Stok Menipis" value={kpi.lowStockProducts} href="/admin/products" accent="#D97706" icon="⚠️" urgent={kpi.lowStockProducts > 0} />
            <KPICard label="Total Kategori" value={kpi.totalCategories} href="/admin/categories" accent="#7C3AED" icon="🏷" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/products/new" className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white">
              Tambah Produk
            </Link>
            <Link href="/admin/products" className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)]">
              Lihat Semua Produk
            </Link>
          </div>
        </div>
      ) : null}

      {active === 2 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <KPICard label="Pending Approval" value={kpi.pendingRetail} href="/admin/retail-users" accent="#D97706" icon="⏳" urgent={kpi.pendingRetail > 0} />
            <KPICard label="Total Brand" value={kpi.totalBrands} href="/admin/brands" accent="#16A34A" icon="🏢" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/retail-users" className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white">
              Kelola Retail Users
            </Link>
            <Link href="/admin/generate-token" className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)]">
              Generate Token
            </Link>
          </div>
        </div>
      ) : null}

      {active === 3 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard label="Total Produk" value={kpi.totalProducts} href="/admin/products" accent="#3B82F6" icon="📦" />
            <KPICard label="Total Inquiry" value={kpi.totalInquiries} href="/admin/inquiries" accent="#16A34A" icon="💬" />
            <KPICard label="Voucher Aktif" value={kpi.activeVouchers} href="/admin/vouchers" accent="#7C3AED" icon="🎟" />
            <KPICard label="Retail Users" value={kpi.pendingRetail} href="/admin/retail-users" accent="#D97706" icon="👥" />
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <p className="text-sm text-[var(--color-text-muted)]">
              Export data dan analitik lengkap akan tersedia di fase berikutnya.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function softTint(accent: string): string {
  const map: Record<string, string> = {
    "#3B82F6": "#EFF6FF",
    "#16A34A": "#F0FDF4",
    "#D97706": "#FFFBEB",
    "#7C3AED": "#FAF5FF",
  };
  return map[accent] ?? "var(--color-accent-soft)";
}

function KPICard({
  label,
  value,
  href,
  accent,
  icon,
  urgent,
}: {
  label: string;
  value: number;
  href: string;
  accent: string;
  icon?: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-[14px] bg-white px-6 py-5 no-underline shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      style={{ border: urgent ? `1px solid ${accent}` : "1px solid var(--color-border)" }}
    >
      <span
        className="mb-3 flex size-10 items-center justify-center rounded-[10px] text-lg"
        style={{ background: softTint(accent), color: accent }}
      >
        {icon ?? "•"}
      </span>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="text-[30px] font-extrabold leading-none tracking-[-0.02em] text-[var(--color-text)]">
        {value.toLocaleString("id-ID")}
      </p>
      <span className="mt-2 block text-[11px] text-[var(--color-text-light)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        → Lihat detail
      </span>
    </Link>
  );
}

function StockBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    READY: "bg-green-50 text-green-700",
    LOW_STOCK: "bg-amber-50 text-amber-700",
    OUT_OF_STOCK: "bg-red-50 text-red-700",
    PREORDER: "bg-blue-50 text-blue-700",
  };
  const labels: Record<string, string> = {
    READY: "Tersedia",
    LOW_STOCK: "Menipis",
    OUT_OF_STOCK: "Habis",
    PREORDER: "Preorder",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? map.READY}`}>
      {labels[status] ?? status}
    </span>
  );
}

function InquiryBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "bg-amber-50 text-amber-700",
    CONTACTED: "bg-blue-50 text-blue-700",
    CLOSED: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}
