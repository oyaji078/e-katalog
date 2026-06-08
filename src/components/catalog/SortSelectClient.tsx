"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  value: string;
  promoEnabled?: boolean;
};

export default function SortSelectClient({ value, promoEnabled = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSortChange(nextSort: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSort && nextSort !== "latest") {
      params.set("sort", nextSort);
    } else {
      params.delete("sort");
    }

    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <select
      name="sort"
      value={value}
      onChange={(e) => handleSortChange(e.target.value)}
      className="border border-[#D7DEE8] bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#111827] outline-none transition focus:border-[#E4D329]"
    >
      <option value="latest">Terbaru</option>
      <option value="popular">Populer</option>
      {promoEnabled ? <option value="promo">Promo</option> : null}
    </select>
  );
}
