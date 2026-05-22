import { requireSuperAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  await requireSuperAdminSession();
  const db = getDb();

  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  const superAdminCount = await db.user.count({ where: { role: "SUPER_ADMIN" } });

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-dark">Security Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Security overview and checklist. All secrets are managed server-side only.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border-gray bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-text-dark">Access Control Summary</h2>
          <dl className="grid gap-3 text-sm">
            <SecurityField label="Admin Users" value={String(adminCount)} />
            <SecurityField label="Super Admin Users" value={String(superAdminCount)} />
            <SecurityField label="Auth Provider" value="Better Auth" />
            <SecurityField label="Password Min Length" value="8 characters" />
            <SecurityField label="Password Max Length" value="128 characters" />
          </dl>
        </div>

        <div className="rounded-lg border border-border-gray bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-text-dark">Security Checklist</h2>
          <ul className="grid gap-3 text-sm">
            <ChecklistItem label="Admin routes protected server-side" done={true} />
            <ChecklistItem label="Super Admin routes require session check" done={true} />
            <ChecklistItem label="Cost prices never exposed in public API" done={true} />
            <ChecklistItem label="WhatsApp number from StoreSetting (not client)" done={true} />
            <ChecklistItem label="Feature flags checked server-side" done={true} />
            <ChecklistItem label="No checkout/cart/payment endpoints" done={true} />
            <ChecklistItem label="Secrets not logged in activity log" done={true} />
            <ChecklistItem label="Environment variables not exposed in UI" done={true} />
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border-gray bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-text-dark">Security Notes</h2>
        <ul className="grid gap-2 text-sm text-text-muted">
          <li>• All database secrets (DATABASE_URL, AUTH_SECRET) are server-side environment variables only.</li>
          <li>• API routes resolve user roles server-side; client role claims are never trusted.</li>
          <li>• Admin/Super Admin sidebar hides unauthorized links, but route access is also enforced server-side.</li>
          <li>• WhatsApp inquiries use server-resolved product pricing; client cannot submit price data.</li>
          <li>• AdminActivityLog excludes passwords, tokens, and secrets.</li>
        </ul>
      </div>
    </main>
  );
}

function SecurityField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3">
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
