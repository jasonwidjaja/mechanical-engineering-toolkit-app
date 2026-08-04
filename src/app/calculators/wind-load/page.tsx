/**
 * Wind Load Calculator
 *
 * Computes the wind drag force on a bluff body using the fundamental
 * aerodynamic drag equation:
 *
 *   F = 0.5 × Cd × ρ × V² × A
 *
 * Where:
 *   Cd  = drag coefficient (shape-dependent; user-selectable or custom)
 *   ρ   = air density in kg/m³ (default 1.225 at sea level)
 *   V   = wind speed in m/s  (converted from mph if needed)
 *   A   = projected frontal area of the structure in m²
 *   F   = resultant drag force in Newtons (also shown in lbf)
 *
 * This is a first-pass structural estimate.  TIA-222 tower design requires
 * additional gust factors, exposure category coefficients, and load combinations.
 */
"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Shape options — each named shape pre-fills the Cd field.
// "Custom" leaves Cd blank for the user to enter.
// ---------------------------------------------------------------------------
type ShapeOption = { label: string; cd: number | null };

const SHAPES: ShapeOption[] = [
  { label: "Flat plate (Cd = 2.0)",      cd: 2.0  },
  { label: "Cylinder (Cd = 1.0)",        cd: 1.0  },
  { label: "Parabolic dish (Cd = 1.3)",  cd: 1.3  },
  { label: "Custom",                      cd: null },
];

// Unit toggle type — the two supported wind-speed unit systems
type WindUnit = "m/s" | "mph";

export default function WindLoadPage() {
  // ---- unit toggle ----
  const [unit, setUnit] = useState<WindUnit>("m/s");

  // ---- raw string inputs (kept as strings so the fields show what the user typed) ----
  const [V,   setV]   = useState("");           // wind speed
  const [rho, setRho] = useState("1.225");      // air density, default sea level
  const [cd,  setCd]  = useState("2.0");        // drag coefficient — pre-filled from shape
  const [A,   setA]   = useState("");           // projected frontal area, m²

  // ---- selected shape index ----
  const [shapeIdx, setShapeIdx] = useState(0);  // default = Flat plate

  // ---- results ----
  const [resultN,   setResultN]   = useState<number | null>(null);
  const [resultLbf, setResultLbf] = useState<number | null>(null);
  const [formulaLine, setFormulaLine] = useState("");
  const [calcError, setCalcError] = useState("");

  // Switch unit system: clear inputs to avoid silent unit confusion
  function handleUnitSwitch(newUnit: WindUnit) {
    setUnit(newUnit);
    setV("");
    setResultN(null);
    setResultLbf(null);
    setFormulaLine("");
    setCalcError("");
  }

  // When the shape dropdown changes, pre-fill the Cd field
  function handleShapeChange(idx: number) {
    setShapeIdx(idx);
    const shape = SHAPES[idx];
    if (shape.cd !== null) {
      setCd(String(shape.cd));
    } else {
      setCd("");
    }
    // Clear results — shape change is a meaningful input change
    setResultN(null);
    setResultLbf(null);
    setFormulaLine("");
    setCalcError("");
  }

  // ---------------------------------------------------------------------------
  // Main calculation
  // ---------------------------------------------------------------------------
  function calculate() {
    const V_raw  = parseFloat(V);
    const rho_v  = parseFloat(rho);
    const cd_v   = parseFloat(cd);
    const A_v    = parseFloat(A);

    // Validate: all must be positive finite numbers
    if (!isFinite(V_raw)  || V_raw  <= 0) { setCalcError("Wind speed V must be a positive number."); return; }
    if (!isFinite(rho_v)  || rho_v  <= 0) { setCalcError("Air density ρ must be a positive number."); return; }
    if (!isFinite(cd_v)   || cd_v   <= 0) { setCalcError("Drag coefficient Cd must be a positive number."); return; }
    if (!isFinite(A_v)    || A_v    <= 0) { setCalcError("Frontal area A must be a positive number."); return; }

    setCalcError("");

    // Convert to m/s if the user is working in mph
    const V_ms = unit === "mph" ? V_raw * 0.44704 : V_raw;

    // Core drag equation
    const F_N   = 0.5 * cd_v * rho_v * V_ms * V_ms * A_v;
    const F_lbf = F_N * 0.22481;

    setResultN(F_N);
    setResultLbf(F_lbf);

    // Human-readable formula recap shown under the results
    setFormulaLine(
      `F = 0.5 × ${cd_v} × ${rho_v} × ${V_ms.toFixed(2)}² × ${A_v} = ${F_N.toFixed(1)} N`
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back navigation */}
      <Link href="/" className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6">
        ← Back to all calculators
      </Link>

      {/* Page header */}
      <h1 className="text-2xl font-bold text-graphite mb-1">Wind Load Calculator</h1>
      <p className="text-sm text-graphite/60 mb-6">
        First-pass structural estimate — TIA-222 design requires additional load factors
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* INPUT CARD                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg border border-panel-gray p-5 mb-5">

        {/* 1. Wind speed unit toggle */}
        <div className="mb-5">
          <span className="block text-xs font-semibold text-graphite/80 mb-2">Wind speed units</span>
          <div className="flex gap-2">
            {(["m/s", "mph"] as WindUnit[]).map(u => (
              <button
                key={u}
                onClick={() => handleUnitSwitch(u)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
 unit === u
 ? "bg-steel-blue text-white border-steel-blue-deep"
 : "bg-white text-graphite/70 border-graphite/20 hover:border-steel-blue-line"
 }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Wind speed V */}
        <FormRow label={`Wind speed V (${unit})`}>
          <input
            type="number"
            value={V}
            onChange={e => { setV(e.target.value); setResultN(null); }}
            placeholder="e.g. 40"
            className="w-full border border-panel-gray rounded px-3 py-1.5 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </FormRow>

        {/* 3. Air density ρ */}
        <FormRow
          label="Air density ρ (kg/m³)"
          hint="1.225 at sea level; ~1.06 at 2000 m"
        >
          <input
            type="number"
            value={rho}
            onChange={e => { setRho(e.target.value); setResultN(null); }}
            placeholder="1.225"
            className="w-full border border-panel-gray rounded px-3 py-1.5 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </FormRow>

        {/* 4. Shape dropdown — pre-fills Cd */}
        <FormRow label="Structure shape">
          <select
            value={shapeIdx}
            onChange={e => handleShapeChange(Number(e.target.value))}
            className="w-full border border-panel-gray rounded px-3 py-1.5 text-sm bg-white"
          >
            {SHAPES.map((s, i) => (
              <option key={s.label} value={i}>{s.label}</option>
            ))}
          </select>
        </FormRow>

        {/* 5. Drag coefficient Cd — always editable, pre-filled by shape */}
        <FormRow label="Drag coefficient Cd (—)">
          <input
            type="number"
            value={cd}
            onChange={e => { setCd(e.target.value); setResultN(null); }}
            placeholder="e.g. 2.0"
            className="w-full border border-panel-gray rounded px-3 py-1.5 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </FormRow>

        {/* 6. Projected frontal area A */}
        <FormRow label="Projected frontal area A (m²)">
          <input
            type="number"
            value={A}
            onChange={e => { setA(e.target.value); setResultN(null); }}
            placeholder="e.g. 1.5"
            className="w-full border border-panel-gray rounded px-3 py-1.5 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </FormRow>

        {/* Calculate button */}
        <button
          onClick={calculate}
          className="w-full mt-3 bg-steel-blue hover:bg-steel-blue-deep text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          Calculate Wind Load
        </button>

        {/* Inline validation error */}
        {calcError && (
          <p className="mt-2 text-sm text-signal-red">{calcError}</p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RESULTS CARD — shown only after a successful calculation             */}
      {/* ------------------------------------------------------------------ */}
      {resultN !== null && resultLbf !== null && (
        <div className="bg-steel-blue-tint border border-steel-blue-line rounded-lg p-5 mb-5">
          <h2 className="text-sm font-semibold text-steel-blue-deep mb-4">Results</h2>

          {/* Primary + secondary result tiles */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Primary: force in Newtons */}
            <div className="bg-white rounded-lg border border-steel-blue-line px-4 py-3 text-center">
              <p className="text-2xl font-bold text-steel-blue-deep">
                {resultN >= 1000
                  ? (resultN / 1000).toFixed(2) + " kN"
                  : resultN.toFixed(1) + " N"}
              </p>
              <p className="text-xs text-graphite/60 mt-0.5">Drag force (SI)</p>
            </div>

            {/* Secondary: force in pound-force */}
            <div className="bg-white rounded-lg border border-steel-blue-line px-4 py-3 text-center">
              <p className="text-xl font-semibold text-steel-blue">
                {resultLbf.toFixed(1)} lbf
              </p>
              <p className="text-xs text-graphite/60 mt-0.5">Drag force (imperial)</p>
            </div>
          </div>

          {/* Formula recap line */}
          <p className="text-xs font-mono text-steel-blue-deep bg-steel-blue-tint rounded px-3 py-2">
            {formulaLine}
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CONCEPTUAL DIAGRAM                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg border border-panel-gray p-4 mb-5">
        <h2 className="text-sm font-semibold text-graphite/80 mb-3">Physics Diagram</h2>
        <WindLoadDiagram />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DISCLAIMER                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-signal-amber-tint border border-signal-amber-line rounded-lg px-4 py-3 text-xs text-signal-amber-deep">
        <strong>Disclaimer:</strong> First-pass estimate. TIA-222 structural analysis requires
        additional load factors, gust factors, and terrain exposure categories. Wind-tunnel
        testing or CFD is recommended for novel shapes.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conceptual SVG Diagram
// Shows a mast with a radar/antenna unit at the top, wind approaching from
// the left, and a resultant force arrow on the unit.
// This is purely illustrative — it does NOT scale with input values.
// ---------------------------------------------------------------------------
function WindLoadDiagram() {
  return (
    <svg
      viewBox="0 0 360 200"
      className="w-full rounded-lg"
      style={{ background: "#E5EAF0" }}   /* light blue-gray sky background */
      aria-label="Wind load physics diagram showing wind arrows hitting a radar unit on a mast"
    >
      {/* ── Ground ── */}
      <line x1={0} y1={170} x2={360} y2={170} stroke="#98999B" strokeWidth={2} />
      {/* Subtle ground hatch marks */}
      {[10, 30, 50, 70, 90, 110, 130, 150, 330, 350].map(x => (
        <line key={x} x1={x} y1={170} x2={x - 10} y2={185} stroke="#98999B" strokeWidth={1} />
      ))}

      {/* ── Mast body (12 px wide, 80 px tall, gray rectangle) ── */}
      <rect x={175} y={90} width={12} height={80} fill="#5F6164" rx={1} />

      {/* ── Mounting flange at mast base (wider plate) ── */}
      <rect x={168} y={162} width={26} height={8} fill="#5F6164" rx={1} />

      {/* ── Radar / antenna unit (box at the top of the mast) ── */}
      <rect x={158} y={60} width={42} height={32} fill="#98999B" stroke="#5F6164" strokeWidth={1.5} rx={2} />
      {/* Small detail: horizontal lines inside the box to suggest a radar panel */}
      <line x1={162} y1={68} x2={196} y2={68} stroke="#5F6164" strokeWidth={0.8} />
      <line x1={162} y1={74} x2={196} y2={74} stroke="#5F6164" strokeWidth={0.8} />
      <line x1={162} y1={80} x2={196} y2={80} stroke="#5F6164" strokeWidth={0.8} />
      <line x1={162} y1={86} x2={196} y2={86} stroke="#5F6164" strokeWidth={0.8} />

      {/* ── Wind arrows — 3 parallel blue arrows from left → right ── */}
      {/* Arrow shaft lines */}
      <line x1={90} y1={68} x2={154} y2={68} stroke="#2B4C7E" strokeWidth={2} />
      <line x1={90} y1={76} x2={154} y2={76} stroke="#2B4C7E" strokeWidth={2} />
      <line x1={90} y1={84} x2={154} y2={84} stroke="#2B4C7E" strokeWidth={2} />

      {/* Arrowheads (small filled triangles) pointing right at x=156 */}
      <polygon points="154,64 162,68 154,72" fill="#2B4C7E" />
      <polygon points="154,72 162,76 154,80" fill="#2B4C7E" />
      <polygon points="154,80 162,84 154,88" fill="#2B4C7E" />

      {/* "V →" label near the middle arrow */}
      <text x={106} y={73} fill="#2B4C7E" fontSize={11} fontWeight="bold">V →</text>

      {/* ── Resultant force arrow on the unit (red, pointing right) ── */}
      {/* Shaft */}
      <line x1={200} y1={76} x2={232} y2={76} stroke="#9B3B3E" strokeWidth={2.5} />
      {/* Arrowhead */}
      <polygon points="230,71 240,76 230,81" fill="#9B3B3E" />

      {/* "F" label at the arrowhead */}
      <text x={242} y={72} fill="#9B3B3E" fontSize={12} fontWeight="bold">F</text>

      {/* Sub-label "Cd × ρ × V²" below the force arrow */}
      <text x={203} y={92} fill="#9B3B3E" fontSize={8.5}>Cd × ρ × V²</text>

      {/* ── Legend / axis label ── */}
      <text x={8} y={195} fill="#98999B" fontSize={8}>Ground level</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helper: a labeled form row used for every input field
// ---------------------------------------------------------------------------
function FormRow({
  label, hint, children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-graphite/80 mb-1">{label}</label>
      {children}
      {hint && (
        <p className="mt-1 text-xs text-graphite/50">{hint}</p>
      )}
    </div>
  );
}
