import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { RetailWhatsAppRequestButton } from "@/components/ui/RetailWhatsAppRequestButton";

export default async function RetailRequestTokenPage() {
  const session = await getCurrentSession();
  const featureEnabled = await isFeatureEnabled("enable_retail_whatsapp_request");

  const isLoggedIn = !!session?.user;
  const isRetailUser = session?.user?.role === "USER";
  const retailStatus = session?.user?.retailStatus as string | undefined;
  const canRequest = isLoggedIn && isRetailUser && (retailStatus === "REGISTERED" || retailStatus === "PENDING_RETAIL");

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary-maroon">
          E-Katalog Komputer
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Minta Token Retail</h1>

        {!isLoggedIn ? (
          <div className="mt-6 rounded-2xl border border-border-gray bg-soft-bg/50 p-4">
            <p className="text-sm text-text-muted">
              Silakan <Link href="/login" className="font-semibold text-primary-maroon">login</Link> terlebih dahulu untuk meminta token retail.
            </p>
          </div>
        ) : !isRetailUser ? (
          <div className="mt-6 rounded-2xl border border-border-gray bg-soft-bg/50 p-4">
            <p className="text-sm text-text-muted">
              Halaman ini hanya untuk akun retail.
            </p>
          </div>
        ) : !featureEnabled ? (
          <div className="mt-6 rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Layanan token retail sedang ditutup.</p>
            <p className="mt-2 text-sm text-text-muted">
              Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        ) : !canRequest ? (
          <div className="mt-6 rounded-2xl border border-border-gray bg-soft-bg/50 p-4">
            <p className="text-sm text-text-muted">
              Status akun Anda &ldquo;{retailStatus ?? "-"}&rdquo; tidak dapat mengajukan permintaan token. Hanya akun dengan status &ldquo;Terdaftar&rdquo; yang dapat mengajukan.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-text-muted">
              Klik tombol di bawah untuk mengirim permintaan token aktivasi retail ke admin via WhatsApp.
            </p>
            <RetailWhatsAppRequestButton />
          </div>
        )}
      </section>
    </main>
  );
}
