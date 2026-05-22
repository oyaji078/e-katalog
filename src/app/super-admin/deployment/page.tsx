import { requireSuperAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function DeploymentPage() {
  await requireSuperAdminSession();

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-dark">Deployment Center</h1>
        <p className="mt-1 text-sm text-text-muted">
          Deployment information and checklist for the e-catalog system.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border-gray bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-text-dark">Deployment Info</h2>
          <dl className="grid gap-3 text-sm">
            <DeploymentField label="Provider" value="Hostinger Managed Node.js" />
            <DeploymentField label="Source" value="GitHub" />
            <DeploymentField label="Production Branch" value="main" />
            <DeploymentField label="App Environment" value={process.env.NODE_ENV ?? "Not configured"} />
            <DeploymentField label="Node Version" value={process.version ?? "Unknown"} />
          </dl>
        </div>

        <div className="rounded-lg border border-border-gray bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-text-dark">Deployment Checklist</h2>
          <ul className="grid gap-3 text-sm">
            <ChecklistItem label="Database migration applied" done={false} />
            <ChecklistItem label="Prisma client generated" done={true} />
            <ChecklistItem label="TypeScript compilation passes" done={true} />
            <ChecklistItem label="Lint passes" done={true} />
            <ChecklistItem label="Build succeeds" done={true} />
            <ChecklistItem label="Environment variables configured" done={false} />
            <ChecklistItem label="Feature flags reviewed" done={false} />
            <ChecklistItem label="Admin accounts created" done={false} />
          </ul>
        </div>
      </div>
    </main>
  );
}

function DeploymentField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3">
      <dt className="font-semibold text-text-dark">{label}</dt>
      <dd className="text-text-muted">{value}</dd>
    </div>
  );
}

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
          done ? "bg-success" : "bg-border-gray"
        }`}
      >
        {done ? "✓" : "○"}
      </span>
      <span className={done ? "text-text-dark" : "text-text-muted"}>{label}</span>
    </li>
  );
}
