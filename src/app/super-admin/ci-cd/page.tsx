import { requireSuperAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function CiCdPage() {
  await requireSuperAdminSession();

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">CI/CD Status</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Continuous integration and deployment configuration overview.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[#D7DEE8] bg-white p-5 text-[#111827] shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#111827]">CI/CD Configuration</h2>
          <dl className="grid gap-3 text-sm">
            <DeploymentField label="CI Provider" value="GitHub Actions" />
            <DeploymentField label="Deployment Target" value="Hostinger Managed Node.js" />
            <DeploymentField label="Production Branch" value="main" />
            <DeploymentField label="Staging Branch" value="develop" />
          </dl>
        </div>

        <div className="rounded-lg border border-[#D7DEE8] bg-white p-5 text-[#111827] shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#111827]">Branch Strategy</h2>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-bold text-success">main</span>
              <span className="text-brand-muted">Production</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning">develop</span>
              <span className="text-brand-muted">Staging / Development</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="rounded-full bg-brand-secondary/15 px-2 py-0.5 text-xs font-bold text-brand-primary">feature/*</span>
              <span className="text-brand-muted">Feature branches</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-bold text-brand-primary">fix/*</span>
              <span className="text-brand-muted">Bug fixes</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="rounded-full bg-brand-accent/20 px-2 py-0.5 text-xs font-bold text-brand-accent">hotfix/*</span>
              <span className="text-brand-muted">Emergency fixes</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[#D7DEE8] bg-white p-5 text-[#111827] shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-[#111827]">Continuous Integration (CI)</h2>
        <p className="mb-3 text-sm text-brand-muted">
          A GitHub Actions workflow (<code className="rounded bg-bg-gray px-1.5 py-0.5 text-xs">.github/workflows/ci.yml</code>) runs on
          every push and pull request to <strong>main</strong> and <strong>develop</strong>. It validates:
        </p>
        <ul className="mb-4 grid gap-2 text-sm">
          <li className="flex items-center gap-2 text-brand-muted">
            <span className="text-success">✓</span> Prisma schema validation &amp; client generation
          </li>
          <li className="flex items-center gap-2 text-brand-muted">
            <span className="text-success">✓</span> TypeScript type checking
          </li>
          <li className="flex items-center gap-2 text-brand-muted">
            <span className="text-success">✓</span> ESLint
          </li>
          <li className="flex items-center gap-2 text-brand-muted">
            <span className="text-success">✓</span> Production build
          </li>
        </ul>
        <p className="mb-4 text-sm text-brand-muted">
          <strong>Note:</strong> CI is validation-only. It does not deploy. Deployment automation is a future enhancement.
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-[#D7DEE8] bg-white p-5 text-[#111827] shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-[#111827]">Continuous Deployment (CD) — Not Configured</h2>
        <p className="mb-3 text-sm text-brand-muted">
          Automated deployment to Hostinger is <strong>not yet implemented</strong>. Deployment is currently a manual process:
        </p>
        <ol className="mb-4 ml-5 list-decimal space-y-2 text-sm text-brand-muted">
          <li>Run local validation (lint, typecheck, build)</li>
          <li>Merge to <strong>main</strong> branch</li>
          <li>Manually trigger deploy in Hostinger control panel (or upload via FTP)</li>
          <li>Apply database migrations via SSH or deployment step</li>
          <li>Run post-deployment smoke test</li>
        </ol>
        <p className="text-sm text-brand-muted">
          See <code className="rounded bg-bg-gray px-1.5 py-0.5 text-xs">docs/PRODUCTION_DEPLOYMENT_GUIDE.md</code> for full instructions.
        </p>
      </div>
    </main>
  );
}

function DeploymentField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3">
      <dt className="font-semibold text-[#111827]">{label}</dt>
      <dd className="text-[#5B6472]">{value}</dd>
    </div>
  );
}


