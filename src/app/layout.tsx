import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import "./globals.css";

import { auth } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "E-Katalog Komputer",
  description:
    "Katalog komputer dan aksesoris elektronik dengan alur inquiry WhatsApp.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check maintenance mode for public routes only
  let showMaintenance = false;

  try {
    const maintenanceMode = await isFeatureEnabled("enable_maintenance_mode");

    if (maintenanceMode) {
      const hdrs = await headers();
      const pathname = hdrs.get("x-pathname") ?? "/";

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

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {showMaintenance ? (
          <div className="flex min-h-screen items-center justify-center bg-soft-bg px-4">
            <div className="max-w-md rounded-lg border border-border-gray bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-warning/20">
                <span className="text-3xl font-bold text-warning">!</span>
              </div>
              <h1 className="text-2xl font-bold text-text-dark">Maintenance Mode</h1>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                Situs sedang dalam pemeliharaan. Silakan kembali lagi nanti.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-md bg-primary-maroon px-4 py-2 text-sm font-bold text-white"
              >
                Refresh
              </Link>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
