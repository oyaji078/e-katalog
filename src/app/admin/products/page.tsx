import Link from "next/link";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import AdminProductsPageClient from "./AdminProductsPageClient";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 50;
const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;
const STOCK_STATUSES = ["READY", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER"] as const;
const FLAGS = ["active", "featured", "recommended"] as const;

type SearchParams = {
  page?: string;
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  stock?: string;
  flag?: string;
  minPrice?: string;
  maxPrice?: string;
  createdFrom?: string;
  createdTo?: string;
};

type ProductFilters = {
  search: string;
  category: string;
  brand: string;
  status: string;
  stock: string;
  flag: string;
  minPrice: string;
  maxPrice: string;
  createdFrom: string;
  createdTo: string;
};

function clean(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

function parseNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }
  return parsed;
}

function normalizeFilters(params: SearchParams): ProductFilters {
  const status = clean(params.status);
  const stock = clean(params.stock);
  const flag = clean(params.flag);

  return {
    search: clean(params.search),
    category: clean(params.category),
    brand: clean(params.brand),
    status: PRODUCT_STATUSES.includes(status as (typeof PRODUCT_STATUSES)[number]) ? status : "",
    stock: STOCK_STATUSES.includes(stock as (typeof STOCK_STATUSES)[number]) ? stock : "",
    flag: FLAGS.includes(flag as (typeof FLAGS)[number]) ? flag : "",
    minPrice: clean(params.minPrice),
    maxPrice: clean(params.maxPrice),
    createdFrom: clean(params.createdFrom),
    createdTo: clean(params.createdTo),
  };
}

function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.search) {
    and.push({
      OR: [
        { name: { contains: filters.search } },
        { sku: { contains: filters.search } },
        { slug: { contains: filters.search } },
        { category: { name: { contains: filters.search } } },
        { brand: { name: { contains: filters.search } } },
      ],
    });
  }

  if (filters.category) where.categoryId = filters.category;
  if (filters.brand) where.brandId = filters.brand;
  if (filters.status) where.status = filters.status as Prisma.ProductWhereInput["status"];
  if (filters.stock) where.stockStatus = filters.stock as Prisma.ProductWhereInput["stockStatus"];
  if (filters.flag === "active") where.status = "ACTIVE";
  if (filters.flag === "featured") where.isFeatured = true;
  if (filters.flag === "recommended") where.isRecommended = true;

  const minPrice = parseNumber(filters.minPrice);
  const maxPrice = parseNumber(filters.maxPrice);
  if (minPrice !== null || maxPrice !== null) {
    where.publicPrice = {
      ...(minPrice !== null ? { gte: minPrice } : {}),
      ...(maxPrice !== null ? { lte: maxPrice } : {}),
    };
  }

  const createdFrom = parseDate(filters.createdFrom);
  const createdTo = parseDate(filters.createdTo, true);
  if (createdFrom || createdTo) {
    where.createdAt = {
      ...(createdFrom ? { gte: createdFrom } : {}),
      ...(createdTo ? { lte: createdTo } : {}),
    };
  }

  if (and.length) where.AND = and;
  return where;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
        <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Tidak memiliki akses</p>
          <Link href="/" className="mt-4 block text-center text-brand-primary">
            Ke Halaman Utama
          </Link>
        </section>
      </main>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const filters = normalizeFilters(params);
  const where = buildWhere(filters);
  const db = getDb();
  const [totalCount, products, categories, brands] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        slug: true,
        primaryImageUrl: true,
        costPrice: true,
        publicPrice: true,
        retailPrice: true,
        stockQuantity: true,
        stockStatus: true,
        status: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE,
    }),
    db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    slug: p.slug,
    primaryImageUrl: p.primaryImageUrl ?? p.images[0]?.url ?? null,
    costPrice: p.costPrice.toString(),
    publicPrice: p.publicPrice.toString(),
    retailPrice: p.retailPrice?.toString() ?? null,
    stockQuantity: p.stockQuantity,
    stockStatus: p.stockStatus,
    status: p.status,
    category: p.category ? { name: p.category.name } : null,
    brand: p.brand ? { name: p.brand.name } : null,
  }));

  return (
    <AdminProductsPageClient
      products={serialized}
      pagination={{
        page,
        pageSize: ITEMS_PER_PAGE,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE)),
      }}
      filters={filters}
      categories={categories}
      brands={brands}
    />
  );
}
