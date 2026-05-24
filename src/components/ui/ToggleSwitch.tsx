"use client";

import { useState } from "react";

type ToggleSwitchProps = {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  /** Value submitted when checked (default "true" for boolean checkboxes) */
  onValue?: string;
  /** Value submitted when unchecked (requires onValue to be set) */
  offValue?: string;
  onChange?: (checked: boolean) => void;
};

export default function ToggleSwitch({
  name,
  label,
  description,
  defaultChecked = false,
  onValue,
  offValue,
  onChange,
}: ToggleSwitchProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
    onChange?.(e.target.checked);
  };

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-gray bg-soft-bg px-4 py-3 transition hover:border-primary-maroon/30">
      <div className="relative mt-0.5 flex-shrink-0">
        {onValue !== undefined && offValue !== undefined ? (
          <input type="hidden" name={name} value={checked ? onValue : offValue} />
        ) : null}
        <input
          type="checkbox"
          name={onValue !== undefined ? undefined : name}
          value={onValue ?? "true"}
          checked={checked}
          onChange={handleChange}
          className="peer sr-only"
        />
        <div className="h-5 w-9 rounded-full bg-border-gray after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-maroon peer-checked:after:translate-x-full" />
      </div>
      <div>
        <p className="text-xs font-semibold text-text-dark">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[10px] leading-relaxed text-text-muted">{description}</p>
        ) : null}
      </div>
    </label>
  );
}
