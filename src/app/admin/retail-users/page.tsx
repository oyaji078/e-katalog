import Link from "next/link";

import type { Prisma, RetailStatus, RetailTokenStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";
import {
  buildRetailApprovalMessage,
  buildRetailApprovalWhatsappUrl,
} from "@/lib/retail-approval";
import RetailUserActionsClient from "./RetailUserActionsClient";
import RetailUserStatusFilterClient from "./RetailUserStatusFilterClient";

export const dynamic = "force-dynamic";

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

const TOKEN_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  EXPIRED: "Kedaluwarsa",
  USED: "Dipakai",
  REVOKED: "Dicabut",
};

const TOKEN_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-success/15 text-success",
  EXPIRED: "bg-warning/15 text-warning",
  USED: "bg-brand-primary/10 text-brand-primary",
  REVOKED: "bg-danger/15 text-danger",
};

const ITEMS_PER_PAGE = 50;
const FILTERABLE_RETAIL_STATUSES: RetailStatus[] = [
  "REGISTERED",
  "PENDING_RETAIL",
  "RETAIL_ACTIVE",
  "RETAIL_REJECTED",
  "SUSPENDED",
];
const TOKEN_STATUSES: RetailTokenStatus[] = ["ACTIVE", "USED", "EXPIRED", "REVOKED"];
const TABS = ["users", "pending", "tokens"] as const;

type RetailTab = (typeof TABS)[number];

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
    status: RetailTokenStatus;
    expiresAt: Date;
    usedAt: Date | null;
    revokedAt: Date | null;
  }>;
};

type RetailTokenDisplay = {
  id: string;
  tokenPreview: string;
  status: RetailTokenStatus;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  assignedTo: {
    id: string;
    name: string;
    email: string;
    whatsappNumber: string | null;
    storeName: string | null;
    retailStatus: RetailStatus;
  } | null;
  generatedBy: {
    name: string;
    email: string;
  };
};

export default async function AdminRetailUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; tab?: string }>;
}) {
  await requireAdmin();
  const db = getDb();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.search?.trim() || "";
  const activeTab = TABS.includes(params.tab as RetailTab) ? (params.tab as RetailTab) : "users";
  const rawStatus = params.status?.trim() || "";
  const userStatusFilter =
    activeTab !== "tokens" && FILTERABLE_RETAIL_STATUSES.includes(rawStatus as RetailStatus)
      ? (rawStatus as RetailStatus)
      : "";
  const tokenStatusFilter =
    activeTab === "tokens" && TOKEN_STATUSES.includes(rawStatus as RetailTokenStatus)
      ? (rawStatus as RetailTokenStatus)
      : "";
  const statusFilter = activeTab === "tokens" ? tokenStatusFilter : userStatusFilter;
  const now = new Date();

  const userWhere = buildUserWhere({ activeTab, search, statusFilter: userStatusFilter });
  const tokenWhere = buildTokenWhere({ search, statusFilter: tokenStatusFilter, now });
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [
    totalUserCount,
    retailUsers,
    totalTokenCount,
    retailTokens,
    allRetailCount,
    needsTokenCount,
    tokenCount,
  ] = await Promise.all([
    db.user.count({ where: userWhere }),
    db.user.findMany({
      where: userWhere,
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
          select: {
            tokenPreview: true,
            status: true,
            expiresAt: true,
            usedAt: true,
            revokedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    db.retailToken.count({ where: tokenWhere }),
    db.retailToken.findMany({
      where: tokenWhere,
      select: {
        id: true,
        tokenPreview: true,
        status: true,
        expiresAt: true,
        usedAt: true,
        revokedAt: true,
        createdAt: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsappNumber: true,
            storeName: true,
            retailStatus: true,
          },
        },
        generatedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    db.user.count({
      where: { role: "USER", retailStatus: { in: FILTERABLE_RETAIL_STATUSES } },
    }),
    db.user.count({
      where: { role: "USER", retailStatus: { in: ["REGISTERED", "PENDING_RETAIL"] } },
    }),
    db.retailToken.count(),
  ]);

  const activeTotalCount = activeTab === "tokens" ? totalTokenCount : totalUserCount;
  const totalPages = Math.ceil(activeTotalCount / ITEMS_PER_PAGE);
  const firstItem = activeTotalCount === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const lastItem = Math.min(page * ITEMS_PER_PAGE, activeTotalCount);
  const filterOptions =
    activeTab === "tokens"
      ? TOKEN_STATUSES.map((status) => ({ value: status, label: TOKEN_STATUS_LABELS[status] }))
      : FILTERABLE_RETAIL_STATUSES.map((status) => ({
          value: status,
          label: STATUS_LABELS[status],
        }));

  return (
    <main className="text-brand-text">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Pengguna Ritel</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Kelola pendaftar ritel, status akun, dan token aktivasi dalam satu halaman.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <RetailTabLink href="/admin/retail-users?tab=users" active={activeTab === "users"} label="Pengguna Ritel" count={allRetailCount} />
          <RetailTabLink href="/admin/retail-users?tab=pending" active={activeTab === "pending"} label="Perlu Token" count={needsTokenCount} />
          <RetailTabLink href="/admin/retail-users?tab=tokens" active={activeTab === "tokens"} label="Token Aktivasi" count={tokenCount} />
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form method="GET" className="grid w-full gap-2 sm:flex sm:flex-1">
            <input type="hidden" name="tab" value={activeTab} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder={
                activeTab === "tokens"
                  ? "Cari token, nama, email, atau toko..."
                  : "Cari nama, email, toko, atau kode aktivasi..."
              }
              className="min-w-0 flex-1 rounded-xl border border-brand-border bg-white px-4 py-2 text-sm outline-none focus:border-brand-primary"
            />
            <RetailUserStatusFilterClient value={statusFilter} options={filterOptions} />
            <button
              type="submit"
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Cari
            </button>
            {search || statusFilter ? (
              <Link
                href={`/admin/retail-users?tab=${activeTab}`}
                className="rounded-xl border border-brand-border px-4 py-2 text-center text-sm font-semibold text-brand-muted hover:bg-brand-bg"
              >
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        {activeTab === "tokens" ? (
          <RetailTokensTable tokens={retailTokens} now={now} />
        ) : (
          <RetailUsersTable users={retailUsers} now={now} />
        )}

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-brand-muted">
              Menampilkan {firstItem}-{lastItem} dari {activeTotalCount} data
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={pageHref({ page: page - 1, tab: activeTab, search, status: statusFilter })}
                  className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
                >
                  Sebelumnya
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link
                  href={pageHref({ page: page + 1, tab: activeTab, search, status: statusFilter })}
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

function buildUserWhere({
  activeTab,
  search,
  statusFilter,
}: {
  activeTab: RetailTab;
  search: string;
  statusFilter: RetailStatus | "";
}): Prisma.UserWhereInput {
  const AND: Prisma.UserWhereInput[] = [
    { role: "USER" },
    { retailStatus: { in: FILTERABLE_RETAIL_STATUSES } },
  ];

  if (statusFilter) {
    AND.push({ retailStatus: statusFilter });
  } else if (activeTab === "pending") {
    AND.push({ retailStatus: { in: ["REGISTERED", "PENDING_RETAIL"] } });
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

  return { AND };
}

function buildTokenWhere({
  search,
  statusFilter,
  now,
}: {
  search: string;
  statusFilter: RetailTokenStatus | "";
  now: Date;
}): Prisma.RetailTokenWhereInput {
  const AND: Prisma.RetailTokenWhereInput[] = [];

  if (statusFilter === "ACTIVE") {
    AND.push({ status: "ACTIVE", usedAt: null, revokedAt: null, expiresAt: { gt: now } });
  } else if (statusFilter === "EXPIRED") {
    AND.push({
      OR: [
        { status: "EXPIRED" },
        { status: "ACTIVE", expiresAt: { lte: now } },
      ],
    });
  } else if (statusFilter) {
    AND.push({ status: statusFilter });
  }

  if (search) {
    AND.push({
      OR: [
        { tokenPreview: { contains: search } },
        { assignedTo: { name: { contains: search } } },
        { assignedTo: { email: { contains: search } } },
        { assignedTo: { storeName: { contains: search } } },
        { assignedTo: { userCode: { contains: search } } },
      ],
    });
  }

  return AND.length ? { AND } : {};
}

function pageHref({
  page,
  tab,
  search,
  status,
}: {
  page: number;
  tab: RetailTab;
  search: string;
  status: string;
}) {
  const params = new URLSearchParams({ tab, page: String(page) });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return `/admin/retail-users?${params.toString()}`;
}

function RetailTabLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${
        active
          ? "border-brand-primary bg-brand-primary text-white"
          : "border-brand-border bg-white text-brand-muted hover:border-brand-primary hover:text-brand-primary"
      }`}
    >
      {label}
      <span className={active ? "text-white/80" : "text-brand-muted"}>{count}</span>
    </Link>
  );
}

function RetailUsersTable({ users, now }: { users: RetailUserDisplay[]; now: Date }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
      {users.length === 0 ? (
        <div className="p-10 text-center text-sm text-brand-muted">
          Tidak ada pengguna ditemukan.
        </div>
      ) : (
        <>
          <div className="space-y-3 p-3 md:hidden">
            {users.map((user) => {
              const activationToken = getActivationToken(user, now);
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
                        Daftar {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <RetailStatusBadge user={user} now={now} />
                  </div>

                  <RetailContactDetails user={user} now={now} />

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
                <col className="w-[260px]" />
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
                {users.map((user) => {
                  const activationToken = getActivationToken(user, now);
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
                            Daftar {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <RetailContactDetails user={user} now={now} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <RetailStatusBadge user={user} now={now} />
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
  );
}

function RetailTokensTable({ tokens, now }: { tokens: RetailTokenDisplay[]; now: Date }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
      {tokens.length === 0 ? (
        <div className="p-10 text-center text-sm text-brand-muted">
          Tidak ada token ditemukan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] divide-y divide-brand-border text-sm">
            <thead className="bg-[#EEF4F7] text-xs uppercase tracking-wide text-[#111827]">
              <tr>
                <th className="px-4 py-3 text-left">Token</th>
                <th className="px-4 py-3 text-left">Pengguna</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Dibuat / Berlaku</th>
                <th className="px-4 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {tokens.map((token) => {
                const activeToken = tokenIsUsable(token, now) ? token.tokenPreview : null;
                const user = token.assignedTo;
                const whatsappMessage =
                  user && activeToken ? buildRetailApprovalMessage(user.name, activeToken) : undefined;
                const whatsappUrl =
                  user && whatsappMessage
                    ? buildRetailApprovalWhatsappUrl(user.whatsappNumber, whatsappMessage)
                    : undefined;

                return (
                  <tr key={token.id} className="hover:bg-white/50">
                    <td className="px-4 py-3 align-top">
                      <code className="font-mono text-sm font-black tracking-[0.2em] text-brand-text">
                        {token.tokenPreview}
                      </code>
                      <p className="mt-1 text-xs text-brand-muted">Oleh {token.generatedBy.name}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {user ? (
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-text">{user.name}</p>
                          <p className="text-xs text-brand-muted">{user.email}</p>
                          <p className="text-xs text-brand-muted">{user.storeName ?? "-"}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-brand-muted">Tidak terhubung</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <RetailTokenStatusBadge token={token} now={now} />
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-brand-muted">
                      <p>Dibuat {formatDate(token.createdAt)}</p>
                      <p>Berlaku sampai {formatDate(token.expiresAt)}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {user ? (
                        <RetailUserActionsClient
                          userId={user.id}
                          status={user.retailStatus}
                          applicantName={user.name}
                          whatsappNumber={user.whatsappNumber}
                          activationToken={activeToken}
                          whatsappUrl={whatsappUrl}
                          whatsappMessage={whatsappMessage}
                        />
                      ) : (
                        <span className="text-xs text-brand-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getLatestToken(user: Pick<RetailUserDisplay, "assignedRetailTokens">) {
  return user.assignedRetailTokens[0] ?? null;
}

function tokenIsUsable(
  token: Pick<RetailUserDisplay["assignedRetailTokens"][number], "status" | "expiresAt" | "usedAt" | "revokedAt">,
  now: Date,
) {
  return token.status === "ACTIVE" && !token.usedAt && !token.revokedAt && token.expiresAt > now;
}

function getActivationToken(user: Pick<RetailUserDisplay, "assignedRetailTokens">, now: Date) {
  const latestToken = getLatestToken(user);
  if (!latestToken || !tokenIsUsable(latestToken, now)) return null;
  return latestToken.tokenPreview;
}

function getStatusKey(user: RetailUserDisplay, now: Date) {
  if (user.retailStatus === "PENDING_RETAIL" && getActivationToken(user, now)) {
    return "PENDING_RETAIL_WITH_TOKEN";
  }

  return user.retailStatus;
}

function RetailStatusBadge({ user, now }: { user: RetailUserDisplay; now: Date }) {
  const statusKey = getStatusKey(user, now);

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

function RetailTokenStatusBadge({
  token,
  now,
}: {
  token: Pick<RetailTokenDisplay, "status" | "expiresAt" | "usedAt" | "revokedAt">;
  now: Date;
}) {
  const statusKey = tokenStatusKey(token, now);

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
        TOKEN_STATUS_STYLES[statusKey] ?? "bg-muted/20 text-brand-muted"
      }`}
    >
      {TOKEN_STATUS_LABELS[statusKey] ?? statusKey}
    </span>
  );
}

function tokenStatusKey(
  token: Pick<RetailTokenDisplay, "status" | "expiresAt" | "usedAt" | "revokedAt">,
  now: Date,
) {
  if (token.status === "ACTIVE" && !token.usedAt && !token.revokedAt && token.expiresAt <= now) {
    return "EXPIRED";
  }
  return token.status;
}

function RetailContactDetails({
  user,
  now,
}: {
  user: RetailUserDisplay;
  now: Date;
}) {
  const latestToken = getLatestToken(user);
  const activationToken = getActivationToken(user, now);
  const tokenValue = activationToken
    ? activationToken
    : latestToken
      ? `${TOKEN_STATUS_LABELS[tokenStatusKey(latestToken, now)] ?? latestToken.status}`
      : "Belum ada token";

  return (
    <dl className="mt-3 grid min-w-0 gap-1.5 text-xs text-brand-muted md:mt-0">
      <DetailRow label="Email" value={user.email} />
      <DetailRow label="WhatsApp" value={user.whatsappNumber || "-"} />
      <DetailRow label="Toko" value={user.storeName || "-"} />
      <DetailRow
        label="Token"
        value={tokenValue}
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

function formatDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
