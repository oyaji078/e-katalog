import type { Metadata } from "next";
import { headers } from "next/headers";

import Sidebar from "@/components/layout/AdminSidebar";
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
    <div className="flex min-h-screen overflow-x-hidden bg-soft-bg">
      <Sidebar role={session.user.role} />
      <div className="min-w-0 flex-1 p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
