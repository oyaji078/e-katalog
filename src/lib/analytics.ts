import type { AnalyticsEventType, Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

export type TrackEventInput = {
  type: AnalyticsEventType;
  path?: string;
  productId?: string;
  productName?: string;
  userId?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
};

const SENSITIVE_METADATA_KEYS = /password|secret|token|authorization|cookie|email/i;
const SHORT_TEXT_LIMIT = 191;
const METADATA_TEXT_LIMIT = 500;
const METADATA_DEPTH_LIMIT = 4;
const METADATA_ARRAY_LIMIT = 25;
const METADATA_OBJECT_KEY_LIMIT = 30;

function textOrNull(value: string | undefined, maxLength = SHORT_TEXT_LIMIT) {
  const text = value?.trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

function phoneOrNull(value: string | undefined) {
  const text = value?.trim().replace(/[^\d+]/g, "");
  if (!text) return null;
  return text.slice(0, 32);
}

function toSafeJsonValue(value: unknown, depth = 0): Prisma.InputJsonValue | undefined {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return undefined;
  if (typeof value === "bigint") return value.toString();
  if (value === null) return undefined;
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.slice(0, METADATA_TEXT_LIMIT);
  if (depth >= METADATA_DEPTH_LIMIT) return "[truncated]";

  if (Array.isArray(value)) {
    return value
      .slice(0, METADATA_ARRAY_LIMIT)
      .map((item) => toSafeJsonValue(item, depth + 1))
      .filter((item): item is Prisma.InputJsonValue => item !== undefined);
  }

  if (typeof value === "object") {
    const output: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, item] of Object.entries(value).slice(0, METADATA_OBJECT_KEY_LIMIT)) {
      if (SENSITIVE_METADATA_KEYS.test(key)) continue;
      const safeValue = toSafeJsonValue(item, depth + 1);
      if (safeValue !== undefined) output[key] = safeValue;
    }
    return output as Prisma.InputJsonObject;
  }

  return undefined;
}

function safeMetadata(value: Record<string, unknown> | undefined) {
  const metadata = toSafeJsonValue(value);
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  return metadata;
}

function logAnalyticsFailure(error: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  console.warn("[analytics] Tracking failed", error);
}

/**
 * Track an analytics event. Failures never block the primary user flow.
 */
export async function trackAnalyticsEvent(input: TrackEventInput): Promise<void> {
  try {
    const db = getDb();
    await db.analyticsEvent.create({
      data: {
        type: input.type,
        path: textOrNull(input.path),
        productId: textOrNull(input.productId),
        productName: textOrNull(input.productName),
        userId: textOrNull(input.userId),
        phone: phoneOrNull(input.phone),
        metadata: safeMetadata(input.metadata),
      },
    });
  } catch (error) {
    logAnalyticsFailure(error);
  }
}

export const trackEvent = trackAnalyticsEvent;

/**
 * Get event count for a given type within a date range.
 */
export async function getEventCount(
  type: AnalyticsEventType,
  since: Date,
): Promise<number> {
  try {
    const db = getDb();
    return await db.analyticsEvent.count({
      where: { type, createdAt: { gte: since } },
    });
  } catch {
    return 0;
  }
}

/**
 * Get event count for a bounded date range.
 */
export async function getEventCountBetween(
  type: AnalyticsEventType,
  start: Date,
  end: Date,
): Promise<number> {
  try {
    const db = getDb();
    return await db.analyticsEvent.count({
      where: { type, createdAt: { gte: start, lt: end } },
    });
  } catch {
    return 0;
  }
}

type TrendInterval = "day" | "month";

export type InteractionTrendPoint = {
  bucket: string;
  label: string;
  visits: number;
  productViews: number;
  whatsapp: number;
  inquiries: number;
};

type RawEventTrendRow = {
  bucket: string | Date;
  type: string;
  count: number | bigint | string;
};

type RawInquiryTrendRow = {
  bucket: string | Date;
  count: number | bigint | string;
};

function countNumber(value: number | bigint | string) {
  return typeof value === "bigint" ? Number(value) : Number(value);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dayBucket(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthBucket(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function normalizeBucket(value: string | Date, interval: TrendInterval) {
  if (value instanceof Date) {
    return interval === "month" ? monthBucket(value) : dayBucket(value);
  }
  return interval === "month" ? value.slice(0, 7) : value.slice(0, 10);
}

function labelForBucket(bucket: string, interval: TrendInterval) {
  if (interval === "month") {
    const [year, month] = bucket.split("-").map(Number);
    return new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" }).format(
      new Date(year, month - 1, 1),
    );
  }

  const [year, month, day] = bucket.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(
    new Date(year, month - 1, day),
  );
}

function buildBuckets(start: Date, end: Date, interval: TrendInterval) {
  const buckets: string[] = [];
  const cursor = new Date(start);

  if (interval === "month") {
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    while (cursor < end) {
      buckets.push(monthBucket(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return buckets;
  }

  cursor.setHours(0, 0, 0, 0);
  while (cursor < end) {
    buckets.push(dayBucket(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

/**
 * Aggregate dashboard trend data server-side without loading full event tables.
 */
export async function getInteractionTrend(
  start: Date,
  end: Date,
  interval: TrendInterval = "day",
): Promise<InteractionTrendPoint[]> {
  const buckets = buildBuckets(start, end, interval);
  const byBucket = new Map(
    buckets.map((bucket) => [
      bucket,
      {
        bucket,
        label: labelForBucket(bucket, interval),
        visits: 0,
        productViews: 0,
        whatsapp: 0,
        inquiries: 0,
      },
    ]),
  );

  try {
    const db = getDb();
    const eventRows =
      interval === "month"
        ? await db.$queryRaw<RawEventTrendRow[]>`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') AS bucket, type, COUNT(*) AS count
            FROM \`AnalyticsEvent\`
            WHERE createdAt >= ${start}
              AND createdAt < ${end}
              AND type IN ('PAGE_VIEW', 'PRODUCT_VIEW', 'WHATSAPP_CLICK')
            GROUP BY bucket, type
            ORDER BY bucket ASC
          `
        : await db.$queryRaw<RawEventTrendRow[]>`
            SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS bucket, type, COUNT(*) AS count
            FROM \`AnalyticsEvent\`
            WHERE createdAt >= ${start}
              AND createdAt < ${end}
              AND type IN ('PAGE_VIEW', 'PRODUCT_VIEW', 'WHATSAPP_CLICK')
            GROUP BY bucket, type
            ORDER BY bucket ASC
          `;

    const inquiryRows =
      interval === "month"
        ? await db.$queryRaw<RawInquiryTrendRow[]>`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') AS bucket, COUNT(*) AS count
            FROM \`WhatsappInquiryLog\`
            WHERE createdAt >= ${start}
              AND createdAt < ${end}
            GROUP BY bucket
            ORDER BY bucket ASC
          `
        : await db.$queryRaw<RawInquiryTrendRow[]>`
            SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS bucket, COUNT(*) AS count
            FROM \`WhatsappInquiryLog\`
            WHERE createdAt >= ${start}
              AND createdAt < ${end}
            GROUP BY bucket
            ORDER BY bucket ASC
          `;

    for (const row of eventRows) {
      const bucket = normalizeBucket(row.bucket, interval);
      const point = byBucket.get(bucket);
      if (!point) continue;
      if (row.type === "PAGE_VIEW") point.visits = countNumber(row.count);
      if (row.type === "PRODUCT_VIEW") point.productViews = countNumber(row.count);
      if (row.type === "WHATSAPP_CLICK") point.whatsapp = countNumber(row.count);
    }

    for (const row of inquiryRows) {
      const bucket = normalizeBucket(row.bucket, interval);
      const point = byBucket.get(bucket);
      if (point) point.inquiries = countNumber(row.count);
    }
  } catch {
    return Array.from(byBucket.values());
  }

  return Array.from(byBucket.values());
}

/**
 * Get top products by event type within a date range.
 */
export async function getTopProducts(
  type: AnalyticsEventType,
  since: Date,
  limit = 5,
): Promise<Array<{ productId: string; productName: string | null; count: number }>> {
  return getTopProductsBetween(type, since, new Date(), limit);
}

/**
 * Get top products by event type within a bounded date range.
 */
export async function getTopProductsBetween(
  type: AnalyticsEventType,
  start: Date,
  end: Date,
  limit = 5,
): Promise<Array<{ productId: string; productName: string | null; count: number }>> {
  try {
    const db = getDb();
    const events = await db.analyticsEvent.groupBy({
      by: ["productId"],
      where: {
        type,
        productId: { not: null },
        createdAt: { gte: start, lt: end },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });

    const productIds = events
      .map((event) => event.productId)
      .filter((id): id is string => id !== null);

    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map(products.map((product) => [product.id, product.name]));

    return events
      .filter((event) => event.productId)
      .map((event) => ({
        productId: event.productId!,
        productName: productMap.get(event.productId!) ?? null,
        count: event._count.id,
      }));
  } catch {
    return [];
  }
}

/**
 * Get recent events.
 */
export async function getRecentEvents(limit = 10) {
  try {
    const db = getDb();
    return await db.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        path: true,
        productName: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}
