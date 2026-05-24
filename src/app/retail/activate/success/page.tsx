import Link from "next/link";

export default function RetailActivationSuccessPage() {
  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary-maroon">
          E-Katalog Komputer
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Aktivasi Berhasil</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Akun ritel Anda sudah aktif. Anda kini dapat melihat harga ritel dan voucher ritel.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href="/products"
            className="flex items-center justify-center rounded-xl bg-primary-maroon px-4 py-3 text-sm font-bold text-white"
          >
            Lihat Produk
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl border border-border-gray px-4 py-3 text-sm font-semibold text-text-muted"
          >
            Ke Beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
