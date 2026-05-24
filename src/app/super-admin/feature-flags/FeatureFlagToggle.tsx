"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

type Props = {
  flagKey: string;
  enabled: boolean;
  flagId: string | null;
};

export function FeatureFlagToggle({ flagKey, enabled, flagId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = useCallback(async (checked: boolean) => {
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
      setCurrent((prev) => !prev);
    } finally {
      setLoading(false);
    }
  }, [flagKey, flagId, router]);

  return (
    <div>
      <div className={loading ? "pointer-events-none opacity-50" : ""}>
        <ToggleSwitch
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
