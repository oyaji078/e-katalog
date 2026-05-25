import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import ActivationForm from "./activation-form";

export default async function RetailActivationPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/retail/activate");
  }

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  const retailStatus = user.retailStatus;

  if (retailStatus === "RETAIL_ACTIVE") {
    redirect("/products");
  }

  if (retailStatus === "SUSPENDED") {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
        <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
          <Link href="/" className="text-sm font-semibold text-brand-primary">
            E-Katalog Komputer
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Aktivasi Retail</h1>
          <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-4">
            <p className="font-semibold text-danger">Akun ritel Anda ditangguhkan.</p>
            <p className="mt-2 text-sm text-brand-muted">
              Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (retailStatus !== "REGISTERED" && retailStatus !== "PENDING_RETAIL") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
      <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-brand-primary">
          E-Katalog Komputer
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Aktivasi Akun Ritel</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Masukkan token lengkap yang dikirim admin, bukan token preview atau token hash dari database.
        </p>

        <ActivationForm />

        <Link
          href="/retail/request-token"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-brand-border px-4 py-3 text-sm font-semibold text-brand-muted transition hover:bg-brand-bg"
        >
          Belum punya token? Minta Token via WhatsApp
        </Link>
      </section>
    </main>
  );
}
