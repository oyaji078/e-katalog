import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";
import { maskToken } from "@/lib/mask";

type DateRange = {
  start: Date;
  end: Date;
  endExclusive: Date;
};

const MAX_EXPORT_RANGE_DAYS = 90;

function parseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateRange(request: NextRequest): DateRange {
  const today = new Date();
  const defaultEnd = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const defaultStart = new Date(defaultEnd);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 30);

  const start = parseDate(request.nextUrl.searchParams.get("start")) ?? defaultStart;
  const end = parseDate(request.nextUrl.searchParams.get("end")) ?? defaultEnd;
  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return { start, end, endExclusive };
}

function isRangeTooLarge(range: DateRange) {
  const diffDays = (range.end.getTime() - range.start.getTime()) / 86_400_000;
  return diffDays > MAX_EXPORT_RANGE_DAYS;
}

function csvEscape(value: unknown) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
}

function csvResponse(filename: string, csv: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request: NextRequest) {
  await requireAdmin();

  const report = request.nextUrl.searchParams.get("report") ?? "";
  const range = getDateRange(request);
  if (isRangeTooLarge(range)) {
    return Response.json(
      { error: `Max export range is ${MAX_EXPORT_RANGE_DAYS} days` },
      { status: 400 },
    );
  }

  const createdAt = { gte: range.start, lt: range.endExclusive };
  const db = getDb();

  if (report === "retail-registrants") {
    const rows = await db.user.findMany({
      where: {
        retailStatus: { in: ["PENDING_RETAIL", "RETAIL_ACTIVE", "RETAIL_REJECTED", "SUSPENDED"] },
        createdAt,
      },
      orderBy: { createdAt: "desc" },
      select: { name: true, email: true, whatsappNumber: true, storeName: true, retailStatus: true, createdAt: true },
    });
    return csvResponse(
      "laporan-pendaftar-ritel.csv",
      toCsv(
        ["Nama", "Email", "WhatsApp", "Toko", "Status", "Tanggal"],
        rows.map((row) => [row.name, row.email, row.whatsappNumber, row.storeName, row.retailStatus, row.createdAt]),
      ),
    );
  }

  if (report === "retail-active") {
    const rows = await db.user.findMany({
      where: { retailStatus: "RETAIL_ACTIVE" },
      orderBy: { updatedAt: "desc" },
      select: { name: true, email: true, whatsappNumber: true, storeName: true, updatedAt: true },
    });
    return csvResponse(
      "laporan-pengguna-ritel-aktif.csv",
      toCsv(
        ["Nama", "Email", "WhatsApp", "Toko", "Update"],
        rows.map((row) => [row.name, row.email, row.whatsappNumber, row.storeName, row.updatedAt]),
      ),
    );
  }

  if (report === "whatsapp-contacts") {
    const rows = await db.analyticsEvent.findMany({
      where: { type: "WHATSAPP_CLICK", createdAt },
      orderBy: { createdAt: "desc" },
      select: { productName: true, productId: true, path: true, phone: true, createdAt: true },
    });
    return csvResponse(
      "laporan-kontak-whatsapp.csv",
      toCsv(
        ["Produk", "Product ID", "Path", "Nomor", "Tanggal"],
        rows.map((row) => [row.productName, row.productId, row.path, row.phone, row.createdAt]),
      ),
    );
  }

  if (report === "top-products") {
    const grouped = await db.analyticsEvent.groupBy({
      by: ["productId"],
      where: { type: "WHATSAPP_CLICK", productId: { not: null }, createdAt },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    const productIds = grouped.map((row) => row.productId).filter((id): id is string => Boolean(id));
    const products = productIds.length
      ? await db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, sku: true },
        })
      : [];
    const productMap = new Map(products.map((product) => [product.id, product]));

    return csvResponse(
      "laporan-produk-paling-banyak-dihubungi.csv",
      toCsv(
        ["Produk", "SKU", "Kontak"],
        grouped.map((row) => {
          const product = row.productId ? productMap.get(row.productId) : null;
          return [product?.name ?? row.productId, product?.sku ?? "", row._count.id];
        }),
      ),
    );
  }

  if (report === "retail-tokens") {
    const rows = await db.retailToken.findMany({
      where: { createdAt },
      orderBy: { createdAt: "desc" },
      select: {
        tokenPreview: true,
        status: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true,
        assignedTo: { select: { name: true, email: true } },
        generatedBy: { select: { name: true, email: true } },
      },
    });
    return csvResponse(
      "laporan-kode-registrasi-ritel.csv",
      toCsv(
        ["OTP", "Status", "Pendaftar", "Email Pendaftar", "Dibuat Oleh", "Kadaluarsa", "Dipakai", "Dibuat"],
        rows.map((row) => [
          maskToken(row.tokenPreview),
          row.status,
          row.assignedTo?.name,
          row.assignedTo?.email,
          row.generatedBy.name,
          row.expiresAt,
          row.usedAt,
          row.createdAt,
        ]),
      ),
    );
  }

  return new Response("Unknown report", { status: 400 });
}
