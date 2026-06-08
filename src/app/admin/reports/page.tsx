import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";
import { maskToken } from "@/lib/mask";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{ start?: string; end?: string }>;
};

type DateRange = {
  start: Date;
  end: Date;
  endExclusive: Date;
  startValue: string;
  endValue: string;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateRange(params: { start?: string; end?: string }): DateRange {
  const today = new Date();
  const defaultEnd = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const defaultStart = new Date(defaultEnd);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 30);

  const start = parseDate(params.start) ?? defaultStart;
  const end = parseDate(params.end) ?? defaultEnd;
  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return {
    start,
    end,
    endExclusive,
    startValue: isoDate(start),
    endValue: isoDate(end),
  };
}

function exportHref(report: string, range: DateRange) {
  const search = new URLSearchParams({
    report,
    start: range.startValue,
    end: range.endValue,
  });
  return `/admin/reports/export?${search.toString()}`;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const range = getDateRange(params);
  const db = getDb();
  const createdAtRange = { gte: range.start, lt: range.endExclusive };

  const [
    retailRegistrants,
    activeRetailUsers,
    whatsappContacts,
    topContactedEvents,
    retailTokens,
    retailRegistrantsCount,
    activeRetailUsersCount,
    whatsappContactsCount,
    contactedProductGroups,
    retailTokensCount,
  ] = await Promise.all([
    db.user.findMany({
      where: {
        retailStatus: { in: ["PENDING_RETAIL", "RETAIL_ACTIVE", "RETAIL_REJECTED", "SUSPENDED"] },
        createdAt: createdAtRange,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, email: true, whatsappNumber: true, storeName: true, retailStatus: true, createdAt: true },
    }),
    db.user.findMany({
      where: { retailStatus: "RETAIL_ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, name: true, email: true, whatsappNumber: true, storeName: true, updatedAt: true },
    }),
    db.analyticsEvent.findMany({
      where: { type: "WHATSAPP_CLICK", createdAt: createdAtRange },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, productId: true, productName: true, path: true, phone: true, createdAt: true },
    }),
    db.analyticsEvent.groupBy({
      by: ["productId"],
      where: { type: "WHATSAPP_CLICK", productId: { not: null }, createdAt: createdAtRange },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    db.retailToken.findMany({
      where: { createdAt: createdAtRange },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        tokenPreview: true,
        status: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true,
        assignedTo: { select: { name: true, email: true } },
        generatedBy: { select: { name: true, email: true } },
      },
    }),
    db.user.count({
      where: {
        retailStatus: { in: ["PENDING_RETAIL", "RETAIL_ACTIVE", "RETAIL_REJECTED", "SUSPENDED"] },
        createdAt: createdAtRange,
      },
    }),
    db.user.count({ where: { retailStatus: "RETAIL_ACTIVE" } }),
    db.analyticsEvent.count({ where: { type: "WHATSAPP_CLICK", createdAt: createdAtRange } }),
    db.analyticsEvent.groupBy({
      by: ["productId"],
      where: { type: "WHATSAPP_CLICK", productId: { not: null }, createdAt: createdAtRange },
    }),
    db.retailToken.count({ where: { createdAt: createdAtRange } }),
  ]);

  const contactedProductsCount = contactedProductGroups.length;

  const topProductIds = topContactedEvents
    .map((event) => event.productId)
    .filter((id): id is string => Boolean(id));
  const topProducts = topProductIds.length
    ? await db.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, name: true, sku: true },
      })
    : [];
  const productMap = new Map(topProducts.map((product) => [product.id, product]));

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Laporan</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Ringkasan bisnis berbasis data ritel, kontak WhatsApp, produk, dan kode registrasi.
        </p>
      </div>

      <form className="mb-6 grid gap-3 rounded-lg border border-brand-border bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm font-semibold text-brand-text">
          Mulai
          <input
            type="date"
            name="start"
            defaultValue={range.startValue}
            className="mt-1 w-full rounded-xl border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </label>
        <label className="text-sm font-semibold text-brand-text">
          Selesai
          <input
            type="date"
            name="end"
            defaultValue={range.endValue}
            className="mt-1 w-full rounded-xl border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </label>
        <button className="self-end rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white">
          Terapkan
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ReportCard label="Pendaftar Ritel" value={retailRegistrantsCount} />
        <ReportCard label="Ritel Aktif" value={activeRetailUsersCount} />
        <ReportCard label="Kontak WhatsApp" value={whatsappContactsCount} />
        <ReportCard label="Produk Dihubungi" value={contactedProductsCount} />
        <ReportCard label="Kode Ritel" value={retailTokensCount} />
      </div>

      <div className="mt-6 grid gap-6">
        <TableSection title="Laporan Pendaftar Ritel" exportUrl={exportHref("retail-registrants", range)}>
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                <th className="px-3 py-2 font-medium">Nama</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">WhatsApp</th>
                <th className="px-3 py-2 font-medium">Toko</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {retailRegistrants.map((user) => (
                <tr key={user.id} className="border-b border-brand-border/50">
                  <td className="px-3 py-2 font-semibold text-brand-text">{user.name}</td>
                  <td className="px-3 py-2 text-brand-muted">{user.email}</td>
                  <td className="px-3 py-2 text-brand-muted">{user.whatsappNumber ?? "-"}</td>
                  <td className="px-3 py-2 text-brand-muted">{user.storeName ?? "-"}</td>
                  <td className="px-3 py-2"><StatusPill value={user.retailStatus} /></td>
                  <td className="px-3 py-2 text-brand-muted">{user.createdAt.toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {retailRegistrants.length === 0 ? <EmptyReport /> : null}
        </TableSection>

        <TableSection title="Laporan Pengguna Ritel Aktif" exportUrl={exportHref("retail-active", range)}>
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                <th className="px-3 py-2 font-medium">Nama</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">WhatsApp</th>
                <th className="px-3 py-2 font-medium">Toko</th>
                <th className="px-3 py-2 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {activeRetailUsers.map((user) => (
                <tr key={user.id} className="border-b border-brand-border/50">
                  <td className="px-3 py-2 font-semibold text-brand-text">{user.name}</td>
                  <td className="px-3 py-2 text-brand-muted">{user.email}</td>
                  <td className="px-3 py-2 text-brand-muted">{user.whatsappNumber ?? "-"}</td>
                  <td className="px-3 py-2 text-brand-muted">{user.storeName ?? "-"}</td>
                  <td className="px-3 py-2 text-brand-muted">{user.updatedAt.toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeRetailUsers.length === 0 ? <EmptyReport /> : null}
        </TableSection>

        <TableSection title="Laporan Kontak WhatsApp" exportUrl={exportHref("whatsapp-contacts", range)}>
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                <th className="px-3 py-2 font-medium">Produk</th>
                <th className="px-3 py-2 font-medium">Path</th>
                <th className="px-3 py-2 font-medium">Nomor</th>
                <th className="px-3 py-2 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {whatsappContacts.map((event) => (
                <tr key={event.id} className="border-b border-brand-border/50">
                  <td className="px-3 py-2 font-semibold text-brand-text">{event.productName ?? event.productId ?? "-"}</td>
                  <td className="px-3 py-2 text-brand-muted">{event.path ?? "-"}</td>
                  <td className="px-3 py-2 text-brand-muted">{event.phone ?? "-"}</td>
                  <td className="px-3 py-2 text-brand-muted">{event.createdAt.toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {whatsappContacts.length === 0 ? <EmptyReport /> : null}
        </TableSection>

        <TableSection title="Laporan Produk Paling Banyak Dihubungi" exportUrl={exportHref("top-products", range)}>
          <table className="min-w-[560px] w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                <th className="px-3 py-2 font-medium">Produk</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Kontak</th>
              </tr>
            </thead>
            <tbody>
              {topContactedEvents.map((event) => {
                const product = event.productId ? productMap.get(event.productId) : null;
                return (
                  <tr key={event.productId} className="border-b border-brand-border/50">
                    <td className="px-3 py-2 font-semibold text-brand-text">{product?.name ?? event.productId ?? "-"}</td>
                    <td className="px-3 py-2 text-brand-muted">{product?.sku ?? "-"}</td>
                    <td className="px-3 py-2 text-brand-muted">{event._count.id}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {topContactedEvents.length === 0 ? <EmptyReport /> : null}
        </TableSection>

        <TableSection title="Laporan Kode Registrasi Ritel" exportUrl={exportHref("retail-tokens", range)}>
          <table className="min-w-[800px] w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                <th className="px-3 py-2 font-medium">OTP</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Pendaftar</th>
                <th className="px-3 py-2 font-medium">Dibuat Oleh</th>
                <th className="px-3 py-2 font-medium">Kadaluarsa</th>
                <th className="px-3 py-2 font-medium">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {retailTokens.map((token) => (
                <tr key={token.id} className="border-b border-brand-border/50">
                  <td className="px-3 py-2 font-mono font-black tracking-[0.2em] text-brand-text">{maskToken(token.tokenPreview)}</td>
                  <td className="px-3 py-2"><StatusPill value={token.status} /></td>
                  <td className="px-3 py-2 text-brand-muted">{token.assignedTo?.name ?? "-"}</td>
                  <td className="px-3 py-2 text-brand-muted">{token.generatedBy.name}</td>
                  <td className="px-3 py-2 text-brand-muted">{token.expiresAt.toLocaleString("id-ID")}</td>
                  <td className="px-3 py-2 text-brand-muted">{token.createdAt.toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {retailTokens.length === 0 ? <EmptyReport /> : null}
        </TableSection>
      </div>
    </main>
  );
}

function ReportCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-brand-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-primary">{value}</p>
    </div>
  );
}

function TableSection({
  title,
  exportUrl,
  children,
}: {
  title: string;
  exportUrl: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-brand-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-4 py-3">
        <h2 className="text-lg font-bold text-brand-text">{title}</h2>
        <a href={exportUrl} className="rounded-lg border border-brand-primary px-3 py-1.5 text-xs font-bold text-brand-primary">
          Export CSV
        </a>
      </div>
      <div className="max-w-full overflow-x-auto p-4">{children}</div>
    </section>
  );
}

function EmptyReport() {
  return <p className="py-6 text-center text-sm text-brand-muted">Belum ada data laporan.</p>;
}

function StatusPill({ value }: { value: string }) {
  const colors: Record<string, string> = {
    PENDING_RETAIL: "bg-warning/20 text-warning",
    RETAIL_ACTIVE: "bg-success/20 text-success",
    RETAIL_REJECTED: "bg-danger/15 text-danger",
    SUSPENDED: "bg-brand-muted/10 text-brand-muted",
    ACTIVE: "bg-success/20 text-success",
    USED: "bg-[#EEF4F7] text-[#0D0B61]",
    EXPIRED: "bg-warning/20 text-warning",
    REVOKED: "bg-danger/15 text-danger",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[value] ?? "bg-brand-border text-brand-muted"}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}
