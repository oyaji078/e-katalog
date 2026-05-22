import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InquiriesPage() {
  await requireAdmin();
  const db = getDb();

  const inquiries = await db.whatsappInquiryLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-dark">WhatsApp Inquiries</h1>
        <p className="mt-1 text-sm text-text-muted">
          Log of all WhatsApp inquiries submitted through the catalog.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border-gray bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-gray bg-soft-bg text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length > 0 ? (
              inquiries.map((inq) => (
                <tr key={inq.id} className="border-b border-border-gray/50">
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                    {new Date(inq.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-dark">{inq.customerName ?? inq.user?.name ?? "Guest"}</div>
                    {inq.user?.email ? (
                      <div className="text-xs text-text-muted">{inq.user.email}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-text-dark">{inq.product?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-text-muted">{inq.sourcePage ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        inq.status === "NEW"
                          ? "bg-warning/20 text-warning"
                          : inq.status === "CONTACTED"
                            ? "bg-soft-teal/15 text-primary-maroon"
                            : "bg-border-gray text-text-muted"
                      }`}
                    >
                      {inq.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-muted">
                  No WhatsApp inquiries yet. The inquiry tracking feature flag must be enabled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
