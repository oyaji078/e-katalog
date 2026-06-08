import Link from "next/link";
import type { ReactNode } from "react";

type TrendTone = "up" | "down" | "neutral" | "warning" | "gold";

type KpiCardProps = {
  label: string;
  value: number | string;
  href?: string;
  icon?: ReactNode;
  trend?: string;
  trendTone?: TrendTone;
  helper?: string;
};

const trendToneClass: Record<TrendTone, string> = {
  up: "bg-success/10 text-success",
  down: "bg-danger/10 text-danger",
  neutral: "bg-[rgba(13,11,97,0.08)] text-brand-muted-on-light",
  warning: "bg-warning/10 text-warning",
  gold: "bg-brand-accent/25 text-brand-on-light",
};

export default function KpiCard({
  label,
  value,
  href,
  icon,
  trend,
  trendTone = "neutral",
  helper,
}: KpiCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 min-h-8 text-[11px] font-bold uppercase tracking-[0.04em] text-brand-muted-on-light">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-black leading-none text-brand-on-light sm:text-3xl">
            {typeof value === "number" ? value.toLocaleString("id-ID") : value}
          </p>
        </div>
        {icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-brand-on-accent">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex min-h-6 flex-wrap items-center gap-2">
        {trend ? (
          <span className={`rounded-full px-2 py-1 text-[11px] font-black ${trendToneClass[trendTone]}`}>
            {trend}
          </span>
        ) : null}
        {helper ? <span className="text-xs font-medium text-brand-muted-on-light">{helper}</span> : null}
      </div>
    </>
  );

  const className =
    "min-w-0 overflow-hidden rounded-lg border border-brand-light bg-brand-soft-white p-4 text-brand-on-light shadow-sm transition hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-md";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <section className={className}>{content}</section>;
}
