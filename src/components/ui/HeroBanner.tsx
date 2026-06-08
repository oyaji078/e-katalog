import Image from "next/image";

const GRID_OVERLAY = {
  position: "absolute" as const,
  inset: 0,
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
  backgroundSize: "32px 32px",
  pointerEvents: "none" as const,
};

export default function HeroBanner({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <div
      className="relative flex min-h-[58svh] w-full items-end overflow-hidden sm:min-h-[68svh] lg:min-h-[78svh]"
      style={{ background: "var(--color-brand-hero)" }}
    >
      {/* Background image */}
      {image && (
        <Image
          priority
          fill
          sizes="100vw"
          src={image}
          alt={title}
          className="object-cover"
          style={{ opacity: 0.74 }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: image
            ? "linear-gradient(135deg, rgba(10,14,26,0.78) 0%, rgba(10,14,26,0.48) 52%, rgba(10,14,26,0.22) 100%)"
            : "linear-gradient(to top, #0A0E1A 0%, rgba(10,14,26,0.6) 55%, transparent 100%)",
        }}
      />

      {/* Texture fallback when no image is configured. */}
      {!image && <div style={GRID_OVERLAY} />}

      {/* Content */}
      <div className="relative z-10 max-w-3xl px-6 pb-12 pt-8 sm:px-12 sm:pb-16 lg:px-16 lg:pb-20">
        {subtitle && (
          <span
            className="mb-3 inline-block rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.7)" }}
          >
            {subtitle}
          </span>
        )}
        <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-5xl">
          {title}
        </h1>
      </div>
    </div>
  );
}

/**
 * Fallback hero banner when no active banner is available from DB
 */
export function HeroBannerFallback() {
  return (
    <HeroBanner
      title="Selamat datang di Rama Computer"
      subtitle="Katalog Digital"
    />
  );
}
