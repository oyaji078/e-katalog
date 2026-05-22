import { requireSuperAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function CiCdPage() {
  await requireSuperAdminSession();

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-dark">CI/CD Status</h1>
        <p className="mt-1 text-sm text-text-muted">
          Continuous integration and deployment configuration overview.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border-gray bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-text-dark">CI/CD Configuration</h2>
          <dl className="grid gap-3 text-sm">
            <DeploymentField label="CI Provider" value="GitHub Actions" />
            <DeploymentField label="Deployment Target" value="Hostinger Managed Node.js" />
            <DeploymentField label="Production Branch" value="main" />
            <DeploymentField label="Staging Branch" value="develop" />
          </dl>
        </div>

        <div className="rounded-lg border border-border-gray bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-text-dark">Branch Strategy</h2>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-bold text-success">main</span>
              <span className="text-text-muted">Production</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning">develop</span>
              <span className="text-text-muted">Staging / Development</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="rounded-full bg-soft-teal/15 px-2 py-0.5 text-xs font-bold text-primary-maroon">feature/*</span>
              <span className="text-text-muted">Feature branches</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="rounded-full bg-primary-maroon/10 px-2 py-0.5 text-xs font-bold text-primary-maroon">fix/*</span>
              <span className="text-text-muted">Bug fixes</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="rounded-full bg-accent-rose/20 px-2 py-0.5 text-xs font-bold text-accent-rose">hotfix/*</span>
              <span className="text-text-muted">Emergency fixes</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border-gray bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-text-dark">CI/CD Setup Checklist</h2>
        <ul className="grid gap-3 text-sm">
          <ChecklistItem label="GitHub Actions workflow configured" done={false} />
          <ChecklistItem label="Hostinger deployment credentials configured" done={false} />
          <ChecklistItem label="Environment secrets set in GitHub" done={false} />
          <ChecklistItem label="Database migration step in pipeline" done={false} />
          <ChecklistItem label="Build and test steps configured" done={false} />
          <ChecklistItem label="Deployment notification configured" done={false} />
        </ul>
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
