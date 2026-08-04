/**
 * CTE Mismatch Calculator
 *
 * Formula: ΔL = L0 × α × ΔT × 1e-6
 *   L0  = reference (nominal) length, mm
 *   α   = coefficient of thermal expansion, ppm/°C (= 1e-6 /°C)
 *   ΔT  = temperature change, °C
 *   ΔL  = free thermal expansion, mm
 *
 * The key engineering result is ΔL_diff = |ΔL_A − ΔL_B|.
 * When two dissimilar materials are bonded, they want to expand by
 * different amounts — the interface must accommodate that difference
 * as shear/peel stress. Larger ΔL_diff = higher interface stress.
 *
 * Note: ppm/°C × 1e-6 converts to a dimensionless strain per °C,
 * so ΔL (mm) = L0 (mm) × (α × 1e-6) × ΔT, which simplifies to
 * ΔL = L0 × α × ΔT × 1e-6.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import Gauge, { type GaugeZone } from "@/components/ui/Gauge";
import { MATERIALS as MATERIAL_DB } from "@/lib/materials";
import MaterialsDbLink from "@/components/ui/MaterialsDbLink";

// ---------------------------------------------------------------------------
// Material data now comes from src/lib/materials.ts — the single source of
// truth shared with the Materials Database and the other calculators. This page
// used to carry its own eight-entry list, which is how "Aluminum 6061" here and
// "Aluminum 6061-T6" there ended up as two different things.
//
// "Custom" is appended as a UI affordance, not a material: it lets the user
// type any α without needing an entry in the database.
// ---------------------------------------------------------------------------
const MATERIALS = [
  ...MATERIAL_DB.map(m => ({ label: m.name, cte: m.cte as number | null })),
  { label: "Custom", cte: null },
];

type MaterialEntry = (typeof MATERIALS)[number];

/**
 * Default pair: aluminium against stainless, a common dissimilar-metal joint.
 *
 * These are looked up by name rather than hardcoded as indices. When the list
 * was a local array, "index 1" happened to be Stainless 304; pointing the same
 * page at the shared database silently made index 1 Aluminium 7075, so the
 * dropdown said one thing and the pre-filled α said another.
 */
const DEFAULT_A_INDEX = Math.max(0, MATERIALS.findIndex(m => m.label === "Aluminum 6061-T6"));
const DEFAULT_B_INDEX = Math.max(0, MATERIALS.findIndex(m => m.label === "Stainless Steel 304"));

// Shape of the calculated result — null means "not yet calculated"
type Result = {
  dLa: number;   // ΔL for Material A, mm
  dLb: number;   // ΔL for Material B, mm
  dLdiff: number; // |ΔL_A − ΔL_B|, mm
  alphaDiff: number; // |α_A − α_B|, for risk classification
};

export default function CTEMismatchPage() {
  // --- Material A state ---
  const [matAIndex, setMatAIndex] = useState(DEFAULT_A_INDEX);
  const [alphaAStr, setAlphaAStr] = useState(String(MATERIALS[DEFAULT_A_INDEX].cte));

  // --- Material B state ---
  const [matBIndex, setMatBIndex] = useState(DEFAULT_B_INDEX);
  const [alphaBStr, setAlphaBStr] = useState(String(MATERIALS[DEFAULT_B_INDEX].cte));

  // --- Shared inputs ---
  const [l0Str, setL0Str]   = useState("");    // reference length, mm
  const [dtStr, setDtStr]   = useState("125"); // ΔT default = 125°C (−40 to +85)

  // --- UI state ---
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [result, setResult]   = useState<Result | null>(null);

  // When the user picks a material from the dropdown, pre-fill the alpha input
  // (unless it's Custom, in which case we leave the current value so they can type).
  function handleMatAChange(idx: number) {
    setMatAIndex(idx);
    const entry = MATERIALS[idx] as MaterialEntry;
    if (entry.cte !== null) setAlphaAStr(String(entry.cte));
  }

  function handleMatBChange(idx: number) {
    setMatBIndex(idx);
    const entry = MATERIALS[idx] as MaterialEntry;
    if (entry.cte !== null) setAlphaBStr(String(entry.cte));
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    const alphaA = parseFloat(alphaAStr);
    const alphaB = parseFloat(alphaBStr);
    const l0     = parseFloat(l0Str);
    const dt     = parseFloat(dtStr);

    if (!alphaAStr.trim() || isNaN(alphaA) || alphaA <= 0)
      errs.alphaA = "Must be a positive number.";
    if (!alphaBStr.trim() || isNaN(alphaB) || alphaB <= 0)
      errs.alphaB = "Must be a positive number.";
    if (!l0Str.trim() || isNaN(l0) || l0 <= 0)
      errs.l0 = "Reference length must be > 0.";
    if (!dtStr.trim() || isNaN(dt) || dt <= 0)
      errs.dt = "Temperature rise must be > 0.";

    return errs;
  }

  // ---------------------------------------------------------------------------
  // Calculate
  // ---------------------------------------------------------------------------
  function handleCalculate() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { setResult(null); return; }

    const alphaA = parseFloat(alphaAStr);
    const alphaB = parseFloat(alphaBStr);
    const l0     = parseFloat(l0Str);
    const dt     = parseFloat(dtStr);

    // ΔL (mm) = L0 (mm) × α (ppm/°C = 1e-6/°C) × ΔT (°C)
    // ppm/°C × 1e-6 → /°C, then × mm = mm of expansion
    const dLa = l0 * (alphaA / 1e6) * dt;
    const dLb = l0 * (alphaB / 1e6) * dt;

    setResult({
      dLa,
      dLb,
      dLdiff: Math.abs(dLa - dLb),
      alphaDiff: Math.abs(alphaA - alphaB),
    });
  }

  // ---------------------------------------------------------------------------
  // Risk level based on |α_A − α_B|
  // ---------------------------------------------------------------------------
  function getRisk(alphaDiff: number) {
    if (alphaDiff >= 20) return {
      level: "high",
      color: "red",
      message:
        "High CTE mismatch — significant interface stress expected at bonds/seals over thermal cycling. Consider isolation layer or flexible adhesive.",
    };
    if (alphaDiff >= 10) return {
      level: "moderate",
      color: "yellow",
      message:
        "Moderate mismatch — review adhesive/sealant compatibility across temperature range.",
    };
    return {
      level: "low",
      color: "green",
      message: "Low mismatch — relatively compatible thermal expansion.",
    };
  }

  const risk = result ? getRisk(result.alphaDiff) : null;

  /**
   * Δα dial. 40 ppm/°C tops the scale — that is already far past the 20 ppm/°C
   * "high mismatch" threshold, and covers everything short of bonding PTFE
   * (125) straight to quartz (0.55), which pins the needle and says so.
   */
  const ALPHA_GAUGE_MAX = 40;
  const ALPHA_ZONES: GaugeZone[] = [
    { from: 0, to: 10, tone: "good" },
    { from: 10, to: 20, tone: "warn" },
    { from: 20, to: ALPHA_GAUGE_MAX, tone: "bad" },
  ];

  // Material names for labels in the diagram
  const matAName = MATERIALS[matAIndex].label;
  const matBName = MATERIALS[matBIndex].label;

  // ---------------------------------------------------------------------------
  // SVG diagram helpers
  // ---------------------------------------------------------------------------

  // Base bar width in SVG pixels. The bar representing the larger expansion
  // gets this full width; the other is scaled proportionally.
  const SVG_BASE_W = 200;

  // Compute bar widths: normalize so the bigger one = SVG_BASE_W.
  // Before calculation, both bars are the same width (no result yet).
  const svgBarWidthA = result
    ? SVG_BASE_W * (result.dLa / Math.max(result.dLa, result.dLb, 0.001))
    : SVG_BASE_W;
  const svgBarWidthB = result
    ? SVG_BASE_W * (result.dLb / Math.max(result.dLa, result.dLb, 0.001))
    : SVG_BASE_W;

  // Bar colours: neutral grey before calculation, then A in steel-blue and B in
  // muted graphite. Two series need two separable colours, and those are the
  // two the palette gives without spending oxide-rust on ordinary data.
  const colorA = result ? "#2B4C7E" : "#98999B"; // steel-blue / neutral
  const colorB = result ? "#5F6164" : "#98999B"; // graphite 70% / neutral

  // SVG geometry constants
  const ORIGIN_X = 40;  // left edge (bonded interface)
  const BAR_A_Y1 = 30;  const BAR_A_Y2 = 70;  // top bar y extents
  const BAR_B_Y1 = 80;  const BAR_B_Y2 = 120; // bottom bar y extents

  // Right edges of each bar
  const rightA = ORIGIN_X + svgBarWidthA;
  const rightB = ORIGIN_X + svgBarWidthB;

  // Midpoints for bar labels
  const midAY = (BAR_A_Y1 + BAR_A_Y2) / 2;
  const midBY = (BAR_B_Y1 + BAR_B_Y2) / 2;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-graphite mb-1">CTE Mismatch Calculator</h1>
      <p className="text-graphite/60 text-sm mb-6">
        First-pass estimate — stress calculation requires FEA for complex geometries
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Input card                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg border border-panel-gray p-6 flex flex-col gap-5">

        {/* Two-column layout: Material A (left) and Material B (right) */}
        <div className="grid grid-cols-2 gap-4">

          {/* --- Material A --- */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-graphite/80 border-b border-panel-gray pb-1">
              Material A
            </h3>

            {/* Material A dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-graphite/80">Material</label>
              <select
                value={matAIndex}
                onChange={(e) => handleMatAChange(Number(e.target.value))}
                className="rounded-lg border border-graphite/20 bg-white px-3 py-2 text-sm transition"
              >
                {MATERIALS.map((m, i) => (
                  <option key={m.label} value={i}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Alpha A — pre-filled from dropdown, editable for fine-tuning or Custom */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-graphite/80">α (ppm/°C)</label>
              <input
                type="number"
                value={alphaAStr}
                onChange={(e) => setAlphaAStr(e.target.value)}
                placeholder="e.g. 23.6"
                className={`
 rounded-lg border px-3 py-2 text-sm
 transition
 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
 ${errors.alphaA ? "border-signal-red-line bg-signal-red-tint" : "border-graphite/20 bg-white"}
 `}
              />
              {errors.alphaA && <p className="text-xs text-signal-red">{errors.alphaA}</p>}
              <p className="text-xs text-graphite/50">CTE in ppm/°C (= µm/m·°C)</p>
            </div>
          </div>

          {/* --- Material B --- */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-graphite/80 border-b border-panel-gray pb-1">
              Material B
            </h3>

            {/* Material B dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-graphite/80">Material</label>
              <select
                value={matBIndex}
                onChange={(e) => handleMatBChange(Number(e.target.value))}
                className="rounded-lg border border-graphite/20 bg-white px-3 py-2 text-sm transition"
              >
                {MATERIALS.map((m, i) => (
                  <option key={m.label} value={i}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Alpha B */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-graphite/80">α (ppm/°C)</label>
              <input
                type="number"
                value={alphaBStr}
                onChange={(e) => setAlphaBStr(e.target.value)}
                placeholder="e.g. 17.3"
                className={`
 rounded-lg border px-3 py-2 text-sm
 transition
 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
 ${errors.alphaB ? "border-signal-red-line bg-signal-red-tint" : "border-graphite/20 bg-white"}
 `}
              />
              {errors.alphaB && <p className="text-xs text-signal-red">{errors.alphaB}</p>}
              <p className="text-xs text-graphite/50">CTE in ppm/°C (= µm/m·°C)</p>
              <MaterialsDbLink className="mt-1" />
            </div>
          </div>
        </div>

        {/* Shared inputs — reference length and temperature rise */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-graphite/80">Reference Length L₀</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={l0Str}
                onChange={(e) => setL0Str(e.target.value)}
                placeholder="e.g. 100"
                className={`
 flex-1 rounded-lg border px-3 py-2 text-sm font-mono tabular-nums
 transition
 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
 ${errors.l0 ? "border-signal-red-line bg-signal-red-tint" : "border-graphite/20 bg-white"}
 `}
              />
              <span className="unit-chip min-w-[3.5rem]">
                mm
              </span>
            </div>
            {errors.l0 && <p className="text-xs text-signal-red">{errors.l0}</p>}
            <p className="text-xs text-graphite/50">
              Bond length or dimension of interest
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-graphite/80">Temperature Rise ΔT</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dtStr}
                onChange={(e) => setDtStr(e.target.value)}
                placeholder="e.g. 125"
                className={`
 flex-1 rounded-lg border px-3 py-2 text-sm font-mono tabular-nums
 transition
 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
 ${errors.dt ? "border-signal-red-line bg-signal-red-tint" : "border-graphite/20 bg-white"}
 `}
              />
              <span className="unit-chip min-w-[3.5rem]">
                °C
              </span>
            </div>
            {errors.dt && <p className="text-xs text-signal-red">{errors.dt}</p>}
            <p className="text-xs text-graphite/50">
              Default 125°C = −40 to +85°C range
            </p>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="btn-primary"
        >
          Calculate
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SVG diagram — always visible, updates after calculation             */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6 bg-white rounded-lg border border-panel-gray p-4">
        <p className="text-xs text-graphite/60 mb-2 font-medium">
          Relative expansion diagram (not to scale)
        </p>
        <svg
          viewBox="0 0 340 160"
          className="w-full"
          aria-label="CTE expansion diagram showing two material bars"
        >
          {/* ----- Bonded interface: dashed vertical line at x=ORIGIN_X ----- */}
          <line
            x1={ORIGIN_X} y1={20}
            x2={ORIGIN_X} y2={130}
            stroke="#5F6164"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {/* "Interface" label below the dashed line */}
          <text
            x={ORIGIN_X} y={145}
            textAnchor="middle"
            fontSize="9"
            fill="#5F6164"
          >
            bonded interface
          </text>

          {/* ----- Material A bar (top) ----- */}
          <rect
            x={ORIGIN_X}
            y={BAR_A_Y1}
            width={svgBarWidthA}
            height={BAR_A_Y2 - BAR_A_Y1}
            fill={colorA}
            rx="3"
            opacity="0.85"
          />
          {/* Material A label inside bar */}
          <text
            x={ORIGIN_X + Math.min(svgBarWidthA / 2, 100)}
            y={midAY + 4}
            textAnchor="middle"
            fontSize="10"
            fill="white"
            fontWeight="600"
          >
            A: {matAName.length > 14 ? matAName.slice(0, 13) + "…" : matAName}
          </text>

          {/* Right-pointing arrow at end of bar A */}
          <line
            x1={rightA}      y1={midAY}
            x2={rightA + 12} y2={midAY}
            stroke={colorA}  strokeWidth="1.5"
            markerEnd="url(#arrowA)"
          />

          {/* ΔL_A label above bar A's right end */}
          <text
            x={rightA + 6}
            y={BAR_A_Y1 - 4}
            textAnchor="middle"
            fontSize="9"
            fill="#2B4C7E"
          >
            {result ? `ΔL_A=${result.dLa.toFixed(4)}mm` : "ΔL_A"}
          </text>

          {/* ----- Material B bar (bottom) ----- */}
          <rect
            x={ORIGIN_X}
            y={BAR_B_Y1}
            width={svgBarWidthB}
            height={BAR_B_Y2 - BAR_B_Y1}
            fill={colorB}
            rx="3"
            opacity="0.85"
          />
          {/* Material B label inside bar */}
          <text
            x={ORIGIN_X + Math.min(svgBarWidthB / 2, 100)}
            y={midBY + 4}
            textAnchor="middle"
            fontSize="10"
            fill="white"
            fontWeight="600"
          >
            B: {matBName.length > 14 ? matBName.slice(0, 13) + "…" : matBName}
          </text>

          {/* Right-pointing arrow at end of bar B */}
          <line
            x1={rightB}      y1={midBY}
            x2={rightB + 12} y2={midBY}
            stroke={colorB}  strokeWidth="1.5"
            markerEnd="url(#arrowB)"
          />

          {/* ΔL_B label below bar B's right end */}
          <text
            x={rightB + 6}
            y={BAR_B_Y2 + 13}
            textAnchor="middle"
            fontSize="9"
            fill="#5F6164"
          >
            {result ? `ΔL_B=${result.dLb.toFixed(4)}mm` : "ΔL_B"}
          </text>

          {/* ----- Double-headed arrow for ΔL_diff (only when bars differ) ----- */}
          {result && result.dLdiff > 0 && (
            <>
              {/* Vertical brace between the two right ends */}
              <line
                x1={Math.max(rightA, rightB) + 18}
                y1={BAR_A_Y2}
                x2={Math.max(rightA, rightB) + 18}
                y2={BAR_B_Y1}
                stroke="#9B3B3E"
                strokeWidth="1.5"
                markerEnd="url(#arrowDiff)"
                markerStart="url(#arrowDiffStart)"
              />
              <text
                x={Math.max(rightA, rightB) + 28}
                y={(BAR_A_Y2 + BAR_B_Y1) / 2 + 4}
                fontSize="9"
                fill="#9B3B3E"
              >
                Δdiff
              </text>
            </>
          )}

          {/* ----- SVG arrow marker definitions ----- */}
          <defs>
            <marker id="arrowA" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#2B4C7E" />
            </marker>
            <marker id="arrowB" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#5F6164" />
            </marker>
            {/* Red arrowhead pointing down (for diff arrow end) */}
            <marker id="arrowDiff" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#9B3B3E" />
            </marker>
            {/* Red arrowhead pointing up (for diff arrow start) */}
            <marker id="arrowDiffStart" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
              <path d="M0,0 L6,3 L0,6 Z" fill="#9B3B3E" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Results card                                                        */}
      {/* ------------------------------------------------------------------ */}
      {result && (
        <div className="panel mt-6 p-6">
          <h2 className="label-caps mb-5">Results</h2>

          {/* Side-by-side ΔL_A and ΔL_B.
              A is marked steel-blue and B muted graphite — matching the bar
              colours in the diagram above, which is what the old blue/violet
              pair was doing before violet left the palette. */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="subpanel border-l-2 border-l-steel-blue px-3 py-3 text-center">
              <p className="label-caps mb-1">ΔL_A (mm)</p>
              <p className="readout text-xl">{result.dLa.toFixed(5)}</p>
              <p className="mt-1 text-xs text-graphite/50">{matAName}</p>
            </div>
            <div className="subpanel border-l-2 border-l-graphite/40 px-3 py-3 text-center">
              <p className="label-caps mb-1">ΔL_B (mm)</p>
              <p className="readout text-xl">{result.dLb.toFixed(5)}</p>
              <p className="mt-1 text-xs text-graphite/50">{matBName}</p>
            </div>
          </div>

          {/* Differential expansion — the primary result. */}
          <div className="mb-5 border-y border-panel-gray py-4 text-center">
            <p className="readout text-3xl">{result.dLdiff.toFixed(5)}</p>
            <p className="mt-0.5 font-mono text-sm text-graphite/60">mm</p>
            <p className="label-caps mt-1">Differential expansion |ΔL_A − ΔL_B|</p>
          </div>

          {/*
            The dial grades |Δα| rather than ΔL_diff: mismatch risk is a property
            of the material pair, so it doesn't change when the user edits the
            bond length. ΔL_diff above is what that mismatch costs on *this*
            geometry.
          */}
          {risk && (
            <div className="mb-5">
              <Gauge
                value={result.alphaDiff}
                min={0}
                max={ALPHA_GAUGE_MAX}
                zones={ALPHA_ZONES}
                label="CTE mismatch |Δα|"
                unit="ppm/°C"
                decimals={1}
                statusText={risk.message}
              />
            </div>
          )}

          {/* Formula with substituted values — helps beginners see what was computed */}
          <p className="subpanel px-3 py-2 font-mono text-xs leading-5 text-graphite/70">
            ΔL_A = {l0Str} × ({alphaAStr} / 1 000 000) × {dtStr} = {result.dLa.toFixed(5)} mm
            <br />
            ΔL_B = {l0Str} × ({alphaBStr} / 1 000 000) × {dtStr} = {result.dLb.toFixed(5)} mm
            <br />
            ΔL_diff = |{result.dLa.toFixed(5)} − {result.dLb.toFixed(5)}| = {result.dLdiff.toFixed(5)} mm
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Disclaimer                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6 bg-signal-amber-tint border border-signal-amber-line rounded-lg p-5">
        <p className="text-xs text-signal-amber-deep leading-relaxed">
          <span className="font-semibold">First-pass estimate.</span> CTE values are typical — verify
          with material spec sheets, especially for composites and polymers which vary with
          layup/formulation. Differential expansion causes shear stress at bonded interfaces;
          structural adequacy requires FEA for complex joints.
        </p>
      </div>
    </div>
  );
}
