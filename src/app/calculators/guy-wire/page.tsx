/**
 * Guy Wire Tension Calculator
 *
 * Conservative worst-case single-wire model.
 *
 * Formula:
 *   T = F_lateral / cos(θ_rad)
 *   where θ_rad = θ × π / 180
 *
 * Assumptions:
 *   - One leeward wire takes the full lateral load (upper-bound / worst case)
 *   - Real guyed masts have 3+ wires; load sharing reduces per-wire tension
 *
 * Warnings:
 *   θ >= 80°  → yellow — tension amplification extreme, reconsider angle
 *   θ >= 85°  → red    — critically high tension, geometry impractical
 */
"use client";

import { useState } from "react";
import Link from "next/link";

// --- Conversion constants ---
const N_TO_LBF = 0.22481; // 1 N = 0.22481 lbf

type Result = {
  tensionN: number;   // wire tension [N]
  tensionKN: number;  // wire tension [kN]
  tensionLbf: number; // wire tension [lbf]
};

export default function GuyWirePage() {
  // --- State ---
  const [fLateral, setFLateral] = useState(""); // lateral wind force [N]
  const [theta, setTheta] = useState("");        // guy wire angle from vertical [degrees]
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);

  // --- Validation ---
  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    const fVal = parseFloat(fLateral);
    const tVal = parseFloat(theta);

    if (!fLateral.trim()) errs.fLateral = "Lateral wind force is required.";
    else if (isNaN(fVal) || fVal <= 0) errs.fLateral = "Must be a positive number greater than 0.";

    if (!theta.trim()) errs.theta = "Guy wire angle is required.";
    else if (isNaN(tVal) || tVal <= 0 || tVal >= 90)
      errs.theta = "Angle must be between 0° and 90° (exclusive).";

    return errs;
  }

  function handleCalculate() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { setResult(null); return; }

    const fVal = parseFloat(fLateral);
    const tVal = parseFloat(theta);
    const thetaRad = (tVal * Math.PI) / 180;
    const tensionN = fVal / Math.cos(thetaRad);

    setResult({
      tensionN,
      tensionKN: tensionN / 1000,
      tensionLbf: tensionN * N_TO_LBF,
    });
  }

  // --- Angle warning level ---
  const tVal = parseFloat(theta);
  const angleWarning =
    !isNaN(tVal) && tVal >= 85
      ? {
          color: "bg-signal-red-tint border-signal-red-line text-signal-red-deep",
          message: "Guy wire angle ≥ 85° — tension becomes extremely large. This geometry is not practical for guying.",
        }
      : !isNaN(tVal) && tVal >= 80
      ? {
          color: "bg-signal-amber-tint border-signal-amber-line text-signal-amber-deep",
          message: "Guy wire angle > 80° greatly amplifies tension — consider a steeper angle (smaller θ).",
        }
      : null;

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-graphite mb-1">Guy Wire Tension Calculator</h1>
      <p className="text-graphite/60 text-sm mb-6">
        Conservative worst-case single-wire model —{" "}
        <span className="font-mono bg-panel-gray px-1 rounded">T = F_lateral / cos(θ)</span>
      </p>

      {/* Conceptual SVG diagram */}
      <div className="bg-white rounded-lg border border-panel-gray p-4 mb-6 flex justify-center">
        <GuyWireDiagram />
      </div>

      {/* Input form — one white card */}
      <div className="bg-white rounded-lg border border-panel-gray p-6 flex flex-col gap-5">
        <InputField
          label="F_lateral — Lateral Wind Force"
          unit="N"
          value={fLateral}
          onChange={setFLateral}
          error={errors.fLateral}
          placeholder="e.g. 800"
          hint="Total lateral wind force on the structure — can be imported from the Wind Load Calculator"
        />
        <InputField
          label="θ — Guy Wire Angle from Vertical"
          unit="°"
          value={theta}
          onChange={setTheta}
          error={errors.theta}
          placeholder="e.g. 30"
          hint="Angle between the guy wire and vertical mast. Typical range: 25°–60°. Shallower = higher tension."
        />

        {/* Live angle warning shown before calculating */}
        {angleWarning && !errors.theta && (
          <div className={`rounded-lg border px-4 py-2.5 text-xs font-medium ${angleWarning.color}`}>
            {angleWarning.message}
          </div>
        )}

        <button
          onClick={handleCalculate}
          className="btn-primary"
        >
          Calculate Wire Tension
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 bg-steel-blue-tint border border-steel-blue-line rounded-lg p-6">
          <h2 className="text-lg font-semibold text-steel-blue-deep mb-4">Result</h2>

          {/* Primary value — N, always shown */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <ResultValue
              label="N"
              value={result.tensionN.toFixed(1)}
              primary
            />
            {/* kN — shown when tension is notable at the kN scale */}
            <ResultValue
              label="kN"
              value={result.tensionKN.toFixed(3)}
              primary={false}
            />
            {/* lbf — always shown for reference */}
            <ResultValue
              label="lbf"
              value={result.tensionLbf.toFixed(1)}
              primary={false}
            />
          </div>

          {/* Post-calculation angle warning (if applicable) */}
          {angleWarning && (
            <div className={`rounded-lg border px-4 py-2.5 text-xs font-medium mb-4 ${angleWarning.color}`}>
              {angleWarning.message}
            </div>
          )}

          {/* Formula recap */}
          <p className="text-xs text-steel-blue-deep bg-steel-blue-tint rounded-lg px-3 py-2 font-mono">
            T = {fLateral} N / cos({theta}°) = {result.tensionN.toFixed(1)} N
          </p>
        </div>
      )}

      {/* Conservative model note */}
      <div className="mt-6 bg-instrument-white border border-panel-gray rounded-lg p-5">
        <h3 className="text-sm font-semibold text-graphite/80 mb-2">Model Assumptions</h3>
        <p className="text-xs text-graphite/60 leading-relaxed">
          <strong>Conservative worst-case:</strong> assumes one leeward guy wire takes the full lateral
          load. Real guyed masts have 3+ wires; under symmetric loading, load sharing reduces tension
          per wire. Use this as the <em>upper-bound design load per wire</em>.
        </p>
        <ul className="text-xs text-graphite/60 mt-2 space-y-1 list-disc list-inside">
          <li>Does not account for wire pre-tension or dynamic loads.</li>
          <li>Wire must also resist compression loads from the opposite side — verify wire and anchor capacity separately.</li>
          <li>Typical design angles: 30°–45° from vertical optimizes tension vs. ground footprint.</li>
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Diagram — conceptual side view, fixed ~35° angle illustration
// ---------------------------------------------------------------------------

/**
 * GuyWireDiagram renders a conceptual side-view of a guyed mast.
 * The angle shown is illustrative (~35° from vertical) and does NOT
 * change with the user's θ input. Viewbox 300×220.
 */
function GuyWireDiagram() {
  return (
    <svg
      viewBox="0 0 300 220"
      width="300"
      height="220"
      aria-label="Guy wire tension diagram — side view"
    >
      {/* ── Ground line ── */}
      <line x1="10" y1="190" x2="290" y2="190" stroke="#1A1D21" strokeWidth="2" />

      {/* ── Mast — tall gray column ── */}
      <rect x="140" y="30" width="16" height="160" fill="#98999B" stroke="#5F6164" strokeWidth="1.5" />

      {/* ── Mast top cap ── */}
      <rect x="137" y="25" width="22" height="8" rx="2" fill="#98999B" stroke="#5F6164" strokeWidth="1.5" />

      {/* ── Guy wire — from mast top (148, 35) to ground anchor (50, 190) ── */}
      {/* Represents ~35° from vertical for the illustration */}
      <line x1="148" y1="35" x2="50" y2="190" stroke="#1A1D21" strokeWidth="2" />

      {/* ── Ground anchor — filled inverted triangle at (50, 190) ── */}
      <polygon points="50,190 43,204 57,204" fill="#1A1D21" />

      {/* ── Wind force arrow — red horizontal from (10,75) to (136,75) ── */}
      <line x1="10" y1="75" x2="133" y2="75" stroke="#9B3B3E" strokeWidth="2" />
      {/* Arrowhead pointing right */}
      <polygon points="139,75 127,70 127,80" fill="#9B3B3E" />
      <text x="35" y="68" fontSize="9" fill="#9B3B3E" fontWeight="600">F_wind</text>

      {/* ── Vertical reference dashed line from mast top downward ~50px ── */}
      {/* Shows "vertical" reference from which θ is measured */}
      <line x1="148" y1="35" x2="148" y2="85" stroke="#98999B" strokeWidth="1" strokeDasharray="4 3" />

      {/* ── Angle arc at mast top — between vertical reference and wire direction ── */}
      {/* Arc centered at (148,35), sweeping from "down" direction to wire direction */}
      {/* Wire direction from (148,35) toward (50,190): approx 220° in SVG coords */}
      <path
        d="M 148 55 A 20 20 0 0 0 134 52"
        fill="none"
        stroke="#5F6164"
        strokeWidth="1.5"
      />
      {/* θ label near arc */}
      <text x="127" y="65" fontSize="10" fill="#5F6164" fontWeight="500">θ</text>

      {/* ── Tension label along the wire midpoint ── */}
      {/* Midpoint of wire: ((148+50)/2, (35+190)/2) ≈ (99, 112) */}
      <text x="88" y="108" fontSize="10" fill="#1A1D21" fontWeight="600"
        transform="rotate(-40, 99, 112)">T</text>
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
      <label className="text-sm font-medium text-graphite/80">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
 flex-1 rounded-lg border px-3 py-2 text-sm font-mono tabular-nums
 transition
 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
 ${error ? "border-signal-red-line bg-signal-red-tint" : "border-graphite/20 bg-white"}
 `}
        />
        {unit && (
          <span className="unit-chip min-w-[3.5rem]">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-signal-red">{error}</p>}
      {hint && !error && <p className="text-xs text-graphite/50">{hint}</p>}
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
 * Visual hierarchy shows the user which unit is the primary output.
 */
function ResultValue({ label, value, primary = false }: ResultValueProps) {
  return (
    <div
      className={`rounded-lg border px-3 py-3 text-center ${
 primary
 ? "bg-steel-blue border-steel-blue-deep text-white"
 : "bg-white border-steel-blue-line text-graphite"
 }`}
    >
      <p className={`text-xs font-semibold mb-1 ${primary ? "text-steel-blue-tint" : "text-steel-blue"}`}>
        {label}
      </p>
      <p className="readout text-xl leading-tight">{value}</p>
    </div>
  );
}
