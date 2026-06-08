"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    const payload = JSON.stringify({
      type,
      path: path ?? currentPath(),
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
