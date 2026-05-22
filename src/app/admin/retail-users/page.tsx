import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { getDb } from "@/lib/db";

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: "Terdaftar",
  PENDING_RETAIL: "Menunggu",
  RETAIL_ACTIVE: "Aktif",
  RETAIL_REJECTED: "Ditolak",
  SUSPENDED: "Suspend",
};

const STATUS_STYLES: Record<string, string> = {
  REGISTERED: "bg-muted/20 text-muted",
  PENDING_RETAIL: "bg-warning/20 text-warning",
  RETAIL_ACTIVE: "bg-success/20 text-success",
  RETAIL_REJECTED: "bg-accent-rose/20 text-accent-rose",
  SUSPENDED: "bg-muted/20 text-muted",
};

const GROUP_ORDER = ["PENDING_RETAIL", "REGISTERED", "RETAIL_ACTIVE", "RETAIL_REJECTED", "SUSPENDED"];

function UserRow({ user }: { user: { id: string; name: string | null; email: string | null; whatsappNumber: string | null; storeName: string | null; userCode: string | null; retailStatus: string | null; createdAt: Date } }) {
  return (
    <tr key={user.id} className="hover:bg-white/50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">
        {user.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
        {user.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
        {user.whatsappNumber}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
        {user.storeName || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted font-mono">
        {user.userCode}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span
          className={`px-2 py-0.5 text-xs rounded-full ${STATUS_STYLES[user.retailStatus ?? ""] ?? "bg-muted/20 text-muted"}`}
        >
          {STATUS_LABELS[user.retailStatus ?? ""] ?? user.retailStatus}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
        {user.createdAt.toLocaleDateString("id-ID")}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <Link
          href={`/admin/generate-token?userId=${user.id}`}
          className="text-xs font-medium text-primary-maroon hover:text-primary-maroon/80"
        >
          Buat Token
        </Link>
      </td>
    </tr>
  );
}

function UserGroup({ status, users }: { status: string; users: Array<{ id: string; name: string | null; email: string | null; whatsappNumber: string | null; storeName: string | null; userCode: string | null; retailStatus: string | null; createdAt: Date }> }) {
  if (users.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-semibold text-text-muted uppercase tracking-wider">
        {STATUS_LABELS[status] ?? status}
        <span className="ml-2 text-xs font-normal text-text-muted/60">({users.length})</span>
      </h3>
      <div className="rounded-xl border border-border-gray bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-gray">
            <thead className="bg-primary-maroon/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">WhatsApp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">Toko/Instansi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">Kode Pengguna</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">Tanggal Daftar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray">
              {users.map((user) => <UserRow key={user.id} user={user} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default async function AdminRetailUsersPage() {
  const session = await getCurrentSession();

  if (!session?.user || !(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN")) {
    return (
      <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
        <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="block text-center mt-4">
            Go to Homepage
          </Link>
        </section>
      </main>
    );
  }

  const db = getDb();

  const retailUsers = await db.user.findMany({
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
  });

  const grouped = GROUP_ORDER.map((status) => ({
    status,
    users: retailUsers.filter((u) => u.retailStatus === status),
  }));

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <div className="border-b border-border-gray bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-text-muted sm:px-6">
          <div className="flex items-center gap-2">
            <svg
              className="size-4 text-soft-teal"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Garansi toko dan dukungan WhatsApp</span>
          </div>
          <div className="hidden items-center gap-5 sm:flex">
            <span>Promo</span>
            <span>Voucher</span>
            <Link href="/login" className="font-semibold text-primary-maroon">
              Retail Login
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-border-gray bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center">
          <Link href="/admin" className="text-xl font-bold text-primary-maroon">
            E-Katalog Komputer
          </Link>
          <div className="flex items-center rounded-2xl border border-border-gray bg-white px-4 py-3 shadow-sm lg:mx-5 lg:flex-1">
            <svg
              className="mr-3 size-5 text-text-muted"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <input
              aria-label="Cari pengguna"
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Cari nama, email, atau kode pengguna..."
            />
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/generate-token"
              className="rounded-xl border border-primary-maroon px-4 py-2 text-sm font-semibold text-primary-maroon"
            >
              Generate Token
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Pengguna Retail</h1>
          <p className="mt-2 text-sm text-text-muted">
            Kelola pengguna yang telah mendaftar untuk akses retail.
          </p>
        </div>

        {grouped.map(({ status, users }) => (
          <UserGroup key={status} status={status} users={users} />
        ))}
      </div>
    </main>
  );
}
