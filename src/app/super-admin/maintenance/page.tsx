import { requireSuperAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { MaintenanceToggle } from "./MaintenanceToggle";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  await requireSuperAdminSession();
  const db = getDb();

  const flag = await db.featureFlag.findUnique({
    where: { key: "enable_maintenance_mode" },
  });

  const setting = await db.storeSetting.findUnique({
    where: { key: "maintenance_message" },
  });

  const isEnabled = flag?.enabled ?? false;
  const message = setting?.value ?? "Situs sedang dalam pemeliharaan. Silakan kembali nanti.";

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Maintenance Mode</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Enable or disable maintenance mode for the public site.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-text">Status</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                isEnabled ? "bg-danger" : "bg-success"
              }`}
            >
              {isEnabled ? "MAINTENANCE ON" : "LIVE"}
            </span>
          </div>
          <p className="mb-4 text-sm text-brand-muted">
            {isEnabled
              ? "The public site is currently in maintenance mode. Only Super Admins can access system routes."
              : "The site is live and accessible to all users."}
          </p>
          <MaintenanceToggle enabled={isEnabled} flagId={flag?.id ?? null} />
        </div>

        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-brand-text">Maintenance Message</h2>
          <p className="mb-2 text-sm text-brand-muted">Current message shown to users:</p>
          <div className="rounded-md border border-brand-border bg-brand-bg p-4 text-sm text-brand-text">
            {message}
          </div>
          <p className="mt-4 text-xs text-brand-muted">
            Change the maintenance message in Store Settings under key{" "}
            <code className="font-mono text-brand-primary">maintenance_message</code>.
          </p>
        </div>
      </div>
    </main>
  );
}
