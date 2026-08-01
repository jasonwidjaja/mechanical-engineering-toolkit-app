/**
 * Heat Sink Sizing Estimator
 *
 * Formula:
 *   R_required (°C/W) = (T_max − T_ambient) / P
 *
 *   R_required is the maximum total thermal resistance (junction-to-ambient)
 *   the cooling solution can have while still keeping the component below T_max.
 *
 *   The result is compared against typical heat sink R_sa ranges so the engineer
 *   can quickly narrow down what class of cooling is needed (natural vs. forced
 *   vs. liquid).
 *
 * This is a first-pass estimate — it does not account for junction-to-case or
 * case-to-sink resistances, which must be subtracted from R_required in practice.
 */

// "use client" — required because we use React hooks (useState) for interactivity.
// Without this directive, Next.js would render this on the server where there is
// no browser event system, and useState would fail.
"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Result shape — a dedicated type keeps the code readable and type-safe.
type Result = {
  rRequired: number; // °C/W — the maximum allowable thermal resistance
};

// ---------------------------------------------------------------------------
// Guidance config
// ---------------------------------------------------------------------------
// Each entry describes a band of R_required values and what cooling strategy
// it implies. The bands are checked in order, so we use >= comparisons.

type GuidanceBand = {
  min: number;           // lower bound (inclusive)
  max: number;           // upper bound (exclusive); Infinity for the last band
  badge: string;         // short label inside the colored badge
  color: "red" | "orange" | "yellow" | "green";
  explanation: string;   // human-readable guidance shown below the badge
};

const GUIDANCE_BANDS: GuidanceBand[] = [
  {
    min: 0,
    max: 1,
    badge: "< 1 °C/W",
    color: "red",
    explanation: "< 1°C/W — liquid cooling or large forced-air system likely required",
  },
  {
    min: 1,
    max: 2,
    badge: "1–2 °C/W",
    color: "orange",
    explanation: "1–2°C/W — forced-air with a medium to large heat sink",
  },
  {
    min: 2,
    max: 5,
    badge: "2–5 °C/W",
    color: "yellow",
    explanation: "2–5°C/W — forced-air convection or a large natural convection sink",
  },
  {
    min: 5,
    max: 10,
    badge: "5–10 °C/W",
    color: "green",
    explanation: "5–10°C/W — natural convection with a moderate-sized heat sink",
  },
  {
    min: 10,
    max: Infinity,
    badge: "≥ 10 °C/W",
    color: "green",
    explanation: "≥ 10°C/W — natural convection likely sufficient; small sink or PCB spreading may work",
  },
];

// Tailwind class sets for each badge color.
// We keep them as full strings (not dynamic fragments) so Tailwind's
// class-scanner can find them at build time and include them in the CSS.
// Each value is a complete set of Tailwind classes as full strings.
// IMPORTANT: never build class names with template-literal fragments like
// `border-${color}-200` — Tailwind's static scanner won't see them and they
// will be purged from the production CSS bundle. All classes must appear as
// complete, literal strings somewhere in the source.
const BADGE_CLASSES: Record<GuidanceBand["color"], { badge: string; text: string; bg: string; border: string }> = {
  red:    { badge: "bg-red-100 border-red-300 text-red-800",         text: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"    },
  orange: { badge: "bg-orange-100 border-orange-300 text-orange-800", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  yellow: { badge: "bg-yellow-100 border-yellow-300 text-yellow-800", text: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  green:  { badge: "bg-green-100 border-green-300 text-green-800",    text: "text-green-700",  bg: "bg-green-50",  border: "border-green-200"  },
};

// ---------------------------------------------------------------------------
// Reference table data
// ---------------------------------------------------------------------------
// Typical sink-to-ambient resistance ranges. Shown as a quick lookup so the
// user can cross-reference their R_required against real product categories.
const REFERENCE_TABLE = [
  { type: "Natural convection, small (~25 cm²)",   range: "15 – 25" },
  { type: "Natural convection, large (~100 cm²)",  range: "5 – 15"  },
  { type: "Forced air, small fan",                 range: "2 – 8"   },
  { type: "Forced air, large fan",                 range: "0.5 – 3" },
  { type: "Liquid cold plate",                     range: "0.1 – 0.5" },
];

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function HeatsinkSizingPage() {
  // ── State ──
  // Strings for all inputs (HTML inputs return strings).
  // Default values are pre-filled with common engineering starting points.
  const [pInput,       setPInput]       = useState("");
  const [tAmbInput,    setTAmbInput]    = useState("25");
  const [tMaxInput,    setTMaxInput]    = useState("85");
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [result,       setResult]       = useState<Result | null>(null);

  // ── Validation ──
  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    const p    = parseFloat(pInput);
    const tAmb = parseFloat(tAmbInput);
    const tMax = parseFloat(tMaxInput);

    if (!pInput.trim())           errs.p    = "Power dissipation is required.";
    else if (isNaN(p) || p <= 0)  errs.p    = "Must be a positive number.";

    if (!tAmbInput.trim())           errs.tAmb = "Ambient temperature is required.";
    else if (isNaN(tAmb))            errs.tAmb = "Must be a number.";

    if (!tMaxInput.trim())           errs.tMax = "Max component temperature is required.";
    else if (isNaN(tMax))            errs.tMax = "Must be a number.";

    // Cross-field validation: T_max must be strictly above T_ambient
    if (!errs.tAmb && !errs.tMax && tMax <= tAmb) {
      errs.tMax = "T_max must be greater than T_ambient.";
    }

    return errs;
  }

  function handleCalculate() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { setResult(null); return; }

    const p    = parseFloat(pInput);
    const tAmb = parseFloat(tAmbInput);
    const tMax = parseFloat(tMaxInput);

    // Core formula
    const rRequired = (tMax - tAmb) / p;

    setResult({ rRequired });
  }

  // Find which guidance band the result falls in.
  // Array.find returns the first match; because bands are non-overlapping and
  // sorted, there will always be exactly one match for any positive number.
  const guidance = result
    ? GUIDANCE_BANDS.find(
        (b) => result.rRequired >= b.min && result.rRequired < b.max
      )!
    : null;

  const formulaLine = result
    ? `R = (${tMaxInput} − ${tAmbInput}) °C / ${pInput} W = ${result.rRequired.toFixed(2)} °C/W`
    : null;

  return (
    <div className="max-w-lg mx-auto">

      {/* Back navigation */}
      <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
        ← Back to all calculators
      </Link>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Heat Sink Sizing Estimator
      </h1>

      {/* Accuracy label */}
      <p className="text-amber-700 text-sm font-medium mb-6">
        First-pass estimate — not CFD-accurate
      </p>

      {/* ── Input card ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">

        {/* P — power dissipation */}
        <InputField
          label="Power Dissipation P"
          unit="W"
          value={pInput}
          onChange={(v) => { setPInput(v); setResult(null); }}
          error={errors.p}
          placeholder="e.g. 25"
          hint="Total heat the component generates under worst-case load."
        />

        {/* T_ambient */}
        <InputField
          label="Ambient Temperature T_ambient"
          unit="°C"
          value={tAmbInput}
          onChange={(v) => { setTAmbInput(v); setResult(null); }}
          error={errors.tAmb}
          placeholder="e.g. 25"
          hint="Temperature of the air or fluid surrounding the heat sink."
        />

        {/* T_max */}
        <InputField
          label="Max Component Temperature T_max"
          unit="°C"
          value={tMaxInput}
          onChange={(v) => { setTMaxInput(v); setResult(null); }}
          error={errors.tMax}
          placeholder="e.g. 85"
          hint="Maximum allowable case or junction temperature (from datasheet)."
        />

        {/* Calculate button */}
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          Calculate
        </button>
      </div>

      {/* ── Results card — only rendered when we have a valid result ── */}
      {result && guidance && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Result</h2>

          {/* Big R_required number */}
          <div className="bg-blue-600 border border-blue-700 rounded-lg px-4 py-4 text-center mb-4">
            <p className="text-xs font-semibold text-blue-200 mb-1">R_required</p>
            <p className="text-3xl font-bold text-white leading-tight">
              {result.rRequired.toFixed(2)}
            </p>
            <p className="text-xs text-blue-300 mt-1">°C/W</p>
          </div>

          {/*
            Color-coded guidance badge.
            The badge color communicates feasibility at a glance:
            green = easy to achieve, red = challenging / expensive.
          */}
          <div className={`rounded-lg border px-4 py-3 ${BADGE_CLASSES[guidance.color].bg} ${BADGE_CLASSES[guidance.color].border}`}>
            {/* Colored pill badge */}
            <span
              className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border mr-2 ${BADGE_CLASSES[guidance.color].badge}`}
            >
              {guidance.badge}
            </span>
            {/* Explanation text */}
            <span className={`text-sm font-medium ${BADGE_CLASSES[guidance.color].text}`}>
              {guidance.explanation}
            </span>
          </div>

          {/* Formula line — shows the exact values substituted in */}
          <p className="mt-4 text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2 font-mono">
            {formulaLine}
          </p>

          {/*
            Small note reminding the engineer that this is the total R,
            not just the heatsink R — they need to subtract θ_jc and θ_cs.
          */}
          <p className="mt-3 text-xs text-blue-600">
            <strong>Note:</strong> R_required is the total junction-to-ambient budget. To find the required
            heat-sink R_sa, subtract the junction-to-case (θ_jc) and case-to-sink (θ_cs) resistances
            from the component datasheet:&nbsp;
            <span className="font-mono">R_sa = R_required − θ_jc − θ_cs</span>
          </p>
        </div>
      )}

      {/* ── Reference table — always visible ── */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Typical Heat Sink R_sa Reference
        </h3>
        <table className="w-full text-xs text-gray-600">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-2 font-medium text-gray-500">Heat sink type</th>
              <th className="text-right pb-2 font-medium text-gray-500">Typical R_sa (°C/W)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {REFERENCE_TABLE.map(({ type, range }) => (
              <tr key={type}>
                <td className="py-1.5 pr-4">{type}</td>
                <td className="py-1.5 text-right font-mono">{range}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-400">
          Values are approximate and vary widely with fin geometry, airflow velocity, and orientation.
          Always consult the manufacturer datasheet for the specific part.
        </p>
      </div>

      {/* ── Disclaimer card ── */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">Important limitations</h3>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>This formula gives the total thermal budget, not the heat-sink resistance alone.</li>
          <li>θ_jc and θ_cs (from the component datasheet) must be subtracted to get R_sa.</li>
          <li>Does not account for PCB spreading resistance or adjacent component heat load.</li>
          <li>Verify with thermal simulation (CFD) or thermocouple measurement before sign-off.</li>
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * InputField — reusable labeled number input with unit badge, error, and hint.
 *
 * The three [appearance:...] Tailwind classes hide the browser's built-in
 * number spinner arrows across all browsers (Chrome uses the webkit prefixed
 * pseudo-elements; Firefox respects the standard appearance property).
 */
type InputFieldProps = {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
};

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
            [appearance:textfield]
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
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
