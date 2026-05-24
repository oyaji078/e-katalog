import type { Metadata } from "next";
import { headers } from "next/headers";

import Sidebar from "@/components/layout/AdminSidebar";
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
    <div className="flex min-h-screen overflow-x-hidden bg-soft-bg">
      <Sidebar role={session.user.role} />
      <div className="min-w-0 flex-1 p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
