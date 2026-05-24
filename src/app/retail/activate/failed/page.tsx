import Link from "next/link";

export default function RetailActivationFailedPage({
  message = "Token tidak valid, sudah digunakan, kedaluwarsa, atau tidak terdaftar untuk akun Anda.",
}: {
  message?: string;
}) {
  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary-maroon">
          E-Katalog Komputer
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Aktivasi Gagal</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">{message}</p>
        <div className="mt-6 space-y-3">
          <Link
            href="/retail/activate"
            className="flex items-center justify-center rounded-xl border border-primary-maroon px-4 py-3 text-sm font-semibold text-primary-maroon"
          >
            Coba Lagi
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl bg-primary-maroon px-4 py-3 text-sm font-bold text-white"
          >
            Ke Beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
