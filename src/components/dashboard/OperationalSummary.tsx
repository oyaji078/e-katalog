import Link from "next/link";

export type OperationalSummaryItem = {
  label: string;
  value: number | string;
  description: string;
  href?: string;
  tone?: "blue" | "green" | "gold" | "red" | "neutral";
};

const toneClass: Record<NonNullable<OperationalSummaryItem["tone"]>, string> = {
  blue: "border-brand-support/30 bg-brand-support/10 text-brand-on-light",
  green: "border-success/20 bg-success/5 text-success",
  gold: "border-brand-accent/30 bg-brand-accent/20 text-brand-on-light",
  red: "border-danger/20 bg-danger/5 text-danger",
  neutral: "border-brand-light bg-[rgba(13,11,97,0.06)] text-brand-muted-on-light",
};

export default function OperationalSummary({
  title = "Ringkasan Operasional",
  items,
}: {
  title?: string;
  items: OperationalSummaryItem[];
}) {
  return (
    <section className="min-w-0 rounded-lg border border-brand-light bg-brand-soft-white p-5 text-brand-on-light shadow-sm">
      <h2 className="mb-4 text-base font-black text-brand-on-light">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm font-black text-brand-on-light">{item.label}</p>
                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-xs font-black ${
                    toneClass[item.tone ?? "neutral"]
                  }`}
                >
                  {typeof item.value === "number" ? item.value.toLocaleString("id-ID") : item.value}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-brand-muted-on-light">{item.description}</p>
            </>
          );

          const className =
            "block min-w-0 rounded-lg border border-brand-light bg-[rgba(13,11,97,0.05)] p-3 transition hover:border-brand-accent hover:bg-white";

          return item.href ? (
            <Link key={item.label} href={item.href} className={className}>
              {content}
            </Link>
          ) : (
            <div key={item.label} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
