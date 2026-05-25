import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";

export default async function TopBar() {
  const user = await getCurrentUser();

  return (
    <section className="border-b border-brand-border bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-brand-muted sm:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-brand-secondary" />
          <span>Garansi toko dan dukungan WhatsApp</span>
        </div>
        <div className="hidden items-center gap-5 sm:flex">
          <Link href="/vouchers">Voucher</Link>
          {!user ? (
            <Link className="font-semibold text-brand-primary" href="/login">
              Retail Login
            </Link>
          ) : user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
            <Link className="font-semibold text-brand-primary" href={user.role === "SUPER_ADMIN" ? "/super-admin" : "/admin"}>
              {user.role === "SUPER_ADMIN" ? "Super Admin" : "Dashboard Admin"}
            </Link>
          ) : user.retailStatus === "RETAIL_ACTIVE" ? (
            <>
              <span className="text-xs font-bold text-brand-secondary">Harga Ritel Aktif</span>
              <Link className="font-semibold text-brand-primary" href="/products">
                Katalog
              </Link>
            </>
          ) : user.retailStatus === "PENDING_RETAIL" ? (
            <Link className="font-semibold text-brand-primary" href="/retail/activate">
              Aktivasi Token
            </Link>
          ) : (
            <Link className="font-semibold text-brand-primary" href="/retail/request-token">
              Request Token
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
