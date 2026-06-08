import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { RetailWhatsAppRequestButton } from "@/components/ui/RetailWhatsAppRequestButton";

export const dynamic = "force-dynamic";

export default async function RetailRequestTokenPage() {
  const user = await getCurrentUser();
  const featureEnabled = await isFeatureEnabled("enable_retail_whatsapp_request");

  const isLoggedIn = !!user;
  const isRetailUser = user?.role === "USER";
  const retailStatus = user?.retailStatus;
  const canRequest = isLoggedIn && isRetailUser && (retailStatus === "REGISTERED" || retailStatus === "PENDING_RETAIL");

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
      <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-brand-primary">
          RAMA COMPUTER
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Minta Token Retail</h1>

        {!isLoggedIn ? (
          <div className="mt-6 rounded-2xl border border-brand-border bg-brand-bg/50 p-4">
            <p className="text-sm text-brand-muted">
              Silakan <Link href="/login" className="font-semibold text-brand-primary">login</Link> terlebih dahulu untuk meminta token retail.
            </p>
          </div>
        ) : !isRetailUser ? (
          <div className="mt-6 rounded-2xl border border-brand-border bg-brand-bg/50 p-4">
            <p className="text-sm text-brand-muted">
              Halaman ini hanya untuk akun retail.
            </p>
          </div>
        ) : retailStatus === "RETAIL_ACTIVE" ? (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-4">
            <p className="font-semibold text-success">Akun ritel Anda sudah aktif.</p>
            <p className="mt-2 text-sm text-brand-muted">
              Anda dapat melihat harga ritel dan voucher ritel.
            </p>
            <Link
              href="/products"
              className="mt-4 inline-flex rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white"
            >
              Lihat Produk
            </Link>
          </div>
        ) : retailStatus === "SUSPENDED" ? (
          <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-4">
            <p className="font-semibold text-danger">Akun ritel Anda ditangguhkan.</p>
            <p className="mt-2 text-sm text-brand-muted">
              Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        ) : (
          <>
            <ol className="mt-6 space-y-3 text-sm text-brand-muted">
              <li className="flex items-start gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">1</span>
                <span>Hubungi admin melalui WhatsApp untuk meminta OTP aktivasi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">2</span>
                <span>Admin akan mengirim token ke akun Anda.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">3</span>
                <span>Masukkan token di halaman aktivasi untuk mengaktifkan akun ritel.</span>
              </li>
            </ol>

            {retailStatus === "PENDING_RETAIL" ? (
              <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <p className="text-sm font-semibold text-warning">Token sudah diminta.</p>
                <p className="mt-1 text-sm text-brand-muted">
                  Jika admin sudah mengirim token, masukkan token di halaman aktivasi.
                </p>
              </div>
            ) : null}

            {canRequest && featureEnabled ? (
              <div className="mt-4">
                <RetailWhatsAppRequestButton />
              </div>
            ) : null}

            <Link
              href="/retail/activate"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-brand-primary px-4 py-3 text-sm font-bold text-brand-primary transition hover:bg-brand-primary hover:text-white"
            >
              Sudah punya token? Aktifkan Akun Ritel
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
