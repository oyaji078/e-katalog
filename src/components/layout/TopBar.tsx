import Link from "next/link";

export default function TopBar() {
  return (
    <section className="border-b border-border-gray bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-text-muted sm:px-6">
        <div className="flex items-center gap-2">
          <svg
            className="size-4 text-soft-teal"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Garansi toko dan dukungan WhatsApp</span>
        </div>
        <div className="hidden items-center gap-5 sm:flex">
          <span>Promo</span>
          <span>Voucher</span>
          <Link href="/login" className="font-semibold text-primary-maroon">
            Retail Login
          </Link>
        </div>
      </div>
    </section>
  );
}