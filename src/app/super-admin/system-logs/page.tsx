import { requireSuperAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SystemLogsPage() {
  await requireSuperAdminSession();
  const db = getDb();

  const logs = await db.adminActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: { select: { name: true, email: true } },
    },
  });

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-dark">System Logs</h1>
        <p className="mt-1 text-sm text-text-muted">
          Administrative action logs. Showing the last 100 entries.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border-gray bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-gray bg-soft-bg text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-border-gray/50">
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                    {new Date(log.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-text-dark">{log.actor?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-primary-maroon">{log.actorRole ?? "-"}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-dark">{log.action}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {log.targetType}:{log.targetId ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge risk={log.risk} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted">
                  No system logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    LOW: "bg-soft-teal/15 text-primary-maroon",
    MEDIUM: "bg-warning/20 text-warning",
    HIGH: "bg-danger/20 text-danger",
    CRITICAL: "bg-accent-rose/20 text-accent-rose",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[risk] || "bg-border-gray text-text-muted"}`}
    >
      {risk}
    </span>
  );
}
