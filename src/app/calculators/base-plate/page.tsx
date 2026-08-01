/**
 * Base Plate Anchor Bolt Tension
 *
 * Uses the elastic method to distribute an overturning moment across a
 * bolt circle. Each bolt's share of the moment reaction is proportional
 * to its distance from the neutral axis (the horizontal axis through the
 * centroid, perpendicular to the moment vector).
 *
 * For N evenly spaced bolts on a circle of radius R:
 *   Bolt i is at angle θᵢ = 2πi/N (i = 0 … N-1)
 *   y-component (distance from neutral axis): yᵢ = R × sin(θᵢ)
 *
 *   Σ yᵢ² = N × R² / 2   (exact identity for evenly spaced bolts)
 *
 *   Tensile force from moment: Fᵢ = M × yᵢ / Σyⱼ²
 *     = M × R·sin(θᵢ) / (N·R²/2)
 *     = 2M·sin(θᵢ) / (N·R)          where R is in metres
 *
 *   Maximum moment tension (bolt most aligned with the load direction):
 *     F_moment_max = 2M / (N × R_m)   where R_m = R / 1000
 *
 *   Axial load (compressive weight P split equally):
 *     F_axial_per_bolt = P / N        (negative because it reduces tension)
 *
 *   Net max tension = F_moment_max − F_axial_per_bolt
 *
 * If net ≤ 0: all bolts remain in compression — no tensile demand.
 */
"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CalcResult = {
  R_m: number;          // bolt circle radius in metres
  F_moment_max: number; // peak tension from moment only, N
  F_axial: number;      // compressive contribution per bolt, N
  net_max: number;      // net max bolt tension, N (can be negative)
  N: number;
  M: number;
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function BasePlatePage() {
  // ---- raw string inputs ----
  const [M,   setM]   = useState("");      // overturning moment, N·m
  const [N,   setN]   = useState("4");     // number of bolts (integer)
  const [R,   setR]   = useState("");      // bolt circle radius, mm
  const [P,   setP]   = useState("0");     // axial/compressive load, N

  // ---- results / error ----
  const [result,    setResult]    = useState<CalcResult | null>(null);
  const [calcError, setCalcError] = useState("");

  // ---- calculation ----
  function calculate() {
    const m   = parseFloat(M);
    const n   = parseInt(N, 10);
    const r   = parseFloat(R);
    const p   = parseFloat(P) || 0;

    // --- validation ---
    if (isNaN(m) || m <= 0)       { setCalcError("M must be a positive number."); setResult(null); return; }
    if (isNaN(n) || n < 2)        { setCalcError("N must be an integer ≥ 2.");   setResult(null); return; }
    if (!Number.isInteger(n))     { setCalcError("N must be a whole number.");    setResult(null); return; }
    if (isNaN(r) || r <= 0)       { setCalcError("R must be a positive number."); setResult(null); return; }
    if (isNaN(p) || p < 0)        { setCalcError("P must be ≥ 0.");              setResult(null); return; }

    const R_m = r / 1000;                          // mm → m

    // F_moment_max = 2M / (N × R_m)
    const F_moment_max = (2 * m) / (n * R_m);

    // Axial compressive contribution per bolt
    const F_axial = p / n;

    // Net = moment tension − compressive weight relief
    const net_max = F_moment_max - F_axial;

    setCalcError("");
    setResult({ R_m, F_moment_max, F_axial, net_max, N: n, M: m });
  }

  // Number of bolts integer options 2–24
  const boltOptions = Array.from({ length: 23 }, (_, i) => i + 2);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Base Plate Anchor Bolt Tension</h1>
      <p className="text-sm text-gray-500 mb-5">
        Overturning moment distributed across a bolt circle — first-pass estimate
      </p>

      {/* ---- Inputs card ---- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Inputs</h2>
        <div className="flex flex-col gap-4">

          {/* M — overturning moment */}
          <InputRow
            label="M — Overturning moment"
            unit="N·m"
            hint="Use F_wind × h_wind from the Tripod Stability calculator."
            value={M}
            onChange={v => { setM(v); setResult(null); }}
          />

          {/* N — number of bolts */}
          <div className="flex items-start gap-3">
            <label className="text-xs text-gray-600 flex-1 leading-tight pt-1.5">
              N — Number of bolts
            </label>
            <select
              value={N}
              onChange={e => { setN(e.target.value); setResult(null); }}
              className="w-28 border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 outline-none bg-white"
            >
              {boltOptions.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* R — bolt circle radius */}
          <InputRow
            label="R — Bolt circle radius"
            unit="mm"
            value={R}
            onChange={v => { setR(v); setResult(null); }}
          />

          {/* P — axial load (optional) */}
          <InputRow
            label="P — Axial load / weight (optional)"
            unit="N"
            hint="Compressive weight of the mast. Positive = compression (downward force)."
            value={P}
            onChange={v => { setP(v); setResult(null); }}
            placeholder="0"
          />
        </div>
      </div>

      {/* ---- Calculate button ---- */}
      <button
        onClick={calculate}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors mb-4"
      >
        Calculate Bolt Tension
      </button>

      {calcError && (
        <p className="text-sm text-red-600 mb-4">{calcError}</p>
      )}

      {/* ---- SVG diagram ---- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Pattern Diagram (top-down view)</h2>
        <BasePlateDiagram
          N={parseInt(N, 10) || 4}
          result={result}
        />
      </div>

      {/* ---- Results card ---- */}
      {result && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4">
          <h2 className="text-base font-semibold text-blue-900 mb-3">Results</h2>

          {/* Formula recap */}
          <p className="text-xs text-blue-700 mb-3 font-mono">
            F_moment_max = 2M / (N × R) = 2 × {result.M.toFixed(0)} / ({result.N} × {result.R_m.toFixed(4)})
          </p>

          <div className="flex flex-col gap-2 mb-4">
            <ResultRow
              label="Tension from moment alone"
              value={`${result.F_moment_max.toFixed(1)} N`}
              sub={`(${(result.F_moment_max / 1000).toFixed(3)} kN)`}
              color="text-gray-800"
            />
            <ResultRow
              label={`Compressive relief per bolt (P / N = ${result.F_axial.toFixed(1)} N)`}
              value={`−${result.F_axial.toFixed(1)} N`}
              color="text-green-700"
            />

            <div className="border-t border-blue-200 my-1" />

            {result.net_max > 0 ? (
              <div className="flex items-start justify-between">
                <span className="text-sm text-red-700 font-semibold flex-1">
                  Net max bolt tension
                </span>
                <div className="text-right">
                  <span className="text-lg font-bold text-red-700">
                    {result.net_max.toFixed(1)} N
                  </span>
                  <span className="block text-xs text-red-500">
                    ({(result.net_max / 1000).toFixed(3)} kN) — bolt in TENSION
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <span className="text-sm text-green-700 font-semibold flex-1">
                  Net max bolt tension
                </span>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-700">
                    {result.net_max.toFixed(1)} N
                  </span>
                  <span className="block text-xs text-green-600">
                    Weight dominates — all bolts in compression. No net tensile demand.
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-blue-700">
            Compare against bolt proof load from the{" "}
            <Link href="/calculators/bolt-torque" className="underline hover:text-blue-900">
              Bolt Torque Calculator
            </Link>
            .
          </p>
        </div>
      )}

      {/* ---- Disclaimer ---- */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
        <strong>First-pass estimate only.</strong> This uses the elastic method for a circular bolt pattern under pure overturning.
        It does not account for base-plate flexibility, prying forces, or combined shear + tension.
        Verify with a licensed structural engineer for safety-critical applications.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Diagram — top-down view of the bolt circle
// ---------------------------------------------------------------------------

/**
 * Renders a top-down view of the circular base plate with:
 * - Outer plate boundary (gray circle)
 * - Bolt pitch circle (gray dashed)
 * - Individual bolt circles (colored by tension/compression/neutral)
 * - Moment arrow (curved CCW arc near the center)
 * - Radius label from center to bolt 0
 * - "MAX TENSION" callout on bolt 0
 */
function BasePlateDiagram({ N, result }: { N: number; result: CalcResult | null }) {
  const W = 300, H = 300;
  const CX = 150, CY = 150;        // center of the diagram
  const PLATE_R  = 120;            // plate outline radius, px
  const BOLT_R_PX = 80;            // bolt pitch circle radius, px
  const BOLT_DOT  = 8;             // bolt circle dot radius, px

  // Compute bolt positions. Bolt 0 is at the "top" (angle = -π/2).
  const bolts = Array.from({ length: N }, (_, i) => {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    return {
      cx: CX + BOLT_R_PX * Math.cos(angle),
      cy: CY + BOLT_R_PX * Math.sin(angle),
      // sin component relative to the neutral axis (x-axis in engineering)
      // bolt 0 is at angle -π/2, so sin(-π/2) = -1 → most tensioned bolt
      sinVal: Math.sin(angle + Math.PI / 2), // sin(2πi/N), bolt 0 → sin(0) = 0... wait:
      // Let's recompute: bolt i tension ∝ sin(2πi/N).
      // Bolt 0: sin(0) = 0 (on neutral axis — zero moment tension)
      // Actually the max tension bolt is where sin(2πi/N) is maximum = 1, i.e., i = N/4.
      // BUT the spec says to place bolt 0 at top and highlight it as max tension.
      // To reconcile: the problem states the neutral axis is the horizontal axis.
      // The bolt farthest from it (max |y|) in the vertical direction is the critical one.
      // In screen coords with bolt 0 at "top" (screen y = CY - BOLT_R_PX),
      //   bolt 0 is at screen top = smallest y = most upward in screen = "downwind" bolt.
      // In engineering (y-up) that bolt is at the highest positive y.
      // The spec explicitly says: bolt 0 = critical. We honor that.
    };
  });

  // Determine bolt fill colors
  function boltFill(i: number): string {
    if (!result) return "#9ca3af"; // gray before calculation

    // Per spec: bolt 0 is the max tension bolt.
    // Other bolts on the tension side (sin > 0 in engineering coords) are in tension.
    // sin in engineering coords for bolt i = sin(2πi/N) where bolt 0 offset = 0 ...
    // With our angle layout: angle_i = 2πi/N - π/2
    // y_i (engineering) = BOLT_R_PX × sin(2πi/N - π/2 + π/2) = BOLT_R_PX × sin(2πi/N)
    // Bolt 0: sin(0) = 0 — neutral axis! That contradicts the spec.
    // Resolution: per spec bolt 0 is at top of screen = screen y = CY - BOLT_R_PX.
    // Screen top corresponds to engineering +y (y-up convention, as in bolt-pattern page sy()).
    // F_i ∝ sin(2πi/N), engineering angle measured from x-axis.
    // With bolt 0 at screen-top (engineering angle = π/2): sin(π/2) = 1 → max tension. Correct!
    // So angle_i = 2πi/N + π/2, and sin_i = sin(2πi/N + π/2) = cos(2πi/N).
    // No — our drawing angle is: angle_i_screen = 2πi/N - π/2 (so bolt 0 is at screen top).
    // Engineering angle = -screen_angle (y flipped). So eng_angle_i = -(2πi/N - π/2) = π/2 - 2πi/N.
    // sin(eng_angle_i) = sin(π/2 - 2πi/N) = cos(2πi/N).
    // Bolt 0: cos(0) = 1 → max tension.
    const sinVal = Math.cos((2 * Math.PI * i) / N);

    // Net tension for this bolt = F_moment_i - F_axial
    // F_moment_i = F_moment_max × sinVal  (since F_moment_max = 2M/(N×R) and F_i = 2M×sin/(N×R))
    const F_i = result.F_moment_max * sinVal - result.F_axial;

    if (F_i > 0)  return "rgba(239,68,68,0.8)";    // red — tension
    return "rgba(34,197,94,0.6)";                   // green — compression
  }

  // Moment arrow: CCW arc, center (150,150), radius 30, from 30° to 330°
  // Arc path: large-arc=1, sweep=1 for CCW in SVG (y-down), but visually CCW = sweep=0
  // SVG arcs: sweep-flag=1 means clockwise in screen coords.
  // For a CCW visual arrow in screen coords: sweep-flag=0.
  const arrowR = 30;
  const startDeg = 30,  endDeg = 330;
  const startRad = (startDeg * Math.PI) / 180;
  const endRad   = (endDeg   * Math.PI) / 180;
  const ax1 = CX + arrowR * Math.cos(startRad);
  const ay1 = CY + arrowR * Math.sin(startRad);
  const ax2 = CX + arrowR * Math.cos(endRad);
  const ay2 = CY + arrowR * Math.sin(endRad);
  // Large arc flag: going CCW from 30° to 330° is the short way (300° span) — large-arc=1, sweep=0
  const momentArcPath = `M ${ax1} ${ay1} A ${arrowR} ${arrowR} 0 1 0 ${ax2} ${ay2}`;

  // Arrowhead at the end of the arc (at 330°), pointing CCW tangent direction
  // Tangent at endDeg (330°) going CCW: perpendicular to radius = (sin(endRad), -cos(endRad)) but reversed
  const arrowTipX = ax2, arrowTipY = ay2;
  const tangentAngle = endRad + Math.PI / 2; // tangent pointing CCW
  const arrowLen = 7;
  const arrowA1X = arrowTipX + arrowLen * Math.cos(tangentAngle + 0.5);
  const arrowA1Y = arrowTipY + arrowLen * Math.sin(tangentAngle + 0.5);
  const arrowA2X = arrowTipX + arrowLen * Math.cos(tangentAngle - 0.5);
  const arrowA2Y = arrowTipY + arrowLen * Math.sin(tangentAngle - 0.5);

  // Radius label line: from center to bolt 1 (i=1), label "R" at midpoint
  const labelBoltIdx = Math.min(1, N - 1);
  const labelBoltAngle = (2 * Math.PI * labelBoltIdx) / N - Math.PI / 2;
  const labelBoltCX = CX + BOLT_R_PX * Math.cos(labelBoltAngle);
  const labelBoltCY = CY + BOLT_R_PX * Math.sin(labelBoltAngle);
  const rLabelX = CX + (BOLT_R_PX / 2) * Math.cos(labelBoltAngle) + 6;
  const rLabelY = CY + (BOLT_R_PX / 2) * Math.sin(labelBoltAngle) - 4;

  // "MAX TENSION" label: near bolt 0 (top of circle), above it
  const maxBoltCX = CX;
  const maxBoltCY = CY - BOLT_R_PX; // bolt 0 top position

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-lg bg-gray-50 border border-gray-100"
      style={{ minHeight: 260 }}
      aria-label="Base plate bolt circle diagram"
    >
      {/* Outer plate boundary */}
      <circle
        cx={CX} cy={CY} r={PLATE_R}
        fill="none" stroke="#d1d5db" strokeWidth={2}
      />

      {/* Bolt pitch circle (dashed) */}
      <circle
        cx={CX} cy={CY} r={BOLT_R_PX}
        fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 4"
      />

      {/* Radius label line (center → bolt 1) */}
      {N > 1 && (
        <>
          <line
            x1={CX} y1={CY}
            x2={labelBoltCX} y2={labelBoltCY}
            stroke="#6b7280" strokeWidth={1} strokeDasharray="3 2"
          />
          <text
            x={rLabelX} y={rLabelY}
            fill="#374151" fontSize={11} fontStyle="italic" fontWeight="600"
          >
            R
          </text>
        </>
      )}

      {/* Moment arrow (CCW curved arrow near center) */}
      <path
        d={momentArcPath}
        fill="none" stroke="#3b82f6" strokeWidth={2}
      />
      {/* Arrowhead */}
      <path
        d={`M ${arrowTipX} ${arrowTipY} L ${arrowA1X} ${arrowA1Y} L ${arrowA2X} ${arrowA2Y} Z`}
        fill="#3b82f6"
      />
      {/* "M" label near center */}
      <text
        x={CX} y={CY + 4}
        textAnchor="middle" dominantBaseline="middle"
        fill="#3b82f6" fontSize={12} fontWeight="bold"
      >
        M
      </text>

      {/* Bolt dots */}
      {bolts.map((b, i) => {
        const fill = boltFill(i);
        const isMaxTension = i === 0; // bolt 0 is always the critical bolt per spec

        return (
          <g key={i}>
            {/* Dashed highlight ring for max-tension bolt (bolt 0) */}
            {isMaxTension && result && result.net_max > 0 && (
              <circle
                cx={b.cx} cy={b.cy} r={BOLT_DOT + 5}
                fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2"
              />
            )}
            {/* Bolt dot */}
            <circle
              cx={b.cx} cy={b.cy} r={BOLT_DOT}
              fill={fill}
              stroke="white" strokeWidth={1.5}
            />
            {/* Bolt index number */}
            <text
              x={b.cx} y={b.cy + 0.5}
              textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize={7} fontWeight="bold"
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={4} fill="#6b7280" />

      {/* "MAX TENSION" label pointing to bolt 0 */}
      {result && result.net_max > 0 && (
        <>
          {/* Leader line from label to bolt */}
          <line
            x1={maxBoltCX + 14} y1={maxBoltCY - 14}
            x2={maxBoltCX + 3}  y2={maxBoltCY - BOLT_DOT - 2}
            stroke="#ef4444" strokeWidth={1}
          />
          <text
            x={maxBoltCX + 16} y={maxBoltCY - 16}
            fill="#ef4444" fontSize={8.5} fontWeight="bold"
          >
            MAX TENSION
          </text>
        </>
      )}

      {/* Legend */}
      {result && (
        <g>
          <circle cx={10} cy={H - 30} r={5} fill="rgba(239,68,68,0.8)" />
          <text x={19} y={H - 26} fill="#6b7280" fontSize={8}>Tension</text>
          <circle cx={65} cy={H - 30} r={5} fill="rgba(34,197,94,0.6)" />
          <text x={74} y={H - 26} fill="#6b7280" fontSize={8}>Compression</text>
        </g>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Label + right-aligned number input with optional unit and hint. */
function InputRow({
  label, unit, hint, value, onChange, placeholder,
}: {
  label: string;
  unit: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <label className="text-xs text-gray-600 leading-tight block">{label}</label>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? ""}
          className="w-28 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:ring-1 focus:ring-blue-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-gray-400 w-8">{unit}</span>
      </div>
    </div>
  );
}

/** Single result row with label, value, optional sub-text, and optional color class. */
function ResultRow({
  label, value, sub, color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <div className="text-right">
        <span className={`text-base font-bold font-mono ${color ?? "text-gray-800"}`}>{value}</span>
        {sub && <span className="block text-xs text-gray-500">{sub}</span>}
      </div>
    </div>
  );
}
