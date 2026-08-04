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
const BAR_COLOR = "#2B4C7E";

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
    <div className="bg-white border border-panel-gray rounded-lg px-3 py-2 text-xs">
      <div className="font-semibold text-graphite mb-0.5">{d.process}</div>
      <div className="text-graphite/70">
        Minimum wall: <span className="font-mono font-medium">{d.min} mm</span>
      </div>
      <div className="text-graphite/60">
        Typical range: <span className="font-mono">{d.min}–{d.max} mm</span>
      </div>
    </div>
  );
}

export default function MinWallChart() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-graphite mb-0.5">
        Minimum achievable wall thickness
      </h3>
      <p className="text-xs text-graphite/60 mb-4">
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
            <CartesianGrid horizontal={false} stroke="#F5F6F7" />

            <XAxis
              type="number"
              domain={[0, 1.3]}
              tickFormatter={v => `${v}`}
              tick={{ fontSize: 11, fill: "#98999B" }}
              axisLine={{ stroke: "#E7EAEC" }}
              tickLine={false}
              label={{
                value: "wall thickness (mm)",
                position: "insideBottom",
                offset: -12,
                style: { fontSize: 11, fill: "#98999B" },
              }}
            />
            <YAxis
              type="category"
              dataKey="process"
              tick={{ fontSize: 12, fill: "#5F6164" }}
              axisLine={false}
              tickLine={false}
              width={78}
            />

            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "#F5F6F7" }}
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
                style={{ fontSize: 11, fill: "#5F6164", fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table view of the same data — chart and table should never disagree,
          and this is what makes the figure accessible without color or hover. */}
      <details className="mt-3">
        <summary className="text-xs text-steel-blue hover:text-steel-blue-deep cursor-pointer">
          View as table
        </summary>
        <table className="w-full text-xs mt-2">
          <thead>
            <tr className="bg-instrument-white border-b border-panel-gray text-left text-graphite/60">
              <th className="px-3 py-2 font-semibold">Process</th>
              <th className="px-3 py-2 font-semibold">Minimum wall</th>
              <th className="px-3 py-2 font-semibold">Typical range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-gray">
            {MIN_WALL_CHART_DATA.map(d => (
              <tr key={d.process}>
                <td className="px-3 py-2 text-graphite/80">{d.process}</td>
                <td className="px-3 py-2 font-mono text-graphite/80">{d.min} mm</td>
                <td className="px-3 py-2 font-mono text-graphite/60">{d.min}–{d.max} mm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
