"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useMemo, useState } from "react";

import { createFlashSaleAction, updateFlashSaleAction, type FlashSaleFormState } from "./actions";

type ProductOption = {
  id: string;
  name: string;
  publicPrice: number;
  retailPrice: number | null;
};

type FlashSaleProductEntry = {
  productId: string;
  flashSalePublicPrice: number | null;
  flashSaleRetailPrice: number | null;
  flashSaleStock: number;
};

type FlashSaleData = {
  id: string;
  name: string;
  startsAt: string;
  durationDays: number;
  showForPublic: boolean;
  showForRetail: boolean;
  products: FlashSaleProductEntry[];
};

const initialState: FlashSaleFormState = { success: false, message: "" };

function onlyDigits(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function parsePrice(value: string) {
  return Number(onlyDigits(value)) || 0;
}

function formatMoney(value: string | number | null | undefined) {
  const raw = onlyDigits(String(value ?? ""));
  if (!raw) return "";
  return Number(raw).toLocaleString("id-ID");
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toLocaleString("id-ID");
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
  const [showForPublic, setShowForPublic] = useState(flashSale?.showForPublic ?? true);
  const [showForRetail, setShowForRetail] = useState(flashSale?.showForRetail ?? false);
  const [useFlatDiscount, setUseFlatDiscount] = useState(false);
  const [flatDiscount, setFlatDiscount] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    flashSale?.products.map((p) => p.productId) ?? [],
  );
  const [publicPrices, setPublicPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      flashSale?.products.map((p) => [p.productId, p.flashSalePublicPrice ? String(p.flashSalePublicPrice) : ""]) ?? [],
    ),
  );
  const [retailPrices, setRetailPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      flashSale?.products.map((p) => [p.productId, p.flashSaleRetailPrice ? String(p.flashSaleRetailPrice) : ""]) ?? [],
    ),
  );
  const [productStocks, setProductStocks] = useState<Record<string, number>>(
    Object.fromEntries(flashSale?.products.map((p) => [p.productId, p.flashSaleStock]) ?? []),
  );
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const selectedProducts = useMemo(
    () => selectedProductIds.map((id) => productById.get(id)).filter(Boolean) as ProductOption[],
    [productById, selectedProductIds],
  );
  const availableProducts = useMemo(
    () => products.filter((product) => !selectedProductIds.includes(product.id)),
    [products, selectedProductIds],
  );
  const filteredAvailable = useMemo(
    () => availableProducts.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [availableProducts, searchQuery],
  );

  const endDate = useMemo(() => {
    if (!startsAt) return "";
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return "";
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    return end.toLocaleDateString("id-ID");
  }, [startsAt, durationDays]);

  const applyFlatDiscount = useCallback((rawDiscount: string) => {
    const discount = parsePrice(rawDiscount);
    const nextPublic: Record<string, string> = {};
    const nextRetail: Record<string, string> = {};

    for (const productId of selectedProductIds) {
      const product = productById.get(productId);
      if (!product) continue;
      nextPublic[productId] = String(Math.max(0, product.publicPrice - discount));
      nextRetail[productId] = product.retailPrice
        ? String(Math.max(0, product.retailPrice - discount))
        : "";
    }

    setPublicPrices((current) => ({ ...current, ...nextPublic }));
    setRetailPrices((current) => ({ ...current, ...nextRetail }));
  }, [productById, selectedProductIds]);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => router.push("/admin/flash-sales"), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  function addProduct(id: string) {
    setSelectedProductIds((prev) => [...prev, id]);
    const product = productById.get(id);
    const discount = parsePrice(flatDiscount);
    setPublicPrices((prev) => ({
      ...prev,
      [id]: useFlatDiscount && product ? String(Math.max(0, product.publicPrice - discount)) : prev[id] ?? "",
    }));
    setRetailPrices((prev) => ({
      ...prev,
      [id]: useFlatDiscount && product?.retailPrice ? String(Math.max(0, product.retailPrice - discount)) : prev[id] ?? "",
    }));
    setProductStocks((prev) => ({ ...prev, [id]: prev[id] ?? 1 }));
  }

  function removeProduct(id: string) {
    setSelectedProductIds((prev) => prev.filter((productId) => productId !== id));
  }

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">
          {isEdit ? "Edit Flash Sale" : "Flash Sale Baru"}
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Atur harga flash sale berdasarkan audience public dan retail.
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
        <input type="hidden" name="showForPublic" value={showForPublic ? "1" : "0"} />
        <input type="hidden" name="showForRetail" value={showForRetail ? "1" : "0"} />
        {useFlatDiscount ? <input type="hidden" name="useFlatDiscount" value="1" /> : null}
        {useFlatDiscount ? <input type="hidden" name="potonganRata" value={flatDiscount} /> : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-brand-border bg-white p-5">
              <h2 className="mb-4 text-base font-bold text-brand-text">Informasi Flash Sale</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-text">
                    Nama Flash Sale <span className="text-danger">*</span>
                  </label>
                  <input
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-brand-text">
                      Tanggal Mulai <span className="text-danger">*</span>
                    </label>
                    <input
                      name="startsAt"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(event) => setStartsAt(event.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-text">Durasi (hari)</label>
                    <input
                      name="durationDays"
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={(event) => setDurationDays(Number(event.target.value) || 1)}
                      className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                    />
                    {endDate ? <p className="mt-1 text-[10px] text-brand-muted">Selesai: {endDate}</p> : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-brand-border bg-white p-5">
              <h2 className="mb-3 text-base font-bold text-brand-text">Audience</h2>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={showForPublic}
                    onChange={(event) => {
                      if (event.target.checked || showForRetail) setShowForPublic(event.target.checked);
                    }}
                  />
                  Public
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={showForRetail}
                    onChange={(event) => {
                      if (event.target.checked || showForPublic) setShowForRetail(event.target.checked);
                    }}
                  />
                  Retail
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-brand-border bg-white p-5">
              <label className="flex items-center gap-3 text-sm font-bold text-brand-text">
                <input
                  type="checkbox"
                  checked={useFlatDiscount}
                  onChange={(event) => {
                    setUseFlatDiscount(event.target.checked);
                    if (event.target.checked) applyFlatDiscount(flatDiscount);
                  }}
                />
                Gunakan Potongan Pukul Rata
              </label>
              {useFlatDiscount ? (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-brand-text">Potongan Pukul Rata (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatMoney(flatDiscount)}
                    onChange={(event) => {
                      const raw = onlyDigits(event.target.value);
                      setFlatDiscount(raw);
                      applyFlatDiscount(raw);
                    }}
                    placeholder="0"
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  />
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-brand-border bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-brand-text">Produk Flash Sale</h2>
                <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:bg-brand-primary/80"
                >
                  + Tambah Produk
                </button>
              </div>

              {selectedProducts.length === 0 ? (
                <p className="py-4 text-center text-sm text-brand-muted">
                  Belum ada produk. Klik Tambah Produk untuk memilih.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedProducts.map((product) => {
                    const hasZeroStock = (productStocks[product.id] ?? 0) <= 0;
                    const calculatedPublic = Math.max(0, product.publicPrice - parsePrice(flatDiscount));
                    const calculatedRetail = product.retailPrice
                      ? Math.max(0, product.retailPrice - parsePrice(flatDiscount))
                      : null;

                    return (
                      <div
                        key={product.id}
                        className={`rounded-xl border p-3 ${
                          hasZeroStock ? "border-danger/30 bg-danger/5" : "border-brand-border bg-brand-bg"
                        }`}
                      >
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-brand-text">{product.name}</p>
                            <p className="mt-1 text-xs text-brand-muted">
                              Public: Rp {formatNumber(product.publicPrice)} | Ritel:{" "}
                              {product.retailPrice ? `Rp ${formatNumber(product.retailPrice)}` : "-"}
                            </p>
                            {showForRetail && !product.retailPrice ? (
                              <p className="mt-1 text-xs font-semibold text-danger">
                                Produk belum memiliki Harga Jual Ritel.
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-end gap-2">
                            <input type="hidden" name="productIds" value={product.id} />
                            {showForPublic ? (
                              <div>
                                <label className="block text-[10px] font-semibold text-brand-muted">
                                  Harga Flash Sale Public
                                </label>
                                {useFlatDiscount ? (
                                  <p className="w-32 rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs font-bold text-brand-accent">
                                    Rp {formatNumber(calculatedPublic)}
                                  </p>
                                ) : (
                                  <input
                                    name="flashSalePublicPrices"
                                    type="text"
                                    inputMode="numeric"
                                    value={formatMoney(publicPrices[product.id])}
                                    onChange={(event) => {
                                      const raw = onlyDigits(event.target.value);
                                      setPublicPrices((prev) => ({ ...prev, [product.id]: raw }));
                                    }}
                                    className="w-32 rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-primary"
                                  />
                                )}
                              </div>
                            ) : null}
                            {showForRetail ? (
                              <div>
                                <label className="block text-[10px] font-semibold text-brand-muted">
                                  Harga Flash Sale Ritel
                                </label>
                                {useFlatDiscount ? (
                                  <p className="w-32 rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs font-bold text-brand-primary">
                                    {calculatedRetail ? `Rp ${formatNumber(calculatedRetail)}` : "-"}
                                  </p>
                                ) : (
                                  <input
                                    name="flashSaleRetailPrices"
                                    type="text"
                                    inputMode="numeric"
                                    value={formatMoney(retailPrices[product.id])}
                                    onChange={(event) => {
                                      const raw = onlyDigits(event.target.value);
                                      setRetailPrices((prev) => ({ ...prev, [product.id]: raw }));
                                    }}
                                    className="w-32 rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-primary"
                                  />
                                )}
                              </div>
                            ) : null}
                            <div>
                              <label className="block text-[10px] font-semibold text-brand-muted">Stok</label>
                              <input
                                name="flashSaleStocks"
                                type="number"
                                min="1"
                                value={productStocks[product.id] ?? 1}
                                onChange={(event) =>
                                  setProductStocks((prev) => ({ ...prev, [product.id]: Number(event.target.value) || 0 }))
                                }
                                className="w-20 rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-primary"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeProduct(product.id)}
                              className="rounded-lg px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-5">
            <div className="sticky bottom-0 rounded-2xl border border-brand-border bg-white p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/flash-sales"
                  className="flex-1 rounded-xl border border-brand-border px-5 py-2.5 text-center text-sm font-semibold text-brand-muted hover:bg-brand-bg"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Menyimpan..." : isEdit ? "Simpan" : "Buat Flash Sale"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {showProductModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowProductModal(false)}
        >
          <div
            className="mx-4 flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-brand-border p-4">
              <h3 className="text-base font-bold text-brand-text">Tambah Produk</h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari produk..."
                className="mt-2 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredAvailable.length === 0 ? (
                <p className="py-8 text-center text-sm text-brand-muted">
                  {searchQuery ? "Produk tidak ditemukan." : "Semua produk sudah dipilih."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredAvailable.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-brand-border px-4 py-3 text-left transition hover:border-brand-primary/30 hover:bg-brand-bg"
                    >
                      <span className="text-sm font-semibold text-brand-text">{product.name}</span>
                      <span className="shrink-0 text-xs text-brand-muted">
                        Public Rp {formatNumber(product.publicPrice)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-brand-border p-4">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="w-full rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white"
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
