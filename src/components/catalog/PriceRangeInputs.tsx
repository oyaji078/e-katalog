"use client";

import { useMemo, useState } from "react";

import { formatIDRInput, parseIDRInput } from "@/lib/currency";

type PriceRangeInputsProps = {
  minValue: string;
  maxValue: string;
};

function normalize(value: string) {
  const parsed = parseIDRInput(value);
  return parsed === null ? "" : String(parsed);
}

export default function PriceRangeInputs({ minValue, maxValue }: PriceRangeInputsProps) {
  const initialMin = useMemo(() => formatIDRInput(minValue), [minValue]);
  const initialMax = useMemo(() => formatIDRInput(maxValue), [maxValue]);
  const [minDisplay, setMinDisplay] = useState(initialMin);
  const [maxDisplay, setMaxDisplay] = useState(initialMax);

  return (
    <fieldset className="block text-sm font-black text-brand-text">
      <legend className="mb-2">Rentang Harga</legend>
      <div className="flex items-center gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Harga minimum</span>
          <input type="hidden" name="priceMin" value={normalize(minDisplay)} />
          <input
            inputMode="numeric"
            value={minDisplay}
            placeholder="Min"
            onChange={(event) => setMinDisplay(formatIDRInput(event.target.value))}
            onBlur={() => setMinDisplay(formatIDRInput(minDisplay))}
            className="w-full border border-brand-border bg-brand-soft-white px-3 py-2 text-sm font-semibold text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-accent"
          />
        </label>
        <span className="text-xs text-brand-muted">-</span>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Harga maksimum</span>
          <input type="hidden" name="priceMax" value={normalize(maxDisplay)} />
          <input
            inputMode="numeric"
            value={maxDisplay}
            placeholder="Max"
            onChange={(event) => setMaxDisplay(formatIDRInput(event.target.value))}
            onBlur={() => setMaxDisplay(formatIDRInput(maxDisplay))}
            className="w-full border border-brand-border bg-brand-soft-white px-3 py-2 text-sm font-semibold text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-accent"
          />
        </label>
      </div>
    </fieldset>
  );
}
