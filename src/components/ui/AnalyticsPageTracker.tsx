"use client";

import { useEffect, useRef } from "react";

import type { AnalyticsEventType } from "@/generated/prisma/client";

type AnalyticsPageTrackerProps = {
  type: Extract<AnalyticsEventType, "PAGE_VIEW" | "PRODUCT_VIEW" | "WHATSAPP_CLICK">;
  path?: string;
  productId?: string;
  productName?: string;
  metadata?: Record<string, unknown>;
};

function currentPath() {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
}

export default function AnalyticsPageTracker({
  type,
  path,
  productId,
  productName,
  metadata,
}: AnalyticsPageTrackerProps) {
  // Track exactly once per unique (type, path, product) view. A ref keyed on
  // that identity is the dedupe guard so we don't emit duplicate events from:
  //   - React StrictMode's double effect invocation in development,
  //   - re-renders that pass a fresh `metadata` object literal (new reference),
  //   - any unrelated parent re-render.
  // A genuine client-side navigation to a different path unmounts this tracker
  // and remounts it with a new key, so real page views are still counted.
  const trackedKey = useRef<string | null>(null);

  useEffect(() => {
    const resolvedPath = path ?? currentPath();
    const key = `${type}::${resolvedPath}::${productId ?? ""}`;
    if (trackedKey.current === key) return;
    trackedKey.current = key;

    const payload = JSON.stringify({
      type,
      path: resolvedPath,
      productId,
      productName,
      metadata,
    });

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [metadata, path, productId, productName, type]);

  return null;
}
