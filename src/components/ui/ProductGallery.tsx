"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mainImage = images[activeIndex] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={productName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-4"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[var(--color-page)]">
            <ImageIcon className="size-20 text-[var(--color-border-strong)]" strokeWidth={1.2} />
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                activeIndex === i
                  ? "border-[var(--color-accent)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
              }`}
              aria-label={`Tampilkan foto produk ${i + 1}`}
            >
              <Image
                src={img}
                alt={`${productName} ${i + 1}`}
                fill
                sizes="20vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
