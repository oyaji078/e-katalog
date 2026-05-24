"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { formatIndonesianNumber, parseIndonesianNumber } from "@/lib/currency";
import { createProductAction, type ProductFormState, updateProductAction } from "./actions";

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
    isRecommended: boolean;
    isFeatured: boolean;
    categoryId: string;
    brandId: string;
    specifications: unknown;
  };
};

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

export default function ProductFormClient({ mode, categories, brands, product }: ProductFormClientProps) {
  const router = useRouter();
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.primaryImageUrl ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [useLink, setUseLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState(product?.primaryImageUrl ?? "");

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
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setRemoveImage(false);
      setUseLink(false);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setPreviewUrl(null);
    setRemoveImage(true);
    setUseLink(false);
    setLinkUrl("");
  }, []);

  const formatPrice = useCallback((val: string) => {
    if (!val) return "";
    return formatIndonesianNumber(val);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    if (imageFile) formData.set("imageFile", imageFile);
    if (useLink && linkUrl) formData.set("primaryImageUrl", linkUrl);
    if (removeImage) formData.set("removeImage", "1");
    formData.set("hargaBarang", String(hb));
    formData.set("marginPublic", String(mp));
    formData.set("marginRitel", String(mr));

    formAction(formData);
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
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

      {/* 2-column layout */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Informasi Produk */}
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
              <div>
                <label className="block text-sm font-semibold text-text-dark">
                  Deskripsi Produk <span className="text-danger">*</span>
                </label>
                <textarea
                  name="description"
                  defaultValue={product?.description}
                  required
                  rows={3}
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
              {product ? (
                <div>
                  <label className="block text-sm font-semibold text-text-dark">SKU</label>
                  <p className="mt-1 font-mono text-sm text-text-muted">{product.sku}</p>
                </div>
              ) : null}
            </div>
          </section>

          {/* Deskripsi */}
          <section className="rounded-2xl border border-border-gray bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-text-dark">Gambar Produk</h2>
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border-gray bg-soft-bg">
                {previewUrl && !removeImage ? (
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" sizes="8rem" />
                ) : (
                  <span className="text-center text-[10px] text-text-muted">
                    <svg className="mx-auto mb-1 size-8 text-border-gray" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    Preview
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-maroon px-4 py-2 text-xs font-bold text-white hover:bg-primary-maroon/80">
                  Pilih Gambar
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                </label>
                {previewUrl && !removeImage ? (
                  <button type="button" onClick={handleRemoveImage} className="block text-xs font-semibold text-danger hover:underline">
                    Hapus Gambar
                  </button>
                ) : null}
                <label className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <input type="checkbox" checked={useLink} onChange={(e) => setUseLink(e.target.checked)} />
                  Gunakan Link Gambar
                </label>
                {useLink ? (
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="/uploads/products/contoh.webp"
                    className="w-full rounded-xl border border-border-gray bg-soft-bg px-3 py-2 text-sm outline-none focus:border-primary-maroon"
                  />
                ) : null}
                {useLink ? <input type="hidden" name="primaryImageUrl" value={linkUrl} /> : null}
              </div>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Harga & Margin */}
          <section className="rounded-2xl border border-border-gray bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-text-dark">Harga &amp; Margin</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-dark">Harga Barang *</label>
                <input
                  type="text" inputMode="numeric"
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
                  type="text" inputMode="numeric"
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
                  type="text" inputMode="numeric"
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

          {/* Stok & Status */}
          <section className="rounded-2xl border border-border-gray bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-text-dark">Stok &amp; Status</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-dark">Stok</label>
                <input
                  name="stockQuantity" type="number" min="0"
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

          {/* Penempatan Produk */}
          <section className="rounded-2xl border border-border-gray bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-text-dark">Penempatan Produk</h2>
            <div className="space-y-2">
              <ToggleSwitch
                name="isRecommended"
                label="Prioritaskan di Rekomendasi"
                description="Produk akan diutamakan tampil di bagian Rekomendasi Produk pada halaman utama."
                defaultChecked={product?.isRecommended}
              />
              <ToggleSwitch
                name="isFeatured"
                label="Jadikan Produk Unggulan"
                description="Produk Unggulan akan tampil di bagian Produk Unggulan dengan badge 'Unggulan'."
                defaultChecked={product?.isFeatured}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Submit */}
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

      {/* Success toast */}
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

