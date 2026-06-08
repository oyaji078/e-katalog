"use client";

import Link from "next/link";
import { useState } from "react";

import TrendChart, { type TrendChartPoint } from "@/components/dashboard/TrendChart";

type KPIData = {
  totalProducts: number;
  totalInquiries: number;
  pendingRetail: number;
  activeRetail: number;
  registeredRetail: number;
  activeVouchers: number;
  lowStockProducts: number;
  totalCategories: number;
  totalBrands: number;
};

type DashboardRange = {
  key: string;
  label: string;
  startInput: string;
  endInput: string;
};

type TopProduct = {
  id: string;
  name: string;
  count: number;
  href: string;
};

type DashboardAnalytics = {
  visits: number;
  productViews: number;
  whatsappClicks: number;
  inquiries: number;
  retailRegistrations: number;
  activeTokens: number;
  usedTokens: number;
  trend: TrendChartPoint[];
  topViewedProducts: TopProduct[];
  topWhatsappProducts: TopProduct[];
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
  range: DashboardRange;
  kpi: KPIData;
  analytics: DashboardAnalytics;
  recentProducts: RecentProduct[];
  recentInquiries: RecentInquiry[];
};

const TABS = ["Ringkasan", "Produk", "Retail", "Laporan"];

export default function DashboardTabs({ range, kpi, analytics, recentProducts, recentInquiries }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-6">
      <DateRangeForm range={range} />

      <div className="flex gap-1 border-b border-[var(--color-border)]">
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
            <KPICard label="Produk Aktif" value={kpi.totalProducts} href="/admin/products" tone="blue" />
            <KPICard label="Inquiry WhatsApp" value={kpi.totalInquiries} href="/admin/inquiries" tone="green" />
            <KPICard label="Pending Retail" value={kpi.pendingRetail} href="/admin/retail-users?tab=pending" tone="gold" urgent={kpi.pendingRetail > 0} />
            <KPICard label="Voucher Aktif" value={kpi.activeVouchers} href="/admin/vouchers" tone="violet" />
          </div>

          <section className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text)]">Tren aktivitas katalog</h2>
                <p className="text-sm text-[var(--color-text-muted)]">{range.label}</p>
              </div>
              <Link href={`/admin/reports?start=${range.startInput}&end=${range.endInput}`} className="text-sm font-semibold text-[var(--color-accent)]">
                Buka laporan
              </Link>
            </div>
            <TrendChart data={analytics.trend} />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <MetricBars
              title="Ringkasan periode"
              items={[
                { label: "Kunjungan", value: analytics.visits },
                { label: "View produk", value: analytics.productViews },
                { label: "Klik WhatsApp", value: analytics.whatsappClicks },
                { label: "Inquiry masuk", value: analytics.inquiries },
              ]}
            />
            <TopProductBars title="Produk paling dilihat" items={analytics.topViewedProducts} unit="view" />
            <TopProductBars title="Produk paling sering kontak" items={analytics.topWhatsappProducts} unit="klik" />
          </div>
        </div>
      ) : null}

      {active === 1 ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <KPICard label="Total Aktif" value={kpi.totalProducts} href="/admin/products" tone="blue" />
            <KPICard label="Stok Menipis" value={kpi.lowStockProducts} href="/admin/products?stock=LOW_STOCK" tone="gold" urgent={kpi.lowStockProducts > 0} />
            <KPICard label="Total Kategori" value={kpi.totalCategories} href="/admin/categories" tone="violet" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentProducts products={recentProducts} />
            <TopProductBars title="Produk paling dilihat periode ini" items={analytics.topViewedProducts} unit="view" />
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
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard label="Retail Aktif" value={kpi.activeRetail} href="/admin/retail-users?status=RETAIL_ACTIVE" tone="green" />
            <KPICard label="Belum Aktivasi" value={kpi.registeredRetail + kpi.pendingRetail} href="/admin/retail-users?tab=pending" tone="gold" urgent={kpi.pendingRetail > 0} />
            <KPICard label="Token Aktif" value={analytics.activeTokens} href="/admin/retail-users?tab=tokens&status=ACTIVE" tone="blue" />
            <KPICard label="Token Dipakai" value={analytics.usedTokens} href="/admin/retail-users?tab=tokens&status=USED" tone="violet" />
          </div>
          <MetricBars
            title="Aktivitas retail periode ini"
            items={[
              { label: "Registrasi retail", value: analytics.retailRegistrations },
              { label: "Token dipakai", value: analytics.usedTokens },
              { label: "Pending approval", value: kpi.pendingRetail },
              { label: "Retail aktif", value: kpi.activeRetail },
            ]}
          />
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/retail-users" className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white">
              Kelola Pengguna Retail
            </Link>
            <Link href="/admin/retail-users?tab=tokens" className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)]">
              Lihat Token Aktivasi
            </Link>
          </div>
        </div>
      ) : null}

      {active === 3 ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard label="Kunjungan" value={analytics.visits} href={`/admin/reports?start=${range.startInput}&end=${range.endInput}`} tone="blue" />
            <KPICard label="Klik WhatsApp" value={analytics.whatsappClicks} href="/admin/inquiries" tone="green" />
            <KPICard label="Inquiry Periode" value={analytics.inquiries} href="/admin/inquiries" tone="gold" />
            <KPICard label="Produk Aktif" value={kpi.totalProducts} href="/admin/products" tone="violet" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentInquiries inquiries={recentInquiries} />
            <MetricBars
              title="Kesehatan katalog"
              items={[
                { label: "Brand aktif", value: kpi.totalBrands },
                { label: "Kategori aktif", value: kpi.totalCategories },
                { label: "Voucher aktif", value: kpi.activeVouchers },
                { label: "Produk stok menipis", value: kpi.lowStockProducts },
              ]}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DateRangeForm({ range }: { range: DashboardRange }) {
  return (
    <form action="/admin" method="get" className="rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_auto] lg:items-end">
        <label>
          <span className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Periode dashboard</span>
          <select name="range" defaultValue={range.key} className="min-h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
            <option value="7d">7 hari</option>
            <option value="1m">1 bulan</option>
            <option value="3m">3 bulan</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Mulai</span>
          <input type="date" name="start" defaultValue={range.startInput} className="min-h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Sampai</span>
          <input type="date" name="end" defaultValue={range.endInput} className="min-h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none" />
        </label>
        <button type="submit" className="min-h-10 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-bold text-white">
          Terapkan
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">Data aktif: {range.label}</p>
    </form>
  );
}

function toneColors(tone: "blue" | "green" | "gold" | "violet") {
  const map = {
    blue: { bg: "#EFF6FF", text: "#1D4ED8" },
    green: { bg: "#F0FDF4", text: "#15803D" },
    gold: { bg: "#FFFBEB", text: "#B45309" },
    violet: { bg: "#F5F3FF", text: "#6D28D9" },
  };
  return map[tone];
}

function KPICard({
  label,
  value,
  href,
  tone,
  urgent,
}: {
  label: string;
  value: number;
  href: string;
  tone: "blue" | "green" | "gold" | "violet";
  urgent?: boolean;
}) {
  const colors = toneColors(tone);
  return (
    <Link
      href={href}
      className="group block rounded-lg bg-white px-5 py-4 no-underline shadow-sm transition hover:-translate-y-px hover:shadow-md"
      style={{ border: urgent ? `1px solid ${colors.text}` : "1px solid var(--color-border)" }}
    >
      <span className="mb-3 inline-flex h-2 w-10 rounded-full" style={{ background: colors.text }} />
      <p className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-muted)]">{label}</p>
      <p className="text-3xl font-extrabold leading-none text-[var(--color-text)]">
        {value.toLocaleString("id-ID")}
      </p>
      <span className="mt-2 block text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: colors.text }}>
        Lihat detail
      </span>
    </Link>
  );
}

function MetricBars({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-[var(--color-text)]">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[var(--color-text)]">{item.label}</span>
              <span className="font-bold text-[var(--color-text)]">{item.value.toLocaleString("id-ID")}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-page)]">
              <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${Math.max(5, (item.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TopProductBars({ title, items, unit }: { title: string; items: TopProduct[]; unit: string }) {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-[var(--color-text)]">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <Link key={item.id} href={item.href} className="block rounded-lg border border-[var(--color-border)] p-3 hover:border-[var(--color-accent)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--color-text)]">{index + 1}. {item.name}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-page)]">
                    <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} />
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--color-page)] px-2 py-1 text-xs font-bold text-[var(--color-text)]">
                  {item.count.toLocaleString("id-ID")} {unit}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-muted)]">
            Belum ada data periode ini.
          </div>
        )}
      </div>
    </section>
  );
}

function RecentProducts({ products }: { products: RecentProduct[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Produk Terbaru</h3>
        <Link href="/admin/products" className="text-xs font-medium text-[var(--color-accent)]">
          Lihat semua
        </Link>
      </div>
      {products.map((product) => (
        <div key={product.id} className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3 last:border-0">
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-medium text-[var(--color-text)]">{product.name}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {new Date(product.createdAt).toLocaleDateString("id-ID")}
            </p>
          </div>
          <StockBadge status={product.stockStatus} />
        </div>
      ))}
    </section>
  );
}

function RecentInquiries({ inquiries }: { inquiries: RecentInquiry[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Inquiry Terbaru</h3>
        <Link href="/admin/inquiries" className="text-xs font-medium text-[var(--color-accent)]">
          Lihat semua
        </Link>
      </div>
      {inquiries.map((inquiry) => (
        <div key={inquiry.id} className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3 last:border-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)]">
              {inquiry.customerName ?? "Guest"}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{inquiry.sourcePage ?? "-"}</p>
          </div>
          <InquiryBadge status={inquiry.status} />
        </div>
      ))}
    </section>
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
