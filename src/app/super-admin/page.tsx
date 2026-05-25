import Link from "next/link";

import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin();
  const db = getDb();

  const [adminCount, superAdminCount, recentLogs, featureFlags] = await Promise.all([
    db.user.count({ where: { role: "ADMIN" } }),
    db.user.count({ where: { role: "SUPER_ADMIN" } }),
    db.adminActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, action: true, actorRole: true, risk: true, createdAt: true },
    }),
    db.featureFlag.findMany({
      select: { id: true, key: true, enabled: true },
    }),
  ]);

  const maintenanceOn = featureFlags.find((f) => f.key === "enable_maintenance_mode")?.enabled ?? false;

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold text-brand-text">Super Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Admin Users" value={adminCount} href="/super-admin/admin-users" color="text-brand-primary" />
        <MetricCard label="Super Admins" value={superAdminCount} href="/super-admin/admin-users" color="text-brand-accent" />
        <MetricCard label="Feature Flags" value={featureFlags.length} href="/super-admin/feature-flags" color="text-brand-secondary" />
        <MetricCard
          label="Maintenance Mode"
          value={maintenanceOn ? "ON" : "OFF"}
          href="/super-admin/maintenance"
          color={maintenanceOn ? "text-danger" : "text-success"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-text">Recent System Logs</h2>
            <Link href="/super-admin/system-logs" className="text-sm font-semibold text-brand-primary">
              View all
            </Link>
          </div>
          {recentLogs.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Risk</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-brand-border/50">
                    <td className="py-2 text-brand-text">{log.action}</td>
                    <td className="py-2 text-brand-muted">{log.actorRole ?? "-"}</td>
                    <td className="py-2">
                      <RiskBadge risk={log.risk} />
                    </td>
                    <td className="py-2 text-brand-muted">
                      {new Date(log.createdAt).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-brand-muted">No system logs yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-brand-text">Quick Actions</h2>
          <div className="grid gap-3">
            <QuickAction href="/super-admin/feature-flags" label="Manage Feature Flags" />
            <QuickAction href="/super-admin/admin-users" label="Manage Admin Users" />
            <QuickAction href="/super-admin/deployment" label="Deployment Center" />
            <QuickAction href="/super-admin/maintenance" label="Toggle Maintenance Mode" />
            <QuickAction href="/super-admin/environment" label="View Environment Info" />
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value, href, color }: { label: string; value: number | string; href: string; color: string }) {
  return (
    <Link href={href} className="rounded-lg border border-brand-border bg-white p-4 shadow-sm transition hover:shadow-md">
      <p className="text-xs font-semibold text-brand-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </Link>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    LOW: "bg-brand-secondary/15 text-brand-primary",
    MEDIUM: "bg-warning/20 text-warning",
    HIGH: "bg-danger/20 text-danger",
    CRITICAL: "bg-danger/20 text-danger",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[risk] || "bg-brand-border text-brand-muted"}`}>
      {risk}
    </span>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-brand-border px-4 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
    >
      {label}
    </Link>
  );
}
