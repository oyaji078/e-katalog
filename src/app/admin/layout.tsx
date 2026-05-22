import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import Sidebar from "@/components/layout/AdminSidebar";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin Dashboard - E-Katalog Komputer",
  description: "Admin panel untuk mengelola katalog produk",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  }).catch(() => null);

  const role = session?.user?.role;

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-soft-bg">
      <Sidebar role={role} />
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
