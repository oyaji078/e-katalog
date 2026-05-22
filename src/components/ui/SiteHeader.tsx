import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-border-gray bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center">
        <Link href="/" className="text-xl font-bold text-primary-maroon">
          E-Katalog Komputer
        </Link>
        <div className="flex flex-1 items-center rounded-2xl border border-border-gray bg-white px-4 py-3 shadow-sm lg:mx-5">
          <svg
            className="mr-3 size-5 text-text-muted"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M9.663 6h10.069a3 3 0 013 3v10.937a3 3 0 01-3 3h-5.373M9.663 12h6.364a2.25 2.25 0 002.25-2.25V8.25a2.25 2.25 0 00-2.25-2.25H9.663Z" />
          </svg>
          <input
            aria-label="Cari produk"
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Cari laptop, monitor, keyboard, printer..."
          />
        </div>
        <div className="flex gap-2">
          <Link
            href="/register"
            className="rounded-xl border border-primary-maroon px-4 py-2 text-sm font-semibold text-primary-maroon"
          >
            Daftar Retail
          </Link>
          <a
            href="https://wa.me/6280000000000"
            className="rounded-xl bg-whatsapp-green px-4 py-2 text-sm font-semibold text-white"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}