"use client";

import {
  BarChart3,
  Bookmark,
  FileText,
  Flag,
  Globe,
  Image,
  LayoutDashboard,
  Menu as MenuIcon,
  Package,
  Settings,
  Shield,
  Tags,
  Terminal,
  TicketPercent,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";

type AdminMobileNavProps = {
  role: string | null | undefined;
  brandName?: string;
  logoUrl?: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const adminGroups: NavGroup[] = [
  {
    label: "Katalog",
    items: [
      { href: "/admin", label: "Dasbor", icon: LayoutDashboard },
      { href: "/admin/products", label: "Produk", icon: Package },
      { href: "/admin/categories", label: "Kategori", icon: Tags },
      { href: "/admin/brands", label: "Merek", icon: Bookmark },
    ],
  },
  {
    label: "Promosi",
    items: [
      { href: "/admin/flash-sales", label: "Flash Sale", icon: Zap },
      { href: "/admin/promo-vouchers", label: "Promo & Voucher", icon: TicketPercent },
      { href: "/admin/hero-banners", label: "Hero Banner", icon: Image },
    ],
  },
  {
    label: "Pengguna & Laporan",
    items: [
      { href: "/admin/retail-users", label: "Pengguna Ritel", icon: Users },
      { href: "/admin/inquiries", label: "Inquiry", icon: BarChart3 },
      { href: "/admin/reports", label: "Laporan", icon: FileText },
    ],
  },
  {
    label: "Pengaturan",
    items: [{ href: "/admin/store-settings", label: "Pengaturan Toko", icon: Settings }],
  },
];

const superAdminGroups: NavGroup[] = [
  {
    label: "Sistem",
    items: [
      { href: "/super-admin", label: "Dasbor", icon: LayoutDashboard },
      { href: "/super-admin/system", label: "System", icon: Wrench },
      { href: "/super-admin/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/super-admin/deployment", label: "Deploy", icon: Terminal },
      { href: "/super-admin/ci-cd", label: "CI/CD", icon: Wrench },
      { href: "/super-admin/maintenance", label: "Maintenance", icon: Settings },
      { href: "/super-admin/environment", label: "Environment", icon: Globe },
    ],
  },
  {
    label: "Pengguna",
    items: [
      { href: "/super-admin/admin-users", label: "Admin Users", icon: Shield },
      { href: "/super-admin/roles", label: "Roles", icon: Users },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { href: "/super-admin/system-logs", label: "Activity Logs", icon: FileText },
      { href: "/super-admin/security", label: "Security", icon: Shield },
      { href: "/super-admin/reports", label: "Reports", icon: FileText },
    ],
  },
];

const adminBottomItems: NavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Dasbor" },
  { href: "/admin/products", icon: Package, label: "Produk" },
  { href: "/admin/promo-vouchers", icon: TicketPercent, label: "Promo" },
  { href: "/admin/retail-users", icon: Users, label: "Ritel" },
];

const superAdminBottomItems: NavItem[] = [
  { href: "/super-admin", icon: LayoutDashboard, label: "Dasbor" },
  { href: "/super-admin/system", icon: Wrench, label: "System" },
  { href: "/super-admin/feature-flags", icon: Flag, label: "Flags" },
  { href: "/super-admin/admin-users", icon: Shield, label: "Admin" },
];

export default function AdminMobileNav({
  role,
  brandName = "RAMA COMPUTER",
  logoUrl,
}: AdminMobileNavProps) {
  const pathname = usePathname();
  const isSuperAdminArea = role === "SUPER_ADMIN" && pathname.startsWith("/super-admin");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const groups = isSuperAdminArea ? superAdminGroups : adminGroups;
  const bottomItems = isSuperAdminArea ? superAdminBottomItems : adminBottomItems;

  useEffect(() => {
    function openDrawer() {
      setDrawerOpen(true);
    }

    window.addEventListener("admin-mobile-menu-open", openDrawer);
    return () => window.removeEventListener("admin-mobile-menu-open", openDrawer);
  }, []);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D7DEE8] bg-white text-[#111827] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="grid h-14 grid-cols-5">
          {bottomItems.map((item) => {
            const isItemActive = isActive(item.href, pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`m-1 flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 transition-colors ${
                  isItemActive
                    ? "bg-brand-accent text-brand-on-accent"
                    : "text-[#5B6472] hover:bg-[rgba(228,211,41,0.12)] hover:text-[#0D0B61]"
                }`}
              >
                <item.icon size={18} strokeWidth={isItemActive ? 2.5 : 1.8} />
                <span className="max-w-full truncate text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="m-1 flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[#5B6472] transition-colors hover:bg-[rgba(228,211,41,0.12)] hover:text-[#0D0B61]"
          >
            <MenuIcon size={18} />
            <span className="max-w-full truncate text-[10px] font-bold">Menu</span>
          </button>
        </div>
      </nav>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white text-[#111827] lg:hidden">
          <div className="flex items-center justify-between border-b border-[#D7DEE8] px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="size-8 shrink-0 rounded-lg border border-[#D7DEE8] bg-white object-contain p-1"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0D0B61]">
                  <span className="text-xs font-black text-white">{brandInitials(brandName)}</span>
                </div>
              )}
              <span className="min-w-0 truncate text-sm font-bold text-[#111827]">{brandName}</span>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#5B6472] hover:bg-[rgba(228,211,41,0.12)] hover:text-[#0D0B61]"
              aria-label="Tutup menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {groups.map((group) => (
              <div key={group.label} className="mb-3">
                <div className="mb-0.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5B6472]">
                  {group.label}
                </div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href, pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? "bg-brand-accent font-bold text-brand-on-accent"
                            : "text-[#5B6472] hover:bg-[rgba(228,211,41,0.12)] hover:text-[#0D0B61]"
                        }`}
                      >
                        <item.icon size={20} />
                        <span className="min-w-0 truncate">{item.label}</span>
                        {active ? <span className="ml-auto size-2 shrink-0 rounded-full bg-[#0D0B61]" /> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : null}
    </>
  );
}

function brandInitials(value: string) {
  const letters = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return letters || "RC";
}

function isActive(href: string, currentPath: string): boolean {
  if (href === "/admin" || href === "/super-admin") return currentPath === href;
  return currentPath.startsWith(href);
}
