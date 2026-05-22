"use client";

import { useCallback, useState } from "react";

type Props = {
  flagKey: string;
  enabled: boolean;
  flagId: string | null;
};

export function FeatureFlagToggle({ flagKey, enabled, flagId }: Props) {
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
        body: JSON.stringify({ flagKey, enabled: !current, flagId }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle");
      }

      setCurrent((prev) => !prev);
    } catch {
      setError("Toggle failed");
    } finally {
      setLoading(false);
    }
  }, [flagKey, current, flagId]);

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`rounded-md px-3 py-1.5 text-xs font-bold text-white transition ${
          current
            ? "bg-danger hover:bg-danger/80"
            : "bg-success hover:bg-success/80"
        } disabled:opacity-50`}
      >
        {loading ? "..." : current ? "Disable" : "Enable"}
      </button>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
