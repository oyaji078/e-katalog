import type { Metadata } from "next";
import { headers } from "next/headers";

import Sidebar from "@/components/layout/AdminSidebar";
import AdminMobileNav from "@/components/layout/AdminMobileNav";
import { requireAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin Dashboard - E-Katalog Komputer",
  description: "Admin panel untuk mengelola katalog produk",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/admin";
  const session = await requireAdminSession(pathname);

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <div className="sticky top-0 hidden h-screen shrink-0 self-start lg:block">
        <Sidebar role={session.user.role} />
      </div>
      <main className="min-w-0 flex-1 pb-16 lg:pb-0">
        <div className="p-4 sm:p-6">{children}</div>
      </main>
      <AdminMobileNav role={session.user.role} />
    </div>
  );
}
