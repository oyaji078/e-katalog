import Link from "next/link";

export const dynamic = "force-dynamic";

export default function RetailActivationSuccessPage() {
  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
      <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-gray-900 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-brand-primary">
          RAMA COMPUTER
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Aktivasi Berhasil</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Akun ritel Anda sudah aktif. Anda kini dapat melihat harga ritel dan voucher ritel.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href="/products"
            className="flex items-center justify-center rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white"
          >
            Lihat Produk
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Ke Beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
