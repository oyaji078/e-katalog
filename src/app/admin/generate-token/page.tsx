import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";
import GenerateTokenFormClient from "./GenerateTokenFormClient";

export const dynamic = "force-dynamic";

export default async function AdminGenerateTokenPage() {
  await requireAdmin();
  const db = getDb();
  
  // Fetch users pending retail activation
  const eligibleUsers = await db.user.findMany({
    where: { retailStatus: "PENDING_RETAIL" },
    select: {
      id: true,
      name: true,
      email: true,
      whatsappNumber: true,
      storeName: true,
      userCode: true,
      retailStatus: true
    }
  });

  return (
    <main className="text-text-dark">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Generate Retail Token</h1>
          <p className="mt-2 text-sm text-text-muted">
            Buat token aktivasi hanya untuk pengguna dengan status Menunggu.
          </p>
        </div>

        <GenerateTokenFormClient eligibleUsers={eligibleUsers} />
      </div>
    </main>
  );
}
