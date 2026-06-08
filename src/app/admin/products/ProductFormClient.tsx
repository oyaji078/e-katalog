"use client";

import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useCallback, useEffect, useRef, useState } from "react";

import { formatIndonesianNumber, parseIndonesianNumber } from "@/lib/currency";
import { createProductAction, type ProductFormState, updateProductAction } from "./actions";

type ProductImageRecord = {
  id?: string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
};

type BrandOption = { id: string; name: string; isActive: boolean; logoUrl?: string | null };

type ProductFormClientProps = {
  mode: "create" | "edit";
  categories: { id: string; name: string }[];
  brands: BrandOption[];
  product?: {
    id: string;
    name: string;
    sku: string;
    description: string;
    warrantyInfo: string | null;
    primaryImageUrl: string | null;
    pricingMode: string | null;
    costPrice: string;
    publicMarginValue: string;
    retailMarginValue: string;
    publicPrice: string;
    retailPrice: string;
    stockQuantity: number;
    stockStatus: string;
    status: string;
    categoryId: string;
    brandId: string;
    specifications: unknown;
    images?: ProductImageRecord[];
  };
};

type ImageItem =
  | { key: string; source: "existing"; id: string; url: string; file?: never }
  | { key: string; source: "legacy"; url: string; file?: never }
  | { key: string; source: "new"; url: string; file: File };

const initialState: ProductFormState = { success: false, message: "", error: "", productId: "" };

const stockOptions = [
  { value: "READY", label: "Tersedia" },
  { value: "LOW_STOCK", label: "Stok Terbatas" },
  { value: "OUT_OF_STOCK", label: "Stok Habis" },
  { value: "PREORDER", label: "Preorder" },
];

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "ARCHIVED", label: "Diarsipkan" },
];

function createImageKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function initialImageItems(product: ProductFormClientProps["product"]): ImageItem[] {
  if (!product) return [];

  const items: ImageItem[] = [];
  const knownUrls = new Set<string>();
  const sortedImages = [...(product.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (product.primaryImageUrl && !sortedImages.some((image) => image.url === product.primaryImageUrl)) {
    items.push({
      key: `legacy:${product.primaryImageUrl}`,
      source: "legacy",
      url: product.primaryImageUrl,
    });
    knownUrls.add(product.primaryImageUrl);
  }

  for (const image of sortedImages) {
    if (!image.url || knownUrls.has(image.url)) continue;
    items.push(
      image.id
        ? { key: `existing:${image.id}`, source: "existing", id: image.id, url: image.url }
        : { key: `legacy:${image.url}`, source: "legacy", url: image.url },
    );
    knownUrls.add(image.url);
  }

  return items;
}

function initialPrimaryKey(product: ProductFormClientProps["product"], items: ImageItem[]) {
  if (!product?.primaryImageUrl) return items[0]?.key ?? "";
  return items.find((item) => item.url === product.primaryImageUrl)?.key ?? items[0]?.key ?? "";
}

function formatSpecifications(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default function ProductFormClient({ mode, categories, brands, product }: ProductFormClientProps) {
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [imageItems, setImageItems] = useState<ImageItem[]>(() => initialImageItems(product));
  const [primaryKey, setPrimaryKey] = useState(() => {
    const items = initialImageItems(product);
    return initialPrimaryKey(product, items);
  });
  const objectUrls = useRef<string[]>([]);

  const [validationError, setValidationError] = useState("");

  const inferPricingMode = () => {
    if (!product) return "ONE_PRICE";
    if (
      product.pricingMode === "ONE_PRICE" ||
      product.pricingMode === "MARGIN_BASED" ||
      product.pricingMode === "MANUAL_DUAL_PRICE"
    ) {
      return product.pricingMode;
    }
    const cp = Number(product.costPrice);
    const pp = Number(product.publicPrice);
    const rp = product.retailPrice ? Number(product.retailPrice) : pp;
    if (cp > 0) return "MARGIN_BASED";
    if (pp === rp) return "ONE_PRICE";
    return "MANUAL_DUAL_PRICE";
  };

  const initialMode = inferPricingMode();
  const [pricingMode, setPricingMode] = useState(initialMode);
  const [hargaJual, setHargaJual] = useState(
    product && initialMode === "ONE_PRICE" ? product.publicPrice : "",
  );
  const [hargaPublik, setHargaPublik] = useState(
    product && initialMode === "MANUAL_DUAL_PRICE" ? product.publicPrice : "",
  );
  const [hargaRitel, setHargaRitel] = useState(
    product && initialMode === "MANUAL_DUAL_PRICE" && product.retailPrice ? product.retailPrice : "",
  );
  const [hargaBarang, setHargaBarang] = useState(product?.costPrice ?? "");
  const [marginPublic, setMarginPublic] = useState(product?.publicMarginValue ?? "");
  const [marginRitel, setMarginRitel] = useState(product?.retailMarginValue ?? "");

  const hj = parseIndonesianNumber(String(hargaJual));
  const hp = parseIndonesianNumber(String(hargaPublik));
  const hr = parseIndonesianNumber(String(hargaRitel));
  const hb = parseIndonesianNumber(String(hargaBarang));
  const mp = parseIndonesianNumber(String(marginPublic));
  const mr = parseIndonesianNumber(String(marginRitel));
  const previewPublic = pricingMode === "ONE_PRICE" ? hj : pricingMode === "MANUAL_DUAL_PRICE" ? hp : hb + mp;
  const previewRitel = pricingMode === "ONE_PRICE" ? hj : pricingMode === "MANUAL_DUAL_PRICE" ? hr : hb + mr;

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      for (const url of objectUrls.current) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    if (state.success && state.message) {
      const timer = setTimeout(() => {
        window.location.href = "/admin/products";
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.message]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError("");
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const MAX_SINGLE = 3 * 1024 * 1024;
    const MAX_TOTAL = 20 * 1024 * 1024;
    const MAX_COUNT = 8;

    const currentCount = imageItems.filter((item) => item.source === "new").length;
    if (currentCount + files.length > MAX_COUNT) {
      setValidationError(`Maksimal ${MAX_COUNT} gambar per produk.`);
      e.target.value = "";
      return;
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setValidationError("Format gambar harus JPG, PNG, atau WEBP.");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_SINGLE) {
        setValidationError("Ukuran satu gambar maksimal 3MB.");
        e.target.value = "";
        return;
      }
    }

    const totalExistingSize = imageItems
      .filter((item) => item.source === "new" && item.file)
      .reduce((sum, item) => sum + (item.file?.size ?? 0), 0);
    const totalNewSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalExistingSize + totalNewSize > MAX_TOTAL) {
      setValidationError("Ukuran total gambar terlalu besar. Maksimal 20MB.");
      e.target.value = "";
      return;
    }

    const newItems = files.map((file): ImageItem => {
      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);
      return {
        key: `new:${createImageKey()}`,
        source: "new",
        file,
        url,
      };
    });

    setImageItems((current) => {
      const next = [...current, ...newItems];
      if (!primaryKey && next[0]) setPrimaryKey(next[0].key);
      return next;
    });
    e.target.value = "";
  }, [primaryKey, imageItems]);

  const removeImage = useCallback((key: string) => {
    setImageItems((current) => {
      const removed = current.find((item) => item.key === key);
      if (removed?.source === "new") {
        URL.revokeObjectURL(removed.url);
        objectUrls.current = objectUrls.current.filter((url) => url !== removed.url);
      }

      const next = current.filter((item) => item.key !== key);
      if (primaryKey === key) setPrimaryKey(next[0]?.key ?? "");
      return next;
    });
  }, [primaryKey]);

  const formatPrice = useCallback((val: string | number) => {
    if (val === "") return "";
    return formatIndonesianNumber(val);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    formData.delete("newImages");
    formData.delete("imageOrder");
    formData.delete("primaryImageRef");

    const newIndexByKey = new Map<string, number>();
    let newIndex = 0;
    let primaryImageRef = "";

    for (const item of imageItems) {
      let ref = "";
      if (item.source === "new") {
        ref = `new:${newIndex}`;
        newIndexByKey.set(item.key, newIndex);
        formData.append("newImages", item.file);
        newIndex += 1;
      } else if (item.source === "existing") {
        ref = `existing:${item.id}`;
      } else {
        ref = `legacy:${item.url}`;
      }

      formData.append("imageOrder", ref);
      if (item.key === primaryKey) primaryImageRef = ref;
    }

    if (!primaryImageRef && imageItems[0]) {
      const first = imageItems[0];
      if (first.source === "new") {
        const index = newIndexByKey.get(first.key);
        primaryImageRef = typeof index === "number" ? `new:${index}` : "";
      } else if (first.source === "existing") {
        primaryImageRef = `existing:${first.id}`;
      } else {
        primaryImageRef = `legacy:${first.url}`;
      }
    }

    formData.set("primaryImageRef", primaryImageRef);
    formData.set("pricingMode", pricingMode);
    if (pricingMode === "ONE_PRICE") {
      formData.set("hargaJual", String(hj));
    } else if (pricingMode === "MANUAL_DUAL_PRICE") {
      formData.set("hargaPublik", String(hp));
      formData.set("hargaRitel", String(hr));
    } else {
      formData.set("hargaBarang", String(hb));
      formData.set("marginPublic", String(mp));
      formData.set("marginRitel", String(mr));
    }

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}

      {state.error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}

      {state.success && state.message ? (
        <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-sm font-semibold text-success">
          {state.message}
        </div>
      ) : null}

      {validationError ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm font-semibold text-danger">
          {validationError}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-brand-border bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-brand-text">Informasi Produk</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-text">
                  Nama Produk <span className="text-danger">*</span>
                </label>
                <input
                  name="name"
                  defaultValue={product?.name}
                  required
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-brand-text">
                    Kategori <span className="text-danger">*</span>
                  </label>
                  <select
                    name="categoryId"
                    defaultValue={product?.categoryId}
                    required
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-text">
                    Merek <span className="text-danger">*</span>
                  </label>
                  <select
                    name="brandId"
                    defaultValue={product?.brandId}
                    required
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  >
                    <option value="">Pilih Merek</option>
                    {brands
                      .slice()
                      .sort((a, b) => {
                        if (a.isActive && !b.isActive) return -1;
                        if (!a.isActive && b.isActive) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((brd) => (
                        <option key={brd.id} value={brd.id}>
                          {brd.name}{!brd.isActive ? " (nonaktif)" : ""}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              {product ? (
                <div>
                  <label className="block text-sm font-semibold text-brand-text">Kode Produk</label>
                  <p className="mt-1 font-mono text-sm text-brand-muted">{product.sku}</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-brand-text">Kode Produk</label>
                  <p className="mt-1 text-xs text-brand-muted">
                    Kode produk dibuat otomatis setelah produk disimpan.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-border bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-brand-text">Gambar Produk</h2>
                <p className="mt-1 text-xs text-brand-muted">
                  Unggah beberapa foto produk. Pilih satu sebagai foto utama untuk kartu produk.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:bg-brand-primary/80">
                <Upload className="size-4" />
                Upload Foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {imageItems.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {imageItems.map((item, index) => {
                  const isPrimary = item.key === primaryKey;
                  return (
                    <div
                      key={item.key}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                        isPrimary ? "border-brand-primary ring-2 ring-brand-primary/15" : "border-brand-border"
                      }`}
                    >
                      <div
                        className="relative aspect-square bg-cover bg-center"
                        style={{ backgroundImage: `url("${item.url}")` }}
                      >
                        <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-brand-primary shadow-sm">
                          Foto {index + 1}
                        </div>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryKey(item.key)}
                          className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${
                            isPrimary
                              ? "bg-brand-primary text-white"
                              : "bg-brand-bg text-brand-primary hover:bg-brand-primary hover:text-white"
                          }`}
                        >
                          <Star className="size-3.5" />
                          {isPrimary ? "Foto Utama" : "Jadikan Utama"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(item.key)}
                          className="inline-flex items-center justify-center rounded-xl bg-danger/10 px-3 py-2 text-danger hover:bg-danger hover:text-white"
                          aria-label="Hapus foto produk"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-border bg-brand-bg p-6 text-center">
                <ImagePlus className="size-10 text-brand-primary/50" />
                <p className="mt-2 text-sm font-bold text-brand-text">Belum ada foto produk</p>
                <p className="mt-1 text-xs text-brand-muted">
                  Produk tanpa foto akan memakai placeholder lokal di halaman publik.
                </p>
              </div>
            )}

            <p className="mt-3 text-xs text-brand-muted">
              Format: JPG, PNG, atau WebP. Ukuran maksimal 5 MB per foto.
            </p>
          </section>

          <section className="rounded-2xl border border-brand-border bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-brand-text">Deskripsi Produk</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-text">
                  Deskripsi <span className="text-danger">*</span>
                </label>
                <textarea
                  name="description"
                  defaultValue={product?.description}
                  required
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-text">Informasi Garansi</label>
                <input
                  name="warrantyInfo"
                  defaultValue={product?.warrantyInfo ?? ""}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  placeholder="Contoh: Garansi toko 1 tahun"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-text">Spesifikasi Produk</label>
                <textarea
                  name="specifications"
                  defaultValue={formatSpecifications(product?.specifications)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 font-mono text-xs outline-none focus:border-brand-primary"
                  placeholder={'Contoh:\\nProcessor: Intel Core i5\\nRAM: 16 GB\\nStorage: 512 GB SSD'}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-brand-border bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-brand-text">Pengaturan Harga</h2>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {(["ONE_PRICE", "MANUAL_DUAL_PRICE", "MARGIN_BASED"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPricingMode(mode)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold text-center transition ${
                    pricingMode === mode
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-brand-border bg-white text-brand-muted hover:border-brand-primary"
                  }`}
                >
                  {mode === "ONE_PRICE" ? "Satu Harga" : mode === "MANUAL_DUAL_PRICE" ? "Beda Harga" : "Gunakan Margin"}
                </button>
              ))}
            </div>
            <p className="mb-3 text-xs text-brand-muted">
              {pricingMode === "ONE_PRICE"
                ? "Gunakan harga yang sama untuk pelanggan umum dan ritel."
                : pricingMode === "MANUAL_DUAL_PRICE"
                  ? "Masukkan harga publik dan harga ritel secara manual."
                  : "Hitung harga jual berdasarkan harga modal dan margin."}
            </p>
            <div className="space-y-3">
              {pricingMode === "ONE_PRICE" ? (
                <div>
                  <label className="block text-xs font-semibold text-brand-text">Harga Jual *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatPrice(String(hargaJual))}
                    onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setHargaJual(raw); }}
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                    placeholder="0"
                  />
                </div>
              ) : null}
              {pricingMode === "MANUAL_DUAL_PRICE" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-brand-text">Harga Publik *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatPrice(String(hargaPublik))}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setHargaPublik(raw); }}
                      className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-text">Harga Ritel *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatPrice(String(hargaRitel))}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setHargaRitel(raw); }}
                      className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      placeholder="0"
                    />
                    {hr > 0 && hr > hp ? (
                      <p className="mt-1 text-xs text-warning">Harga ritel lebih tinggi dari harga publik.</p>
                    ) : null}
                  </div>
                </>
              ) : null}
              {pricingMode === "MARGIN_BASED" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-brand-text">Harga Modal *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatPrice(String(hargaBarang))}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setHargaBarang(raw); }}
                      className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-text">Margin Publik *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatPrice(String(marginPublic))}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setMarginPublic(raw); }}
                      className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-text">Margin Ritel *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatPrice(String(marginRitel))}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setMarginRitel(raw); }}
                      className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      placeholder="0"
                    />
                  </div>
                </>
              ) : null}
              <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-3">
                <p className="text-[10px] font-semibold text-brand-muted">
                  {pricingMode === "ONE_PRICE" ? "Harga Jual" : "Harga Publik"}
                </p>
                <p className="text-lg font-black text-brand-accent">Rp {formatIndonesianNumber(previewPublic)}</p>
              </div>
              <div className="rounded-xl border border-brand-secondary/20 bg-brand-secondary/5 p-3">
                <p className="text-[10px] font-semibold text-brand-muted">
                  {pricingMode === "ONE_PRICE" ? "Harga Jual" : "Harga Ritel"}
                </p>
                <p className="text-lg font-black text-brand-secondary">Rp {formatIndonesianNumber(previewRitel)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-brand-border bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-brand-text">Stok &amp; Status</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-brand-text">Stok</label>
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  defaultValue={product?.stockQuantity ?? 0}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text">Status Stok</label>
                <select
                  name="stockStatus"
                  defaultValue={product?.stockStatus ?? "READY"}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                >
                  {stockOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text">Status Produk</label>
                <select
                  name="status"
                  defaultValue={product?.status ?? "DRAFT"}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-lg">
        <Link
          href="/admin/products"
          className="rounded-xl border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-brand-bg"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : "Simpan Produk"}
        </button>
      </div>

      {state.success && state.message ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/20">
              <svg className="size-7 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-brand-text">Produk berhasil disimpan</h3>
            <p className="mt-2 text-sm text-brand-muted">Mengalihkan ke daftar produk...</p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
