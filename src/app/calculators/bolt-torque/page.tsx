/**
 * Bolt Torque Calculator
 *
 * Formula: T = K × F × d
 *   T = tightening torque
 *   K = torque coefficient (nut factor) — accounts for thread + bearing friction
 *   F = desired preload / clamp force
 *   d = nominal bolt diameter
 *
 * Metric:   d in mm (converted to m), F in N  → T in N·m
 * Imperial: d in inches,              F in lbf → T in lb·in
 *
 * Results are always shown in all three units (N·m, lb·ft, lb·in).
 * The unit system toggle just changes which unit is highlighted and
 * what the user types as inputs.
 */
"use client";

import { useState } from "react";
import Link from "next/link";

// --- Conversion constants ---
const NM_TO_LBFT = 0.73756;   // 1 N·m  = 0.73756 lb·ft
const NM_TO_LBIN = 8.8507;    // 1 N·m  = 8.8507  lb·in
const LBIN_TO_NM = 0.11298;   // 1 lb·in = 0.113   N·m

type UnitSystem = "metric" | "imperial";

type Result = {
  nm: number;
  lbft: number;
  lbin: number;
};

export default function BoltTorquePage() {
  // --- State ---
  const [units, setUnits] = useState<UnitSystem>("metric");
  const [diameter, setDiameter] = useState("");
  const [preload, setPreload] = useState("");
  const [kFactor, setKFactor] = useState("0.2");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);

  // Clear inputs when switching unit systems so old metric values
  // don't silently carry over as imperial values.
  function switchUnits(u: UnitSystem) {
    if (u === units) return;
    setUnits(u);
    setDiameter("");
    setPreload("");
    setResult(null);
    setErrors({});
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    const d = parseFloat(diameter);
    const f = parseFloat(preload);
    const k = parseFloat(kFactor);

    if (!diameter.trim()) errs.diameter = "Bolt diameter is required.";
    else if (isNaN(d) || d <= 0) errs.diameter = "Must be a positive number.";

    if (!preload.trim()) errs.preload = "Preload (clamp force) is required.";
    else if (isNaN(f) || f <= 0) errs.preload = "Must be a positive number.";

    if (!kFactor.trim()) errs.kFactor = "K factor is required.";
    else if (isNaN(k) || k <= 0) errs.kFactor = "Must be a positive number.";

    return errs;
  }

  function handleCalculate() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { setResult(null); return; }

    const d = parseFloat(diameter);
    const F = parseFloat(preload);
    const K = parseFloat(kFactor);

    // Calculate torque in N·m first, then derive everything else from that.
    // Metric: convert mm → m before multiplying.
    // Imperial: formula gives lb·in directly; convert to N·m for reference.
    let nm: number;
    if (units === "metric") {
      nm = K * F * (d / 1000);
    } else {
      const lbin = K * F * d;
      nm = lbin * LBIN_TO_NM;
    }

    setResult({ nm, lbft: nm * NM_TO_LBFT, lbin: nm * NM_TO_LBIN });
  }

  // Config object that changes with the unit system.
  // One place to update labels, placeholders, and hints.
  const cfg = units === "metric"
    ? {
        diamUnit: "mm",
        diamPlaceholder: "e.g. 12",
        diamHint: "Nominal diameter (e.g. M12 → 12 mm, M20 → 20 mm)",
        forceUnit: "N",
        forcePlaceholder: "e.g. 30000",
        forceHint: "Target axial force the bolt exerts when tightened",
        formulaLine: result
          ? `T = ${kFactor} × ${preload} N × ${(parseFloat(diameter) / 1000).toFixed(4)} m`
          : "",
      }
    : {
        diamUnit: "in",
        diamPlaceholder: "e.g. 0.5",
        diamHint: 'Nominal diameter (e.g. ½" bolt → 0.5 in, ¾" → 0.75 in)',
        forceUnit: "lbf",
        forcePlaceholder: "e.g. 6750",
        forceHint: "Target axial force the bolt exerts when tightened",
        formulaLine: result
          ? `T = ${kFactor} × ${preload} lbf × ${diameter} in`
          : "",
      };

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Bolt Torque Calculator</h1>
      <p className="text-gray-500 text-sm mb-4">
        Uses the nut-factor formula{" "}
        <span className="font-mono bg-gray-100 px-1 rounded">T = K × F × d</span>{" "}
        to find the tightening torque needed to reach a target clamp force.
      </p>

      {/* Unit system toggle — pill-style buttons */}
      <div className="flex gap-2 mb-6">
        {(["metric", "imperial"] as UnitSystem[]).map((u) => (
          <button
            key={u}
            onClick={() => switchUnits(u)}
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

      {/* Input form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
        <InputField
          label="Bolt Diameter"
          unit={cfg.diamUnit}
          value={diameter}
          onChange={setDiameter}
          error={errors.diameter}
          placeholder={cfg.diamPlaceholder}
          hint={cfg.diamHint}
        />
        <InputField
          label="Desired Preload (Clamp Force)"
          unit={cfg.forceUnit}
          value={preload}
          onChange={setPreload}
          error={errors.preload}
          placeholder={cfg.forcePlaceholder}
          hint={cfg.forceHint}
        />
        <InputField
          label="Torque Coefficient K"
          unit=""
          value={kFactor}
          onChange={setKFactor}
          error={errors.kFactor}
          placeholder="0.2"
          hint="Nut factor: 0.10–0.15 (lubricated) · 0.20–0.22 (plain steel) · 0.25–0.30 (stainless)"
        />
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          Calculate Torque
        </button>
      </div>

      {/* Results — three unit cards, primary one highlighted */}
      {result && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Result</h2>
          <div className="grid grid-cols-3 gap-3">
            {/* N·m is primary for metric */}
            <ResultValue
              label="N·m"
              value={result.nm.toFixed(2)}
              primary={units === "metric"}
            />
            {/* lb·ft is a common mid-range unit shown for both systems */}
            <ResultValue
              label="lb·ft"
              value={result.lbft.toFixed(2)}
              primary={false}
            />
            {/* lb·in is primary for imperial (most fastener specs in the US use lb·in) */}
            <ResultValue
              label="lb·in"
              value={result.lbin.toFixed(1)}
              primary={units === "imperial"}
            />
          </div>

          {/* Show the exact numbers plugged in — great for double-checking */}
          <p className="mt-4 text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2 font-mono">
            {cfg.formulaLine}
          </p>
        </div>
      )}

      {/* K-factor reference — embedded in the page so the user never has to look it up */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">K-Factor (Nut Factor) Reference</h3>
        <table className="w-full text-xs text-gray-600">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-2 font-medium text-gray-500">Surface / Condition</th>
              <th className="text-right pb-2 font-medium text-gray-500">K range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              ["Moly-disulfide (anti-seize)", "0.10 – 0.13"],
              ["Heavy machine oil / waxed", "0.12 – 0.15"],
              ["Cadmium plated", "0.11 – 0.15"],
              ["Zinc plated (electro)", "0.17 – 0.22"],
              ["Plain steel, as-received", "0.20 – 0.22"],
              ["Hot-dip galvanized", "0.25 – 0.30"],
              ["Stainless on stainless", "0.20 – 0.35"],
            ].map(([cond, k]) => (
              <tr key={cond}>
                <td className="py-1.5 pr-4">{cond}</td>
                <td className="py-1.5 text-right font-mono">{k}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-400">
          K varies with bolt grade, plating, lubricant, and installation method. Use a torque audit or
          tension-measuring test for safety-critical joints.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type InputFieldProps = {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
};

/**
 * Labeled number input with optional unit badge, error message, and hint.
 */
function InputField({ label, unit, value, onChange, error, placeholder, hint }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            flex-1 rounded-lg border px-3 py-2 text-sm outline-none
            focus:ring-2 focus:ring-blue-400 transition
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}
          `}
        />
        {unit && (
          <span className="text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-md px-2 py-2 min-w-[3.5rem] text-center">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

type ResultValueProps = {
  label: string;
  value: string;
  primary?: boolean;
};

/**
 * Single result tile. Primary tiles get a blue fill; secondary get a white card.
 * The visual hierarchy shows the user which unit matches their input system.
 */
function ResultValue({ label, value, primary = false }: ResultValueProps) {
  return (
    <div
      className={`rounded-lg border px-3 py-3 text-center ${
        primary
          ? "bg-blue-600 border-blue-700 text-white"
          : "bg-white border-blue-100 text-gray-800"
      }`}
    >
      <p className={`text-xs font-semibold mb-1 ${primary ? "text-blue-200" : "text-blue-500"}`}>
        {label}
      </p>
      <p className="text-xl font-bold leading-tight">{value}</p>
    </div>
  );
}
