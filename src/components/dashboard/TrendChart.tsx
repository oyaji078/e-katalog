"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";

export type TrendChartPoint = {
  label: string;
  visits: number;
  whatsapp: number;
  inquiries: number;
};

type SeriesKey = "visits" | "whatsapp" | "inquiries";

type SeriesConfig = {
  key: SeriesKey;
  label: string;
  color: string;
};

const SERIES: SeriesConfig[] = [
  { key: "visits", label: "Kunjungan", color: "#1A3D6A" },
  { key: "whatsapp", label: "Klik WhatsApp", color: "#16A34A" },
  { key: "inquiries", label: "Inquiry", color: "#C8A91E" },
];

const WIDTH = 720;
const HEIGHT = 280;
const PLOT = {
  left: 42,
  right: 18,
  top: 18,
  bottom: 32,
};

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function buildAreaPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  const last = points[points.length - 1];
  const first = points[0];
  return `${buildLinePath(points)} L ${last.x} ${HEIGHT - PLOT.bottom} L ${first.x} ${
    HEIGHT - PLOT.bottom
  } Z`;
}

export default function TrendChart({ data }: { data: TrendChartPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const values = data.flatMap((point) => [point.visits, point.whatsapp, point.inquiries]);
    const max = Math.max(1, ...values);
    const plotWidth = WIDTH - PLOT.left - PLOT.right;
    const plotHeight = HEIGHT - PLOT.top - PLOT.bottom;
    const lastIndex = Math.max(1, data.length - 1);

    const xFor = (index: number) => PLOT.left + (index / lastIndex) * plotWidth;
    const yFor = (value: number) => PLOT.top + (1 - value / max) * plotHeight;

    const series = SERIES.map((item) => ({
      ...item,
      points: data.map((point, index) => ({
        x: xFor(index),
        y: yFor(point[item.key]),
        value: point[item.key],
      })),
    }));

    const grid = [0, 0.25, 0.5, 0.75, 1].map((step) => {
      const value = Math.round(max * (1 - step));
      return {
        value,
        y: PLOT.top + step * plotHeight,
      };
    });

    return { max, series, grid, xFor };
  }, [data]);

  const hasData = data.some((point) => point.visits || point.whatsapp || point.inquiries);
  const resolvedActiveIndex = activeIndex ?? (data.length > 0 ? data.length - 1 : null);
  const activePoint = resolvedActiveIndex !== null ? data[resolvedActiveIndex] : null;
  const activeX = resolvedActiveIndex !== null ? chart.xFor(resolvedActiveIndex) : null;

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!svgRef.current || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (data.length - 1));
    setActiveIndex(index);
  }

  if (data.length === 0 || !hasData) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-brand-light bg-[rgba(13,11,97,0.05)] text-sm font-semibold text-brand-muted-on-light">
        Belum ada data aktivitas.
      </div>
    );
  }

  const tooltipX = activeX !== null && activeX > WIDTH - 190 ? activeX - 176 : (activeX ?? PLOT.left) + 12;

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap gap-3">
        {SERIES.map((series) => (
          <div key={series.key} className="flex items-center gap-2 text-xs font-bold text-brand-muted-on-light">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label}
          </div>
        ))}
      </div>
      <div className="relative min-w-0 overflow-hidden rounded-lg border border-brand-light bg-white">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-[280px] w-full touch-pan-y"
          role="img"
          aria-label="Tren kunjungan, klik WhatsApp, dan inquiry"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setActiveIndex(null)}
        >
          {chart.grid.map((line) => (
            <g key={line.y}>
              <line
                x1={PLOT.left}
                x2={WIDTH - PLOT.right}
                y1={line.y}
                y2={line.y}
                stroke="#D8DEE8"
                strokeDasharray="4 6"
              />
              <text x={10} y={line.y + 4} fill="#6B7280" fontSize="11" fontWeight="700">
                {formatNumber(line.value)}
              </text>
            </g>
          ))}

          {chart.series.map((series, index) => {
            const path = buildLinePath(series.points);
            const areaPath = index === 0 ? buildAreaPath(series.points) : "";
            return (
              <g key={series.key}>
                {areaPath ? <path d={areaPath} fill="#1A3D6A" opacity="0.08" /> : null}
                {series.points.length > 1 ? (
                  <path d={path} fill="none" stroke={series.color} strokeLinecap="round" strokeWidth="3" />
                ) : null}
                {series.points.map((point, pointIndex) => (
                  <circle
                    key={`${series.key}-${pointIndex}`}
                    cx={point.x}
                    cy={point.y}
                    r={resolvedActiveIndex === pointIndex ? 4 : 2.5}
                    fill="#ffffff"
                    stroke={series.color}
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}

          {data.map((point, index) => {
            if (index !== 0 && index !== data.length - 1 && index % Math.ceil(data.length / 6) !== 0) return null;
            return (
              <text
                key={`${point.label}-${index}`}
                x={chart.xFor(index)}
                y={HEIGHT - 10}
                textAnchor="middle"
                fill="#6B7280"
                fontSize="11"
                fontWeight="700"
              >
                {point.label}
              </text>
            );
          })}

          {activePoint && activeX !== null ? (
            <g>
              <line
                x1={activeX}
                x2={activeX}
                y1={PLOT.top}
                y2={HEIGHT - PLOT.bottom}
                stroke="#102A4C"
                strokeDasharray="4 6"
                opacity="0.45"
              />
              <rect x={tooltipX} y="18" width="164" height="86" rx="8" fill="#102A4C" opacity="0.96" />
              <text x={tooltipX + 12} y="39" fill="#ffffff" fontSize="12" fontWeight="800">
                {activePoint.label}
              </text>
              <text x={tooltipX + 12} y="59" fill="#EAF1F8" fontSize="11" fontWeight="700">
                Kunjungan: {formatNumber(activePoint.visits)}
              </text>
              <text x={tooltipX + 12} y="77" fill="#EAF1F8" fontSize="11" fontWeight="700">
                WhatsApp: {formatNumber(activePoint.whatsapp)}
              </text>
              <text x={tooltipX + 12} y="95" fill="#EAF1F8" fontSize="11" fontWeight="700">
                Inquiry: {formatNumber(activePoint.inquiries)}
              </text>
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
