import Link from "next/link";

import type { Prisma, RetailStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
import {
  buildRetailApprovalMessage,
  buildRetailApprovalWhatsappUrl,
} from "@/lib/retail-approval";
import RetailUserActionsClient from "./RetailUserActionsClient";
import RetailUserStatusFilterClient from "./RetailUserStatusFilterClient";

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: "Terdaftar",
  PENDING_RETAIL: "Menunggu",
  PENDING_RETAIL_WITH_TOKEN: "Menunggu Aktivasi",
  RETAIL_ACTIVE: "Aktif",
  RETAIL_REJECTED: "Ditolak",
  SUSPENDED: "Suspend",
};

const STATUS_STYLES: Record<string, string> = {
  REGISTERED: "bg-[#EEF4F7] text-[#5B6472]",
  PENDING_RETAIL: "bg-warning/20 text-warning",
  PENDING_RETAIL_WITH_TOKEN: "bg-brand-primary/10 text-brand-primary",
  RETAIL_ACTIVE: "bg-success/20 text-success",
  RETAIL_REJECTED: "bg-danger/20 text-danger",
  SUSPENDED: "bg-warning/20 text-warning",
};

const ITEMS_PER_PAGE = 50;
const FILTERABLE_RETAIL_STATUSES: RetailStatus[] = [
  "REGISTERED",
  "PENDING_RETAIL",
  "RETAIL_ACTIVE",
  "RETAIL_REJECTED",
  "SUSPENDED",
];

type RetailUserDisplay = {
  id: string;
  name: string;
  email: string;
  whatsappNumber: string | null;
  storeName: string | null;
  userCode: string;
  retailStatus: RetailStatus;
  createdAt: Date;
  assignedRetailTokens: Array<{
    tokenPreview: string;
    expiresAt: Date;
  }>;
};

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
  const now = new Date();

  const where: Prisma.UserWhereInput = {};
  const AND: Prisma.UserWhereInput[] = [];

  if (FILTERABLE_RETAIL_STATUSES.includes(statusFilter as RetailStatus)) {
    AND.push({ retailStatus: statusFilter as RetailStatus });
  }

  if (search) {
    AND.push({
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { userCode: { contains: search } },
        { storeName: { contains: search } },
        { assignedRetailTokens: { some: { tokenPreview: { contains: search } } } },
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
        assignedRetailTokens: {
          where: {
            status: "ACTIVE",
            usedAt: null,
            revokedAt: null,
            expiresAt: { gt: now },
          },
          select: {
            tokenPreview: true,
            expiresAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
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
          <h1 className="text-2xl font-bold">Pengguna Ritel</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Kelola pendaftar ritel, status persetujuan, dan kode aktivasi.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form method="GET" className="grid w-full gap-2 sm:flex sm:flex-1">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Cari nama, email, toko, atau kode aktivasi..."
              className="min-w-0 flex-1 rounded-xl border border-brand-border bg-white px-4 py-2 text-sm outline-none focus:border-brand-primary"
            />
            <RetailUserStatusFilterClient
              value={statusFilter}
              options={FILTERABLE_RETAIL_STATUSES.map((status) => ({
                value: status,
                label: STATUS_LABELS[status],
              }))}
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Cari
            </button>
            {search || statusFilter ? (
              <Link
                href="/admin/retail-users"
                className="rounded-xl border border-brand-border px-4 py-2 text-center text-sm font-semibold text-brand-muted hover:bg-brand-bg"
              >
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
          {retailUsers.length === 0 ? (
            <div className="p-10 text-center text-sm text-brand-muted">
              Tidak ada pengguna ditemukan.
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {retailUsers.map((user) => {
                  const activationToken = getActivationToken(user);
                  const whatsappMessage = activationToken
                    ? buildRetailApprovalMessage(user.name, activationToken)
                    : undefined;
                  const whatsappUrl = whatsappMessage
                    ? buildRetailApprovalWhatsappUrl(user.whatsappNumber, whatsappMessage)
                    : undefined;

                  return (
                    <article
                      key={user.id}
                      className="rounded-xl border border-brand-border bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-bold text-brand-text">
                            {user.name}
                          </h2>
                          <p className="mt-1 text-xs text-brand-muted">
                            Daftar {user.createdAt.toLocaleDateString("id-ID")}
                          </p>
                        </div>
                        <RetailStatusBadge user={user} />
                      </div>

                      <RetailContactDetails user={user} activationToken={activationToken} />

                      <div className="mt-4 border-t border-brand-border pt-3">
                        <RetailUserActionsClient
                          userId={user.id}
                          status={user.retailStatus}
                          applicantName={user.name}
                          whatsappNumber={user.whatsappNumber}
                          activationToken={activationToken}
                          whatsappUrl={whatsappUrl}
                          whatsappMessage={whatsappMessage}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden max-w-full md:block">
                <table className="w-full table-fixed divide-y divide-brand-border text-sm">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col />
                    <col className="w-[150px]" />
                    <col className="w-[230px]" />
                  </colgroup>
                  <thead className="bg-[#EEF4F7] text-xs uppercase tracking-wide text-[#111827]">
                    <tr>
                      <th className="px-4 py-3 text-left">Nama</th>
                      <th className="px-4 py-3 text-left">Detail Kontak / Informasi Ritel</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {retailUsers.map((user) => {
                      const activationToken = getActivationToken(user);
                      const whatsappMessage = activationToken
                        ? buildRetailApprovalMessage(user.name, activationToken)
                        : undefined;
                      const whatsappUrl = whatsappMessage
                        ? buildRetailApprovalWhatsappUrl(user.whatsappNumber, whatsappMessage)
                        : undefined;

                      return (
                        <tr key={user.id} className="hover:bg-white/50">
                          <td className="px-4 py-3 align-top">
                            <div className="min-w-0">
                              <p className="line-clamp-1 font-medium text-brand-text">
                                {user.name}
                              </p>
                              <p className="mt-1 text-xs text-brand-muted">
                                Daftar {user.createdAt.toLocaleDateString("id-ID")}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <RetailContactDetails user={user} activationToken={activationToken} />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <RetailStatusBadge user={user} />
                          </td>
                          <td className="px-4 py-3 align-top text-sm font-medium">
                            <RetailUserActionsClient
                              userId={user.id}
                              status={user.retailStatus}
                              applicantName={user.name}
                              whatsappNumber={user.whatsappNumber}
                              activationToken={activationToken}
                              whatsappUrl={whatsappUrl}
                              whatsappMessage={whatsappMessage}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-brand-muted">
              Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}-
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

function getActivationToken(user: Pick<RetailUserDisplay, "assignedRetailTokens">) {
  return user.assignedRetailTokens[0]?.tokenPreview ?? null;
}

function getStatusKey(user: RetailUserDisplay) {
  if (user.retailStatus === "PENDING_RETAIL" && getActivationToken(user)) {
    return "PENDING_RETAIL_WITH_TOKEN";
  }

  return user.retailStatus;
}

function RetailStatusBadge({ user }: { user: RetailUserDisplay }) {
  const statusKey = getStatusKey(user);

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
        STATUS_STYLES[statusKey] ?? "bg-muted/20 text-brand-muted"
      }`}
    >
      {STATUS_LABELS[statusKey] ?? statusKey}
    </span>
  );
}

function RetailContactDetails({
  user,
  activationToken,
}: {
  user: RetailUserDisplay;
  activationToken: string | null;
}) {
  return (
    <dl className="mt-3 grid min-w-0 gap-1.5 text-xs text-brand-muted md:mt-0">
      <DetailRow label="Email" value={user.email} />
      <DetailRow label="WhatsApp" value={user.whatsappNumber || "-"} />
      <DetailRow label="Toko" value={user.storeName || "-"} />
      <DetailRow
        label="Kode"
        value={activationToken ?? "-"}
        valueClassName={activationToken ? "font-mono font-black tracking-[0.2em] text-brand-text" : ""}
      />
    </dl>
  );
}

function DetailRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[90px_minmax(0,1fr)] gap-2">
      <dt className="font-semibold text-brand-muted">{label}:</dt>
      <dd className={`min-w-0 truncate text-brand-text ${valueClassName}`}>{value}</dd>
    </div>
  );
}
