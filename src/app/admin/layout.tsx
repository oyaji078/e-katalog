import type { Metadata } from "next";
import { headers } from "next/headers";

import Sidebar from "@/components/layout/AdminSidebar";
import AdminMobileNav from "@/components/layout/AdminMobileNav";
import AdminTopbar from "@/components/layout/AdminTopbar";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPublicSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Admin Dashboard - RAMA COMPUTER",
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
  const settings = await getPublicSiteSettings();

  return (
    <div className="admin-ui flex min-h-screen bg-[#F6F7FB] text-[#111827]">
      <div className="hidden lg:block">
        <Sidebar role={session.user.role} brandName={settings.storeName} logoUrl={settings.logoUrl} />
      </div>
      <main className="min-w-0 flex-1 pb-16 transition-[margin] duration-200 lg:ml-[var(--admin-sidebar-width,256px)] lg:pb-0">
        <AdminTopbar user={session.user} />
        <div className="p-4 sm:p-6">{children}</div>
      </main>
      <AdminMobileNav role={session.user.role} brandName={settings.storeName} logoUrl={settings.logoUrl} />
    </div>
  );
}
