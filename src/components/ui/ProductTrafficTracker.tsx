"use client";

import { useEffect } from "react";

type ProductTrafficTrackerProps = {
  productId: string;
  productName: string;
};

export default function ProductTrafficTracker({ productId, productName }: ProductTrafficTrackerProps) {
  useEffect(() => {
    const storageKey = `ekatalog-product-view:${productId}`;

    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // If sessionStorage is unavailable, still count the real page view.
    }

    fetch(`/api/products/${encodeURIComponent(productId)}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "view", source: "product-detail" }),
      keepalive: true,
    }).catch(() => {});

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PRODUCT_VIEW",
        path: `${window.location.pathname}${window.location.search}`,
        productId,
        productName,
        metadata: { source: "product-detail" },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [productId, productName]);

  return null;
}
