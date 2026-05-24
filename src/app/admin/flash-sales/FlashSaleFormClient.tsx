"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useMemo, useState } from "react";

import { createFlashSaleAction, updateFlashSaleAction, type FlashSaleFormState } from "./actions";

type ProductOption = { id: string; name: string; publicPrice: number };

type FlashSaleProductEntry = {
  productId: string;
  flashSalePrice: number;
  flashSaleStock: number;
};

type FlashSaleData = {
  id: string;
  name: string;
  startsAt: string;
  durationDays: number;
  isActive: boolean;
  products: FlashSaleProductEntry[];
};

const initialState: FlashSaleFormState = { success: false, message: "" };

function parsePrice(val: string) {
  return val.replace(/\./g, "");
}

function formatNumber(val: number) {
  if (Number.isNaN(val)) return "";
  return val.toLocaleString("id-ID");
}

export default function FlashSaleFormClient({
  flashSale,
  products,
}: {
  flashSale?: FlashSaleData;
  products: ProductOption[];
}) {
  const router = useRouter();
  const isEdit = !!flashSale;
  const action = isEdit ? updateFlashSaleAction : createFlashSaleAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [name, setName] = useState(flashSale?.name ?? "");
  const [startsAt, setStartsAt] = useState(flashSale?.startsAt ?? "");
  const [durationDays, setDurationDays] = useState(flashSale?.durationDays ?? 1);
  const [isActive, setIsActive] = useState(flashSale?.isActive ?? false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    flashSale?.products.map((p) => p.productId) ?? [],
  );
  const [productPrices, setProductPrices] = useState<Record<string, number>>(
    Object.fromEntries(flashSale?.products.map((p) => [p.productId, p.flashSalePrice]) ?? []),
  );
  const [productStocks, setProductStocks] = useState<Record<string, number>>(
    Object.fromEntries(flashSale?.products.map((p) => [p.productId, p.flashSaleStock]) ?? []),
  );
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [potonganDisplay, setPotonganDisplay] = useState("");

  const availableProducts = useMemo(
    () => products.filter((p) => !selectedProductIds.includes(p.id)),
    [products, selectedProductIds],
  );

  const filteredAvailable = useMemo(
    () => availableProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [availableProducts, searchQuery],
  );

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedProductIds.includes(p.id)),
    [products, selectedProductIds],
  );

  const endDate = useMemo(() => {
    if (!startsAt) return "";
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return "";
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    return end.toLocaleDateString("id-ID");
  }, [startsAt, durationDays]);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => router.push("/admin/flash-sales"), 1500);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  function addProduct(id: string) {
    setSelectedProductIds((prev) => [...prev, id]);
    const product = products.find((p) => p.id === id);
    if (product && !(id in productPrices)) {
      const potongan = Number(parsePrice(potonganDisplay)) || 0;
      const price = Math.max(0, product.publicPrice - potongan);
      setProductPrices((prev) => ({ ...prev, [id]: price }));
    }
    if (!(id in productStocks)) {
      setProductStocks((prev) => ({ ...prev, [id]: 0 }));
    }
  }

  function removeProduct(id: string) {
    setSelectedProductIds((prev) => prev.filter((pid) => pid !== id));
  }

  const handlePotonganChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setPotonganDisplay(raw);
    const potongan = Number(raw) || 0;
    setProductPrices((prev) => {
      const next = { ...prev };
      for (const pid of Object.keys(next)) {
        const product = products.find((p) => p.id === pid);
        if (product) {
          next[pid] = Math.max(0, product.publicPrice - potongan);
        }
      }
      return next;
    });
  }, [products]);

  const potonganRaw = useMemo(() => Number(parsePrice(potonganDisplay)) || 0, [potonganDisplay]);

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-dark">
          {isEdit ? "Edit Flash Sale" : "Flash Sale Baru"}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {isEdit ? "Perbarui flash sale yang sudah ada." : "Buat flash sale baru dengan produk, harga, dan stok khusus."}
        </p>
      </div>

      {state.error ? (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div className="mb-4 rounded-xl border border-success/20 bg-success/5 p-4 text-sm font-semibold text-success">
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="space-y-5">
        {flashSale ? <input type="hidden" name="id" value={flashSale.id} /> : null}
        <input type="hidden" name="potonganRata" value={potonganRaw} />

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Left: form fields */}
          <div className="space-y-5">
            {/* Informasi Flash Sale */}
            <section className="rounded-2xl border border-border-gray bg-white p-5">
              <h2 className="mb-4 text-base font-bold text-text-dark">Informasi Flash Sale</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-dark">
                    Nama Flash Sale <span className="text-danger">*</span>
                  </label>
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Contoh: Flash Sale Akhir Bulan"
                    className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-text-dark">
                      Tanggal Mulai <span className="text-danger">*</span>
                    </label>
                    <input
                      name="startsAt"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-dark">
                      Durasi (hari)
                    </label>
                    <input
                      name="durationDays"
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value) || 1)}
                      className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                    />
                    {endDate ? (
                      <p className="mt-1 text-[10px] text-text-muted">
                        Selesai: {endDate}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {/* Potongan Pukul Rata */}
            <section className="rounded-2xl border border-border-gray bg-white p-5">
              <h2 className="mb-4 text-base font-bold text-text-dark">Potongan Pukul Rata</h2>
              <div>
                <label className="block text-sm font-semibold text-text-dark">
                  Potongan Harga (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumber(Number(parsePrice(potonganDisplay) || 0))}
                  onChange={handlePotonganChange}
                  onFocus={(e) => {
                    const raw = e.target.value.replace(/\./g, "");
                    setPotonganDisplay(raw);
                  }}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                />
                <p className="mt-1 text-xs text-text-muted">
                  Diskon akan diterapkan ke semua produk yang dipilih. Harga flash sale tiap produk tetap bisa diubah manual.
                </p>
              </div>
            </section>

            {/* Produk Flash Sale */}
            <section className="rounded-2xl border border-border-gray bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-text-dark">Produk Flash Sale</h2>
                <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="rounded-xl bg-primary-maroon px-4 py-2 text-xs font-bold text-white hover:bg-primary-maroon/80"
                >
                  + Tambah Produk
                </button>
              </div>

              {selectedProducts.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-muted">
                  Belum ada produk. Klik &quot;Tambah Produk&quot; untuk memilih.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedProducts.map((product) => {
                    const hasZeroStock = (productStocks[product.id] ?? 0) === 0;
                    return (
                      <div
                        key={product.id}
                        className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
                          hasZeroStock ? "border-danger/30 bg-danger/5" : "border-border-gray bg-soft-bg"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-dark">{product.name}</p>
                          <p className="text-xs text-text-muted">
                            Harga Normal: Rp {formatNumber(product.publicPrice)}
                          </p>
                          {productPrices[product.id] !== undefined && productPrices[product.id] >= product.publicPrice ? (
                            <p className="text-xs text-danger">
                              Harga flash sale harus lebih rendah dari harga normal!
                            </p>
                          ) : null}
                          {hasZeroStock ? (
                            <p className="mt-1 rounded bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger inline-block">
                              Peringatan: Stok 0
                            </p>
                          ) : null}
                        </div>
                        <input type="hidden" name="productIds" value={product.id} />
                        <div className="flex items-center gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-text-muted">Harga Flash Sale</label>
                            <input
                              name="flashSalePrices"
                              type="text"
                              inputMode="numeric"
                              value={formatNumber(productPrices[product.id] ?? product.publicPrice)}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, "");
                                const val = Number(raw) || 0;
                                setProductPrices((prev) => ({ ...prev, [product.id]: val }));
                              }}
                              onFocus={(e) => {
                                const raw = e.target.value.replace(/\./g, "");
                                setProductPrices((prev) => ({ ...prev, [product.id]: Number(raw) || 0 }));
                              }}
                              className="w-28 rounded-lg border border-border-gray bg-white px-2 py-1.5 text-xs outline-none focus:border-primary-maroon"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-text-muted">Stok</label>
                            <input
                              name="flashSaleStocks"
                              type="number"
                              min="0"
                              value={productStocks[product.id] ?? 0}
                              onChange={(e) =>
                                setProductStocks((prev) => ({ ...prev, [product.id]: Number(e.target.value) || 0 }))
                              }
                              className="w-20 rounded-lg border border-border-gray bg-white px-2 py-1.5 text-xs outline-none focus:border-primary-maroon"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProduct(product.id)}
                            className="self-end rounded-lg p-1.5 text-danger hover:bg-danger/10"
                          >
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right: Status & Submit */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-border-gray bg-white p-5">
              <h2 className="mb-4 text-base font-bold text-text-dark">Status</h2>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-gray bg-soft-bg px-4 py-3 transition hover:border-primary-maroon/30">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    name="isActive"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-border-gray after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-maroon peer-checked:after:translate-x-full" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-dark">Aktifkan Flash Sale</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-text-muted">
                    Flash sale hanya tampil jika dalam periode yang aktif.
                  </p>
                </div>
              </label>
            </section>

            <div className="sticky bottom-0 rounded-2xl border border-border-gray bg-white p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/flash-sales"
                  className="flex-1 rounded-xl border border-border-gray px-5 py-2.5 text-center text-sm font-semibold text-text-muted hover:bg-soft-bg"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-primary-maroon px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Menyimpan..." : isEdit ? "Simpan" : "Buat Flash Sale"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Product selection modal */}
      {showProductModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowProductModal(false)}
        >
          <div
            className="mx-4 flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border-gray p-4">
              <h3 className="text-base font-bold text-text-dark">Tambah Produk</h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk..."
                className="mt-2 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2 text-sm outline-none focus:border-primary-maroon"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredAvailable.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-muted">
                  {searchQuery ? "Produk tidak ditemukan." : "Semua produk sudah dipilih."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredAvailable.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-border-gray px-4 py-3 text-left transition hover:border-primary-maroon/30 hover:bg-soft-bg"
                    >
                      <span className="text-sm font-semibold text-text-dark">{product.name}</span>
                      <span className="text-xs text-text-muted">
                        Rp {formatNumber(product.publicPrice)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-border-gray p-4">
              <button
                onClick={() => setShowProductModal(false)}
                className="w-full rounded-xl bg-primary-maroon px-4 py-2 text-sm font-bold text-white"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
