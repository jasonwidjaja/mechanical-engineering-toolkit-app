"use client";

/**
 * Precision Spectrum
 *
 * Every process in the tolerance table placed on one axis, drawn as a floating
 * bar running from its tightest achievable tolerance to its standard one.
 * Sorted tightest-first, so the reader can find the loosest (cheapest) process
 * that still clears the tolerance they need by scanning down until the bars
 * stop reaching far enough left.
 *
 * Why a LOG axis: the values span 0.002 mm to 1.5 mm — nearly three orders of
 * magnitude. On a linear axis every machining process would collapse into an
 * indistinguishable smear against the left edge while sand casting ate the
 * width. Log spacing gives each decade equal room, which is the only way the
 * tight end stays readable.
 *
 * Colour encodes CATEGORY and matches the chips in the table below, so the two
 * read as one system. Category is also printed on the y-axis label rows and in
 * the tooltip, so colour is never carrying the meaning alone.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CATEGORY_COLORS,
  SPECTRUM_REFERENCE_MM,
  TOLERANCE_ROWS,
  type ToleranceCategory,
} from "@/lib/dfm-data";

/**
 * A point mark (a process with only one published figure) would have zero width
 * and vanish. It's widened by this factor purely so the mark is visible — the
 * true single value is what the tooltip and the axis position report.
 */
const POINT_SPREAD = 1.16;

type Datum = {
  process: string;
  category: ToleranceCategory;
  /** [tight, loose] — recharts renders a two-element array as a floating bar. */
  range: [number, number];
  tight: number;
  loose: number;
  isPoint: boolean;
  fromPercent: boolean;
};

// Build once at module load — the source rows are static.
const DATA: Datum[] = TOLERANCE_ROWS.map(r => {
  const { tight, loose, point, fromPercent } = r.spectrum;
  return {
    process: r.process,
    category: r.category,
    // Asserted as a tuple: TypeScript widens a ternary between two array
    // literals to number[], which doesn't satisfy the [number, number] that
    // recharts needs to read a floating bar's two ends.
    range: (point
      ? [tight / POINT_SPREAD, loose * POINT_SPREAD]
      : [tight, loose]) as [number, number],
    tight,
    loose,
    isPoint: Boolean(point),
    fromPercent: Boolean(fromPercent),
  };
})
  // Tightest first. Ties broken by the loose end, so the narrower (more capable)
  // process sorts above a wider one that merely reaches the same tight limit.
  .sort((a, b) => a.tight - b.tight || a.loose - b.loose);

/** Explicit decade ticks — recharts' automatic ticks are poor on a log scale. */
const TICKS = [0.001, 0.01, 0.1, 1];

function SpectrumTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Datum }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs max-w-[240px]">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm"
          style={{ backgroundColor: CATEGORY_COLORS[d.category] }}
          aria-hidden="true"
        />
        <span className="font-semibold text-gray-800">{d.process}</span>
      </div>
      <div className="text-gray-500 mb-1">{d.category}</div>
      {d.isPoint ? (
        <div className="text-gray-700">
          Typical: <span className="font-mono font-medium">±{d.tight} mm</span>
        </div>
      ) : (
        <>
          <div className="text-gray-700">
            Tightest: <span className="font-mono font-medium">±{d.tight} mm</span>
          </div>
          <div className="text-gray-600">
            Standard: <span className="font-mono">±{d.loose} mm</span>
          </div>
        </>
      )}
      {d.fromPercent && (
        <div className="text-gray-400 mt-1 leading-snug">
          Spec is a % of dimension — shown at a {SPECTRUM_REFERENCE_MM} mm reference size.
        </div>
      )}
    </div>
  );
}

export default function PrecisionSpectrumChart() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-0.5">Precision Spectrum</h3>
      <p className="text-xs text-gray-500 mb-3">
        Each bar spans a process&apos;s tightest achievable tolerance to its standard
        one. Sorted tightest first — <strong>further left is more precise</strong>.
        Note the log scale: each gridline is 10× the one before it.
      </p>

      {/* Category legend. Present because colour carries category across 15 bars
          whose y-axis labels alone wouldn't group them. */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
        {(Object.keys(CATEGORY_COLORS) as ToleranceCategory[]).map(cat => (
          <span key={cat} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              aria-hidden="true"
            />
            {cat}
          </span>
        ))}
      </div>

      <div style={{ width: "100%", height: 430 }}>
        <ResponsiveContainer>
          <BarChart
            data={DATA}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 24, left: 8 }}
            barCategoryGap="22%"
          >
            <CartesianGrid horizontal={false} stroke="#f1f5f9" />

            <XAxis
              type="number"
              scale="log"
              // A log axis cannot include zero, so the domain is set explicitly.
              domain={[0.001, 2]}
              ticks={TICKS}
              allowDataOverflow
              tickFormatter={v => `±${v}`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              label={{
                value: "tolerance (mm, log scale)",
                position: "insideBottom",
                offset: -14,
                style: { fontSize: 11, fill: "#94a3b8" },
              }}
            />
            <YAxis
              type="category"
              dataKey="process"
              tick={{ fontSize: 10.5, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
              width={158}
              interval={0}
            />

            <Tooltip content={<SpectrumTooltip />} cursor={{ fill: "#f8fafc" }} />

            {/* isAnimationActive={false} for the same reason as MinWallChart —
                recharts grows bars from zero, which renders wrong in a
                screenshot or print and is pointless on a static reference. */}
            <Bar dataKey="range" radius={2} barSize={15} isAnimationActive={false}>
              {DATA.map(d => (
                <Cell key={d.process} fill={CATEGORY_COLORS[d.category]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
        Die casting and MIM specify tolerance as a percentage of the dimension, so they
        are plotted at a {SPECTRUM_REFERENCE_MM} mm reference size — at a different part
        size those two bars move. Grinding and reaming/boring publish a single figure
        rather than a range, so their marks are points, drawn slightly wide to stay visible.
      </p>
    </div>
  );
}
