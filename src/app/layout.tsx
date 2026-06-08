import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

import "./globals.css";

import { auth } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getCurrentUser } from "@/lib/session";
import { buildSiteThemeStyle, getPublicSiteSettings } from "@/lib/site-settings";
import FigmaMobileBottomNav from "@/components/ui/FigmaMobileBottomNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Rama Computer - Katalog Komputer & Aksesoris",
    template: "%s | Rama Computer",
  },
  description: "Katalog komputer, laptop, aksesoris, dan elektronik. Cek harga dan stok via WhatsApp.",
  openGraph: {
    siteName: "Rama Computer",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

function isAuthPage(pathname: string) {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/api/auth")
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check maintenance mode for public routes only
  let showMaintenance = false;
  let pathname = "/";

  try {
    const { headers } = await import("next/headers");
    const hdrs = await headers();
    pathname = hdrs.get("x-pathname") ?? "/";

    const maintenanceMode = await isFeatureEnabled("enable_maintenance_mode");

    if (maintenanceMode) {
      const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/super-admin");
      const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/api/auth");
      const isMaintenanceRoute = pathname.startsWith("/maintenance");

      if (!isAdminRoute && !isAuthRoute && !isMaintenanceRoute) {
        const session = await auth.api.getSession({
          headers: hdrs,
        }).catch(() => null);

        if (session?.user?.role !== "SUPER_ADMIN") {
          showMaintenance = true;
        }
      }
    }
  } catch {
    // Fail open — allow access if maintenance check fails
  }

  const [user, settings, publicVoucherEnabled, retailVoucherEnabled] = await Promise.all([
    getCurrentUser().catch(() => null),
    getPublicSiteSettings(),
    isFeatureEnabled("enable_public_voucher"),
    isFeatureEnabled("enable_retail_voucher"),
  ]);
  const hideBottomNav = isAuthPage(pathname);

  const isAdminUser = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const showPublicBottomNav = !hideBottomNav && !isAdminUser;
  const voucherEnabled =
    user?.retailStatus === "RETAIL_ACTIVE" ? retailVoucherEnabled : publicVoucherEnabled;

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} style={buildSiteThemeStyle(settings)}>
      <body className={`min-h-full flex flex-col ${showPublicBottomNav ? "pb-16 lg:pb-0" : ""}`}>
        {showMaintenance ? (
          <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
            <div className="max-w-md rounded-lg border border-brand-border bg-brand-card p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-warning/20">
                <span className="text-3xl font-bold text-warning">!</span>
              </div>
              <h1 className="text-2xl font-bold text-brand-text">Maintenance Mode</h1>
              <p className="mt-3 text-sm leading-6 text-brand-muted">
                Situs sedang dalam pemeliharaan. Silakan kembali lagi nanti.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-md bg-brand-accent px-4 py-2 text-sm font-bold text-brand-on-accent hover:bg-brand-accent-hover"
              >
                Refresh
              </Link>
            </div>
          </div>
        ) : (
          <>
            {children}
            {showPublicBottomNav ? (
              <FigmaMobileBottomNav user={user} voucherEnabled={voucherEnabled} />
            ) : null}
          </>
        )}
      </body>
    </html>
  );
}
