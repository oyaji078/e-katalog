import Link from "next/link";
import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";
import RetailUserStatusFilterClient from "./RetailUserStatusFilterClient";

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: "Terdaftar",
  PENDING_RETAIL: "Menunggu",
  RETAIL_ACTIVE: "Aktif",
  RETAIL_REJECTED: "Ditolak",
  SUSPENDED: "Suspend",
};

const STATUS_STYLES: Record<string, string> = {
  REGISTERED: "bg-muted/20 text-brand-muted",
  PENDING_RETAIL: "bg-warning/20 text-warning",
  RETAIL_ACTIVE: "bg-success/20 text-success",
  RETAIL_REJECTED: "bg-danger/20 text-danger",
  SUSPENDED: "bg-warning/20 text-warning",
};

const ITEMS_PER_PAGE = 50;

export default async function AdminRetailUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  await requireAdmin();
  const db = getDb();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.search?.trim() || "";
  const statusFilter = params.status?.trim() || "";

  const where: Record<string, unknown> = {};
  const AND: Record<string, unknown>[] = [];

  if (statusFilter && STATUS_LABELS[statusFilter]) {
    AND.push({ retailStatus: statusFilter });
  }

  if (search) {
    AND.push({
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { userCode: { contains: search } },
        { storeName: { contains: search } },
      ],
    });
  }

  if (AND.length > 0) where.AND = AND;

  const [totalCount, retailUsers] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        whatsappNumber: true,
        storeName: true,
        userCode: true,
        retailStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <main className="text-brand-text">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Pengguna Retail</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Kelola pengguna yang telah mendaftar untuk akses retail.
          </p>
        </div>

        {/* Search + Filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form method="GET" className="flex flex-1 gap-2">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Cari nama, email, atau kode pengguna..."
              className="flex-1 rounded-xl border border-brand-border bg-white px-4 py-2 text-sm outline-none focus:border-brand-primary"
            />
            <RetailUserStatusFilterClient
              value={statusFilter}
              options={Object.entries(STATUS_LABELS).map(([key, label]) => ({
                value: key,
                label,
              }))}
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Cari
            </button>
            {(search || statusFilter) ? (
              <Link
                href="/admin/retail-users"
                className="rounded-xl border border-brand-border px-4 py-2 text-sm font-semibold text-brand-muted hover:bg-brand-bg"
              >
                Reset
              </Link>
            ) : null}
          </form>
          <Link
            href="/admin/generate-token"
            className="inline-flex items-center justify-center rounded-xl border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary"
          >
                            Buat Token
          </Link>
        </div>

        {/* Results */}
        <div className="rounded-xl border border-brand-border bg-white shadow-sm">
          {retailUsers.length === 0 ? (
            <div className="p-10 text-center text-sm text-brand-muted">
              Tidak ada pengguna ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border text-sm">
                <thead className="bg-brand-primary/5 text-xs uppercase tracking-wide text-brand-primary">
                  <tr>
                    <th className="px-4 py-3 text-left">Nama</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">WhatsApp</th>
                    <th className="px-4 py-3 text-left">Toko/Instansi</th>
                    <th className="px-4 py-3 text-left">Kode</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Tanggal Daftar</th>
                    <th className="px-4 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {retailUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/50">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-brand-text">
                        {user.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-muted">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-muted">
                        {user.whatsappNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-muted">
                        {user.storeName || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-brand-muted">
                        {user.userCode}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            STATUS_STYLES[user.retailStatus ?? ""] ?? "bg-muted/20 text-brand-muted"
                          }`}
                        >
                          {STATUS_LABELS[user.retailStatus ?? ""] ?? user.retailStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-muted">
                        {user.createdAt.toLocaleDateString("id-ID")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                        {user.retailStatus === "PENDING_RETAIL" ? (
                          <Link
                            href={`/admin/generate-token?userId=${user.id}`}
                            className="text-xs font-medium text-brand-primary hover:text-brand-primary/80"
                          >
                            Buat Token
                          </Link>
                        ) : user.retailStatus === "REGISTERED" ? (
                          <span className="text-xs text-brand-muted">
                            Registrasi retail belum lengkap
                          </span>
                        ) : (
                          <span className="text-xs text-brand-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-brand-muted">
              Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(page * ITEMS_PER_PAGE, totalCount)} dari {totalCount} pengguna
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={`/admin/retail-users?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`}
                  className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
                >
                  Sebelumnya
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link
                  href={`/admin/retail-users?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`}
                  className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
                >
                  Selanjutnya
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
