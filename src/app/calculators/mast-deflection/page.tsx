/**
 * Mast Tip Deflection & Pointing Error
 *
 * Models a cantilevered hollow circular tube (mast) subjected to:
 *   1. A point load F at the tip  (wind force on the payload, e.g. radar)
 *   2. A uniform distributed load w along the mast  (wind on the tube itself)
 *
 * Uses Euler-Bernoulli cantilever beam theory.
 *
 * Key formulas:
 *
 *   Section second moment of area (hollow circle):
 *     I = (π/64) × (D_o⁴ − D_i⁴)    [m⁴]     — convert mm → m before raising to 4th power
 *
 *   Point load at free tip (cantilever):
 *     δ_point = F·L³ / (3·EI)        [m]       tip deflection
 *     θ_point = F·L² / (2·EI)        [rad]     tip rotation / pointing error
 *
 *   Uniformly distributed load (cantilever):
 *     δ_dist  = w·L⁴ / (8·EI)        [m]
 *     θ_dist  = w·L³ / (6·EI)        [rad]
 *
 *   Totals (superposition — valid for small deflections):
 *     δ_total = δ_point + δ_dist                 [m → displayed in mm]
 *     θ_total = θ_point + θ_dist                 [rad → mrad and °]
 *
 *   Cross-range error (small angle approximation):
 *     x_error = θ_total_rad × R                  [m]
 *
 * Units note: all geometry inputs in mm are converted to metres before calculation.
 */
"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Material data — E values are approximate and intended for first-pass sizing.
// "Custom" leaves E blank so the user can enter their own modulus.
// ---------------------------------------------------------------------------
const MATERIALS = [
  { label: "Aluminum 6061-T6",      E_GPa: 69   },
  { label: "Steel (structural)",     E_GPa: 200  },
  { label: "Carbon fiber (approx)", E_GPa: 70   },  // axial / longitudinal direction
  { label: "Custom",                 E_GPa: null },
] as const;

// ---------------------------------------------------------------------------
// Result type — stores every intermediate quantity so the formula recap
// can display values without recalculating.
// ---------------------------------------------------------------------------
type CalcResult = {
  D_i_mm:       number;   // inner diameter, mm
  I_m4:         number;   // second moment of area, m⁴
  EI:           number;   // flexural rigidity, N·m²
  delta_mm:     number;   // total tip deflection, mm
  theta_rad:    number;   // total tip rotation, rad
  theta_mrad:   number;   // …in milli-radians
  theta_deg:    number;   // …in degrees
  x_error_m:   number | null;  // cross-range error (null if R not provided)
};

export default function MastDeflectionPage() {
  // ---- raw string inputs ----
  const [L,    setL]    = useState("");       // mast length, m
  const [Do,   setDo]   = useState("");       // outer diameter, mm
  const [t,    setT]    = useState("");       // wall thickness, mm
  const [E,    setE]    = useState("69");     // Young's modulus, GPa  (default: Al 6061)
  const [F,    setF]    = useState("");       // tip point load, N
  const [w,    setW]    = useState("0");      // distributed load, N/m
  const [R,    setR]    = useState("");       // target range, m (optional)

  // ---- selected material index ----
  const [matIdx, setMatIdx] = useState(0);   // default = Aluminum 6061-T6

  // ---- results ----
  const [result,     setResult]     = useState<CalcResult | null>(null);
  const [calcError,  setCalcError]  = useState("");

  // When the material dropdown changes, pre-fill E (unless Custom)
  function handleMaterialChange(idx: number) {
    setMatIdx(idx);
    const mat = MATERIALS[idx];
    if (mat.E_GPa !== null) {
      setE(String(mat.E_GPa));
    } else {
      setE("");
    }
    setResult(null);
    setCalcError("");
  }

  // ---------------------------------------------------------------------------
  // Main calculation
  // ---------------------------------------------------------------------------
  function calculate() {
    const L_v  = parseFloat(L);
    const Do_v = parseFloat(Do);
    const t_v  = parseFloat(t);
    const E_v  = parseFloat(E);
    const F_v  = parseFloat(F);
    const w_v  = parseFloat(w) || 0;   // default to 0 if blank
    const R_v  = R.trim() !== "" ? parseFloat(R) : null;

    // ---- Validation ----
    if (!isFinite(L_v)  || L_v  <= 0) { setCalcError("Mast length L must be a positive number."); return; }
    if (!isFinite(Do_v) || Do_v <= 0) { setCalcError("Outer diameter D_o must be a positive number."); return; }
    if (!isFinite(t_v)  || t_v  <= 0) { setCalcError("Wall thickness t must be a positive number."); return; }
    if (t_v >= Do_v / 2)               { setCalcError("Wall thickness t must be less than D_o / 2 (i.e. half the outer diameter)."); return; }
    if (!isFinite(E_v)  || E_v  <= 0) { setCalcError("Young's modulus E must be a positive number."); return; }
    if (!isFinite(F_v)  || F_v  < 0)  { setCalcError("Tip load F must be zero or a positive number."); return; }
    if (!isFinite(w_v)  || w_v  < 0)  { setCalcError("Distributed load w must be zero or a positive number."); return; }
    if (R_v !== null && (!isFinite(R_v) || R_v <= 0)) {
      setCalcError("Target range R must be a positive number (or leave blank to skip).");
      return;
    }

    setCalcError("");

    // ---- Geometry ----
    const D_i_mm = Do_v - 2 * t_v;                          // inner diameter, mm
    const Do_m   = Do_v / 1000;                              // outer diameter, m
    const Di_m   = D_i_mm / 1000;                            // inner diameter, m

    // Second moment of area for a hollow circle, m⁴
    const I_m4 = (Math.PI / 64) * (Math.pow(Do_m, 4) - Math.pow(Di_m, 4));

    // Flexural rigidity
    const E_Pa = E_v * 1e9;
    const EI   = E_Pa * I_m4;

    // ---- Point load (cantilever tip) ----
    const delta_point_m = (F_v  * Math.pow(L_v, 3)) / (3 * EI);
    const theta_point   = (F_v  * Math.pow(L_v, 2)) / (2 * EI);

    // ---- Distributed load (uniform cantilever) ----
    const delta_dist_m  = (w_v  * Math.pow(L_v, 4)) / (8 * EI);
    const theta_dist    = (w_v  * Math.pow(L_v, 3)) / (6 * EI);

    // ---- Totals ----
    const delta_total_m  = delta_point_m + delta_dist_m;
    const delta_mm       = delta_total_m * 1000;
    const theta_rad      = theta_point + theta_dist;
    const theta_mrad     = theta_rad * 1000;
    const theta_deg      = theta_rad * (180 / Math.PI);

    // ---- Cross-range error (only when R is given) ----
    const x_error_m = R_v !== null ? theta_rad * R_v : null;

    setResult({
      D_i_mm,
      I_m4,
      EI,
      delta_mm,
      theta_rad,
      theta_mrad,
      theta_deg,
      x_error_m,
    });
  }

  // Format a number in engineering notation (e.g. 3.14e-7 → "3.14 × 10⁻⁷")
  function engNotation(val: number): string {
    if (val === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(val)));
    const mantissa = val / Math.pow(10, exp);
    // Superscript exponent string
    const sup = String(exp)
      .replace(/-/g, "⁻")
      .replace(/0/g, "⁰").replace(/1/g, "¹").replace(/2/g, "²").replace(/3/g, "³")
      .replace(/4/g, "⁴").replace(/5/g, "⁵").replace(/6/g, "⁶").replace(/7/g, "⁷")
      .replace(/8/g, "⁸").replace(/9/g, "⁹");
    return `${mantissa.toFixed(3)} × 10${sup}`;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back navigation */}
      <Link href="/" className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6">
        ← Back to all calculators
      </Link>

      {/* Page header */}
      <h1 className="text-2xl font-bold text-graphite mb-1">Mast Tip Deflection & Pointing Error</h1>
      <p className="text-sm text-graphite/60 mb-1">
        Cantilevered hollow tube — first-pass estimate. Final design needs FEA.
      </p>
      {/* Use-case note */}
      <p className="text-xs text-steel-blue-deep bg-steel-blue-tint border border-steel-blue-line rounded-lg px-3 py-2 mb-6">
        Connects mechanical stiffness directly to radar/antenna pointing accuracy.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* INPUT CARD                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg border border-panel-gray p-5 mb-5">
        <h2 className="text-sm font-semibold text-graphite/80 mb-4">Mast Geometry & Loading</h2>

        {/* Mast length */}
        <FormRow label="Mast length L (m)">
          <input
            type="number"
            value={L}
            onChange={e => { setL(e.target.value); setResult(null); }}
            placeholder="e.g. 3.0"
            className={inputCls}
          />
        </FormRow>

        {/* Outer diameter */}
        <FormRow label="Outer diameter D_o (mm)">
          <input
            type="number"
            value={Do}
            onChange={e => { setDo(e.target.value); setResult(null); }}
            placeholder="e.g. 76.1"
            className={inputCls}
          />
        </FormRow>

        {/* Wall thickness */}
        <FormRow label="Wall thickness t (mm)" hint="Must be less than D_o / 2">
          <input
            type="number"
            value={t}
            onChange={e => { setT(e.target.value); setResult(null); }}
            placeholder="e.g. 4.0"
            className={inputCls}
          />
        </FormRow>

        {/* Material dropdown + editable E field */}
        <FormRow label="Material">
          <select
            value={matIdx}
            onChange={e => handleMaterialChange(Number(e.target.value))}
            className="w-full border border-panel-gray rounded px-3 py-1.5 text-sm bg-white mb-2"
          >
            {MATERIALS.map((m, i) => (
              <option key={m.label} value={i}>{m.label}</option>
            ))}
          </select>
          {/* Editable E field — always shown so user can fine-tune */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-graphite/60 w-36">Young&apos;s modulus E (GPa)</span>
            <input
              type="number"
              value={E}
              onChange={e => { setE(e.target.value); setResult(null); }}
              placeholder="e.g. 69"
              className={`flex-1 ${inputCls}`}
            />
          </div>
        </FormRow>

        {/* Tip point load F */}
        <FormRow label="Tip point load F (N)" hint="Wind force on the payload at the mast tip">
          <input
            type="number"
            value={F}
            onChange={e => { setF(e.target.value); setResult(null); }}
            placeholder="e.g. 500"
            className={inputCls}
          />
        </FormRow>

        {/* Distributed load w */}
        <FormRow label="Distributed load w (N/m)" hint="Wind drag on the mast tube itself; 0 if unknown">
          <input
            type="number"
            value={w}
            onChange={e => { setW(e.target.value); setResult(null); }}
            placeholder="0"
            className={inputCls}
          />
        </FormRow>

        {/* Target range R (optional) */}
        <FormRow label="Target range R (m) — optional" hint="If provided, cross-range pointing error is computed">
          <input
            type="number"
            value={R}
            onChange={e => { setR(e.target.value); setResult(null); }}
            placeholder="Leave blank to skip"
            className={inputCls}
          />
        </FormRow>

        {/* Calculate button */}
        <button
          onClick={calculate}
          className="w-full mt-2 bg-steel-blue hover:bg-steel-blue-deep text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          Calculate Deflection
        </button>

        {/* Validation error */}
        {calcError && (
          <p className="mt-2 text-sm text-signal-red">{calcError}</p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RESULTS CARD                                                         */}
      {/* ------------------------------------------------------------------ */}
      {result && (
        <div className="bg-steel-blue-tint border border-steel-blue-line rounded-lg p-5 mb-5">
          <h2 className="text-sm font-semibold text-steel-blue-deep mb-4">Results</h2>

          {/* Row 1: δ, θ in mrad, θ in degrees */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <ResultTile
              value={result.delta_mm.toFixed(2)}
              unit="mm"
              label="Tip deflection δ"
              primary
            />
            <ResultTile
              value={result.theta_mrad.toFixed(3)}
              unit="mrad"
              label="Pointing error θ"
            />
            <ResultTile
              value={result.theta_deg.toFixed(4)}
              unit="°"
              label="Pointing error θ"
            />
          </div>

          {/* Row 2: cross-range error (only if R was provided) */}
          {result.x_error_m !== null && (
            <div className="grid grid-cols-1 gap-3 mb-3">
              <ResultTile
                value={result.x_error_m >= 1
                  ? result.x_error_m.toFixed(3) + " m"
                  : (result.x_error_m * 1000).toFixed(1) + " mm"}
                unit=""
                label="Cross-range pointing error"
              />
            </div>
          )}

          {/* Section properties summary */}
          <div className="mt-1 bg-white rounded-lg border border-steel-blue-line px-4 py-2 text-xs text-steel-blue-deep">
            <span className="font-semibold">Section: </span>
            D_i = {result.D_i_mm.toFixed(2)} mm &nbsp;·&nbsp;
            I = {engNotation(result.I_m4)} m⁴ &nbsp;·&nbsp;
            EI = {(result.EI / 1000).toFixed(1)} kN·m²
          </div>

          {/* Formula recap */}
          <p className="mt-2 text-xs font-mono text-steel-blue-deep bg-steel-blue-tint rounded px-3 py-2 leading-relaxed">
            {"δ = F·L³/(3EI) + w·L⁴/(8EI) = "}
            {result.delta_mm.toFixed(2)} mm
            {"  |  θ = "}
            {result.theta_mrad.toFixed(3)} mrad
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CONCEPTUAL DIAGRAM                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg border border-panel-gray p-4 mb-5">
        <h2 className="text-sm font-semibold text-graphite/80 mb-3">Physics Diagram</h2>
        <MastDeflectionDiagram />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DISCLAIMER                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-signal-amber-tint border border-signal-amber-line rounded-lg px-4 py-3 text-xs text-signal-amber-deep">
        <strong>Disclaimer:</strong> First-pass estimate using Euler-Bernoulli beam theory for a
        uniform cantilever. Mast weight, material nonlinearity, joint flexibility, and base fixity
        compliance are not included. Verify with FEA for flight or safety-critical applications.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conceptual SVG Diagram — cantilevered mast bending to the right
// Deflection is always ~40 px regardless of input values (purely illustrative).
// ---------------------------------------------------------------------------
function MastDeflectionDiagram() {
  return (
    <svg
      viewBox="0 0 320 280"
      className="w-full rounded-lg bg-instrument-white border border-panel-gray"
      aria-label="Cantilever mast deflection diagram showing undeflected and deflected mast positions"
    >
      {/* ── Fixed support base: thick horizontal band ── */}
      <rect x={100} y={225} width={120} height={14} fill="#CDD2D5" rx={2} />
      {/* Fixed support hatching — diagonal lines below the base */}
      {[0, 1, 2, 3, 4].map(i => (
        <line
          key={i}
          x1={108 + i * 20} y1={239}
          x2={98  + i * 20} y2={255}
          stroke="#98999B" strokeWidth={1.5}
        />
      ))}

      {/* ── Undeflected mast: solid dark gray rectangle (plumb vertical) ── */}
      {/* x=145 to x=160 (15 px wide), y=40 to y=225 */}
      <rect x={145} y={40} width={15} height={185} fill="#5F6164" rx={2} />

      {/* ── Deflected mast: curved shape (blue, semi-transparent) ──
          The mast is fixed at the bottom (x=152) and deflects ~53px to the right at the tip.
          We use two bezier paths for the left and right edges of the deflected mast. */}

      {/* Right edge of deflected mast */}
      <path
        d="M 160,225 C 160,150 183,90 213,40 L 206,40 C 178,88 157,148 153,225 Z"
        fill="#2B4C7E"
        fillOpacity={0.30}
        stroke="#2B4C7E"
        strokeWidth={1.5}
        strokeOpacity={0.6}
      />

      {/* ── Deflected mast centerline dashed (blue) — visual emphasis ── */}
      <path
        d="M 152,225 C 152,150 175,90 205,40"
        fill="none"
        stroke="#2B4C7E"
        strokeWidth={2}
        strokeDasharray="6 3"
        strokeOpacity={0.8}
      />

      {/* ── Distributed load arrows (orange) on the right side of the UNDEFLECTED mast ──
          5 arrows at regular y-intervals, each 22px wide, pointing right */}
      {[75, 105, 135, 165, 195].map((y, i) => (
        <g key={y}>
          {/* Arrow shaft */}
          <line x1={160} y1={y} x2={180} y2={y} stroke="#A17D36" strokeWidth={1.8} />
          {/* Arrowhead */}
          <polygon
            points={`178,${y - 4} 184,${y} 178,${y + 4}`}
            fill="#A17D36"
          />
          {/* Label "w" next to the third arrow */}
          {i === 2 && (
            <text x={187} y={y + 4} fill="#A17D36" fontSize={10} fontWeight="bold">w</text>
          )}
        </g>
      ))}

      {/* ── Tip point load arrow (red, horizontal, at deflected tip) ── */}
      {/* Shaft from x=205 to x=240, at y=40 */}
      <line x1={205} y1={40} x2={238} y2={40} stroke="#9B3B3E" strokeWidth={2.5} />
      {/* Arrowhead */}
      <polygon points="235,34 245,40 235,46" fill="#9B3B3E" />
      {/* Label "F" */}
      <text x={248} y={44} fill="#9B3B3E" fontSize={12} fontWeight="bold">F</text>

      {/* ── Tip deflection annotation ──
          Dashed horizontal line from undeflected tip (160,40) to deflected tip (205,40) */}
      <line
        x1={152} y1={34} x2={205} y2={34}
        stroke="#5F6164" strokeWidth={1.2} strokeDasharray="4 2"
      />
      {/* Short vertical tick at each end of the dashed line */}
      <line x1={152} y1={30} x2={152} y2={38} stroke="#5F6164" strokeWidth={1} />
      <line x1={205} y1={30} x2={205} y2={38} stroke="#5F6164" strokeWidth={1} />
      {/* δ label above the dashed line, centered */}
      <text x={172} y={29} fill="#1A1D21" fontSize={11} fontWeight="bold"
        textAnchor="middle">δ</text>

      {/* ── Angle arc annotation at the deflected tip ── */}
      {/* Small arc from the vertical (pointing up from tip) sweeping right,
          centered at the deflected tip (205,40) */}
      <path
        d="M 205,55 A 15,15 0 0,0 218,44"
        fill="none"
        stroke="#5F6164"
        strokeWidth={1.5}
      />
      {/* θ label */}
      <text x={218} y={57} fill="#5F6164" fontSize={11} fontWeight="bold">θ</text>

      {/* ── Axis labels ── */}
      <text x={107} y={270} fill="#98999B" fontSize={8}>Fixed base</text>
      <text x={107} y={15}  fill="#98999B" fontSize={8}>Free tip (deflected)</text>
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

// ---------------------------------------------------------------------------
// Helper: a compact result tile used in the results card
// ---------------------------------------------------------------------------
function ResultTile({
  value, unit, label, primary = false,
}: {
  value: string;
  unit: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-steel-blue-line px-3 py-3 text-center">
      <p className={`font-bold text-steel-blue-deep ${primary ? "text-2xl" : "text-lg"}`}>
        {value}
        {unit && <span className="text-sm font-normal ml-1 text-steel-blue">{unit}</span>}
      </p>
      <p className="text-xs text-graphite/60 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

// Shared Tailwind classes for all number inputs — eliminates browser spinners
const inputCls =
  "w-full border border-panel-gray rounded px-3 py-1.5 text-sm   " +
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
