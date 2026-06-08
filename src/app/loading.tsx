function ProductCardSkeleton() {
  return (
    <div className="h-full bg-white">
      <div className="aspect-square animate-pulse bg-brand-soft" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-4/5 animate-pulse rounded bg-brand-soft" />
        <div className="h-3 w-full animate-pulse rounded bg-brand-soft" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-brand-soft" />
        <div className="h-10 animate-pulse rounded-xl bg-brand-soft" />
        <div className="grid grid-cols-[1fr_auto] gap-2 pt-2">
          <div className="h-8 animate-pulse rounded-full bg-brand-soft" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-brand-soft" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-brand-bg pb-20 text-brand-text">
      <div className="h-28 animate-pulse bg-brand-primary" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-4 h-32 animate-pulse rounded-3xl bg-brand-soft" />
        <div className="mb-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-white" />
          ))}
        </div>
        <div className="grid overflow-hidden rounded-2xl bg-gray-100 gap-px grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
