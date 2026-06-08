"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

type Props = {
  flagKey: string;
  name: string;
  enabled: boolean;
  flagId: string | null;
  critical?: boolean;
};

export function FeatureFlagToggle({ flagKey, name, enabled, flagId, critical = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const handleToggle = useCallback(async (checked: boolean) => {
    if (critical) {
      const confirmed = window.confirm(
        `Ubah fitur kritis "${name}" menjadi ${checked ? "aktif" : "nonaktif"}?`,
      );
      if (!confirmed) {
        setResetKey((value) => value + 1);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/feature-flags/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagKey, enabled: checked, flagId }),
      });

      if (!res.ok) throw new Error("Failed to toggle");
      setCurrent(checked);
      router.refresh();
    } catch {
      setError("Toggle failed");
      setCurrent(current);
      setResetKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  }, [critical, current, flagKey, flagId, name, router]);

  return (
    <div>
      <div className={loading ? "pointer-events-none opacity-50" : ""}>
        <ToggleSwitch
          key={`${flagKey}-${current}-${resetKey}`}
          name={`flag_${flagKey}`}
          label={current ? "Aktif" : "Nonaktif"}
          defaultChecked={current}
          onChange={handleToggle}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
