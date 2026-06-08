import Link from "next/link";

export type TopProductItem = {
  id: string;
  name: string;
  href?: string;
  count: number;
  countLabel: string;
  meta: Array<{ label: string; value: string | number }>;
};

type TopProductsCardProps = {
  title: string;
  items: TopProductItem[];
  emptyText?: string;
};

export default function TopProductsCard({
  title,
  items,
  emptyText = "Belum ada data aktivitas.",
}: TopProductsCardProps) {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <section className="min-w-0 rounded-lg border border-brand-light bg-brand-soft-white p-5 text-brand-on-light shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-base font-black text-brand-on-light">{title}</h2>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => {
            const row = (
              <div className="min-w-0 rounded-lg border border-brand-light bg-[rgba(13,11,97,0.05)] p-3 transition hover:border-brand-accent hover:bg-white">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-accent text-xs font-black text-brand-on-accent">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-black text-brand-on-light">{item.name}</p>
                      <span className="shrink-0 rounded-full bg-brand-accent px-2 py-1 text-xs font-black text-brand-on-accent">
                        {item.count.toLocaleString("id-ID")} {item.countLabel}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-brand-support"
                        style={{ width: `${Math.max(7, (item.count / max) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {item.meta.map((meta) => (
                        <div key={meta.label} className="min-w-0">
                          <p className="truncate text-[10px] font-bold uppercase tracking-[0.04em] text-brand-muted-on-light">
                            {meta.label}
                          </p>
                          <p className="mt-0.5 truncate text-xs font-black text-brand-on-light">{meta.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );

            return item.href ? (
              <Link key={item.id} href={item.href} className="block">
                {row}
              </Link>
            ) : (
              <div key={item.id}>{row}</div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-brand-light bg-[rgba(13,11,97,0.05)] text-sm font-semibold text-brand-muted-on-light">
          {emptyText}
        </div>
      )}
    </section>
  );
}
