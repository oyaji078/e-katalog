"use client";

import { useCallback, useState } from "react";

type Props = {
  enabled: boolean;
  flagId: string | null;
};

export function MaintenanceToggle({ enabled, flagId }: Props) {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/feature-flags/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flagKey: "enable_maintenance_mode",
          enabled: !current,
          flagId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle maintenance mode");
      }

      setCurrent((prev) => !prev);
    } catch {
      setError("Toggle failed");
    } finally {
      setLoading(false);
    }
  }, [current, flagId]);

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`rounded-md px-4 py-2 text-sm font-bold text-white transition ${
          current
            ? "bg-success hover:bg-success/80"
            : "bg-danger hover:bg-danger/80"
        } disabled:opacity-50`}
      >
        {loading ? "Processing..." : current ? "Disable Maintenance" : "Enable Maintenance"}
      </button>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
