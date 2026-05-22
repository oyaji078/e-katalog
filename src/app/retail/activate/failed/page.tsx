import Link from "next/link";

export default function RetailActivationFailedPage({ 
  message = "The token is invalid, already used, expired, revoked, or not assigned to your account." 
}: { 
  message?: string 
}) {
  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary-maroon">
          E-Katalog Komputer
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Retail Activation Failed</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          {message}
        </p>
        <div className="mt-6">
          <Link
            href="/retail/activate"
            className="w-full rounded-xl border border-primary-maroon px-4 py-3 text-sm font-semibold text-primary-maroon"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="mt-2 w-full rounded-xl bg-primary-maroon px-4 py-3 text-sm font-bold text-white"
          >
            Go to Homepage
          </Link>
        </div>
      </section>
    </main>
  );
}