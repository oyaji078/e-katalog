import Link from "next/link";

import ActivationForm from "./activation-form";

export default function RetailActivationPage() {
  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary-maroon">
          E-Katalog Komputer
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Retail Token Activation</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Enter the token given by admin to activate retail access.
        </p>

        <ActivationForm />

        <Link
          href="/retail/request-token"
          className="mt-4 block rounded-xl bg-whatsapp-green px-4 py-3 text-center text-sm font-bold text-white"
        >
          Minta token via WhatsApp
        </Link>
      </section>
    </main>
  );
}
