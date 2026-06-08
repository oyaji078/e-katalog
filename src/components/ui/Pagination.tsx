import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export default function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevHref = currentPage > 1 ? buildHref(currentPage - 1) : undefined;
  const nextHref = currentPage < totalPages ? buildHref(currentPage + 1) : undefined;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Navigasi halaman" className="mt-6 flex items-center justify-center gap-1.5">
      {prevHref ? (
        <Link
          href={prevHref}
          rel="prev"
          className="inline-flex items-center gap-1 border border-brand-border bg-brand-card px-3 py-1.5 text-xs font-bold text-brand-muted transition hover:border-brand-accent hover:text-brand-accent"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 border border-brand-border/50 bg-brand-bg px-3 py-1.5 text-xs font-bold text-brand-muted/50">
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((page, i) => {
          if (page === "ellipsis") {
            return (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-brand-muted">
                ...
              </span>
            );
          }
          const isCurrent = page === currentPage;
          return (
            <Link
              key={page}
              href={buildHref(page)}
              className={`inline-flex size-8 items-center justify-center text-xs font-bold transition ${
                isCurrent
                  ? "bg-brand-accent text-brand-on-accent"
                  : "border border-brand-border bg-brand-card text-brand-muted hover:border-brand-accent hover:text-brand-accent"
              }`}
              aria-current={isCurrent ? "page" : undefined}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {nextHref ? (
        <Link
          href={nextHref}
          rel="next"
          className="inline-flex items-center gap-1 border border-brand-border bg-brand-card px-3 py-1.5 text-xs font-bold text-brand-muted transition hover:border-brand-accent hover:text-brand-accent"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="size-3.5" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 border border-brand-border/50 bg-brand-bg px-3 py-1.5 text-xs font-bold text-brand-muted/50">
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="size-3.5" />
        </span>
      )}
    </nav>
  );
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);

  return pages;
}
