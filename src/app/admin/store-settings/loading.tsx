export default function StoreSettingsLoading() {
  return (
    <main className="mx-auto max-w-6xl">
      <div className="mb-6 space-y-2">
        <div className="h-3 w-32 animate-pulse rounded bg-brand-soft" />
        <div className="h-8 w-64 animate-pulse rounded bg-white" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-white" />
      </div>

      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, sectionIndex) => (
          <section
            key={sectionIndex}
            className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"
          >
            <div className="mb-5 space-y-2">
              <div className="h-5 w-44 animate-pulse rounded bg-brand-soft" />
              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-brand-soft" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: sectionIndex === 1 ? 3 : 4 }).map((_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-brand-soft" />
                  <div className="h-12 animate-pulse rounded-xl bg-brand-soft" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
