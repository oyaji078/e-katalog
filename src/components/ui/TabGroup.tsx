"use client";

import { useState, type ReactNode } from "react";

export default function TabGroup({
  tabs,
  children,
}: {
  tabs: string[];
  children: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const childArray = Array.isArray(children) ? children : [children];

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-[var(--color-border)]">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(i)}
            className={`-mb-px rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              active === i
                ? "border border-b-white border-[var(--color-border)] bg-white text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        {childArray[active]}
      </div>
    </div>
  );
}
