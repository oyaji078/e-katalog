"use client";

import { useMemo, useState } from "react";

import { FeatureFlagToggle } from "./FeatureFlagToggle";

export type FeatureFlagView = {
  key: string;
  name: string;
  description: string;
  group: string;
  enabled: boolean;
  flagId: string | null;
  critical?: boolean;
};

const GROUPS = [
  "All",
  "Public Catalog",
  "Product",
  "Promo/Voucher",
  "Retail",
  "WhatsApp",
  "Reports",
  "Admin",
  "Super Admin",
  "System",
];

export default function FeatureFlagsClient({ flags }: { flags: FeatureFlagView[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");

  const filteredFlags = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return flags.filter((flag) => {
      const groupMatches = group === "All" || flag.group === group;
      const queryMatches =
        !normalizedQuery ||
        flag.key.toLowerCase().includes(normalizedQuery) ||
        flag.name.toLowerCase().includes(normalizedQuery) ||
        flag.description.toLowerCase().includes(normalizedQuery);
      return groupMatches && queryMatches;
    });
  }, [flags, group, query]);

  const groupedFlags = GROUPS.filter((item) => item !== "All")
    .map((item) => ({
      group: item,
      flags: filteredFlags.filter((flag) => flag.group === item),
    }))
    .filter((item) => item.flags.length > 0);

  return (
    <main>
      <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">Feature Flags</h1>
        <p className="mt-1 text-sm text-[#5B6472]">
          Kelola fitur katalog, ritel, WhatsApp, laporan, admin, dan sistem.
        </p>
      </div>

      <div className="mb-5 grid gap-3 rounded-lg border border-[#D7DEE8] bg-white p-4 text-[#111827] shadow-sm md:grid-cols-[1fr_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari fitur..."
          className="rounded-xl border border-[#D7DEE8] bg-white px-3 py-2 text-sm text-[#111827] outline-none placeholder:text-[#6B7280] focus:border-[#0D0B61]"
        />
        <select
          value={group}
          onChange={(event) => setGroup(event.target.value)}
          className="rounded-xl border border-[#D7DEE8] bg-white px-3 py-2 text-sm font-semibold text-[#111827] outline-none focus:border-[#0D0B61]"
        >
          {GROUPS.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "Semua kategori" : item}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-5">
        {groupedFlags.map((section) => (
          <section key={section.group}>
            <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-[#5B6472]">
              {section.group}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {section.flags.map((flag) => (
                <article
                  key={flag.key}
                  className="rounded-lg border border-[#D7DEE8] bg-white p-4 text-[#111827] shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-[#111827]">{flag.name}</h3>
                        {flag.critical ? (
                          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
                            Kritis
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 break-all font-mono text-[11px] text-[#5B6472]">{flag.key}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        flag.enabled ? "bg-success/20 text-success" : "bg-[#EEF4F7] text-[#5B6472]"
                      }`}
                    >
                      {flag.enabled ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="mt-3 min-h-10 text-xs leading-5 text-[#5B6472]">
                    {flag.description}
                  </p>
                  <div className="mt-3 border-t border-[#D7DEE8] pt-3">
                    <FeatureFlagToggle
                      flagKey={flag.key}
                      name={flag.name}
                      enabled={flag.enabled}
                      flagId={flag.flagId}
                      critical={flag.critical}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {groupedFlags.length === 0 ? (
        <div className="rounded-lg border border-[#D7DEE8] bg-white p-8 text-center text-sm text-[#5B6472]">
          Tidak ada fitur yang cocok dengan filter.
        </div>
      ) : null}
    </main>
  );
}
