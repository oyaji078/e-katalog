import { getDb } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireSuperAdminSession();
  const db = getDb();

  const adminUsers = await db.user.findMany({
    where: {
      OR: [{ role: "ADMIN" }, { role: "SUPER_ADMIN" }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <main>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Admin Users</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage admin and super admin accounts.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border-gray bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-gray bg-soft-bg text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.length > 0 ? (
              adminUsers.map((u) => (
                <tr key={u.id} className="border-b border-border-gray/50">
                  <td className="px-4 py-3 font-medium text-text-dark">{u.name}</td>
                  <td className="px-4 py-3 text-text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(u.createdAt).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">
                  No admin users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-lg border border-soft-teal/30 bg-soft-teal/10 p-4 text-sm text-primary-maroon">
        Admin user creation and role changes are managed through user registration and database-level
        role assignment. Use the database or seed scripts to create new admin accounts.
      </div>
    </main>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isSuper = role === "SUPER_ADMIN";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        isSuper ? "bg-accent-rose/20 text-accent-rose" : "bg-soft-teal/15 text-primary-maroon"
      }`}
    >
      {role}
    </span>
  );
}
