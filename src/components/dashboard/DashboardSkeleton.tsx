function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg border border-brand-border bg-white ${className}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-brand-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 animate-pulse rounded bg-brand-soft" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-brand-soft" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded bg-brand-soft" />
          <div className="h-9 w-28 animate-pulse rounded bg-brand-soft" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <SkeletonBlock className="h-[390px]" />
        <SkeletonBlock className="h-[390px]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>
    </div>
  );
}
