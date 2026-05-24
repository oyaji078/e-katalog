"use client";

import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useCallback, useEffect, useRef, useState } from "react";

import { formatIndonesianNumber, parseIndonesianNumber } from "@/lib/currency";
import { createProductAction, type ProductFormState, updateProductAction } from "./actions";

type ProductImageRecord = {
  id?: string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
};

type ProductFormClientProps = {
  mode: "create" | "edit";
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    sku: string;
    description: string;
    warrantyInfo: string | null;
    primaryImageUrl: string | null;
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
  const router = useRouter();
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [imageItems, setImageItems] = useState<ImageItem[]>(() => initialImageItems(product));
  const [primaryKey, setPrimaryKey] = useState(() => {
    const items = initialImageItems(product);
    return initialPrimaryKey(product, items);
  });
  const objectUrls = useRef<string[]>([]);

  const [validationError, setValidationError] = useState("");

  const [hargaBarang, setHargaBarang] = useState(product?.costPrice ?? "");
  const [marginPublic, setMarginPublic] = useState(product?.publicMarginValue ?? "");
  const [marginRitel, setMarginRitel] = useState(product?.retailMarginValue ?? "");

  const hb = parseIndonesianNumber(String(hargaBarang));
  const mp = parseIndonesianNumber(String(marginPublic));
  const mr = parseIndonesianNumber(String(marginRitel));
  const previewPublic = hb + mp;
  const previewRitel = hb + mr;

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      for (const url of objectUrls.current) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    if (state.success && state.message) {
      const timer = setTimeout(() => {
        router.push("/admin/products");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.message, router]);

  const handlePriceInput = useCallback((setter: (v: string) => void) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, "");
      setter(raw);
    };
  }, []);

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
    formData.set("hargaBarang", String(hb));
    formData.set("marginPublic", String(mp));
    formData.set("marginRitel", String(mr));

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
          <section className="rounded-2xl border border-border-gray bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-text-dark">Informasi Produk</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-dark">
                  Nama Produk <span className="text-danger">*</span>
                </label>
                <input
                  name="name"
                  defaultValue={product?.name}
                  required
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-text-dark">
                    Kategori <span className="text-danger">*</span>
                  </label>
                  <select
                    name="categoryId"
                    defaultValue={product?.categoryId}
                    required
                    className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-dark">
                    Merek <span className="text-danger">*</span>
                  </label>
                  <select
                    name="brandId"
                    defaultValue={product?.brandId}
                    required
                    className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                  >
                    <option value="">Pilih Merek</option>
                    {brands.map((brd) => (
                      <option key={brd.id} value={brd.id}>{brd.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {product ? (
                <div>
                  <label className="block text-sm font-semibold text-text-dark">SKU</label>
                  <p className="mt-1 font-mono text-sm text-text-muted">{product.sku}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border-gray bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-text-dark">Gambar Produk</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Unggah beberapa foto produk. Pilih satu sebagai foto utama untuk kartu produk.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-maroon px-4 py-2 text-xs font-bold text-white hover:bg-primary-maroon/80">
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
                        isPrimary ? "border-primary-maroon ring-2 ring-primary-maroon/15" : "border-border-gray"
                      }`}
                    >
                      <div
                        className="relative aspect-square bg-cover bg-center"
                        style={{ backgroundImage: `url("${item.url}")` }}
                      >
                        <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-primary-maroon shadow-sm">
                          Foto {index + 1}
                        </div>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryKey(item.key)}
                          className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${
                            isPrimary
                              ? "bg-primary-maroon text-white"
                              : "bg-soft-bg text-primary-maroon hover:bg-primary-maroon hover:text-white"
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
              <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-gray bg-soft-bg p-6 text-center">
                <ImagePlus className="size-10 text-primary-maroon/50" />
                <p className="mt-2 text-sm font-bold text-text-dark">Belum ada foto produk</p>
                <p className="mt-1 text-xs text-text-muted">
                  Produk tanpa foto akan memakai placeholder lokal di halaman publik.
                </p>
              </div>
            )}

            <p className="mt-3 text-xs text-text-muted">
              Format: JPG, PNG, atau WebP. Ukuran maksimal 5 MB per foto.
            </p>
          </section>

          <section className="rounded-2xl border border-border-gray bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-text-dark">Deskripsi Produk</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-dark">
                  Deskripsi <span className="text-danger">*</span>
                </label>
                <textarea
                  name="description"
                  defaultValue={product?.description}
                  required
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-dark">Informasi Garansi</label>
                <input
                  name="warrantyInfo"
                  defaultValue={product?.warrantyInfo ?? ""}
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                  placeholder="Contoh: Garansi toko 1 tahun"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-dark">Spesifikasi Produk</label>
                <textarea
                  name="specifications"
                  defaultValue={formatSpecifications(product?.specifications)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 font-mono text-xs outline-none focus:border-primary-maroon"
                  placeholder={'Contoh:\\nProcessor: Intel Core i5\\nRAM: 16 GB\\nStorage: 512 GB SSD'}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border-gray bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-text-dark">Harga &amp; Margin</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-dark">Harga Barang *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatPrice(String(hargaBarang))}
                  onChange={handlePriceInput(setHargaBarang)}
                  onFocus={(e) => { const raw = e.target.value.replace(/\./g, ""); setHargaBarang(raw); }}
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-dark">Margin Publik *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatPrice(String(marginPublic))}
                  onChange={handlePriceInput(setMarginPublic)}
                  onFocus={(e) => { const raw = e.target.value.replace(/\./g, ""); setMarginPublic(raw); }}
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-dark">Margin Ritel *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatPrice(String(marginRitel))}
                  onChange={handlePriceInput(setMarginRitel)}
                  onFocus={(e) => { const raw = e.target.value.replace(/\./g, ""); setMarginRitel(raw); }}
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                  placeholder="0"
                />
              </div>
              <div className="rounded-xl border border-accent-rose/20 bg-accent-rose/5 p-3">
                <p className="text-[10px] font-semibold text-text-muted">Estimasi Harga Jual Publik</p>
                <p className="text-lg font-black text-accent-rose">Rp {formatIndonesianNumber(previewPublic)}</p>
              </div>
              <div className="rounded-xl border border-soft-teal/20 bg-soft-teal/5 p-3">
                <p className="text-[10px] font-semibold text-text-muted">Estimasi Harga Jual Ritel</p>
                <p className="text-lg font-black text-soft-teal">Rp {formatIndonesianNumber(previewRitel)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border-gray bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-text-dark">Stok &amp; Status</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-dark">Stok</label>
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  defaultValue={product?.stockQuantity ?? 0}
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-dark">Status Stok</label>
                <select
                  name="stockStatus"
                  defaultValue={product?.stockStatus ?? "READY"}
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
                >
                  {stockOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-dark">Status Produk</label>
                <select
                  name="status"
                  defaultValue={product?.status ?? "DRAFT"}
                  className="mt-1 w-full rounded-xl border border-border-gray bg-soft-bg px-4 py-2.5 text-sm outline-none focus:border-primary-maroon"
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

      <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-2xl border border-border-gray bg-white p-4 shadow-lg">
        <Link
          href="/admin/products"
          className="rounded-xl border border-border-gray px-5 py-2.5 text-sm font-semibold text-text-muted hover:bg-soft-bg"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-primary-maroon px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
            <h3 className="text-lg font-bold text-text-dark">Produk berhasil disimpan</h3>
            <p className="mt-2 text-sm text-text-muted">Mengalihkan ke daftar produk...</p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
