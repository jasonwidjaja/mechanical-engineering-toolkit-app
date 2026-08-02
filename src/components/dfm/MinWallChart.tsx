"use client";

/**
 * Minimum Wall Thickness Chart (3D printing processes)
 *
 * This is the ONE place in the DFM hub where a chart beats a table. The
 * guidelines table already lists these numbers, but the reader's actual
 * question — "which process lets me go thinnest?" — is a magnitude comparison,
 * and bar length answers that faster than three strings of text do.
 *
 * Charting choices, and why:
 *   • Horizontal bars, because "SLS / MJF" is a long category name. Horizontal
 *     bars give labels room without rotating them to 45°.
 *   • ONE hue, not three. This is a single measure across three categories, not
 *     three different things — coloring each bar differently would imply an
 *     identity distinction that isn't there.
 *   • No legend. With a single series the title already names what's plotted.
 *   • Bars are direct-labeled, so the exact value is readable without hovering
 *     and without a dense value axis.
 *   • Bar length is the MINIMUM of each process's range (the question is
 *     "minimum achievable"); the full typical range is in the tooltip.
 *
 * "use client" is required — recharts measures the DOM to size itself, so it
 * cannot run as a server component.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MIN_WALL_CHART_DATA } from "@/lib/dfm-data";

// Single sequential hue — Tailwind blue-600, the app's accent.
// Validated for lightness band, chroma, and ≥3:1 contrast against the surface.
const BAR_COLOR = "#2563eb";

/** Tooltip contents. Text uses ink tokens, never the series color. */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: (typeof MIN_WALL_CHART_DATA)[number] }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <div className="font-semibold text-gray-800 mb-0.5">{d.process}</div>
      <div className="text-gray-600">
        Minimum wall: <span className="font-mono font-medium">{d.min} mm</span>
      </div>
      <div className="text-gray-500">
        Typical range: <span className="font-mono">{d.min}–{d.max} mm</span>
      </div>
    </div>
  );
}

export default function MinWallChart() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-0.5">
        Minimum achievable wall thickness
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Thinner is more capable. Bar shows the minimum of each process&apos;s typical
        range — hover for the full range.
      </p>

      {/* Fixed height: ResponsiveContainer needs a sized parent to measure against. */}
      <div style={{ width: "100%", height: 190 }}>
        <ResponsiveContainer>
          <BarChart
            data={MIN_WALL_CHART_DATA}
            layout="vertical"
            margin={{ top: 4, right: 56, bottom: 20, left: 8 }}
            barCategoryGap="28%"
          >
            {/* Recessive grid — value-axis lines only, so bars stay the loudest thing */}
            <CartesianGrid horizontal={false} stroke="#f1f5f9" />

            <XAxis
              type="number"
              domain={[0, 1.3]}
              tickFormatter={v => `${v}`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              label={{
                value: "wall thickness (mm)",
                position: "insideBottom",
                offset: -12,
                style: { fontSize: 11, fill: "#94a3b8" },
              }}
            />
            <YAxis
              type="category"
              dataKey="process"
              tick={{ fontSize: 12, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
              width={78}
            />

            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "#f8fafc" }}
            />

            {/*
              radius rounds only the data end (right); the baseline end stays square.

              isAnimationActive={false} is deliberate. Recharts animates bars
              growing from zero, and until that finishes the bars — and their
              LabelLists — are drawn at partial length. On a static reference
              page there's nothing to gain from the animation, and turning it off
              means the chart is also correct in a screenshot, a print, or a PDF.
            */}
            <Bar
              dataKey="min"
              fill={BAR_COLOR}
              radius={[0, 4, 4, 0]}
              barSize={22}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="min"
                position="right"
                // No type annotation on `v` — let TS infer recharts' own
                // LabelFormatter signature, which allows string | number | undefined.
                formatter={v => (typeof v === "number" ? `${v.toFixed(1)} mm` : "")}
                style={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table view of the same data — chart and table should never disagree,
          and this is what makes the figure accessible without color or hover. */}
      <details className="mt-3">
        <summary className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
          View as table
        </summary>
        <table className="w-full text-xs mt-2">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
              <th className="px-3 py-2 font-semibold">Process</th>
              <th className="px-3 py-2 font-semibold">Minimum wall</th>
              <th className="px-3 py-2 font-semibold">Typical range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MIN_WALL_CHART_DATA.map(d => (
              <tr key={d.process}>
                <td className="px-3 py-2 text-gray-700">{d.process}</td>
                <td className="px-3 py-2 font-mono text-gray-700">{d.min} mm</td>
                <td className="px-3 py-2 font-mono text-gray-500">{d.min}–{d.max} mm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
