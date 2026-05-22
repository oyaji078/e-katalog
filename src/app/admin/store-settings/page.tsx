import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  await requireAdmin();
  const db = getDb();

  const settings = await db.storeSetting.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-dark">Store Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Configuration key-value store for the e-catalog system.
        </p>
      </div>

      <div className="rounded-lg border border-border-gray bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-gray bg-soft-bg text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Secret</th>
              <th className="px-4 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {settings.length > 0 ? (
              settings.map((s) => (
                <tr key={s.id} className="border-b border-border-gray/50">
                  <td className="px-4 py-3 font-mono text-xs text-text-dark">{s.key}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {s.isSecret ? "••••••••" : s.value}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.isSecret ? "bg-warning/20 text-warning" : "bg-soft-teal/15 text-primary-maroon"
                      }`}
                    >
                      {s.isSecret ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{s.description ?? "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">
                  No store settings configured. Settings can be added via the database or seed scripts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
