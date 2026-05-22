import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import Sidebar from "@/components/layout/AdminSidebar";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Super Admin - E-Katalog Komputer",
  description: "Super admin panel untuk manajemen sistem",
};

export default async function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  }).catch(() => null);

  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-soft-bg">
      <Sidebar role="SUPER_ADMIN" />
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
