import Image from "next/image";

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
    <section className="rounded-2xl bg-primary-maroon p-6 text-white shadow-sm">
      {image && (
        <div className="mb-4">
          <Image
            src={image}
            alt={title}
            className="w-full h-48 object-cover rounded-lg"
            width={1200}
            height={400}
          />
        </div>
      )}
      <p className="text-sm font-semibold text-white/80">{subtitle}</p>
      <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
        {title}
      </h1>
    </section>
  );
}