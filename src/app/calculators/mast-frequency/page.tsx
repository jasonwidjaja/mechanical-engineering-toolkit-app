/**
 * Mast Natural Frequency & Vortex Shedding Check
 *
 * Computes the first-mode natural frequency of a cantilevered hollow circular
 * tube (mast) and checks for vortex-induced resonance over a user-supplied
 * wind-speed range.
 *
 * Key formulas:
 *
 *   Section geometry:
 *     D_i = D_o − 2t                                  [mm]
 *     I   = (π/64) × ((D_o/1000)⁴ − (D_i/1000)⁴)   [m⁴]
 *
 *   First-mode natural frequency (cantilever, continuous beam):
 *     f_n = (βL)₁² / (2π × L²) × √(EI / m_linear)
 *     where (βL)₁ = 1.8751 (first eigenvalue for a clamped-free beam)
 *
 *   Strouhal vortex shedding frequency (Strouhal number S = 0.2 for a cylinder):
 *     f_shed = 0.2 × V / (D_o / 1000)    [Hz]
 *
 *   Resonance window: ±20% around f_n
 *     Risk if:  f_n × 0.8  ≤  f_shed_max   AND   f_shed_min  ≤  f_n × 1.2
 *
 *   Exact resonance wind speed:
 *     V_resonance = f_n × (D_o / 1000) / 0.2
 */
"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Material data — same set as mast-deflection
// ---------------------------------------------------------------------------
const MATERIALS = [
  { label: "Aluminum 6061-T6",      E_GPa: 69   },
  { label: "Steel (structural)",     E_GPa: 200  },
  { label: "Carbon fiber (approx)", E_GPa: 70   },
  { label: "Custom",                 E_GPa: null },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CalcResult = {
  D_i_mm:      number;  // inner diameter, mm
  I_m4:        number;  // second moment of area, m⁴
  E_Pa:        number;  // Young's modulus, Pa
  f_n:         number;  // natural frequency, Hz
  f_shed_min:  number;  // shedding frequency at V_min, Hz
  f_shed_max:  number;  // shedding frequency at V_max, Hz
  resonance:   boolean; // true if shedding range overlaps ±20% of f_n
  V_resonance: number;  // exact wind speed producing f_shed = f_n, m/s
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function MastFrequencyPage() {
  // ---- raw string inputs ----
  const [L,        setL]        = useState("");      // mast length, m
  const [Do,       setDo]       = useState("");      // outer diameter, mm
  const [t,        setT]        = useState("");      // wall thickness, mm
  const [E,        setE]        = useState("69");    // Young's modulus, GPa
  const [mLinear,  setMLinear]  = useState("");      // mass per unit length, kg/m
  const [Vmin,     setVmin]     = useState("");      // min design wind speed, m/s
  const [Vmax,     setVmax]     = useState("");      // max design wind speed, m/s

  // ---- material selection ----
  const [matIdx, setMatIdx] = useState(0);

  // ---- results / error ----
  const [result,    setResult]    = useState<CalcResult | null>(null);
  const [calcError, setCalcError] = useState("");

  // When material dropdown changes, auto-fill E (unless Custom)
  function handleMaterialChange(idx: number) {
    setMatIdx(idx);
    const mat = MATERIALS[idx];
    if (mat.E_GPa !== null) setE(String(mat.E_GPa));
    setResult(null);
  }

  // ---- calculation ----
  function calculate() {
    const l    = parseFloat(L);
    const do_  = parseFloat(Do);
    const th   = parseFloat(t);
    const e    = parseFloat(E);
    const m    = parseFloat(mLinear);
    const vmin = parseFloat(Vmin);
    const vmax = parseFloat(Vmax);

    // --- validation ---
    if (isNaN(l)    || l    <= 0)  { setCalcError("L must be positive.");              setResult(null); return; }
    if (isNaN(do_)  || do_  <= 0)  { setCalcError("D_o must be positive.");            setResult(null); return; }
    if (isNaN(th)   || th   <= 0)  { setCalcError("t must be positive.");              setResult(null); return; }
    if (th >= do_ / 2)             { setCalcError("t must be less than D_o / 2.");     setResult(null); return; }
    if (isNaN(e)    || e    <= 0)  { setCalcError("E must be positive.");              setResult(null); return; }
    if (isNaN(m)    || m    <= 0)  { setCalcError("m_linear must be positive.");       setResult(null); return; }
    if (isNaN(vmin) || vmin <= 0)  { setCalcError("V_min must be positive.");          setResult(null); return; }
    if (isNaN(vmax) || vmax <= 0)  { setCalcError("V_max must be positive.");          setResult(null); return; }
    if (vmax <= vmin)              { setCalcError("V_max must be greater than V_min."); setResult(null); return; }

    // --- section geometry ---
    const D_i_mm = do_ - 2 * th;                         // inner diameter, mm
    const D_o_m  = do_ / 1000;                           // outer diameter, m
    const D_i_m  = D_i_mm / 1000;                        // inner diameter, m
    const I_m4   = (Math.PI / 64) * (D_o_m ** 4 - D_i_m ** 4);  // m⁴

    // --- material ---
    const E_Pa = e * 1e9;                                // GPa → Pa

    // --- natural frequency ---
    // f_n = (βL)₁² / (2π × L²) × √(EI / m_linear)
    // (βL)₁ = 1.8751 for clamped-free first mode
    const betaL1 = 1.8751;
    const f_n = (betaL1 ** 2 / (2 * Math.PI * l ** 2)) *
                Math.sqrt((E_Pa * I_m4) / m);

    // --- vortex shedding ---
    const f_shed_min = 0.2 * vmin / D_o_m;
    const f_shed_max = 0.2 * vmax / D_o_m;

    // Resonance check: shedding range overlaps ±20% band around f_n
    const resonance = (f_n * 0.8 <= f_shed_max) && (f_shed_min <= f_n * 1.2);

    // Exact wind speed producing resonance: f_n = 0.2 × V / D_o → V = f_n × D_o / 0.2
    const V_resonance = f_n * D_o_m / 0.2;

    setCalcError("");
    setResult({ D_i_mm, I_m4, E_Pa, f_n, f_shed_min, f_shed_max, resonance, V_resonance });
  }

  // Format I in engineering notation (m⁴ values are tiny)
  function formatI(I: number): string {
    const exp = Math.floor(Math.log10(Math.abs(I)));
    const mantissa = I / Math.pow(10, exp);
    return `${mantissa.toFixed(3)} × 10^${exp} m⁴`;
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-graphite mb-1">
        Mast Natural Frequency &amp; Vortex Shedding Check
      </h1>
      <p className="text-sm text-graphite/60 mb-5">
        First-pass check against vortex-induced resonance — TIA-222 / ASCE 7
      </p>

      {/* ---- Inputs card ---- */}
      <div className="bg-white rounded-lg border border-panel-gray p-5 mb-4">
        <h2 className="text-sm font-semibold text-graphite/80 mb-4">Mast Section &amp; Loading</h2>
        <div className="flex flex-col gap-4">

          {/* L */}
          <InputRow
            label="L — Mast length"
            unit="m"
            value={L}
            onChange={v => { setL(v); setResult(null); }}
          />

          {/* D_o */}
          <InputRow
            label="D_o — Outer diameter"
            unit="mm"
            value={Do}
            onChange={v => { setDo(v); setResult(null); }}
          />

          {/* t */}
          <InputRow
            label="t — Wall thickness"
            unit="mm"
            hint="Must be less than D_o / 2."
            value={t}
            onChange={v => { setT(v); setResult(null); }}
          />

          {/* Material + E */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <label className="text-xs text-graphite/70 flex-1">Material</label>
              <select
                value={matIdx}
                onChange={e => handleMaterialChange(parseInt(e.target.value, 10))}
                className="w-44 border border-panel-gray rounded px-2 py-1 text-sm bg-white"
              >
                {MATERIALS.map((mat, i) => (
                  <option key={mat.label} value={i}>{mat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-graphite/70 flex-1">
                E — Young&#39;s modulus{MATERIALS[matIdx].E_GPa === null ? " (enter value)" : ""}
              </label>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  value={E}
                  onChange={e => { setE(e.target.value); setResult(null); }}
                  readOnly={MATERIALS[matIdx].E_GPa !== null}
                  className={`w-28 border border-panel-gray rounded px-2 py-1 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
 MATERIALS[matIdx].E_GPa !== null ? "bg-instrument-white text-graphite/60 cursor-default" : ""
 }`}
                />
                <span className="text-xs text-graphite/50 w-8">GPa</span>
              </div>
            </div>
          </div>

          {/* m_linear */}
          <InputRow
            label="m_linear — Linear mass density"
            unit="kg/m"
            hint="For steel tube: approx ρ × A where ρ = 7850 kg/m³."
            value={mLinear}
            onChange={v => { setMLinear(v); setResult(null); }}
          />

          {/* V_min, V_max */}
          <div className="border-t border-panel-gray pt-3 flex flex-col gap-3">
            <p className="text-xs font-medium text-graphite/60">Design wind speed range</p>
            <InputRow
              label="V_min — Minimum design wind speed"
              unit="m/s"
              value={Vmin}
              onChange={v => { setVmin(v); setResult(null); }}
            />
            <InputRow
              label="V_max — Maximum design wind speed"
              unit="m/s"
              hint="Must be greater than V_min."
              value={Vmax}
              onChange={v => { setVmax(v); setResult(null); }}
            />
          </div>
        </div>
      </div>

      {/* ---- Calculate button ---- */}
      <button
        onClick={calculate}
        className="w-full bg-steel-blue hover:bg-steel-blue-deep text-white font-semibold py-2.5 px-4 rounded-lg transition-colors mb-4"
      >
        Calculate Natural Frequency
      </button>

      {calcError && (
        <p className="text-sm text-signal-red mb-4">{calcError}</p>
      )}

      {/* ---- SVG diagram ---- */}
      <div className="bg-white rounded-lg border border-panel-gray p-4 mb-4">
        <h2 className="text-sm font-semibold text-graphite/80 mb-3">Vortex Shedding Pattern (top-down view)</h2>
        <VortexSheddingDiagram />
      </div>

      {/* ---- Results card ---- */}
      {result && (
        <div className="bg-steel-blue-tint border border-steel-blue-line rounded-lg p-5 mb-4">
          <h2 className="text-base font-semibold text-steel-blue-deep mb-4">Results</h2>

          {/* Section properties */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-steel-blue-deep uppercase tracking-wide mb-2">Section Properties</p>
            <div className="flex flex-col gap-1.5">
              <ResultRow
                label="Inner diameter D_i"
                value={`${result.D_i_mm.toFixed(2)} mm`}
              />
              <ResultRow
                label="Second moment of area I"
                value={formatI(result.I_m4)}
              />
              <ResultRow
                label="Mass per unit length m"
                value={`${parseFloat(mLinear).toFixed(3)} kg/m`}
              />
            </div>
          </div>

          {/* Frequency results */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-steel-blue-deep uppercase tracking-wide mb-2">Frequencies</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between">
                <span className="text-sm text-graphite/80 flex-1 font-semibold">Natural frequency f_n</span>
                <span className="text-xl font-bold font-mono text-steel-blue-deep">
                  {result.f_n.toFixed(3)} Hz
                </span>
              </div>
              <ResultRow
                label="Shedding frequency at V_min"
                value={`${result.f_shed_min.toFixed(3)} Hz`}
              />
              <ResultRow
                label="Shedding frequency at V_max"
                value={`${result.f_shed_max.toFixed(3)} Hz`}
              />
              <ResultRow
                label="Shedding range across wind"
                value={`${result.f_shed_min.toFixed(2)} – ${result.f_shed_max.toFixed(2)} Hz`}
              />
            </div>
          </div>

          {/* Resonance flag */}
          <div className="border-t border-steel-blue-line pt-3">
            {result.resonance ? (
              <div className="bg-signal-red-tint border border-signal-red-line rounded-lg px-4 py-3">
                <p className="text-sm font-semibold text-signal-red-deep">
                  Resonance risk — shedding frequency overlaps natural frequency at{" "}
                  {result.V_resonance.toFixed(1)} m/s.
                </p>
                <p className="text-xs text-signal-red mt-1">
                  Consider helical strakes, a tuned mass damper, or a design change to shift f_n
                  outside the shedding range.
                </p>
              </div>
            ) : (
              <div className="bg-phosphor-green-tint border border-phosphor-green-line rounded-lg px-4 py-3">
                <p className="text-sm font-semibold text-phosphor-green-deep">
                  No resonance overlap in the specified wind range.
                </p>
                <p className="text-xs text-phosphor-green mt-1">
                  Resonance would occur at {result.V_resonance.toFixed(1)} m/s, which is outside
                  your V_min–V_max window.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Disclaimer ---- */}
      <div className="bg-signal-amber-tint border border-signal-amber-line rounded-lg px-4 py-3 text-xs text-signal-amber-deep">
        <strong>First-pass estimate only.</strong> Assumes a uniform, undamped cantilever with no
        added mass (payload, fittings) and a Strouhal number of 0.2. Real-world behavior is
        affected by structural damping, boundary conditions, and Reynolds number.
        Verify with a licensed structural engineer and full dynamic analysis for safety-critical
        applications.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Diagram — top-down flow view showing vortex shedding
// ---------------------------------------------------------------------------

/**
 * Static illustration of the von Kármán vortex street behind a cylindrical mast
 * cross-section. Wind approaches from the left; alternating vortices shed downstream.
 */
// ---------------------------------------------------------------------------
// SVG sub-element helpers (plain functions, not React components, to avoid
// the "component defined inside render" anti-pattern with ESLint).
// ---------------------------------------------------------------------------

/** Filled right-pointing arrowhead for wind arrows. */
function renderArrowhead(x: number, y: number, key: number) {
  const size = 6;
  return (
    <polygon
      key={key}
      points={`${x},${y} ${x - size},${y - size / 2} ${x - size},${y + size / 2}`}
      fill="#2B4C7E"
    />
  );
}

/**
 * Vortex swirl: nearly-full circular arc with an arrowhead showing rotation.
 * `cw` = true → clockwise in screen coordinates.
 */
function renderVortex(
  cx: number, cy: number, r: number, cw: boolean, opacity: number, key: number,
) {
  const startDeg = 20, endDeg = 340;
  const startR = (startDeg * Math.PI) / 180;
  const endR   = (endDeg   * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startR);
  const y1 = cy + r * Math.sin(startR);
  const x2 = cx + r * Math.cos(endR);
  const y2 = cy + r * Math.sin(endR);
  // sweep: 1 = CW in screen coords, 0 = CCW in screen coords
  const sweep = cw ? 1 : 0;
  const arcPath = `M ${x1} ${y1} A ${r} ${r} 0 1 ${sweep} ${x2} ${y2}`;
  // Arrowhead at end of arc, aligned with tangent
  const tangent = cw ? endR + Math.PI / 2 : endR - Math.PI / 2;
  const aLen = 5;
  const a1x = x2 + aLen * Math.cos(tangent + 0.5);
  const a1y = y2 + aLen * Math.sin(tangent + 0.5);
  const a2x = x2 + aLen * Math.cos(tangent - 0.5);
  const a2y = y2 + aLen * Math.sin(tangent - 0.5);

  return (
    <g key={key} opacity={opacity}>
      <path d={arcPath} fill="none" stroke="#2B4C7E" strokeWidth={1.5} />
      <path d={`M ${x2} ${y2} L ${a1x} ${a1y} L ${a2x} ${a2y} Z`} fill="#2B4C7E" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// SVG Diagram — top-down flow view showing vortex shedding
// ---------------------------------------------------------------------------

/**
 * Static illustration of the von Kármán vortex street behind a cylindrical mast
 * cross-section. Wind approaches from the left; alternating vortices shed downstream.
 */
function VortexSheddingDiagram() {
  const W = 340, H = 180;
  const CYL_CX = 130, CYL_CY = 90, CYL_R = 30;

  // Wind approach arrows: 5 horizontal arrows
  const windArrowYs = [30, 57, 90, 123, 150];
  const arrowEndX = CYL_CX - CYL_R - 5; // stop just before the cylinder

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-lg bg-instrument-white border border-panel-gray"
      style={{ minHeight: 160 }}
      aria-label="Vortex shedding diagram showing alternating vortices behind a cylinder"
    >
      {/* Wind approach arrows */}
      {windArrowYs.map((y, i) => (
        <g key={i}>
          <line
            x1={10} y1={y} x2={arrowEndX - 6} y2={y}
            stroke="#2B4C7E" strokeWidth={1.5}
          />
          {renderArrowhead(arrowEndX, y, i)}
        </g>
      ))}

      {/* "V" label above top arrow */}
      <text x={48} y={22} fill="#2B4C7E" fontSize={11} fontStyle="italic" fontWeight="bold">V</text>

      {/* Cylinder (mast cross-section) */}
      <circle
        cx={CYL_CX} cy={CYL_CY} r={CYL_R}
        fill="#CDD2D5" stroke="#1A1D21" strokeWidth={2}
      />

      {/* "D" dimension label inside the cylinder */}
      <line
        x1={CYL_CX - CYL_R + 4} y1={CYL_CY}
        x2={CYL_CX + CYL_R - 4} y2={CYL_CY}
        stroke="#1A1D21" strokeWidth={1}
      />
      <text
        x={CYL_CX} y={CYL_CY + 4}
        textAnchor="middle" dominantBaseline="middle"
        fill="#1A1D21" fontSize={10} fontWeight="bold"
      >
        D
      </text>

      {/* Flow streamlines wrapping around the cylinder */}
      {/* Upper streamline */}
      <path
        d={`M ${CYL_CX + CYL_R + 2} ${CYL_CY - CYL_R - 4}
            Q ${CYL_CX + CYL_R + 20} ${CYL_CY - CYL_R + 5}
              ${CYL_CX + CYL_R + 35} ${CYL_CY - 20}`}
        fill="none" stroke="#BFC9D8" strokeWidth={1} strokeDasharray="4 2"
      />
      {/* Lower streamline */}
      <path
        d={`M ${CYL_CX + CYL_R + 2} ${CYL_CY + CYL_R + 4}
            Q ${CYL_CX + CYL_R + 20} ${CYL_CY + CYL_R - 5}
              ${CYL_CX + CYL_R + 35} ${CYL_CY + 20}`}
        fill="none" stroke="#BFC9D8" strokeWidth={1} strokeDasharray="4 2"
      />

      {/* Von Kármán vortex street — alternating upper/lower pairs downstream */}
      {/* Upper vortex 1: CCW in screen */}
      {renderVortex(200, 63, 15, false, 1, 0)}
      {/* Lower vortex 1: CW in screen */}
      {renderVortex(230, 117, 15, true, 1, 1)}
      {/* Upper vortex 2: smaller, farther downstream */}
      {renderVortex(262, 63, 12, false, 0.7, 2)}
      {/* Lower vortex 2: smaller */}
      {renderVortex(292, 117, 12, true, 0.7, 3)}

      {/* Formula label at the bottom */}
      <text
        x={W / 2} y={H - 8}
        textAnchor="middle"
        fill="#5F6164" fontSize={9} fontStyle="italic"
      >
        f_shed = 0.2 × V / D
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Label + right-aligned number input with optional unit and hint. */
function InputRow({
  label, unit, hint, value, onChange,
}: {
  label: string;
  unit: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <label className="text-xs text-graphite/70 leading-tight block">{label}</label>
        {hint && <p className="text-xs text-graphite/50 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-28 border border-panel-gray rounded px-2 py-1 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-graphite/50 w-8">{unit}</span>
      </div>
    </div>
  );
}

/** Single result row: label on left, value on right. */
function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-graphite/70">{label}</span>
      <span className="text-sm font-mono font-semibold text-graphite">{value}</span>
    </div>
  );
}
