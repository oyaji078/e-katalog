function ProductCardSkeleton() {
  return (
    <div className="h-full bg-white">
      <div className="aspect-square animate-pulse bg-brand-soft" />
      <div className="flex min-h-48 flex-col space-y-2 p-3">
        <div className="h-4 w-5/6 animate-pulse rounded bg-brand-soft" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-brand-soft" />
        <div className="h-8 animate-pulse rounded bg-brand-soft" />
        <div className="h-10 animate-pulse rounded-xl bg-brand-soft" />
        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-2">
          <div className="h-8 animate-pulse rounded-full bg-brand-soft" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-brand-soft" />
        </div>
      </div>
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-brand-bg pb-8 text-brand-text">
      <div className="h-28 animate-pulse bg-brand-primary" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-4 rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_210px_auto]">
            <div className="h-11 animate-pulse rounded-2xl bg-brand-soft" />
            <div className="h-11 animate-pulse rounded-2xl bg-brand-soft" />
            <div className="h-11 animate-pulse rounded-2xl bg-brand-soft lg:w-28" />
          </div>
          <div className="mt-4 flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-7 w-24 shrink-0 animate-pulse rounded-full bg-brand-soft" />
            ))}
          </div>
        </div>

        <div className="mb-4 hidden rounded-2xl border border-brand-border bg-white p-3 shadow-sm lg:block">
          <div className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.45fr)_auto_auto_auto]">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-2xl bg-brand-soft" />
            ))}
          </div>
        </div>

        <div className="mb-4 h-5 w-56 animate-pulse rounded bg-white" />
        <div className="grid overflow-hidden rounded-2xl bg-gray-100 gap-px grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
