"use client";

import Link from "next/link";

type TrackedProductLinkProps = {
  href: string;
  productId: string;
  source?: string;
  className?: string;
  children: React.ReactNode;
};

function trackProductClick(productId: string, source?: string) {
  const payload = JSON.stringify({ event: "click", source });
  const url = `/api/products/${encodeURIComponent(productId)}/track`;

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export default function TrackedProductLink({
  href,
  productId,
  source,
  className,
  children,
}: TrackedProductLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackProductClick(productId, source)}
    >
      {children}
    </Link>
  );
}
