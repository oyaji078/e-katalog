import Link from "next/link";

type CategoryDropdownProps = {
  categories: Array<{
    label: string;
    value: string;
  }>;
  value: string;
  onChange: (value: string) => void;
};

export default function CategoryDropdown({
  categories,
  value,
  onChange,
}: CategoryDropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={() => {
          // In a real implementation, this would toggle a dropdown menu
          alert("Category dropdown would open in a real implementation");
        }}
        className="flex items-center gap-2 rounded-xl border border-brand-primary px-3 py-2 text-sm font-semibold text-brand-primary"
      >
        <svg className="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <span>{categories.find(cat => cat.value === value)?.label || "Semua Kategori"}</span>
      </button>
      {/* In a real implementation, this would be a dropdown menu that appears on click */}
      <div className="absolute left-0 mt-2 w-56 rounded-md border border-brand-border bg-white shadow-lg z-20">
        {categories.map((category) => (
          <Link
            key={category.value}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onChange(category.value);
            }}
            className={`block w-full px-4 py-2 text-sm ${value === category.value ? "bg-brand-primary/10 text-brand-primary" : "text-brand-muted hover:bg-white/50"}`}
          >
            {category.label}
          </Link>
        ))}
      </div>
    </div>
  );
}