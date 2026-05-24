"use client";

import { useEffect } from "react";

type ProductTrafficTrackerProps = {
  productId: string;
};

export default function ProductTrafficTracker({ productId }: ProductTrafficTrackerProps) {
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
  }, [productId]);

  return null;
}
