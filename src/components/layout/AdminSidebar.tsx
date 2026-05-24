"use client";

import { BarChart3, Bookmark, ChevronLeft, ChevronRight, FileText, Flag, Globe, Image, KeyRound, LayoutDashboard, Package, Settings, Shield, Tags, Terminal, TicketPercent, Users, Wrench, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import LogoutButton from "@/components/layout/LogoutButton";

type SidebarProps = {
  role: "ADMIN" | "SUPER_ADMIN" | string | null | undefined;
};

const STORAGE_KEY = "ekatalog_sidebar_collapsed";

export default function AdminSidebar({ role }: SidebarProps) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {
      // localStorage not available
    }

    const syncMobile = () => setIsMobile(window.innerWidth < 1024);
    syncMobile();
    window.addEventListener("resize", syncMobile);
    return () => window.removeEventListener("resize", syncMobile);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // localStorage not available
    }
  };

  if (!mounted) {
    return (
      <aside className="w-16 shrink-0 border-r border-border-gray bg-white lg:w-64" />
    );
  }

  const effectiveCollapsed = collapsed || isMobile;

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-border-gray bg-white transition-all duration-200 ${
        effectiveCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center justify-center border-b border-border-gray px-3 py-3">
          <Link
            href={isSuperAdmin ? "/super-admin" : "/admin"}
            className="flex items-center gap-2"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary-maroon">
              <span className="text-xs font-black text-white">EK</span>
            </div>
            {!effectiveCollapsed ? (
              <span className="text-sm font-bold text-text-dark">E-Katalog</span>
            ) : null}
          </Link>
        </div>

        {/* Toggle */}
        <div className="flex justify-center border-b border-border-gray px-3 py-2">
          <button
            type="button"
            onClick={toggleCollapse}
            className="rounded-lg p-1 text-text-muted hover:bg-soft-bg hover:text-text-dark"
            title={effectiveCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          >
            {effectiveCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          {!effectiveCollapsed ? (
            <span className="ml-2 text-xs text-text-muted">Ciutkan</span>
          ) : null}
        </div>

        {/* Admin Nav */}
        <div className="flex-1 space-y-1 px-2 py-3">
          <SidebarLink href={isSuperAdmin ? "/super-admin" : "/admin"} label="Dasbor" icon={LayoutDashboard} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/products" label="Produk" icon={Package} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/categories" label="Kategori" icon={Tags} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/brands" label="Merek" icon={Bookmark} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/flash-sales" label="Flash Sale" icon={Zap} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/promo-vouchers" label="Promo & Voucher" icon={TicketPercent} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/hero-banners" label="Hero Banner" icon={Image} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/retail-users" label="Pengguna Ritel" icon={Users} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/inquiries" label="Inquiry" icon={BarChart3} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/reports" label="Laporan" icon={FileText} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/store-settings" label="Pengaturan Toko" icon={Settings} collapsed={effectiveCollapsed} />
          <SidebarLink href="/admin/generate-token" label="Generate Token" icon={KeyRound} collapsed={effectiveCollapsed} />
        </div>

        {/* Super Admin Nav */}
        {isSuperAdmin ? (
          <div className="space-y-1 border-t border-border-gray px-2 py-3">
            <div className={`mb-1 ${effectiveCollapsed ? "text-center" : "px-3"} text-[10px] font-semibold uppercase text-text-muted`}>
              {effectiveCollapsed ? "..." : "Sistem"}
            </div>
            <SidebarLink href="/super-admin/admin-users" label="Admin" icon={Shield} collapsed={effectiveCollapsed} />
            <SidebarLink href="/super-admin/feature-flags" label="Fitur" icon={Flag} collapsed={effectiveCollapsed} />
            <SidebarLink href="/super-admin/deployment" label="Deploy" icon={Terminal} collapsed={effectiveCollapsed} />
            <SidebarLink href="/super-admin/ci-cd" label="CI/CD" icon={Wrench} collapsed={effectiveCollapsed} />
            <SidebarLink href="/super-admin/maintenance" label="Maintenance" icon={Settings} collapsed={effectiveCollapsed} />
            <SidebarLink href="/super-admin/system-logs" label="Log" icon={FileText} collapsed={effectiveCollapsed} />
            <SidebarLink href="/super-admin/security" label="Keamanan" icon={Shield} collapsed={effectiveCollapsed} />
            <SidebarLink href="/super-admin/environment" label="Environment" icon={Globe} collapsed={effectiveCollapsed} />
            <SidebarLink href="/super-admin/roles" label="Roles" icon={Users} collapsed={effectiveCollapsed} />
          </div>
        ) : null}

        {/* Logout */}
        <div className="border-t border-border-gray px-2 py-3">
          <LogoutButton
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger/10 ${
              effectiveCollapsed ? "justify-center" : ""
            }`}
            iconOnly={effectiveCollapsed}
          />
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-soft-bg hover:text-primary-maroon ${
        collapsed ? "justify-center" : ""
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} />
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );
}
