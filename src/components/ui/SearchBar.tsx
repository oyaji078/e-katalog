export default function SearchBar() {
  return (
    <div className="flex flex-1 items-center rounded-2xl border border-border-gray bg-white px-4 py-3 shadow-sm lg:mx-5">
      <svg
        className="mr-3 size-5 text-text-muted"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <input
        aria-label="Cari produk"
        className="w-full bg-transparent text-sm outline-none"
        placeholder="Cari laptop, monitor, keyboard, printer..."
      />
    </div>
  );
}