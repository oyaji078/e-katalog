import { requireSuperAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EnvironmentPage() {
  await requireSuperAdminSession();
  const db = getDb();

  let dbConnected = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Environment Info</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Safe environment metadata. Secrets are never displayed.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-brand-text">Runtime</h2>
          <dl className="grid gap-3 text-sm">
            <EnvField label="NODE_ENV" value={process.env.NODE_ENV ?? "Not set"} />
            <EnvField label="Node Version" value={process.version} />
            <EnvField label="Platform" value={process.platform} />
            <EnvField label="Architecture" value={process.arch} />
          </dl>
        </div>

        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-brand-text">Database</h2>
          <dl className="grid gap-3 text-sm">
            <div className="grid grid-cols-[160px_1fr] gap-3">
              <dt className="font-semibold text-brand-text">Status</dt>
              <dd>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${
                    dbConnected ? "bg-success" : "bg-danger"
                  }`}
                >
                  {dbConnected ? "Connected" : "Disconnected"}
                </span>
              </dd>
            </div>
            <EnvField label="Provider" value="MySQL (MariaDB)" />
          </dl>
        </div>

        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-brand-text">Storage</h2>
          <p className="text-sm text-brand-muted">
            Storage status not yet configured for display.
          </p>
        </div>

        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-brand-text">Domain &amp; CDN</h2>
          <p className="text-sm text-brand-muted">
            Domain and CDN configuration not yet available for display.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
        <strong>Warning:</strong> This page shows system metadata only. Environment variables
        containing secrets (DATABASE_URL, BETTER_AUTH_SECRET, GitHub tokens, SMTP passwords,
        API keys) are never displayed here.
      </div>
    </main>
  );
}

function EnvField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3">
      <dt className="font-semibold text-brand-text">{label}</dt>
      <dd className="font-mono text-xs text-brand-muted">{value}</dd>
    </div>
  );
}
