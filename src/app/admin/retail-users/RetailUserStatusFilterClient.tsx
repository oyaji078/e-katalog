"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  value: string;
  options: Array<{ value: string; label: string }>;
};

export default function RetailUserStatusFilterClient({ value, options }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleStatusChange(nextStatus: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextStatus) {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <select
      name="status"
      value={value}
      onChange={(event) => handleStatusChange(event.target.value)}
      className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary sm:w-auto"
    >
      <option value="">Semua Status</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
