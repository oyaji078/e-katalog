'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductGrid from '@/components/ui/ProductGrid';
import type { ProductCardProps } from '@/components/ui/ProductCard';
import { SAVED_PRODUCTS_STORAGE_KEY, SAVED_PRODUCTS_CHANGE_EVENT } from '@/lib/saved-products';

function readSavedProductIds(): string[] {
  try {
    const raw = window.localStorage.getItem(SAVED_PRODUCTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item: unknown) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export default function SavedProductsClient() {
  const [productIds, setProductIds] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function refreshIds() {
      setProductIds(readSavedProductIds());
    }

    refreshIds();
    window.addEventListener('storage', refreshIds);
    window.addEventListener(SAVED_PRODUCTS_CHANGE_EVENT, refreshIds);
    return () => {
      window.removeEventListener('storage', refreshIds);
      window.removeEventListener(SAVED_PRODUCTS_CHANGE_EVENT, refreshIds);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Use the role-gated /saved endpoint: it returns fully-mapped
        // ProductCardProps via toProductCardProps, so retailPrice is only
        // present for eligible (RETAIL_ACTIVE) users — guests never receive it.
        const response = await fetch('/api/products/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();

        if (!cancelled) {
          setProducts((data.products ?? []) as ProductCardProps[]);
        }
      } catch (error) {
        console.error('Error loading saved products:', error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [productIds]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center">
        <p className="text-[var(--color-text-muted)]">Memuat produk tersimpan...</p>
      </div>
    );
  }

  if (productIds.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center">
        <div className="text-6xl mb-4">❤️</div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
          Belum ada produk tersimpan
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Tekan ikon ❤ di produk untuk menyimpan dan melihatnya kembali di sini.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] transition"
        >
          Lihat Katalog
        </Link>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
          Produk tidak tersedia
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Beberapa produk yang Anda simpan mungkin sudah dihapus atau tidak aktif.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ProductGrid products={products} columns={4} />
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            localStorage.removeItem(SAVED_PRODUCTS_STORAGE_KEY);
            window.dispatchEvent(new Event(SAVED_PRODUCTS_CHANGE_EVENT));
            setProductIds([]);
          }}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition"
        >
          Hapus semua
        </button>
      </div>
    </div>
  );
}
