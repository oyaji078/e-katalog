import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";

export default async function TopBar() {
  const user = await getCurrentUser();

  return (
    <section className="border-b border-border-gray bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-text-muted sm:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-soft-teal" />
          <span>Garansi toko dan dukungan WhatsApp</span>
        </div>
        <div className="hidden items-center gap-5 sm:flex">
          <Link href="/vouchers">Voucher</Link>
          {!user ? (
            <Link className="font-semibold text-primary-maroon" href="/login">
              Retail Login
            </Link>
          ) : user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
            <Link className="font-semibold text-primary-maroon" href={user.role === "SUPER_ADMIN" ? "/super-admin" : "/admin"}>
              {user.role === "SUPER_ADMIN" ? "Super Admin" : "Dashboard Admin"}
            </Link>
          ) : user.retailStatus === "RETAIL_ACTIVE" ? (
            <>
              <span className="text-xs font-bold text-soft-teal">Harga Ritel Aktif</span>
              <Link className="font-semibold text-primary-maroon" href="/products">
                Katalog
              </Link>
            </>
          ) : user.retailStatus === "PENDING_RETAIL" ? (
            <Link className="font-semibold text-primary-maroon" href="/retail/activate">
              Aktivasi Token
            </Link>
          ) : (
            <Link className="font-semibold text-primary-maroon" href="/retail/request-token">
              Request Token
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
