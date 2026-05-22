import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import GenerateTokenFormClient from "./GenerateTokenFormClient";

export const dynamic = "force-dynamic";

export default async function AdminGenerateTokenPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  // Check if user is admin or super admin
  if (!session?.user || !(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN")) {
    return (
      <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
        <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="block text-center mt-4">
            Go to Homepage
          </Link>
        </section>
      </main>
    );
  }

  const db = getDb();
  
  // Fetch users who are registered or pending retail (eligible for token generation)
  const eligibleUsers = await db.user.findMany({
    where: {
      OR: [
        { retailStatus: "REGISTERED" },
        { retailStatus: "PENDING_RETAIL" }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      whatsappNumber: true,
      storeName: true,
      userCode: true,
      retailStatus: true
    }
  });

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      {/* Top Bar */}
      <div className="border-b border-border-gray bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-text-muted sm:px-6">
          <div className="flex items-center gap-2">
            <svg
              className="size-4 text-soft-teal"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Garansi toko dan dukungan WhatsApp</span>
          </div>
          <div className="hidden items-center gap-5 sm:flex">
            <span>Promo</span>
            <span>Voucher</span>
            <Link href="/login" className="font-semibold text-primary-maroon">
              Retail Login
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border-gray bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center">
          <Link href="/admin" className="text-xl font-bold text-primary-maroon">
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <input
              aria-label="Cari pengguna"
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Cari nama, email, atau kode pengguna..."
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Generate Retail Token</h1>
          <p className="mt-2 text-sm text-text-muted">
            Buat token aktivasi retail untuk pengguna yang terdaftar.
          </p>
        </div>

        <GenerateTokenFormClient eligibleUsers={eligibleUsers} />
      </div>
    </main>
  );
}
