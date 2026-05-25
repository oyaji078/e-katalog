import type { Metadata } from "next";
import { headers } from "next/headers";

import Sidebar from "@/components/layout/AdminSidebar";
import AdminMobileNav from "@/components/layout/AdminMobileNav";
import { requireSuperAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Super Admin - E-Katalog Komputer",
  description: "Super admin panel untuk manajemen sistem",
};

export default async function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/super-admin";
  const session = await requireSuperAdminSession(pathname);

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
