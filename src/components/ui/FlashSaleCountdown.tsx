"use client";

import { useEffect, useMemo, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function calc(end: Date, now: number) {
  const diff = end.getTime() - now;
  if (diff <= 0) return { h: 0, m: 0, s: 0 };
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
  };
}

export default function FlashSaleCountdown({
  endsAt,
  initialNow,
}: {
  endsAt: string;
  initialNow: number;
}) {
  const target = useMemo(() => new Date(endsAt), [endsAt]);
  const [t, setT] = useState(() => calc(target, initialNow));

  useEffect(() => {
    const update = () => setT(calc(target, Date.now()));
    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="flex items-center gap-1">
      {[t.h, t.m, t.s].map((v, i) => (
        <span key={i} className="contents">
          <span className="rounded bg-[#6E1A37] px-1.5 py-0.5 font-mono text-xs font-black text-white shadow-sm">
            {pad(v)}
          </span>
          {i < 2 ? <span className="text-xs font-bold text-gray-400">:</span> : null}
        </span>
      ))}
    </div>
  );
}
