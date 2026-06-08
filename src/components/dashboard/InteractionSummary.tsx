export type InteractionSummaryItem = {
  label: string;
  value: number | string;
  helper: string;
  tone?: "blue" | "green" | "gold" | "neutral";
};

const barClass: Record<NonNullable<InteractionSummaryItem["tone"]>, string> = {
  blue: "bg-brand-primary",
  green: "bg-success",
  gold: "bg-brand-accent",
  neutral: "bg-brand-muted-on-light",
};

export default function InteractionSummary({
  title = "Ringkasan Interaksi",
  items,
}: {
  title?: string;
  items: InteractionSummaryItem[];
}) {
  const numericValues = items.map((item) => (typeof item.value === "number" ? item.value : 0));
  const max = Math.max(1, ...numericValues);

  return (
    <section className="min-w-0 rounded-lg border border-brand-light bg-brand-soft-white p-5 text-brand-on-light shadow-sm">
      <h2 className="text-base font-black text-brand-on-light">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const numeric = typeof item.value === "number" ? item.value : 0;
          return (
            <div key={item.label} className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-brand-on-light">{item.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-brand-muted-on-light">{item.helper}</p>
                </div>
                <p className="shrink-0 text-lg font-black text-brand-on-light">
                  {typeof item.value === "number" ? item.value.toLocaleString("id-ID") : item.value}
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(13,11,97,0.1)]">
                <div
                  className={`h-full rounded-full ${barClass[item.tone ?? "neutral"]}`}
                  style={{ width: typeof item.value === "number" ? `${Math.max(5, (numeric / max) * 100)}%` : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
