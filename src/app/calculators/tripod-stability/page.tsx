/**
 * Tripod / Mast Tip-Over Stability Calculator
 *
 * Formula:
 *   Restoring moment  = W × 9.81 × d      [N·m]
 *   Overturning moment = F_wind × h_wind   [N·m]
 *   FS = (W × 9.81 × d) / (F_wind × h_wind)
 *
 * First-pass TIA-222 style estimate — not a substitute for full structural analysis.
 *
 * Color-coded FS badge:
 *   FS >= 2.0         → green  — Stable
 *   1.5 <= FS < 2.0   → yellow — Marginal
 *   FS < 1.5          → red    — Unstable risk
 */
"use client";

import { useState } from "react";
import Link from "next/link";

// --- Constants ---
const G = 9.81; // gravitational acceleration [m/s²]

type Result = {
  restoringMoment: number;   // [N·m]
  overturningMoment: number; // [N·m]
  fs: number;                // factor of safety
};

export default function TripodStabilityPage() {
  // --- State ---
  const [W, setW] = useState("");          // total system weight [kg]
  const [hCg, setHCg] = useState("");      // height of CG above ground [m]
  const [fWind, setFWind] = useState("");  // wind force [N]
  const [hWind, setHWind] = useState(""); // height at which wind force acts [m]
  const [d, setD] = useState("");          // base half-width / tipping edge distance [m]
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);

  // --- Validation ---
  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    const wVal = parseFloat(W);
    const hCgVal = parseFloat(hCg);
    const fWindVal = parseFloat(fWind);
    const hWindVal = parseFloat(hWind);
    const dVal = parseFloat(d);

    if (!W.trim()) errs.W = "System weight is required.";
    else if (isNaN(wVal) || wVal <= 0) errs.W = "Must be a positive number.";

    if (!hCg.trim()) errs.hCg = "CG height is required.";
    else if (isNaN(hCgVal) || hCgVal <= 0) errs.hCg = "Must be a positive number.";

    if (!fWind.trim()) errs.fWind = "Wind force is required.";
    else if (isNaN(fWindVal) || fWindVal <= 0) errs.fWind = "Must be a positive number greater than 0.";

    if (!hWind.trim()) errs.hWind = "Wind force height is required.";
    else if (isNaN(hWindVal) || hWindVal <= 0) errs.hWind = "Must be a positive number greater than 0.";

    if (!d.trim()) errs.d = "Base half-width is required.";
    else if (isNaN(dVal) || dVal <= 0) errs.d = "Must be a positive number.";

    return errs;
  }

  function handleCalculate() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { setResult(null); return; }

    const wVal = parseFloat(W);
    const fWindVal = parseFloat(fWind);
    const hWindVal = parseFloat(hWind);
    const dVal = parseFloat(d);

    const restoringMoment = wVal * G * dVal;
    const overturningMoment = fWindVal * hWindVal;
    const fs = restoringMoment / overturningMoment;

    setResult({ restoringMoment, overturningMoment, fs });
  }

  // --- FS badge config ---
  const fsBadge = result
    ? result.fs >= 2.0
      ? {
          color: "bg-green-100 border-green-300 text-green-800",
          labelColor: "text-green-600",
          message: "Stable. FS ≥ 2.0 — meets typical structural safety factor.",
        }
      : result.fs >= 1.5
      ? {
          color: "bg-yellow-100 border-yellow-300 text-yellow-800",
          labelColor: "text-yellow-600",
          message: "Marginal. FS between 1.5 and 2.0 — review loading assumptions.",
        }
      : {
          color: "bg-red-100 border-red-300 text-red-800",
          labelColor: "text-red-600",
          message: "Unstable risk. FS < 1.5 — redesign base or reduce wind exposure.",
        }
    : null;

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Tripod / Mast Tip-Over Stability</h1>
      <p className="text-gray-500 text-sm mb-6">
        Factor of safety against overturning —{" "}
        <span className="font-mono bg-gray-100 px-1 rounded">first-pass TIA-222 estimate</span>
      </p>

      {/* Conceptual SVG diagram */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex justify-center">
        <TripodDiagram />
      </div>

      {/* Input form — one white card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
        <InputField
          label="W — Total System Weight"
          unit="kg"
          value={W}
          onChange={setW}
          error={errors.W}
          placeholder="e.g. 150"
          hint="Combined weight of mast, payload, and hardware"
        />
        <InputField
          label="h_cg — Height of Center of Gravity"
          unit="m"
          value={hCg}
          onChange={setHCg}
          error={errors.hCg}
          placeholder="e.g. 2.5"
          hint="Vertical distance from ground to the system center of gravity"
        />
        <InputField
          label="F_wind — Wind Force"
          unit="N"
          value={fWind}
          onChange={setFWind}
          error={errors.fWind}
          placeholder="e.g. 500"
          hint="Lateral wind force — can be pasted from the Wind Load Calculator output"
        />
        <InputField
          label="h_wind — Height of Wind Force Application"
          unit="m"
          value={hWind}
          onChange={setHWind}
          error={errors.hWind}
          placeholder="e.g. 4.0"
          hint="Effective height at which the wind force acts (often ~60–70% of mast height)"
        />
        <InputField
          label="d — Base Footprint Half-Width"
          unit="m"
          value={d}
          onChange={setD}
          error={errors.d}
          placeholder="e.g. 1.2"
          hint="Distance from the mast centerline to the tipping edge (outermost foot)"
        />
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          Calculate Factor of Safety
        </button>
      </div>

      {/* Results */}
      {result && fsBadge && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Result</h2>

          {/* FS primary value */}
          <div className="flex flex-col items-center gap-2 mb-5">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
              Factor of Safety
            </p>
            <p className="text-5xl font-bold text-blue-700">{result.fs.toFixed(2)}</p>
          </div>

          {/* Color-coded status badge */}
          <div className={`rounded-lg border px-4 py-3 text-sm font-medium mb-5 ${fsBadge.color}`}>
            {fsBadge.message}
          </div>

          {/* Moment breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MomentCard
              label="Restoring Moment"
              value={`${result.restoringMoment.toFixed(1)} N·m`}
              sub="W × g × d"
              color="text-green-700 bg-green-50 border-green-200"
            />
            <MomentCard
              label="Overturning Moment"
              value={`${result.overturningMoment.toFixed(1)} N·m`}
              sub="F_wind × h_wind"
              color="text-red-700 bg-red-50 border-red-200"
            />
          </div>

          {/* Formula recap */}
          <p className="text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2 font-mono">
            FS = ({W} kg × 9.81 × {d} m) / ({fWind} N × {hWind} m) = {result.fs.toFixed(3)}
          </p>
        </div>
      )}

      {/* Reference note */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes & Assumptions</h3>
        <ul className="text-xs text-gray-500 space-y-1.5 list-disc list-inside">
          <li>Tipping is assumed about the downwind foot (worst-case single-axis overturning).</li>
          <li>Wind force and application height should come from a full wind load analysis (e.g., ASCE 7 or TIA-222).</li>
          <li>This is a first-pass estimate only — does not account for dynamic loads, soil conditions, or anchor bolt capacity.</li>
          <li>Typical minimum FS for temporary structures: 1.5. Permanent structures: 2.0+.</li>
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Diagram — conceptual side view, not to scale
// ---------------------------------------------------------------------------

/**
 * TripodDiagram renders a side-view illustration of a tripod/mast with labeled
 * force and dimension annotations. Viewbox 320×220. Purely illustrative.
 */
function TripodDiagram() {
  return (
    <svg
      viewBox="0 0 320 220"
      width="320"
      height="220"
      aria-label="Tripod stability diagram — side view"
    >
      {/* ── Ground line ── */}
      <line x1="20" y1="190" x2="300" y2="190" stroke="#374151" strokeWidth="2" />

      {/* ── Mast/tower body — gray filled rectangle ── */}
      <rect x="148" y="60" width="24" height="130" fill="#9ca3af" stroke="#6b7280" strokeWidth="1.5" />

      {/* ── Payload box at top ── */}
      <rect x="138" y="30" width="44" height="30" rx="2" fill="#9ca3af" stroke="#6b7280" strokeWidth="1.5" />

      {/* ── Tripod left leg ── */}
      <line x1="160" y1="60" x2="80" y2="190" stroke="#6b7280" strokeWidth="2.5" />

      {/* ── Tripod right leg ── */}
      <line x1="160" y1="60" x2="240" y2="190" stroke="#6b7280" strokeWidth="2.5" />

      {/* ── 3rd (center) leg — dotted, visible in side view ── */}
      <line x1="160" y1="60" x2="160" y2="190" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="5 3" />

      {/* ── CG marker — purple × at (160, 100) ── */}
      <text x="160" y="104" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#7c3aed">×</text>
      <text x="169" y="100" fontSize="10" fill="#7c3aed" fontWeight="600">CG</text>

      {/* ── h_cg dimension — dashed vertical line left side from y=190 to y=100 ── */}
      <line x1="48" y1="190" x2="48" y2="100" stroke="#475569" strokeWidth="1" strokeDasharray="4 3" />
      {/* Arrow tip pointing up */}
      <polygon points="48,96 44,106 52,106" fill="#475569" />
      {/* Arrow base at ground */}
      <line x1="44" y1="190" x2="52" y2="190" stroke="#475569" strokeWidth="1" />
      <text x="10" y="148" fontSize="9" fill="#475569" fontWeight="500">h_cg</text>

      {/* ── Wind force arrow — red horizontal from (20,45) to (135,45) ── */}
      {/* Arrowhead pointing right */}
      <line x1="20" y1="45" x2="132" y2="45" stroke="#ef4444" strokeWidth="2" />
      <polygon points="138,45 126,40 126,50" fill="#ef4444" />
      <text x="55" y="38" fontSize="9" fill="#ef4444" fontWeight="600">F_wind</text>

      {/* ── h_wind dimension — vertical dashed line left side from y=190 to y=45 ── */}
      <line x1="28" y1="190" x2="28" y2="48" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
      <text x="5" y="122" fontSize="9" fill="#475569" fontWeight="500">h_wind</text>

      {/* ── Tipping edge — red circle at right foot (240, 190) ── */}
      <circle cx="240" cy="190" r="6" fill="none" stroke="#ef4444" strokeWidth="2" />
      <text x="215" y="207" fontSize="8" fill="#ef4444" fontWeight="500">tipping edge</text>

      {/* ── d dimension — double-headed arrow from x=160 to x=240 at y=203 ── */}
      <line x1="160" y1="203" x2="240" y2="203" stroke="#475569" strokeWidth="1" />
      {/* Left arrowhead */}
      <polygon points="160,203 170,199 170,207" fill="#475569" />
      {/* Right arrowhead */}
      <polygon points="240,203 230,199 230,207" fill="#475569" />
      <text x="193" y="215" fontSize="9" fill="#475569" fontWeight="500">d</text>
    </svg>
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
 * Labeled number input with optional unit badge, error message, and hint text.
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

type MomentCardProps = {
  label: string;
  value: string;
  sub: string;
  color: string;
};

/**
 * Small card showing a moment value with a formula sub-label.
 */
function MomentCard({ label, value, sub, color }: MomentCardProps) {
  return (
    <div className={`rounded-lg border px-3 py-3 text-center ${color}`}>
      <p className="text-xs font-semibold mb-1 opacity-80">{label}</p>
      <p className="text-base font-bold leading-tight">{value}</p>
      <p className="text-xs font-mono opacity-70 mt-1">{sub}</p>
    </div>
  );
}
