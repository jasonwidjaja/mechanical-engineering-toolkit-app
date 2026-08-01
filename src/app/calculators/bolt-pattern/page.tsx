/**
 * Bolt Pattern Load Distribution
 *
 * Uses the ELASTIC METHOD (also called the "direct shear + torsional shear" method)
 * to find the shear force on each bolt in a group subjected to an in-plane
 * force (Fx, Fy) and a moment (Mz) applied at the bolt group centroid.
 *
 * How it works:
 *   1. Find the centroid of the bolt group (average of all x and y positions).
 *   2. Compute J = Σ(rx² + ry²) — the polar moment of inertia of the bolt group,
 *      where rx and ry are each bolt's offset from the centroid.
 *   3. Direct shear (equal share): Vdx = Fx/n, Vdy = Fy/n.
 *   4. Torsional shear from Mz (proportional to distance from centroid):
 *        Vtx = –Mz × ry / J
 *        Vty =  Mz × rx / J
 *   5. Total per bolt: Vx = Vdx + Vtx, Vy = Vdy + Vty, |V| = √(Vx²+Vy²).
 *   6. The bolt with the largest |V| is the critical (most loaded) bolt.
 *
 * Units: positions in mm (metric) or inches (imperial).
 *        Forces in N or lbf, moment in N·mm or lbf·in.
 *        Per-bolt results come out in N or lbf.
 */
"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";

// --- Types ---

type UnitSystem = "metric" | "imperial";

// A bolt's raw input — kept as strings so the text fields show exactly what the user typed
type BoltInput = { id: number; x: string; y: string };

// Fully computed result for one bolt
type BoltResult = {
  id: number;
  x: number; y: number;
  rx: number; ry: number; // offset from centroid
  r: number;              // distance from centroid
  Vdx: number; Vdy: number; // direct shear components
  Vtx: number; Vty: number; // torsional shear components
  Vx: number; Vy: number;   // total (vector sum)
  V: number;               // resultant magnitude — what the bolt "feels"
  angle: number;           // direction of V, degrees from +x axis (for reference)
};

// --- Preset bolt patterns (coordinates match the default mm unit system) ---
const PRESETS: Record<string, Array<{ x: string; y: string }>> = {
  "4-bolt square (100×100 mm)": [
    { x: "-50", y: "50" }, { x: "50", y: "50" },
    { x: "50", y: "-50" }, { x: "-50", y: "-50" },
  ],
  "6-bolt circle (r = 75 mm)": Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 * Math.PI) / 180;
    return { x: (75 * Math.cos(a)).toFixed(1), y: (75 * Math.sin(a)).toFixed(1) };
  }),
  "8-bolt circle (r = 100 mm)": Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 * Math.PI) / 180;
    return { x: (100 * Math.cos(a)).toFixed(1), y: (100 * Math.sin(a)).toFixed(1) };
  }),
};

export default function BoltPatternPage() {
  // useRef for the next bolt ID so it doesn't trigger re-renders when incremented
  const nextIdRef = useRef(5);

  const [units, setUnits] = useState<UnitSystem>("metric");

  // Default: 4-bolt square pattern
  const [bolts, setBolts] = useState<BoltInput[]>([
    { id: 1, x: "-50", y: "50" },
    { id: 2, x: "50",  y: "50" },
    { id: 3, x: "50",  y: "-50" },
    { id: 4, x: "-50", y: "-50" },
  ]);

  // Applied loads — defaults give a visually interesting result for the default 4-bolt pattern
  const [Fx, setFx] = useState("10000");   // horizontal shear, N
  const [Fy, setFy] = useState("0");       // vertical shear,   N
  const [Mz, setMz] = useState("500000");  // in-plane moment,  N·mm (= 500 N·m)

  const [results, setResults] = useState<BoltResult[] | null>(null);
  const [calcError, setCalcError] = useState<string>("");

  // Parse bolt positions to numbers for the live SVG preview.
  // useMemo re-runs only when `bolts` changes, not on every keystroke in the load fields.
  const parsedBolts = useMemo(() =>
    bolts
      .map(b => ({ id: b.id, x: parseFloat(b.x), y: parseFloat(b.y) }))
      .filter(b => !isNaN(b.x) && !isNaN(b.y)),
    [bolts]
  );

  // Live centroid — computed automatically so the diagram always shows it
  const centroid = useMemo(() => {
    if (parsedBolts.length === 0) return null;
    const n = parsedBolts.length;
    return {
      x: parsedBolts.reduce((s, b) => s + b.x, 0) / n,
      y: parsedBolts.reduce((s, b) => s + b.y, 0) / n,
    };
  }, [parsedBolts]);

  // --- Main calculation ---
  function calculate() {
    if (parsedBolts.length < 2) {
      setCalcError("Need at least 2 bolts to calculate.");
      setResults(null);
      return;
    }
    if (!centroid) return;

    const fx = parseFloat(Fx) || 0;
    const fy = parseFloat(Fy) || 0;
    const mz = parseFloat(Mz) || 0;
    const n = parsedBolts.length;
    const { x: cx, y: cy } = centroid;

    // J = Σ(rx² + ry²)  — units: mm² for metric, in² for imperial
    const J = parsedBolts.reduce((sum, b) => {
      const rx = b.x - cx, ry = b.y - cy;
      return sum + rx * rx + ry * ry;
    }, 0);

    // Direct shear: split evenly
    const Vdx = fx / n;
    const Vdy = fy / n;

    const boltResults: BoltResult[] = parsedBolts.map(b => {
      const rx = b.x - cx;
      const ry = b.y - cy;
      const r = Math.sqrt(rx * rx + ry * ry);

      // Torsional shear components (derived from τ = Mz·r/J decomposed into x/y):
      //   Vtx = –Mz·ry/J  (CCW moment pushes bolt in –x if bolt is above centroid)
      //   Vty =  Mz·rx/J  (CCW moment pushes bolt in +y if bolt is to the right)
      const Vtx = J > 0 ? -(mz * ry) / J : 0;
      const Vty = J > 0 ? (mz * rx) / J : 0;

      const Vx = Vdx + Vtx;
      const Vy = Vdy + Vty;
      const V = Math.sqrt(Vx * Vx + Vy * Vy);
      const angle = Math.atan2(Vy, Vx) * (180 / Math.PI);

      return { id: b.id, x: b.x, y: b.y, rx, ry, r, Vdx, Vdy, Vtx, Vty, Vx, Vy, V, angle };
    });

    setCalcError("");
    setResults(boltResults);
  }

  // --- Bolt table mutations ---
  function addBolt() {
    setBolts(prev => [...prev, { id: nextIdRef.current++, x: "0", y: "0" }]);
  }

  function removeBolt(id: number) {
    if (bolts.length <= 2) return;
    setBolts(prev => prev.filter(b => b.id !== id));
    setResults(null);
  }

  function updateBolt(id: number, field: "x" | "y", val: string) {
    setBolts(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b));
    setResults(null); // stale results should disappear when positions change
  }

  function loadPreset(key: string) {
    const pattern = PRESETS[key];
    setBolts(pattern.map((p, i) => ({ id: i + 1, x: p.x, y: p.y })));
    nextIdRef.current = pattern.length + 1;
    setResults(null);
  }

  // Derived values used across the template
  const posUnit    = units === "metric" ? "mm"     : "in";
  const forceUnit  = units === "metric" ? "N"      : "lbf";
  const momentUnit = units === "metric" ? "N·mm"   : "lbf·in";
  const maxV = results ? Math.max(...results.map(r => r.V)) : 0;
  const J_display = parsedBolts.reduce((sum, b) => {
    if (!centroid) return sum;
    const rx = b.x - centroid.x, ry = b.y - centroid.y;
    return sum + rx * rx + ry * ry;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Bolt Pattern Load Distribution</h1>
      <p className="text-sm text-gray-500 mb-1">
        Distributes an in-plane force and moment across a bolt group using the{" "}
        <strong>elastic method</strong>. Bolts far from the centroid carry more of the applied
        moment; the critical (most loaded) bolt is highlighted in the results.
      </p>
      <p className="text-xs text-gray-400 mb-5">
        Loads (Fx, Fy, Mz) must be referenced to the bolt group centroid. The moment Mz is positive
        CCW when viewed from the front (+z out of the page).
      </p>

      {/* Unit system toggle */}
      <div className="flex gap-2 mb-6">
        {(["metric", "imperial"] as UnitSystem[]).map(u => (
          <button
            key={u}
            onClick={() => { setUnits(u); setResults(null); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              units === u
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {u === "metric" ? "Metric (mm / N)" : "Imperial (in / lbf)"}
          </button>
        ))}
      </div>

      {/* Two-column layout: inputs (left) + diagram (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* LEFT: inputs */}
        <div className="flex flex-col gap-4">

          {/* Preset pattern loader */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Load a Preset Pattern</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PRESETS).map(key => (
                <button
                  key={key}
                  onClick={() => loadPreset(key)}
                  className="text-xs bg-gray-50 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Bolt positions table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Bolt Positions ({posUnit}) —{" "}
              <span className="font-normal text-gray-500">{bolts.length} bolt{bolts.length !== 1 ? "s" : ""}</span>
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 w-8">#</th>
                  <th className="text-left pb-2 pr-2">X ({posUnit})</th>
                  <th className="text-left pb-2 pr-2">Y ({posUnit})</th>
                  <th className="w-8 pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bolts.map((b, i) => (
                  <tr key={b.id}>
                    <td className="py-1.5 pr-2 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        value={b.x}
                        onChange={e => updateBolt(b.id, "x", e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        value={b.y}
                        onChange={e => updateBolt(b.id, "y", e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <button
                        onClick={() => removeBolt(b.id)}
                        disabled={bolts.length <= 2}
                        className="text-gray-300 hover:text-red-400 disabled:opacity-20 text-lg leading-none px-1 transition-colors"
                        title="Remove bolt"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={addBolt}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              + Add bolt
            </button>
          </div>

          {/* Applied loads */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Applied Loads at Centroid</h2>
            <div className="flex flex-col gap-3">
              <LoadInput
                label={`Fx — Horizontal shear (${forceUnit})`}
                value={Fx}
                onChange={v => { setFx(v); setResults(null); }}
              />
              <LoadInput
                label={`Fy — Vertical shear (${forceUnit})`}
                value={Fy}
                onChange={v => { setFy(v); setResults(null); }}
              />
              <LoadInput
                label={`Mz — In-plane moment (${momentUnit}, CCW +)`}
                value={Mz}
                onChange={v => { setMz(v); setResults(null); }}
              />
            </div>
          </div>

          <button
            onClick={calculate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            Calculate Load Distribution
          </button>

          {calcError && <p className="text-sm text-red-600">{calcError}</p>}
        </div>

        {/* RIGHT: bolt pattern diagram */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Pattern Diagram</h2>
          <BoltPatternDiagram
            bolts={parsedBolts}
            centroid={centroid}
            results={results}
            maxV={maxV}
          />
          {/* Color legend — only shown after a calculation */}
          {results && (
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: "hsl(120,60%,40%)" }} />
                Low load
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: "hsl(45,90%,45%)" }} />
                Medium
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: "hsl(0,75%,50%)" }} />
                Critical bolt
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results table — shown after calculation */}
      {results && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Per-Bolt Shear Forces ({forceUnit})
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            J = {J_display.toFixed(0)} {posUnit}² · Direct shear per bolt:{" "}
            Vdx = {(parseFloat(Fx) / results.length).toFixed(1)}, Vdy = {(parseFloat(Fy) / results.length).toFixed(1)} {forceUnit}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-200">
                  <th className="text-left pb-2 pr-4">Bolt</th>
                  <th className="text-right pb-2 pr-4">x</th>
                  <th className="text-right pb-2 pr-4">y</th>
                  <th className="text-right pb-2 pr-4">Vx</th>
                  <th className="text-right pb-2 pr-4">Vy</th>
                  <th className="text-right pb-2 pr-4 font-semibold text-gray-600">|V|</th>
                  <th className="text-right pb-2">% of max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((r, i) => {
                  const isMax = Math.abs(r.V - maxV) < 0.001;
                  const pct = maxV > 0 ? (r.V / maxV) * 100 : 0;
                  return (
                    <tr key={r.id} className={isMax ? "bg-red-50" : ""}>
                      <td className="py-2 pr-4 font-medium text-gray-700">
                        {i + 1}
                        {isMax && (
                          <span className="ml-1.5 text-xs text-red-600 font-semibold">CRITICAL</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-xs text-gray-500">
                        {r.x.toFixed(1)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-xs text-gray-500">
                        {r.y.toFixed(1)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-xs">
                        {r.Vx.toFixed(1)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-xs">
                        {r.Vy.toFixed(1)}
                      </td>
                      <td className={`py-2 pr-4 text-right font-bold font-mono text-xs ${isMax ? "text-red-700" : "text-gray-800"}`}>
                        {r.V.toFixed(1)}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* How to use this result */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
            <strong>Using this result:</strong> The critical bolt&#39;s resultant |V| is the design shear load.
            Compare it against the bolt&#39;s shear capacity: F_allow = (bolt proof load × 0.577) for Von Mises,
            or F_allow = bolt tensile area × allowable shear stress from your design code (e.g. AISC, VDI 2230).
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Diagram Component
// ---------------------------------------------------------------------------

type DiagramProps = {
  bolts: Array<{ id: number; x: number; y: number }>;
  centroid: { x: number; y: number } | null;
  results: BoltResult[] | null;
  maxV: number;
};

/**
 * Renders the bolt pattern as an SVG.
 * - Before calculation: bolts shown in neutral blue.
 * - After calculation: bolts colored green → yellow → red by load magnitude.
 * - Centroid always shown as a purple ⊕.
 * - Dashed crosshairs pass through the centroid (axis reference lines).
 */
function BoltPatternDiagram({ bolts, centroid, results, maxV }: DiagramProps) {
  if (bolts.length === 0) {
    return (
      <div className="flex-1 min-h-[240px] flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
        Add bolts to see the diagram
      </div>
    );
  }

  const W = 360, H = 300;
  const PAD = 40;

  const xs = bolts.map(b => b.x);
  const ys = bolts.map(b => b.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);

  // Pick uniform scale, capped so bolts don't fill the whole viewport
  const scale = Math.min((W - 2 * PAD) / rangeX, (H - 2 * PAD) / rangeY, 3.5);

  // Center the scaled pattern
  const pw = rangeX * scale;
  const ph = rangeY * scale;
  const ox = (W - pw) / 2;
  const oy = (H - ph) / 2;

  // Map real coords to SVG coords (flip Y so +y = up, as engineers expect)
  function sx(x: number) { return ox + (x - minX) * scale; }
  function sy(y: number) { return H - (oy + (y - minY) * scale); }

  const boltR = Math.max(9, Math.min(15, 180 / Math.max(bolts.length, 1)));

  // HSL color wheel: green (120°) → red (0°) as V/Vmax goes 0 → 1
  function boltColor(v: number) {
    if (!results || maxV === 0) return "hsl(217,80%,55%)"; // neutral blue
    const hue = Math.round((1 - v / maxV) * 120);
    return `hsl(${hue},65%,42%)`;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-lg bg-gray-50 border border-gray-100"
      style={{ minHeight: 220 }}
    >
      {/* Centroid crosshairs (dashed) */}
      {centroid && (
        <>
          <line
            x1={0} y1={sy(centroid.y)} x2={W} y2={sy(centroid.y)}
            stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4 3"
          />
          <line
            x1={sx(centroid.x)} y1={0} x2={sx(centroid.x)} y2={H}
            stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4 3"
          />
        </>
      )}

      {/* Bolt circles */}
      {bolts.map((b, i) => {
        const result = results?.find(r => r.id === b.id);
        const V = result?.V ?? 0;
        const isMax = results ? Math.abs(V - maxV) < 0.001 && maxV > 0 : false;
        const cx = sx(b.x);
        const cy = sy(b.y);

        return (
          <g key={b.id}>
            {/* Dashed ring to call out the critical bolt */}
            {isMax && (
              <circle
                cx={cx} cy={cy} r={boltR + 5}
                fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2"
              />
            )}
            <circle
              cx={cx} cy={cy} r={boltR}
              fill={boltColor(V)} fillOpacity={0.88}
              stroke="white" strokeWidth={1.5}
            />
            {/* Bolt number */}
            <text
              x={cx} y={cy + 0.5}
              textAnchor="middle" dominantBaseline="middle"
              fill="white"
              fontSize={Math.max(8, boltR * 0.7)}
              fontWeight="bold"
            >
              {i + 1}
            </text>
            {/* Force magnitude label below each bolt */}
            {result && (
              <text
                x={cx} y={cy + boltR + 11}
                textAnchor="middle"
                fill="#64748b" fontSize={8.5}
              >
                {result.V.toFixed(0)}
              </text>
            )}
          </g>
        );
      })}

      {/* Centroid marker (purple dot) */}
      {centroid && (
        <g>
          <circle cx={sx(centroid.x)} cy={sy(centroid.y)} r={4} fill="#7c3aed" />
          {/* Horizontal bar of ⊕ */}
          <line
            x1={sx(centroid.x) - 6} y1={sy(centroid.y)}
            x2={sx(centroid.x) + 6} y2={sy(centroid.y)}
            stroke="white" strokeWidth={1.5}
          />
          {/* Vertical bar of ⊕ */}
          <line
            x1={sx(centroid.x)} y1={sy(centroid.y) - 6}
            x2={sx(centroid.x)} y2={sy(centroid.y) + 6}
            stroke="white" strokeWidth={1.5}
          />
          <text
            x={sx(centroid.x) + 8} y={sy(centroid.y) - 6}
            fill="#7c3aed" fontSize={8.5} fontStyle="italic"
          >
            centroid
          </text>
        </g>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Compact label + right-aligned input for the load section. */
function LoadInput({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-gray-600 flex-1 leading-tight">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        className="w-28 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:ring-1 focus:ring-blue-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}
