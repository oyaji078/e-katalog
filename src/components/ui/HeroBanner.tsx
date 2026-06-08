import Image from "next/image";

const GRID_OVERLAY = {
  position: "absolute" as const,
  inset: 0,
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
  backgroundSize: "32px 32px",
  pointerEvents: "none" as const,
};

const GLOW_OVERLAY = {
  position: "absolute" as const,
  top: -100,
  right: -100,
  width: 400,
  height: 400,
  background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
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
      className="relative flex min-h-[300px] w-full items-end overflow-hidden sm:min-h-[420px]"
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
          style={{ opacity: 0.45 }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: image
            ? "linear-gradient(135deg, rgba(10,14,26,0.95) 0%, rgba(10,14,26,0.7) 50%, rgba(10,14,26,0.4) 100%)"
            : "linear-gradient(to top, #0A0E1A 0%, rgba(10,14,26,0.6) 55%, transparent 100%)",
        }}
      />

      {/* Texture + glow (fallback aesthetic, harmless over image too) */}
      {!image && <div style={GRID_OVERLAY} />}
      <div style={GLOW_OVERLAY} />

      {/* Content */}
      <div className="relative z-10 max-w-2xl px-8 pb-10 pt-8 sm:px-12 lg:px-16">
        {subtitle && (
          <span
            className="mb-3 inline-block rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.7)" }}
          >
            {subtitle}
          </span>
        )}
        <h1
          className="text-white"
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
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
