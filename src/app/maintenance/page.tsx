import Link from "next/link";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="max-w-md rounded-lg border border-brand-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-warning/20">
          <span className="text-3xl font-bold text-warning">!</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-text">Maintenance Mode</h1>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          Situs sedang dalam pemeliharaan. Silakan kembali lagi nanti.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-brand-primary px-4 py-2 text-sm font-bold text-white"
        >
          Refresh
        </Link>
      </div>
    </main>
  );
}
