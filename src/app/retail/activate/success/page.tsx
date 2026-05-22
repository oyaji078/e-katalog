import Link from "next/link";

export default function RetailActivationSuccessPage() {
  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary-maroon">
          E-Katalog Komputer
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Retail Activation Successful</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Your retail account has been activated. You can now view retail prices and retail vouchers.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="w-full rounded-xl bg-primary-maroon px-4 py-3 text-sm font-bold text-white"
          >
            Go to Homepage
          </Link>
        </div>
      </section>
    </main>
  );
}