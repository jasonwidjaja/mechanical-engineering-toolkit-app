/**
 * O-Ring Squeeze Ratio Calculator
 *
 * Formula: Squeeze % = ((W − G) / W) × 100
 *   W = O-ring free cross-section (wire) diameter (mm)
 *   G = groove depth (mm), measured from groove floor to mating surface face
 *
 * The result reads on a dial whose zones come from the Parker O-Ring Handbook
 * target ranges:
 *   Static:  15–30% in spec | 10–15% or 30–35% marginal | outside is out of spec
 *   Dynamic: 10–20% in spec |  7–10% or 20–25% marginal | outside is out of spec
 *
 * The SVG cross-section diagram (imported from src/components/) updates live
 * as the user types, even before hitting Calculate.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import OringCrossSectionDiagram from "@/components/OringCrossSectionDiagram";
import Gauge from "@/components/ui/Gauge";
import {
  AS568_CROSS_SECTIONS,
  SealType,
  getSqueezeStatus,
  getSqueezeZones,
  SQUEEZE_GAUGE_MAX,
} from "@/lib/oring-constants";

export default function OringSqueezeCalculatorPage() {
  // --- State ---
  const [sealType,    setSealType]    = useState<SealType>("static");
  const [wSelection,  setWSelection]  = useState("3.53"); // default 3.53 mm (series -200)
  const [wCustom,     setWCustom]     = useState("");
  const [G,           setG]           = useState("");
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    squeeze: number;
    status: "green" | "yellow" | "red";
    message: string;
  } | null>(null);

  // Is the user in custom-entry mode?
  const isCustom = wSelection === "custom";

  // Actual W to use in the formula (number or NaN)
  const W_num = isCustom ? parseFloat(wCustom) : parseFloat(wSelection);
  const G_num = parseFloat(G);

  // For the live SVG preview, fall back to sensible defaults when inputs are blank
  const svgW = (!isNaN(W_num) && W_num > 0) ? W_num : 3.53;
  const svgG = (!isNaN(G_num) && G_num > 0) ? G_num : svgW * 0.80; // ~20% squeeze default

  // --- Validation ---
  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (isCustom) {
      if (!wCustom.trim()) errs.w = "Enter an O-ring cross-section diameter.";
      else if (isNaN(W_num) || W_num <= 0) errs.w = "Must be a positive number.";
    }
    const gVal = parseFloat(G);
    if (!G.trim()) {
      errs.g = "Groove depth is required.";
    } else if (isNaN(gVal) || gVal <= 0) {
      errs.g = "Must be a positive number.";
    } else if (!isNaN(W_num) && gVal >= W_num) {
      errs.g = `Must be less than W (${W_num} mm) — a groove deeper than W produces no squeeze.`;
    }
    return errs;
  }

  function handleCalculate() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { setResult(null); return; }

    const squeeze = ((W_num - G_num) / W_num) * 100;
    setResult({ squeeze, ...getSqueezeStatus(squeeze, sealType) });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-graphite mb-1">O-Ring Squeeze Calculator</h1>
      <p className="text-sm text-graphite/60 mb-6">
        Calculates how much an O-ring is compressed when a groove closes.{" "}
        <span className="font-mono bg-panel-gray px-1 rounded text-xs">
          Squeeze % = (W − G) / W × 100
        </span>
        {" "}— where W is the O-ring wire diameter and G is the groove depth.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── LEFT: Inputs ── */}
        <div className="flex flex-col gap-4">

          {/* Seal type selector */}
          <div className="bg-white rounded-lg border border-panel-gray p-5">
            <p className="text-sm font-semibold text-graphite/80 mb-3">Seal Type</p>
            <div className="flex gap-5">
              {(["static", "dynamic"] as SealType[]).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    checked={sealType === t}
                    onChange={() => { setSealType(t); setResult(null); }}
                    className="accent-steel-blue"
                  />
                  <span className="text-sm capitalize text-graphite/80">{t}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-graphite/50">
              {sealType === "static"
                ? "No relative motion between surfaces — target 15–30% squeeze."
                : "Reciprocating or oscillating motion — target 10–20% squeeze."}
            </p>
          </div>

          {/* O-ring cross-section W */}
          <div className="bg-white rounded-lg border border-panel-gray p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-graphite/80">O-Ring Cross-Section Diameter (W)</p>
            {/* Dropdown of standard AS568 sizes + Custom option */}
            <select
              value={wSelection}
              onChange={e => { setWSelection(e.target.value); setErrors({}); setResult(null); }}
              className="w-full border border-graphite/20 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {AS568_CROSS_SECTIONS.map(s => (
                <option key={s.w} value={String(s.w)}>{s.label}</option>
              ))}
              <option value="custom">Custom…</option>
            </select>
            {/* Custom input — only visible when "Custom…" is selected */}
            {isCustom && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={wCustom}
                  onChange={e => { setWCustom(e.target.value); setErrors({}); setResult(null); }}
                  placeholder="e.g. 4.0"
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm
 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
 ${errors.w ? "border-signal-red-line bg-signal-red-tint" : "border-graphite/20"}`}
                />
                <span className="text-sm text-graphite/60 bg-panel-gray border border-panel-gray rounded-md px-3 py-2">mm</span>
              </div>
            )}
            {errors.w && <p className="text-xs text-signal-red">{errors.w}</p>}
          </div>

          {/* Groove depth G */}
          <div className="bg-white rounded-lg border border-panel-gray p-5">
            <p className="text-sm font-semibold text-graphite/80 mb-2">Groove Depth (G)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={G}
                onChange={e => { setG(e.target.value); setResult(null); }}
                placeholder={`e.g. ${(svgW * 0.80).toFixed(2)}`}
                className={`flex-1 border rounded-lg px-3 py-2 text-sm
 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
 ${errors.g ? "border-signal-red-line bg-signal-red-tint" : "border-graphite/20"}`}
              />
              <span className="text-sm text-graphite/60 bg-panel-gray border border-panel-gray rounded-md px-3 py-2">mm</span>
            </div>
            {errors.g && <p className="text-xs text-signal-red">{errors.g}</p>}
            <p className="mt-1 text-xs text-graphite/50">
              Measured from groove floor to the mating surface face (closed groove height)
            </p>
          </div>

          <button
            onClick={handleCalculate}
            className="w-full bg-steel-blue hover:bg-steel-blue-deep text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            Calculate Squeeze
          </button>

          {/* Result — the dial replaces the old colour-coded text badge, so the
              margin to each threshold is visible rather than just the verdict. */}
          {result && (
            <div className="panel p-5">
              <Gauge
                value={result.squeeze}
                min={0}
                max={SQUEEZE_GAUGE_MAX}
                zones={getSqueezeZones(sealType)}
                label="Squeeze"
                unit="%"
                decimals={1}
                statusText={result.message}
              />
              <p className="mt-4 border-t border-panel-gray pt-3 text-center font-mono text-xs text-graphite/50">
                ({W_num} − {G_num.toFixed(2)}) / {W_num} × 100
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Live SVG diagram ── */}
        <div className="bg-white rounded-lg border border-panel-gray p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-graphite/80 mb-3">Cross-Section View</h2>
          {/* The diagram updates live as W/G change — no Calculate needed to see it */}
          <OringCrossSectionDiagram
            W={svgW}
            G={svgG}
            status={result?.status ?? null}
          />
          <p className="mt-2 text-xs text-graphite/50 text-center">
            Dashed circle = free state (diameter W) · Solid ellipse = compressed (height G)
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 bg-signal-amber-tint border border-signal-amber-line rounded-lg px-4 py-3 text-xs text-signal-amber-deep">
        <strong>Starting point estimate.</strong> Final groove dimensions should be verified against
        the O-ring manufacturer&#39;s groove design charts (e.g.,{" "}
        <em>Parker O-Ring Handbook ORD 5700</em>) and must account for thermal expansion,
        O-ring material swell in the process fluid, and compression set over service life.
      </div>
    </div>
  );
}
