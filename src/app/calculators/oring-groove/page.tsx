/**
 * O-Ring Groove Sizing Calculator (reverse direction)
 *
 * Given a target squeeze %, works backwards to find the required groove depth.
 *
 * Forward formula:  Squeeze % = (W − G) / W × 100
 * Reversed:         G = W × (1 − Squeeze% / 100)
 *
 * Also outputs groove width:
 *   Width_min = 1.3 × W  (lower bound per Parker handbook)
 *   Width_max = 1.6 × W  (upper bound — more fill room)
 *   Width_suggested = multiplier × W  (user-adjustable, default 1.5)
 *
 * "Straight-run estimate" — this applies to a straight seal run (face seal
 * or bore seal). Corners of rectangular grooves need separate verification
 * because the O-ring cannot fill corner radii the same way.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import OringCrossSectionDiagram from "@/components/OringCrossSectionDiagram";
import OringGrooveComparisonDiagram from "@/components/OringGrooveComparisonDiagram";
import { AS568_CROSS_SECTIONS, SealType } from "@/lib/oring-constants";

// Default target squeeze by seal type (per Parker recommendations)
const DEFAULT_SQUEEZE: Record<SealType, string> = {
  static:  "20",
  dynamic: "15",
};

export default function OringGrooveSizingPage() {
  const [sealType,        setSealType]        = useState<SealType>("static");
  const [wSelection,      setWSelection]      = useState("3.53");
  const [wCustom,         setWCustom]         = useState("");
  const [targetSqueeze,   setTargetSqueeze]   = useState(DEFAULT_SQUEEZE.static);
  const [widthMultiplier, setWidthMultiplier] = useState("1.5");
  const [errors,          setErrors]          = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    G: number;
    widthMin: number;
    widthMax: number;
    widthSuggested: number;
  } | null>(null);

  const isCustom = wSelection === "custom";
  const W_num = isCustom ? parseFloat(wCustom) : parseFloat(wSelection);

  function handleSealTypeChange(t: SealType) {
    setSealType(t);
    setTargetSqueeze(DEFAULT_SQUEEZE[t]); // reset to the default for that type
    setResult(null);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (isCustom) {
      if (!wCustom.trim()) errs.w = "Enter an O-ring cross-section diameter.";
      else if (isNaN(W_num) || W_num <= 0) errs.w = "Must be a positive number.";
    }

    const sq = parseFloat(targetSqueeze);
    if (!targetSqueeze.trim()) errs.sq = "Target squeeze is required.";
    else if (isNaN(sq) || sq <= 0 || sq >= 100) errs.sq = "Must be between 0% and 100%.";

    const mult = parseFloat(widthMultiplier);
    if (!widthMultiplier.trim()) errs.mult = "Width multiplier is required.";
    else if (isNaN(mult) || mult <= 0) errs.mult = "Must be a positive number.";

    return errs;
  }

  function handleCalculate() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { setResult(null); return; }

    const W = W_num;
    const sq = parseFloat(targetSqueeze) / 100; // convert % to decimal
    const mult = parseFloat(widthMultiplier);

    const G            = W * (1 - sq);
    const widthMin     = 1.3 * W;
    const widthMax     = 1.6 * W;
    const widthSuggested = mult * W;

    setResult({ G, widthMin, widthMax, widthSuggested });
  }

  // SVG preview uses calculated G (or a placeholder before calculation)
  const svgW = (!isNaN(W_num) && W_num > 0) ? W_num : 3.53;
  const svgG = result ? result.G : svgW * (1 - parseFloat(targetSqueeze || "20") / 100);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">O-Ring Groove Sizing Calculator</h1>
      <p className="text-sm text-gray-500 mb-1">
        Works backwards from a target squeeze to give you the required groove depth and width.
      </p>
      <p className="text-xs text-gray-400 mb-6">
        Formula: <span className="font-mono bg-gray-100 px-1 rounded">G = W × (1 − squeeze / 100)</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── LEFT: Inputs ── */}
        <div className="flex flex-col gap-4">

          {/* Seal type */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Seal Type</p>
            <div className="flex gap-5">
              {(["static", "dynamic"] as SealType[]).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    checked={sealType === t}
                    onChange={() => handleSealTypeChange(t)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm capitalize text-gray-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* O-ring cross-section W */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700">O-Ring Cross-Section Diameter (W)</p>
            <select
              value={wSelection}
              onChange={e => { setWSelection(e.target.value); setErrors({}); setResult(null); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              {AS568_CROSS_SECTIONS.map(s => (
                <option key={s.w} value={String(s.w)}>{s.label}</option>
              ))}
              <option value="custom">Custom…</option>
            </select>
            {isCustom && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={wCustom}
                  onChange={e => { setWCustom(e.target.value); setErrors({}); setResult(null); }}
                  placeholder="e.g. 4.0"
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                    ${errors.w ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                <span className="text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-md px-3 py-2">mm</span>
              </div>
            )}
            {errors.w && <p className="text-xs text-red-600">{errors.w}</p>}
          </div>

          {/* Target squeeze % */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Target Squeeze</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={targetSqueeze}
                onChange={e => { setTargetSqueeze(e.target.value); setResult(null); }}
                className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  ${errors.sq ? "border-red-400 bg-red-50" : "border-gray-300"}`}
              />
              <span className="text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-md px-3 py-2">%</span>
            </div>
            {errors.sq && <p className="text-xs text-red-600">{errors.sq}</p>}
            <p className="mt-1 text-xs text-gray-400">
              Recommended: 15–30% (static) · 10–20% (dynamic)
            </p>
          </div>

          {/* Width multiplier */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Groove Width Multiplier</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={widthMultiplier}
                onChange={e => { setWidthMultiplier(e.target.value); setResult(null); }}
                className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  ${errors.mult ? "border-red-400 bg-red-50" : "border-gray-300"}`}
              />
              <span className="text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-md px-3 py-2">× W</span>
            </div>
            {errors.mult && <p className="text-xs text-red-600">{errors.mult}</p>}
            <p className="mt-1 text-xs text-gray-400">
              Standard range: 1.3 × W (tight) to 1.6 × W (relaxed). Default 1.5.
            </p>
          </div>

          <button
            onClick={handleCalculate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            Calculate Groove Dimensions
          </button>

          {/* Result card */}
          {result && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-blue-900 mb-4">Required Groove Dimensions</h2>
              <div className="flex flex-col gap-3">
                <DimResult
                  label="Groove depth (G)"
                  value={result.G.toFixed(3)}
                  unit="mm"
                  formula={`${W_num} × (1 − ${targetSqueeze}/100)`}
                  primary
                />
                <DimResult
                  label="Groove width (suggested)"
                  value={result.widthSuggested.toFixed(3)}
                  unit="mm"
                  formula={`${widthMultiplier} × ${W_num}`}
                />
                <div className="text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
                  Width range: {result.widthMin.toFixed(2)} mm (1.3×W) — {result.widthMax.toFixed(2)} mm (1.6×W)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: SVG diagram ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Cross-Section Preview</h2>
          <OringCrossSectionDiagram W={svgW} G={svgG} status={result ? "green" : null} />
          <p className="mt-2 text-xs text-gray-400 text-center">
            Updates with current W and target squeeze — calculate to confirm.
          </p>
        </div>
      </div>

      {/*
        ── Why groove depth matters ──
        The preview above shows the groove you're designing. This shows what
        happens if you get it wrong, next to the correct case — the failure mode
        is the whole reason the calculation exists. Uses the live W, computed G
        (falling back to the target-squeeze estimate before Calculate is
        pressed), and target squeeze so both panels track the current inputs.
      */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">
          Why groove depth matters
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          The same O-ring in a groove that&#39;s too deep, and in one sized to your target squeeze.
        </p>
        <OringGrooveComparisonDiagram
          W={svgW}
          G={svgG}
          squeezePct={parseFloat(targetSqueeze) || 20}
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
        <strong>Straight-run estimate only.</strong> This formula applies to a straight seal run
        (face seal or bore seal on a flat surface). Rectangular groove corners cannot be filled the
        same way — verify corner geometry and O-ring stretch/compression separately. Final groove
        dimensions must be confirmed against the O-ring manufacturer&#39;s groove design charts (e.g.,{" "}
        <em>Parker O-Ring Handbook ORD 5700</em>) and account for thermal expansion across the
        operating temperature range.
      </div>
    </div>
  );
}

// Small helper to display one output dimension with its formula
function DimResult({
  label, value, unit, formula, primary = false,
}: {
  label: string; value: string; unit: string; formula: string; primary?: boolean;
}) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${primary ? "bg-white border-blue-200" : "bg-blue-50/50 border-blue-100"}`}>
      <p className="text-xs text-blue-600 font-medium mb-0.5">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-gray-800">{value}</span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
      <p className="text-xs text-gray-400 font-mono mt-0.5">{formula}</p>
    </div>
  );
}
