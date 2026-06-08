export type RecentActivityItem = {
  id: string;
  label: string;
  description: string;
  time: string;
  tone?: "blue" | "green" | "gold" | "red" | "neutral";
};

const toneClass: Record<NonNullable<RecentActivityItem["tone"]>, string> = {
  blue: "bg-brand-support/10 text-brand-on-light",
  green: "bg-success/10 text-success",
  gold: "bg-brand-accent/20 text-brand-on-light",
  red: "bg-danger/10 text-danger",
  neutral: "bg-[rgba(13,11,97,0.08)] text-brand-muted-on-light",
};

export default function RecentActivityList({
  title,
  items,
  emptyText = "Belum ada data aktivitas.",
}: {
  title: string;
  items: RecentActivityItem[];
  emptyText?: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-brand-light bg-brand-soft-white p-5 text-brand-on-light shadow-sm">
      <h2 className="mb-4 text-base font-black text-brand-on-light">{title}</h2>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex min-w-0 gap-3 rounded-lg bg-[rgba(13,11,97,0.05)] p-3">
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  toneClass[item.tone ?? "neutral"]
                }`}
              >
                {item.label.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-black text-brand-on-light">{item.label}</p>
                  <span className="shrink-0 text-[11px] font-semibold text-brand-muted-on-light">{item.time}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-brand-muted-on-light">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-brand-light bg-[rgba(13,11,97,0.05)] text-sm font-semibold text-brand-muted-on-light">
          {emptyText}
        </div>
      )}
    </section>
  );
}
