"use client";

import { useCallback, useState } from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

type Props = {
  enabled: boolean;
  flagId: string | null;
};

export function MaintenanceToggle({ enabled, flagId }: Props) {
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
        body: JSON.stringify({
          flagKey: "enable_maintenance_mode",
          enabled: checked,
          flagId,
        }),
      });

      if (!res.ok) throw new Error("Failed to toggle maintenance mode");
      setCurrent(checked);
    } catch {
      setError("Toggle failed");
      setCurrent((prev) => !prev);
    } finally {
      setLoading(false);
    }
  }, [flagId]);

  return (
    <div>
      <div className={loading ? "pointer-events-none opacity-50" : ""}>
        <ToggleSwitch
          name="maintenance_mode"
          label={current ? "Mode Maintenance Aktif" : "Mode Maintenance Nonaktif"}
          description={current ? "Situs akan menampilkan halaman maintenance" : "Situs berjalan normal"}
          defaultChecked={current}
          onChange={handleToggle}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
