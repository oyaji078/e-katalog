"use client";

import { Bookmark, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { twMerge } from "tailwind-merge";

import { SAVED_PRODUCTS_CHANGE_EVENT, SAVED_PRODUCTS_STORAGE_KEY } from "@/lib/saved-products";

type SavedProductButtonProps = {
  productId: string;
  productName?: string;
  className?: string;
  variant?: "button" | "icon";
};

function readSavedProducts() {
  try {
    const raw = window.localStorage.getItem(SAVED_PRODUCTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeSavedProducts(productIds: string[]) {
  window.localStorage.setItem(SAVED_PRODUCTS_STORAGE_KEY, JSON.stringify(Array.from(new Set(productIds))));
  window.dispatchEvent(new Event(SAVED_PRODUCTS_CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SAVED_PRODUCTS_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SAVED_PRODUCTS_CHANGE_EVENT, callback);
  };
}

function getServerSnapshot() {
  return false;
}

async function trackSavedEvent(eventType: "SAVED_PRODUCT" | "UNSAVED_PRODUCT", productId: string, productName: string | undefined, pathname: string) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: eventType,
        productId,
        productName: productName ?? null,
        path: pathname,
      }),
    });
  } catch {
    // Tracking failure must not break save/unsave UI
  }
}

export default function SavedProductButton({ productId, productName, className = "", variant = "button" }: SavedProductButtonProps) {
  const pathname = usePathname();
  const saved = useSyncExternalStore(
    subscribe,
    () => readSavedProducts().includes(productId),
    getServerSnapshot,
  );

  const toggleSaved = useCallback(() => {
    const products = readSavedProducts();
    const nextSaved = !products.includes(productId);
    const nextProducts = nextSaved
      ? [...products, productId]
      : products.filter((savedProductId) => savedProductId !== productId);

    writeSavedProducts(nextProducts);

    const eventType = nextSaved ? "SAVED_PRODUCT" : "UNSAVED_PRODUCT";
    trackSavedEvent(eventType, productId, productName, pathname);
  }, [productId, productName, pathname]);

  const Icon = saved ? Check : Bookmark;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleSaved}
        aria-pressed={saved}
        title={saved ? "Produk tersimpan" : "Simpan produk"}
        aria-label={saved ? "Produk tersimpan" : "Simpan produk"}
        className={twMerge(
          "inline-flex size-7 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-0 text-[#8A8A9E] shadow-none backdrop-blur transition hover:border-[#E4D329]/50 hover:bg-[rgba(255,255,255,0.06)] hover:text-[#E4D329]",
          saved ? "text-[#E4D329]" : "text-[#8A8A9E]",
          className,
        )}
      >
        <Icon className="size-3.5 shrink-0" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleSaved}
      aria-pressed={saved}
      className={twMerge(
        "inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-center text-[10px] font-black transition",
        saved
          ? "border-brand-accent bg-brand-accent text-brand-on-accent"
          : "border-brand-dark bg-brand-surface text-brand-on-dark hover:border-brand-accent hover:text-brand-accent",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{saved ? "Tersimpan" : "Simpan"}</span>
    </button>
  );
}
