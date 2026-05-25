import { getDb } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/admin-auth";
import { FeatureFlagToggle } from "./FeatureFlagToggle";

export const dynamic = "force-dynamic";

const standardFlags = [
  { key: "enable_retail_registration", name: "Retail Registration", description: "Allow users to register as retail customers." },
  { key: "enable_retail_token_activation", name: "Retail Token Activation", description: "Allow retail activation via token." },
  { key: "enable_retail_whatsapp_request", name: "Retail WhatsApp Request", description: "Allow retail status requests via WhatsApp." },
  { key: "enable_retail_price", name: "Retail Price", description: "Show retail prices to active retail users." },
  { key: "enable_public_voucher", name: "Public Voucher", description: "Enable public voucher display and usage." },
  { key: "enable_retail_voucher", name: "Retail Voucher", description: "Enable retail-only vouchers." },
  { key: "enable_margin_management", name: "Margin Management", description: "Allow margin configuration in admin." },
  { key: "enable_inquiry_tracking", name: "Inquiry Tracking", description: "Log WhatsApp inquiries to database." },
  { key: "enable_product_import", name: "Product Import", description: "Allow bulk product import." },
  { key: "enable_promo_banner", name: "Promo Banner", description: "Show promo banners on the homepage." },
  { key: "enable_maintenance_mode", name: "Maintenance Mode", description: "Put the site in maintenance mode." },
  { key: "enable_admin_activity_log", name: "Admin Activity Log", description: "Log admin and super admin actions." },
];

export default async function FeatureFlagsPage() {
  await requireSuperAdminSession();
  const db = getDb();

  const existingFlags = await db.featureFlag.findMany({
    orderBy: { key: "asc" },
  });

  const existingMap = new Map(existingFlags.map((f) => [f.key, f]));

  const allFlags = standardFlags.map((s) => ({
    ...s,
    dbFlag: existingMap.get(s.key) ?? null,
  }));

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Feature Flags</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Toggle system features on or off. Changes are logged.
        </p>
      </div>

      <div className="rounded-lg border border-brand-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg text-left text-xs text-brand-muted">
              <th className="px-4 py-3 font-medium">Flag Key</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {allFlags.map((f) => (
              <tr key={f.key} className="border-b border-brand-border/50">
                <td className="px-4 py-3 font-mono text-xs text-brand-muted">{f.key}</td>
                <td className="px-4 py-3 font-medium text-brand-text">{f.name}</td>
                <td className="px-4 py-3 text-brand-muted">{f.description}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      f.dbFlag?.enabled
                        ? "bg-success/20 text-success"
                        : "bg-danger/20 text-danger"
                    }`}
                  >
                    {f.dbFlag?.enabled ? "ENABLED" : "DISABLED"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <FeatureFlagToggle
                    flagKey={f.key}
                    enabled={f.dbFlag?.enabled ?? false}
                    flagId={f.dbFlag?.id ?? null}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
