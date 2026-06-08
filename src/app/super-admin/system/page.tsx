import { Database, HardDriveUpload, KeyRound, ServerCog } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { requireSuperAdminSession } from "@/lib/admin-auth";
import {
  getAuthHealth,
  getDatabaseHealth,
  getDeploymentRows,
  getMaskedEnvironmentRows,
  getUploadHealth,
  type HealthCheck,
  type HealthStatus,
} from "@/lib/system-health";

export const dynamic = "force-dynamic";

const colors: Record<HealthStatus, string> = {
  OK: "bg-success/10 text-success",
  WARN: "bg-warning/10 text-warning",
  ERROR: "bg-danger/10 text-danger",
};

export default async function SuperAdminSystemPage() {
  await requireSuperAdminSession();

  const [database, auth] = await Promise.all([getDatabaseHealth(), getAuthHealth()]);
  const uploads = getUploadHealth();

  return (
    <main className="min-w-0 space-y-5">
      <section className="min-w-0 rounded-lg border border-[#D7DEE8] bg-white p-4 text-[#111827] shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black text-[#111827]">System Health</h1>
            <p className="mt-1 text-sm font-medium text-[#5B6472]">
              Status database, auth, storage upload, environment, dan deployment tanpa mengekspos secret.
            </p>
          </div>
          <Link
            href="/super-admin"
            className="inline-flex items-center justify-center rounded-lg border border-[#0D0B61] px-4 py-2 text-sm font-black text-[#0D0B61] transition hover:bg-[#0D0B61] hover:text-white"
          >
            Dashboard
          </Link>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 md:grid-cols-3">
        <HealthCard title="Database Connection" check={database} icon={<Database className="size-5" />} />
        <HealthCard title="Auth Status" check={auth} icon={<KeyRound className="size-5" />} />
        <HealthCard title="Upload Storage" check={uploads} icon={<HardDriveUpload className="size-5" />} />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        <InfoTable title="Masked Environment Summary" rows={getMaskedEnvironmentRows()} />
        <InfoTable title="Deployment Info" rows={getDeploymentRows()} />
      </section>

      <section className="min-w-0 rounded-lg border border-[#D7DEE8] bg-white p-5 text-[#111827] shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ServerCog className="size-5 text-[#0D0B61]" />
          <h2 className="text-base font-black text-[#111827]">System Notes</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Note title="Secrets" text="Environment secret values are masked and never rendered in this dashboard." />
          <Note title="Database" text="The health check only runs SELECT 1 and count-based auth checks." />
          <Note title="Storage" text="Upload health checks folder presence, not private file contents." />
        </div>
      </section>
    </main>
  );
}

function HealthCard({
  title,
  check,
  icon,
}: {
  title: string;
  check: HealthCheck;
  icon: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-[#D7DEE8] bg-white p-4 text-[#111827] shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF4F7] text-[#0D0B61]">
          {icon}
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-black ${colors[check.status]}`}>
          {check.status}
        </span>
      </div>
      <h2 className="mt-4 truncate text-sm font-black text-[#111827]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5B6472]">{check.detail}</p>
    </section>
  );
}

function InfoTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#D7DEE8] bg-white p-5 text-[#111827] shadow-sm">
      <h2 className="text-base font-black text-[#111827]">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <tbody>
            {rows.map(([key, value]) => (
              <tr key={key} className="border-b border-[#D7DEE8]/50 last:border-0">
                <td className="py-2 pr-4 font-mono text-xs font-bold text-[#5B6472]">{key}</td>
                <td className="py-2 font-semibold text-[#111827]">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Note({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-[#EEF4F7] p-4">
      <p className="text-sm font-black text-[#111827]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#5B6472]">{text}</p>
    </div>
  );
}
