import { requireSuperAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requireSuperAdminSession();

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Roles &amp; Permissions</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Role-based access control matrix for the e-catalog system.
        </p>
      </div>

      <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-brand-text">Role Matrix</h2>
        <p className="mb-4 text-sm text-brand-muted">
          The system uses enum-based RBAC with fixed roles. Dynamic permissions are not implemented.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                <th className="pb-3 pr-4 font-medium">Role</th>
                <th className="pb-3 pr-4 font-medium">Access Level</th>
                <th className="pb-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <RoleRow
                role="SUPER_ADMIN"
                level="Full System Access"
                description="Can access all admin features plus system management: admin accounts, feature flags, deployment, CI/CD, maintenance, system logs, security, environment info."
              />
              <RoleRow
                role="ADMIN"
                level="Store Operations"
                description="Can access operational features: products, categories, brands, prices, vouchers, retail users, token generation, promo banners, inquiries, reports, store settings."
              />
              <RoleRow
                role="USER"
                level="Catalog Browsing"
                description="Can browse the catalog, view public prices, and submit WhatsApp inquiries. Can request retail status."
              />
              <RoleRow
                role="RETAIL_ACTIVE"
                level="Retail Pricing"
                description="Same as USER but can see retail prices when the retail price feature flag is enabled."
              />
              <RoleRow
                role="PENDING_RETAIL"
                level="Pending Retail"
                description="Same as USER but has requested retail access. Waiting for token activation or admin approval."
              />
              <RoleRow
                role="GUEST"
                level="Public Catalog"
                description="Unregistered users who can browse the public catalog and view public prices only."
              />
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-brand-text">Retail Status Rules</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Can See Retail Price</th>
              <th className="pb-3 font-medium">Can Generate Token</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-brand-border/50">
              <td className="py-3 pr-4 font-medium text-brand-text">REGISTERED</td>
              <td className="py-3 pr-4 text-brand-muted">No</td>
              <td className="py-3 text-brand-muted">No (target only)</td>
            </tr>
            <tr className="border-b border-brand-border/50">
              <td className="py-3 pr-4 font-medium text-brand-text">PENDING_RETAIL</td>
              <td className="py-3 pr-4 text-brand-muted">No</td>
              <td className="py-3 text-brand-muted">No (target only)</td>
            </tr>
            <tr className="border-b border-brand-border/50">
              <td className="py-3 pr-4 font-medium text-brand-text">RETAIL_ACTIVE</td>
              <td className="py-3 pr-4 text-success">Yes (if flag enabled)</td>
              <td className="py-3 text-brand-muted">No</td>
            </tr>
            <tr className="border-b border-brand-border/50">
              <td className="py-3 pr-4 font-medium text-brand-text">RETAIL_REJECTED</td>
              <td className="py-3 pr-4 text-brand-muted">No</td>
              <td className="py-3 text-brand-muted">No</td>
            </tr>
            <tr className="border-b border-brand-border/50">
              <td className="py-3 pr-4 font-medium text-brand-text">SUSPENDED</td>
              <td className="py-3 pr-4 text-brand-muted">No</td>
              <td className="py-3 text-brand-muted">No</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}

function RoleRow({ role, level, description }: { role: string; level: string; description: string }) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: "text-brand-accent",
    ADMIN: "text-brand-primary",
    USER: "text-brand-text",
    RETAIL_ACTIVE: "text-brand-secondary",
    PENDING_RETAIL: "text-warning",
    GUEST: "text-brand-muted",
  };
  return (
    <tr className="border-b border-brand-border/50">
      <td className={`py-3 pr-4 font-bold ${colors[role] || "text-brand-text"}`}>{role}</td>
      <td className="py-3 pr-4 text-brand-text">{level}</td>
      <td className="py-3 text-sm text-brand-muted">{description}</td>
    </tr>
  );
}
