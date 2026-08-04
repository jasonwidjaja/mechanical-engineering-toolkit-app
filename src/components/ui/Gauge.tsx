/**
 * Gauge — the app's single pass/fail indicator.
 *
 * Every calculator used to express "is this value acceptable?" as its own
 * red/yellow/green text badge, and no two were styled quite the same. They are
 * all replaced by this: a semicircular analog meter with a needle pointing at
 * the value's position between min and max, and the acceptable/marginal/
 * unacceptable ranges painted directly onto the dial as coloured zones.
 *
 * The point is that a badge only tells you the verdict. A dial tells you the
 * verdict *and* how much margin you have — whether an FS of 2.05 scraped past
 * the threshold or cleared it comfortably.
 *
 * Zones are supplied by the caller because every calculator's thresholds come
 * from a different standard. They don't have to cover the whole range or be
 * contiguous; whatever isn't covered renders as bare dial.
 */
"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A coloured band on the dial, in the same units as `value`. */
export type GaugeZone = {
  from: number;
  to: number;
  tone: GaugeTone;
};

export type GaugeTone = "good" | "warn" | "bad";

export type GaugeProps = {
  value: number;
  min: number;
  max: number;
  /** Coloured bands. Order doesn't matter; they're drawn in the order given. */
  zones: GaugeZone[];
  /** Small-caps caption under the dial, e.g. "Factor of safety". */
  label: string;
  /** Unit suffix on the readout, e.g. "%", "Hz", "°C/W". */
  unit?: string;
  /** Decimal places on the readout. Default 2. */
  decimals?: number;
  /**
   * One-line verdict under the readout. Written by the caller so it can carry
   * the actual engineering language ("FS >= 2.0 — meets typical structural
   * safety factor") rather than a generic "Pass".
   */
  statusText?: string;
  /** `sm` for side-by-side placement, `md` (default) for a primary result. */
  size?: "sm" | "md";
  /** Number of tick marks along the arc. Default 9 (i.e. 8 divisions). */
  ticks?: number;
};

// ---------------------------------------------------------------------------
// Geometry
//
// The dial is a 180° arc. Centre sits at (100,100) in a 200×124 viewBox, so the
// arc runs from (100−R, 100) on the left round to (100+R, 100) on the right.
// ---------------------------------------------------------------------------

const CX = 100;
const CY = 100;
const R = 74; // centreline radius of the coloured band
const BAND = 11; // band thickness

/**
 * Map a fraction 0..1 across the dial to a point on the arc.
 * t=0 is hard left, t=0.5 is straight up, t=1 is hard right.
 */
function pointAt(t: number, radius: number) {
  const deg = 180 - t * 180;
  const rad = (deg * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(rad),
    y: CY - radius * Math.sin(rad), // minus: SVG y grows downward
  };
}

/** Arc path between two fractions. sweep=1 because we travel left→right over the top. */
function arcPath(t0: number, t1: number, radius: number) {
  const a = pointAt(t0, radius);
  const b = pointAt(t1, radius);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/** Tailwind stroke utilities per tone — generated from the theme, not hardcoded hex. */
const ZONE_STROKE: Record<GaugeTone, string> = {
  good: "stroke-phosphor-green",
  warn: "stroke-signal-amber",
  bad: "stroke-signal-red",
};

/** Readout text colour per tone. `deep` variants so they hold contrast on white. */
const TONE_TEXT: Record<GaugeTone, string> = {
  good: "text-phosphor-green-deep",
  warn: "text-signal-amber-deep",
  bad: "text-signal-red-deep",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Gauge({
  value,
  min,
  max,
  zones,
  label,
  unit,
  decimals = 2,
  statusText,
  size = "md",
  ticks = 9,
}: GaugeProps) {
  // Guard against a zero-width range producing NaN everywhere downstream.
  const span = max - min || 1;

  /** Value → dial fraction, clamped to the dial's ends. */
  const toT = (v: number) => Math.min(1, Math.max(0, (v - min) / span));

  const t = toT(value);

  // Out-of-range values pin the needle at the end stop but the readout still
  // shows the true number — silently displaying a clamped value would be a lie.
  const offScale = value < min || value > max;

  // Which zone the value actually falls in, for the readout colour.
  const activeZone = zones.find(z => value >= z.from && value <= z.to);
  const tone: GaugeTone | null = activeZone?.tone ?? null;

  // Needle is drawn pointing straight up, then rotated into place: -90° puts it
  // at the left end stop, +90° at the right.
  const needleDeg = -90 + t * 180;

  const width = size === "sm" ? "max-w-[180px]" : "max-w-[260px]";

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 124"
        className={`w-full ${width}`}
        role="meter"
        aria-valuenow={Number(value.toFixed(decimals))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={`${label}${unit ? ` in ${unit}` : ""}`}
      >
        {/* Unfilled dial track — everything the zones don't cover. */}
        <path
          d={arcPath(0, 1, R)}
          className="stroke-panel-gray"
          strokeWidth={BAND}
          fill="none"
          strokeLinecap="butt"
        />

        {/* Coloured zones, painted over the track. */}
        {zones.map((z, i) => {
          const z0 = toT(Math.min(z.from, z.to));
          const z1 = toT(Math.max(z.from, z.to));
          if (z1 <= z0) return null; // zone lies entirely off the dial
          return (
            <path
              key={i}
              d={arcPath(z0, z1, R)}
              className={ZONE_STROKE[z.tone]}
              strokeWidth={BAND}
              fill="none"
              strokeLinecap="butt"
            />
          );
        })}

        {/* Tick marks, just inside the band. */}
        {Array.from({ length: ticks }, (_, i) => {
          const tt = i / (ticks - 1);
          const outer = pointAt(tt, R - BAND / 2 - 2);
          const inner = pointAt(tt, R - BAND / 2 - (i === 0 || i === ticks - 1 ? 9 : 5));
          return (
            <line
              key={i}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              className="stroke-graphite/25"
              strokeWidth={1}
            />
          );
        })}

        {/* End-stop numbers, in mono like every other figure in the app. */}
        <text
          x={pointAt(0, R).x}
          y={CY + 16}
          textAnchor="middle"
          className="fill-graphite/50 font-mono"
          fontSize={9}
        >
          {formatEnd(min)}
        </text>
        <text
          x={pointAt(1, R).x}
          y={CY + 16}
          textAnchor="middle"
          className="fill-graphite/50 font-mono"
          fontSize={9}
        >
          {formatEnd(max)}
        </text>

        {/*
          Needle. The transition is the only motion in the component — a single
          ease on value change, nothing continuous. The global
          prefers-reduced-motion rule in globals.css collapses it to ~0ms.
        */}
        <g
          style={{
            transform: `rotate(${needleDeg}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transformBox: "view-box",
            transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - R + 4}
            className="stroke-graphite"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Counterweight stub below the pivot — reads as a balanced needle. */}
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY + 7}
            className="stroke-graphite"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>

        {/* Pivot boss */}
        <circle cx={CX} cy={CY} r={5} className="fill-white stroke-graphite" strokeWidth={2} />
      </svg>

      {/* ── Digital readout ── */}
      <div className="-mt-1 flex items-baseline gap-1">
        <span className={`readout text-3xl ${tone ? TONE_TEXT[tone] : "text-graphite"}`}>
          {value.toFixed(decimals)}
        </span>
        {unit && (
          <span className={`font-mono text-sm ${tone ? TONE_TEXT[tone] : "text-graphite/60"}`}>
            {unit}
          </span>
        )}
      </div>

      <p className="label-caps mt-1 text-center">{label}</p>

      {offScale && (
        <p className="mt-1 font-mono text-[11px] text-graphite/50">
          Off scale — needle at end stop
        </p>
      )}

      {statusText && (
        <p
          className={`mt-2 max-w-[38ch] text-center text-xs leading-relaxed ${
            tone ? TONE_TEXT[tone] : "text-graphite/70"
          }`}
        >
          {statusText}
        </p>
      )}
    </div>
  );
}

/**
 * End-stop labels have to fit in ~4 characters. Large round numbers lose their
 * decimals, small ones keep enough to stay distinguishable from zero.
 */
function formatEnd(v: number): string {
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1000) return `${Math.round(v / 1000)}k`;
  if (a >= 10) return String(Math.round(v));
  if (a >= 1) return v.toFixed(1);
  return v.toFixed(2);
}
