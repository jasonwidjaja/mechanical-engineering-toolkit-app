/**
 * Thermal Interface Material (TIM) Resistance Calculator
 *
 * Formulas:
 *   R_TIM (°C/W) = t_m / (k × A_m)
 *     t_m = TIM thickness in metres   (user inputs mm  → divide by 1000)
 *     A_m = contact area in m²         (user inputs mm² → divide by 1,000,000)
 *     k   = thermal conductivity (W/m·K)
 *
 *   ΔT (°C) = P × R_TIM
 *     P = power dissipation in Watts
 *
 * This is a first-pass estimate — it assumes uniform heat flow and perfect
 * contact pressure. Real-world performance depends on surface roughness,
 * contact pressure, and bond-line thickness uniformity.
 */

// "use client" tells Next.js that this component runs in the browser.
// Without it, React hooks like useState won't work because Next.js would
// try to render the page on the server, where there is no interactivity.
"use client";

// useState lets us store and update values that cause the UI to re-render.
import { useState } from "react";

// Link is Next.js's client-side navigation component — it's faster than a
// plain <a> tag because it prefetches the target page.
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// The four TIM presets. "custom" means the user enters their own k value.
type TimType = "paste" | "pad" | "filler" | "custom";

// Shape of the calculated result. Having a dedicated type makes it easy
// to pass around and check for null (no result yet vs. result ready).
type Result = {
  rTim: number;   // °C/W
  deltaT: number; // °C
};

// ---------------------------------------------------------------------------
// Preset data — maps each TIM type to a default k value
// ---------------------------------------------------------------------------
const TIM_PRESETS: Record<TimType, { label: string; k: number | null }> = {
  paste:  { label: "Thermal paste",  k: 5   },
  pad:    { label: "Thermal pad",    k: 3   },
  filler: { label: "Gap filler",     k: 1.5 },
  custom: { label: "Custom",         k: null },
};

// ---------------------------------------------------------------------------
// SVG Diagram
// ---------------------------------------------------------------------------
// This is a pure function — given the current inputs and result, it renders
// an SVG that shows a vertical cross-section: Component → TIM → Heatsink.
// Keeping it as a function (instead of a separate component) means it can
// read the parent's variables directly without prop drilling.

/**
 * Maps a TIM thickness in mm to a visual height in SVG pixels.
 * The range 0.1 mm → 2 mm is mapped to 12 px → 40 px.
 * Values outside the range are clamped so the diagram never looks broken.
 */
function timLayerHeight(tMm: number): number {
  const MIN_PX = 12;
  const MAX_PX = 40;
  const MIN_MM = 0.1;
  const MAX_MM = 2.0;
  // Linear interpolation, then clamp
  const clamped = Math.min(Math.max(tMm, MIN_MM), MAX_MM);
  return MIN_PX + ((clamped - MIN_MM) / (MAX_MM - MIN_MM)) * (MAX_PX - MIN_PX);
}

type DiagramProps = {
  tMm: string;       // raw string from the input — may be empty or invalid
  kVal: string;      // raw string from the k input
  pVal: string;      // raw string from the P input
  result: Result | null;
};

function TIMDiagram({ tMm, kVal, pVal, result }: DiagramProps) {
  // Parse the thickness, fall back to a mid-range default for display purposes.
  const t = parseFloat(tMm);
  const tVisual = isNaN(t) || t <= 0 ? 0.5 : t;
  const layerH = timLayerHeight(tVisual);

  // Fixed geometry — all values are in SVG user-units (pixels at 1:1 scale).
  const svgW = 320;
  const svgH = 200;

  // Horizontal layout: component+heatsink blocks span from x=20 to x=220.
  // Arrow occupies the right side x=240 to x=310.
  const blockX = 20;
  const blockW = 200;

  // Vertical layout (total height 200, top margin 10, bottom margin 10):
  //   Component rect:  top=10, height=60
  //   TIM layer:       immediately below component
  //   Heatsink rect:   immediately below TIM, fills to y=190
  const compTop = 10;
  const compH = 60;
  const timTop = compTop + compH;
  const heatTop = timTop + layerH;
  const heatH = svgH - 10 - heatTop; // fill down to y=190

  // Arrow geometry
  const arrowX = 255;
  const arrowTop = compTop;
  const arrowBot = svgH - 10;

  // What to show in the arrow label area
  const arrowLabel = result
    ? [`P = ${pVal} W`, `ΔT = ${result.deltaT.toFixed(2)} °C`]
    : ["Heat", "flow ↓"];

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="w-full max-w-sm mx-auto"
      aria-label="TIM cross-section diagram"
    >
      {/* ── Component block (blue) ── */}
      <rect
        x={blockX} y={compTop}
        width={blockW} height={compH}
        rx={4}
        fill="#bfdbfe"  /* blue-200 */
        stroke="#3b82f6" /* blue-500 */
        strokeWidth={1.5}
      />
      <text
        x={blockX + blockW / 2} y={compTop + compH / 2 + 5}
        textAnchor="middle"
        fontSize={13}
        fontWeight="600"
        fill="#1d4ed8" /* blue-700 */
      >
        Component
      </text>

      {/* ── TIM layer (amber/orange) ── */}
      <rect
        x={blockX} y={timTop}
        width={blockW} height={layerH}
        fill="#fde68a"   /* amber-200 */
        stroke="#f59e0b" /* amber-400 */
        strokeWidth={1.5}
      />
      {/* k value label inside the TIM layer (only if layer is tall enough) */}
      {layerH >= 16 && (
        <text
          x={blockX + blockW / 2} y={timTop + layerH / 2 + 4}
          textAnchor="middle"
          fontSize={10}
          fill="#92400e" /* amber-800 */
        >
          k = {kVal || "?"} W/m·K
        </text>
      )}

      {/* ── Dimension arrow for thickness t ── */}
      {/* Left-side bracket showing TIM thickness */}
      <line
        x1={blockX - 8} y1={timTop}
        x2={blockX - 8} y2={timTop + layerH}
        stroke="#f59e0b" strokeWidth={1.5}
      />
      {/* Top tick */}
      <line
        x1={blockX - 12} y1={timTop}
        x2={blockX - 4}  y2={timTop}
        stroke="#f59e0b" strokeWidth={1.5}
      />
      {/* Bottom tick */}
      <line
        x1={blockX - 12} y1={timTop + layerH}
        x2={blockX - 4}  y2={timTop + layerH}
        stroke="#f59e0b" strokeWidth={1.5}
      />
      {/* "t" label */}
      <text
        x={blockX - 14} y={timTop + layerH / 2 + 4}
        textAnchor="middle"
        fontSize={10}
        fontStyle="italic"
        fill="#b45309" /* amber-700 */
      >
        t
      </text>

      {/* ── Heatsink / Chassis block (gray) ── */}
      <rect
        x={blockX} y={heatTop}
        width={blockW} height={heatH}
        rx={4}
        fill="#e5e7eb"   /* gray-200 */
        stroke="#9ca3af" /* gray-400 */
        strokeWidth={1.5}
      />
      <text
        x={blockX + blockW / 2} y={heatTop + heatH / 2 + 5}
        textAnchor="middle"
        fontSize={13}
        fontWeight="600"
        fill="#374151" /* gray-700 */
      >
        Heatsink / Chassis
      </text>

      {/* ── Heat-flow arrow (right side, pointing downward) ── */}
      {/* Vertical line */}
      <line
        x1={arrowX} y1={arrowTop}
        x2={arrowX} y2={arrowBot - 12}
        stroke="#ef4444" /* red-500 */
        strokeWidth={2}
      />
      {/* Arrowhead */}
      <polygon
        points={`${arrowX - 7},${arrowBot - 12} ${arrowX + 7},${arrowBot - 12} ${arrowX},${arrowBot}`}
        fill="#ef4444"
      />
      {/* Labels above and below arrow */}
      {arrowLabel.map((line, i) => (
        <text
          key={i}
          x={arrowX + 12} y={arrowTop + 20 + i * 16}
          fontSize={10}
          fill="#b91c1c" /* red-700 */
        >
          {line}
        </text>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function TIMResistancePage() {
  // ── State ──
  // Each piece of state is a string because HTML inputs always return strings.
  // We parse them to numbers only at calculation time.
  const [timType, setTimType]   = useState<TimType>("paste");
  const [kInput, setKInput]     = useState("5");     // W/m·K
  const [tInput, setTInput]     = useState("");       // mm
  const [aInput, setAInput]     = useState("");       // mm²
  const [pInput, setPInput]     = useState("");       // W
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [result, setResult]     = useState<Result | null>(null);

  // ── Handlers ──

  /**
   * When the user picks a preset from the dropdown, update the TIM type and
   * pre-fill the k input — but keep it editable so the user can tweak it.
   * For "custom" we leave k as-is (whatever they had before).
   */
  function handleTimTypeChange(type: TimType) {
    setTimType(type);
    const preset = TIM_PRESETS[type];
    if (preset.k !== null) {
      setKInput(String(preset.k));
    }
    // Clear any previous results when the material changes
    setResult(null);
    setErrors({});
  }

  /**
   * Validate all inputs and return an errors object.
   * An empty object means "no errors found".
   */
  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};

    const k = parseFloat(kInput);
    const t = parseFloat(tInput);
    const a = parseFloat(aInput);
    const p = parseFloat(pInput);

    if (!kInput.trim())          errs.k = "Thermal conductivity is required.";
    else if (isNaN(k) || k <= 0) errs.k = "Must be a positive number.";

    if (!tInput.trim())          errs.t = "TIM thickness is required.";
    else if (isNaN(t) || t <= 0) errs.t = "Must be a positive number.";

    if (!aInput.trim())          errs.a = "Contact area is required.";
    else if (isNaN(a) || a <= 0) errs.a = "Must be a positive number.";

    if (!pInput.trim())          errs.p = "Power dissipation is required.";
    else if (isNaN(p) || p <= 0) errs.p = "Must be a positive number.";

    return errs;
  }

  function handleCalculate() {
    const errs = validate();
    setErrors(errs);
    // If there are any validation errors, clear the result and stop.
    if (Object.keys(errs).length > 0) { setResult(null); return; }

    const k   = parseFloat(kInput);
    const t_m = parseFloat(tInput)  / 1000;    // mm → m
    const A_m = parseFloat(aInput)  / 1_000_000; // mm² → m²
    const P   = parseFloat(pInput);

    // Core formula
    const rTim   = t_m / (k * A_m);  // °C/W
    const deltaT = P * rTim;          // °C

    setResult({ rTim, deltaT });
  }

  // Build the formula line that shows the actual substituted values.
  // This only exists after a successful calculation.
  const formulaLine = result
    ? `R = ${(parseFloat(tInput) / 1000).toFixed(4)} m / (${kInput} × ${(parseFloat(aInput) / 1_000_000).toExponential(2)} m²)`
    : null;

  return (
    // max-w-2xl gives us a bit more room because this page has an SVG diagram.
    <div className="max-w-2xl mx-auto">

      {/* Back navigation */}
      <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
        ← Back to all calculators
      </Link>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Thermal Interface Material (TIM) Resistance Calculator
      </h1>

      {/* Accuracy disclaimer — amber banner at the top */}
      <p className="text-amber-700 text-sm font-medium mb-6">
        First-pass estimate — not CFD-accurate
      </p>

      {/*
        Two-column layout on medium+ screens:
        left column = inputs, right column = SVG diagram.
        On small screens they stack vertically.
      */}
      <div className="flex flex-col md:flex-row gap-6">

        {/* ── Left column: inputs ── */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">

          {/* TIM type dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">TIM Type</label>
            <select
              value={timType}
              onChange={(e) => handleTimTypeChange(e.target.value as TimType)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              {/* Object.entries gives us [key, value] pairs from TIM_PRESETS */}
              {Object.entries(TIM_PRESETS).map(([key, { label, k }]) => (
                <option key={key} value={key}>
                  {label}{k !== null ? ` (k = ${k} W/m·K)` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              Selecting a standard type pre-fills k — you can still edit it below.
            </p>
          </div>

          {/* k — thermal conductivity */}
          <InputField
            label="Thermal Conductivity k"
            unit="W/m·K"
            value={kInput}
            onChange={(v) => { setKInput(v); setResult(null); }}
            error={errors.k}
            placeholder="e.g. 5"
            hint="Higher k = better conductor. Paste: ~3–8 · Pad: ~1–6 · Gap filler: ~1–3"
          />

          {/* t — TIM thickness */}
          <InputField
            label="TIM Thickness t"
            unit="mm"
            value={tInput}
            onChange={(v) => { setTInput(v); setResult(null); }}
            error={errors.t}
            placeholder="e.g. 0.1"
            hint="Bond-line thickness. Thinner = lower resistance, but harder to achieve in practice."
          />

          {/* A — contact area */}
          <InputField
            label="Contact Area A"
            unit="mm²"
            value={aInput}
            onChange={(v) => { setAInput(v); setResult(null); }}
            error={errors.a}
            placeholder="e.g. 400"
            hint="Area covered by the TIM (e.g. 20×20 mm die → 400 mm²)"
          />

          {/* P — power dissipation */}
          <InputField
            label="Power Dissipation P"
            unit="W"
            value={pInput}
            onChange={(v) => { setPInput(v); setResult(null); }}
            error={errors.p}
            placeholder="e.g. 15"
            hint="Total heat the component generates under load."
          />

          {/* Calculate button */}
          <button
            onClick={handleCalculate}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            Calculate
          </button>
        </div>

        {/* ── Right column: SVG diagram ── */}
        <div className="flex-shrink-0 md:w-72 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-center gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Cross-section view
          </p>
          {/*
            The diagram updates reactively as the user types — no "Calculate"
            needed to see the visual TIM thickness change.
          */}
          <TIMDiagram
            tMm={tInput}
            kVal={kInput}
            pVal={pInput}
            result={result}
          />
        </div>
      </div>

      {/* ── Results card — only shown after a successful calculation ── */}
      {result && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Result</h2>

          {/* Two big-number tiles side by side */}
          <div className="grid grid-cols-2 gap-4">
            <ResultTile
              label="R_TIM"
              value={result.rTim.toFixed(4)}
              unit="°C/W"
              primary
            />
            <ResultTile
              label="ΔT (junction rise)"
              value={result.deltaT.toFixed(2)}
              unit="°C"
              primary={false}
            />
          </div>

          {/* Formula line — shows exact values substituted in */}
          <p className="mt-4 text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2 font-mono">
            {formulaLine}
          </p>
          <p className="mt-1 text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2 font-mono">
            ΔT = {pInput} W × {result.rTim.toFixed(4)} °C/W
          </p>
        </div>
      )}

      {/* ── Disclaimer card ── */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">Important limitations</h3>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>Assumes uniform heat flux across the entire contact area.</li>
          <li>Does not account for contact resistance due to surface roughness.</li>
          <li>Bond-line thickness (BLT) in practice may differ from the nominal spec.</li>
          <li>Verify with thermal simulation (CFD) or physical measurement before final design sign-off.</li>
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
 * The long Tailwind class string on <input> suppresses the browser's built-in
 * number spinner arrows (the little ▲▼ buttons), which are ugly and off-brand.
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

/**
 * ResultTile — a single big-number display used inside the result card.
 * Primary tiles get a solid blue background; secondary tiles get white.
 */
type ResultTileProps = {
  label: string;
  value: string;
  unit: string;
  primary?: boolean;
};

function ResultTile({ label, value, unit, primary = false }: ResultTileProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-4 text-center ${
        primary
          ? "bg-blue-600 border-blue-700 text-white"
          : "bg-white border-blue-100 text-gray-800"
      }`}
    >
      {/* Small label above the number */}
      <p className={`text-xs font-semibold mb-1 ${primary ? "text-blue-200" : "text-blue-500"}`}>
        {label}
      </p>
      {/* Large result number */}
      <p className="text-2xl font-bold leading-tight">{value}</p>
      {/* Unit below the number */}
      <p className={`text-xs mt-1 ${primary ? "text-blue-300" : "text-gray-400"}`}>{unit}</p>
    </div>
  );
}
