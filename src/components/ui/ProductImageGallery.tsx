"use client";

import { Laptop } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
  categoryName: string;
};

export default function ProductImageGallery({
  images,
  productName,
  categoryName,
}: ProductImageGalleryProps) {
  const [activeImage, setActiveImage] = useState(images[0] ?? null);

  return (
    <div className="grid gap-3">
      <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-white shadow-sm">
        <div className="relative aspect-square bg-brand-bg">
          {activeImage ? (
            <Image
              src={activeImage}
              alt={productName}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-primary/10 via-white to-brand-secondary/20">
              <div className="flex flex-col items-center gap-3">
                <Laptop className="size-20 text-brand-primary/50" />
                <span className="rounded-xl bg-white/90 px-4 py-2 text-sm font-black text-brand-primary shadow-sm">
                  {categoryName}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Thumbnail produk">
          {images.map((image, index) => {
            const selected = image === activeImage;
            return (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(image)}
                className={`relative size-20 shrink-0 overflow-hidden rounded-2xl border shadow-sm transition sm:size-24 ${
                  selected
                    ? "border-brand-primary ring-2 ring-brand-primary/20"
                    : "border-brand-border hover:border-brand-primary/40"
                }`}
                aria-label={`Tampilkan foto produk ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${productName} ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
