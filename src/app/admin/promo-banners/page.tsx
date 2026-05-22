import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export default async function PromoBannersPage() {
  await requireAdmin();
  const db = getDb();

  const [banners, promoEnabled] = await Promise.all([
    db.promoBanner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    isFeatureEnabled("enable_promo_banner"),
  ]);

  return (
    <main>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Promo Banners</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage promotional banners displayed on the homepage.
          </p>
        </div>
      </div>

      {!promoEnabled ? (
        <div className="mb-4 rounded-lg border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
          The promo banner feature flag is currently disabled. Banners will not show on the homepage.
        </div>
      ) : null}

      <div className="rounded-lg border border-border-gray bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-gray bg-soft-bg text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Sort Order</th>
              <th className="px-4 py-3 font-medium">Period</th>
            </tr>
          </thead>
          <tbody>
            {banners.length > 0 ? (
              banners.map((b) => (
                <tr key={b.id} className="border-b border-border-gray/50">
                  <td className="px-4 py-3 font-medium text-text-dark">{b.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        b.isActive ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                      }`}
                    >
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{b.sortOrder}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {b.startsAt
                      ? new Date(b.startsAt).toLocaleDateString("id-ID")
                      : "Ongoing"}
                    {" - "}
                    {b.endsAt
                      ? new Date(b.endsAt).toLocaleDateString("id-ID")
                      : "No end"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">
                  No promo banners yet. Banners can be managed through the database or seed scripts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
