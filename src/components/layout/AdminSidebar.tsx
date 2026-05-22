import Link from "next/link";

type SidebarProps = {
  role: "ADMIN" | "SUPER_ADMIN" | string | null | undefined;
};

export default function AdminSidebar({ role }: SidebarProps) {
  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <aside className="w-64 overflow-y-auto border-r border-border-gray bg-white">
      <div className="flex h-full flex-col px-4 pt-6">
        <Link href={isSuperAdmin ? "/super-admin" : "/admin"} className="mb-6 flex items-center gap-3">
          <svg className="size-5 text-primary-maroon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <span className="font-semibold text-text-dark">
            {isSuperAdmin ? "Super Admin" : "Dashboard"}
          </span>
        </Link>

        <p className="mb-2 px-3 text-xs font-semibold uppercase text-text-muted">Store</p>
        <nav className="space-y-1">
          <SidebarLink href={isSuperAdmin ? "/super-admin" : "/admin"} label="Dashboard" />
          <SidebarLink href="/admin/products" label="Products" />
          <SidebarLink href="/admin/prices" label="Prices" />
          <SidebarLink href="/admin/categories" label="Categories" />
          <SidebarLink href="/admin/brands" label="Brands" />
          <SidebarLink href="/admin/vouchers" label="Vouchers" />
          <SidebarLink href="/admin/retail-users" label="Retail Users" />
          <SidebarLink href="/admin/generate-token" label="Generate Token" />
          <SidebarLink href="/admin/promo-banners" label="Promo Banners" />
          <SidebarLink href="/admin/inquiries" label="Inquiries" />
          <SidebarLink href="/admin/reports" label="Reports" />
          <SidebarLink href="/admin/store-settings" label="Store Settings" />
        </nav>

        {isSuperAdmin ? (
          <>
            <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase text-text-muted">System</p>
            <nav className="space-y-1">
              <SidebarLink href="/super-admin/admin-users" label="Admin Users" />
              <SidebarLink href="/super-admin/roles" label="Roles & Permissions" />
              <SidebarLink href="/super-admin/feature-flags" label="Feature Flags" />
              <SidebarLink href="/super-admin/deployment" label="Deployment Center" />
              <SidebarLink href="/super-admin/ci-cd" label="CI/CD Status" />
              <SidebarLink href="/super-admin/maintenance" label="Maintenance Mode" />
              <SidebarLink href="/super-admin/system-logs" label="System Logs" />
              <SidebarLink href="/super-admin/security" label="Security Settings" />
              <SidebarLink href="/super-admin/environment" label="Environment Info" />
            </nav>
          </>
        ) : null}
      </div>
    </aside>
  );
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-soft-bg hover:text-primary-maroon"
    >
      <span>{label}</span>
    </Link>
  );
}
