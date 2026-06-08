import {
  Activity,
  Database,
  Flag,
  Gauge,
  HardDriveUpload,
  LockKeyhole,
  ServerCog,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import KpiCard from "@/components/dashboard/KpiCard";
import OperationalSummary, { type OperationalSummaryItem } from "@/components/dashboard/OperationalSummary";
import RecentActivityList, { type RecentActivityItem } from "@/components/dashboard/RecentActivityList";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/access-control";
import {
  getAuthHealth,
  getDatabaseHealth,
  getDeploymentRows,
  getUploadHealth,
  type HealthCheck,
  type HealthStatus,
} from "@/lib/system-health";

export const dynamic = "force-dynamic";

const healthTone: Record<HealthStatus, "up" | "warning" | "down"> = {
  OK: "up",
  WARN: "warning",
  ERROR: "down",
};

const statusClass: Record<HealthStatus, string> = {
  OK: "bg-success/10 text-success",
  WARN: "bg-warning/10 text-warning",
  ERROR: "bg-danger/10 text-danger",
};

function activityTone(risk: string): RecentActivityItem["tone"] {
  if (risk === "HIGH" || risk === "CRITICAL") return "red";
  if (risk === "MEDIUM") return "gold";
  return "blue";
}

function quickActions() {
  return [
    { href: "/super-admin/admin-users", label: "Kelola Admin", icon: Users },
    { href: "/super-admin/feature-flags", label: "Feature Flags", icon: Flag },
    { href: "/super-admin/system", label: "System", icon: ServerCog },
    { href: "/admin/reports", label: "Laporan", icon: Activity },
    { href: "/admin/store-settings", label: "Pengaturan Toko", icon: Settings },
  ];
}

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin();
  const db = getDb();
  const now = new Date();

  const [
    database,
    auth,
    totalAdmin,
    activeAdmin,
    totalUsers,
    featureFlags,
    recentLogs,
  ] = await Promise.all([
    getDatabaseHealth(),
    getAuthHealth(),
    db.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
    db.user.count({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        sessions: { some: { expiresAt: { gt: now } } },
      },
    }),
    db.user.count(),
    db.featureFlag.findMany({
      orderBy: [{ enabled: "desc" }, { updatedAt: "desc" }],
      select: { id: true, key: true, name: true, description: true, enabled: true, scope: true, updatedAt: true },
    }),
    db.adminActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        actorRole: true,
        risk: true,
        createdAt: true,
      },
    }),
  ]);

  const uploads = getUploadHealth();
  const activeFlags = featureFlags.filter((flag) => flag.enabled);
  const inactiveFlags = featureFlags.length - activeFlags.length;
  const criticalFlags = featureFlags.filter((flag) =>
    /maintenance|auth|retail|inquiry|upload|security|admin/i.test(flag.key),
  );
  const securityLogs = recentLogs.filter((log) =>
    log.risk === "HIGH" ||
    log.risk === "CRITICAL" ||
    /role|delete|password|security|admin/i.test(log.action),
  );
  const deploymentRows = getDeploymentRows();

  const adminActivity: RecentActivityItem[] = recentLogs.map((log) => ({
    id: log.id,
    label: log.action,
    description: `${log.targetType}${log.targetId ? ` #${log.targetId}` : ""} - ${log.actorRole ?? "SYSTEM"}`,
    time: log.createdAt.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    tone: activityTone(log.risk),
  }));

  const securityActivity: RecentActivityItem[] = securityLogs.slice(0, 6).map((log) => ({
    id: log.id,
    label: log.action,
    description: `${log.targetType} - risiko ${log.risk} - ${log.actorRole ?? "SYSTEM"}`,
    time: log.createdAt.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    tone: activityTone(log.risk),
  }));

  const featureSummary: OperationalSummaryItem[] = [
    {
      label: "Feature Flag Aktif",
      value: activeFlags.length,
      description: "Fitur yang sedang aktif di sistem.",
      href: "/super-admin/feature-flags",
      tone: activeFlags.length > 0 ? "blue" : "neutral",
    },
    {
      label: "Feature Flag Nonaktif",
      value: inactiveFlags,
      description: "Fitur yang tersedia tetapi dimatikan.",
      href: "/super-admin/feature-flags",
      tone: "neutral",
    },
    {
      label: "Critical Features",
      value: criticalFlags.length,
      description: "Flag terkait maintenance, auth, ritel, inquiry, upload, atau admin.",
      href: "/super-admin/feature-flags",
      tone: criticalFlags.some((flag) => flag.enabled) ? "gold" : "neutral",
    },
    {
      label: "Maintenance Mode",
      value: featureFlags.find((flag) => flag.key === "enable_maintenance_mode")?.enabled ? "ON" : "OFF",
      description: "Kontrol akses publik saat perawatan sistem.",
      href: "/super-admin/maintenance",
      tone: featureFlags.find((flag) => flag.key === "enable_maintenance_mode")?.enabled ? "red" : "green",
    },
  ];

  return (
    <main className="min-w-0 space-y-5">
      <section className="min-w-0 rounded-lg border border-[#D7DEE8] bg-white p-4 text-[#111827] shadow-sm">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="truncate text-2xl font-black text-[#111827]">Super Admin Dashboard</h1>
          <p className="text-sm font-medium text-[#5B6472]">
            Monitoring sistem, keamanan, fitur, dan operasional admin
          </p>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total Admin"
          value={totalAdmin}
          href="/super-admin/admin-users"
          icon={<ShieldCheck className="size-5" />}
          trend="Semua role"
        />
        <KpiCard
          label="Admin Aktif"
          value={activeAdmin}
          href="/super-admin/admin-users"
          icon={<Users className="size-5" />}
          trend="Sesi aktif"
          trendTone={activeAdmin > 0 ? "up" : "neutral"}
        />
        <KpiCard
          label="Feature Flag Aktif"
          value={activeFlags.length}
          href="/super-admin/feature-flags"
          icon={<Flag className="size-5" />}
          trend={`${featureFlags.length} total`}
        />
        <KpiCard
          label="Total Pengguna"
          value={totalUsers}
          href="/super-admin/admin-users"
          icon={<Activity className="size-5" />}
          trend="User + admin"
        />
        <KpiCard
          label="Status Database"
          value={database.status}
          href="/super-admin/system"
          icon={<Database className="size-5" />}
          trend="Health"
          trendTone={healthTone[database.status]}
          helper="database"
        />
        <KpiCard
          label="Status Upload Storage"
          value={uploads.status}
          href="/super-admin/system"
          icon={<HardDriveUpload className="size-5" />}
          trend="Storage"
          trendTone={healthTone[uploads.status]}
          helper="uploads"
        />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
        <SystemHealthPanel database={database} auth={auth} uploads={uploads} deploymentRows={deploymentRows} />
        <QuickActions />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        <OperationalSummary title="Feature Flags Summary" items={featureSummary} />
        <RecentActivityList title="Admin Activity" items={adminActivity} emptyText="Belum ada aktivitas admin." />
        <RecentActivityList
          title="Security Panel"
          items={securityActivity}
          emptyText="Tidak ada aksi sensitif terbaru yang tercatat."
        />
        <FeatureFlagList flags={criticalFlags.slice(0, 6)} />
      </section>
    </main>
  );
}

function SystemHealthPanel({
  database,
  auth,
  uploads,
  deploymentRows,
}: {
  database: HealthCheck;
  auth: HealthCheck;
  uploads: HealthCheck;
  deploymentRows: string[][];
}) {
  const rows = [
    { label: "Database connection", check: database, icon: Database },
    { label: "Auth status", check: auth, icon: LockKeyhole },
    { label: "Upload folder status", check: uploads, icon: HardDriveUpload },
  ];

  return (
    <section className="min-w-0 rounded-lg border border-[#D7DEE8] bg-white p-5 text-[#111827] shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-black text-[#111827]">System Health</h2>
          <p className="mt-1 text-xs font-medium text-[#5B6472]">Status runtime tanpa mengekspos secret.</p>
        </div>
        <Link href="/super-admin/system" className="shrink-0 text-xs font-black text-[#111827] hover:text-[#0D0B61]">
          Detail
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 rounded-lg border border-[#D7DEE8] bg-[#EEF4F7] p-3">
            <div className="flex items-center justify-between gap-2">
              <row.icon className="size-4 shrink-0 text-[#0D0B61]" />
              <span className={`rounded-full px-2 py-1 text-[11px] font-black ${statusClass[row.check.status]}`}>
                {row.check.status}
              </span>
            </div>
            <p className="mt-3 truncate text-sm font-black text-[#111827]">{row.label}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#5B6472]">{row.check.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {deploymentRows.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-lg bg-[#EEF4F7] px-3 py-2">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.04em] text-[#5B6472]">{label}</p>
            <p className="mt-1 truncate font-mono text-xs font-black text-[#111827]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickActions() {
  return (
    <section className="min-w-0 rounded-lg border border-[#D7DEE8] bg-white p-5 text-[#111827] shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="size-5 text-[#0D0B61]" />
        <h2 className="text-base font-black text-[#111827]">Quick Actions</h2>
      </div>
      <div className="grid gap-3">
        {quickActions().map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex min-w-0 items-center gap-3 rounded-lg border border-[#D7DEE8] bg-[#EEF4F7] px-4 py-3 text-sm font-black text-[#111827] transition hover:border-brand-accent hover:bg-white hover:text-[#111827]"
          >
            <action.icon className="size-4 shrink-0" />
            <span className="truncate">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeatureFlagList({
  flags,
}: {
  flags: Array<{ id: string; key: string; name: string; enabled: boolean; scope: string; updatedAt: Date }>;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-[#D7DEE8] bg-white p-5 text-[#111827] shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="truncate text-base font-black text-[#111827]">Critical Feature Flags</h2>
        <Link href="/super-admin/feature-flags" className="shrink-0 text-xs font-black text-[#111827] hover:text-[#0D0B61]">
          Kelola
        </Link>
      </div>
      {flags.length > 0 ? (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div key={flag.id} className="min-w-0 rounded-lg bg-[#EEF4F7] p-3">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#111827]">{flag.name}</p>
                  <p className="mt-1 truncate font-mono text-[11px] font-bold text-[#5B6472]">{flag.key}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-black ${
                    flag.enabled ? "bg-success/10 text-success" : "bg-[#EEF4F7] text-[#5B6472]"
                  }`}
                >
                  {flag.enabled ? "ON" : "OFF"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-[#5B6472]">
                <span className="rounded-full bg-white px-2 py-1">{flag.scope}</span>
                <span className="rounded-full bg-white px-2 py-1">
                  {flag.updatedAt.toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-[#D7DEE8] bg-[#EEF4F7] text-sm font-semibold text-[#5B6472]">
          Tidak ada critical feature flag.
        </div>
      )}
    </section>
  );
}
