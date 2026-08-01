/**
 * Natural Frequency Estimator
 *
 * Models the system as a simple single-degree-of-freedom (1-DOF) mass-spring:
 *
 *   ω_n = √(k / m)          (rad/s)  — angular natural frequency
 *   f_n = ω_n / (2π)        (Hz)     — natural frequency in cycles per second
 *   T   = 1 / f_n            (s)     — period; displayed in milliseconds
 *
 * Where:
 *   m = effective mass     (kg)
 *   k = effective stiffness (N/m)
 *
 * DISCLAIMER: This is a first-pass 1-DOF estimate. Real structures have multiple
 * vibration modes, frequency-dependent stiffness, damping, and boundary condition
 * sensitivities. Always verify critical assemblies with modal FEA and physical
 * shake-table testing.
 */
"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Excitation frequency reference table
// Each row has a label, low bound (Hz), and high bound (Hz).
// Used to flag potential resonance overlap after calculation.
// ---------------------------------------------------------------------------
const EXCITATION_SOURCES = [
  { source: "Road vehicle vibration",           fLow:   1,  fHigh:  30 },
  { source: "Rotating machinery (1000 RPM)",    fLow:  16.7, fHigh: 16.7 },
  { source: "Rotating machinery (3000 RPM)",    fLow:  50,  fHigh:  50 },
  { source: "Helicopter rotor (main)",          fLow:   4,  fHigh:  20 },
  { source: "Military transport vibration",     fLow:  10,  fHigh: 500 },
  { source: "Pedestrian footfall",              fLow:   1.5, fHigh:  3 },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when `fn` (Hz) is within ±20% of any point in the range [fLow, fHigh].
 * A single-frequency source (fLow === fHigh) checks fn against ±20% of that value.
 */
function isResonanceOverlap(fn: number, fLow: number, fHigh: number): boolean {
  // Expand the range by 20% on each side
  const expandedLow  = fLow  * 0.8;
  const expandedHigh = fHigh * 1.2;
  return fn >= expandedLow && fn <= expandedHigh;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Result = {
  fn: number;   // natural frequency, Hz
  wn: number;   // angular natural frequency, rad/s
  T: number;    // period, ms
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function VibrationPage() {
  // String inputs so the <input> field shows exactly what the user typed
  const [mass, setMass]           = useState("");
  const [stiffness, setStiffness] = useState("");

  // Per-field validation errors
  const [errors, setErrors] = useState<{ mass?: string; stiffness?: string }>({});

  // Null until the user clicks Calculate
  const [result, setResult] = useState<Result | null>(null);

  // --- Validation & calculation ------------------------------------------
  function validate(): { mass?: string; stiffness?: string } {
    const errs: { mass?: string; stiffness?: string } = {};
    const m = parseFloat(mass);
    const k = parseFloat(stiffness);

    if (!mass.trim()) errs.mass = "Mass is required.";
    else if (isNaN(m) || m <= 0) errs.mass = "Must be a positive number.";

    if (!stiffness.trim()) errs.stiffness = "Stiffness is required.";
    else if (isNaN(k) || k <= 0) errs.stiffness = "Must be a positive number.";

    return errs;
  }

  function handleCalculate() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { setResult(null); return; }

    const m = parseFloat(mass);
    const k = parseFloat(stiffness);

    const wn = Math.sqrt(k / m);             // rad/s
    const fn = wn / (2 * Math.PI);           // Hz
    const T  = (1 / fn) * 1000;              // ms

    setResult({ fn, wn, T });
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Back navigation */}
      <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Natural Frequency Estimator</h1>
      <p className="text-gray-500 text-sm mb-6">
        Simple mass-spring model — first-pass estimate only
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* INPUT CARD                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5 mb-4">

        {/* Mass input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Effective Mass <span className="font-normal text-gray-400">(m)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={mass}
              onChange={e => { setMass(e.target.value); setResult(null); }}
              placeholder="e.g. 2.5"
              className={`
                flex-1 rounded-lg border px-3 py-2 text-sm outline-none
                focus:ring-2 focus:ring-blue-400 transition
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                ${errors.mass ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}
              `}
            />
            <span className="text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-md px-2 py-2 min-w-[3.5rem] text-center">
              kg
            </span>
          </div>
          {errors.mass && <p className="text-xs text-red-600">{errors.mass}</p>}
          {!errors.mass && (
            <p className="text-xs text-gray-400">
              Lumped mass of the moving body (include attached components)
            </p>
          )}
        </div>

        {/* Stiffness input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Effective Stiffness <span className="font-normal text-gray-400">(k)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={stiffness}
              onChange={e => { setStiffness(e.target.value); setResult(null); }}
              placeholder="e.g. 10000"
              className={`
                flex-1 rounded-lg border px-3 py-2 text-sm outline-none
                focus:ring-2 focus:ring-blue-400 transition
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                ${errors.stiffness ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}
              `}
            />
            <span className="text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-md px-2 py-2 min-w-[3.5rem] text-center">
              N/m
            </span>
          </div>
          {errors.stiffness && <p className="text-xs text-red-600">{errors.stiffness}</p>}
          {!errors.stiffness && (
            <p className="text-xs text-gray-400">
              Spring/structural stiffness resisting the motion (N/m = N per meter of deflection)
            </p>
          )}
        </div>

        {/* Calculate button */}
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          Calculate Natural Frequency
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RESULTS — shown after a successful calculation                       */}
      {/* ------------------------------------------------------------------ */}
      {result && (
        <>
          {/* Primary result tile: f_n */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Result</h2>

            {/* f_n — the main answer, shown large */}
            <div className="bg-blue-600 border border-blue-700 rounded-lg px-4 py-4 text-white text-center mb-3">
              <p className="text-xs font-semibold text-blue-200 mb-1 uppercase tracking-wide">
                Natural Frequency (f<sub>n</sub>)
              </p>
              <p className="text-3xl font-bold">{result.fn.toFixed(3)}</p>
              <p className="text-sm text-blue-200 mt-0.5">Hz</p>
            </div>

            {/* Secondary results: ω_n and T side-by-side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-blue-100 rounded-lg px-3 py-3 text-center">
                <p className="text-xs font-semibold text-blue-500 mb-1">
                  Angular freq. (ω<sub>n</sub>)
                </p>
                <p className="text-xl font-bold text-gray-800">{result.wn.toFixed(3)}</p>
                <p className="text-xs text-gray-400 mt-0.5">rad/s</p>
              </div>
              <div className="bg-white border border-blue-100 rounded-lg px-3 py-3 text-center">
                <p className="text-xs font-semibold text-blue-500 mb-1">Period (T)</p>
                <p className="text-xl font-bold text-gray-800">{result.T.toFixed(3)}</p>
                <p className="text-xs text-gray-400 mt-0.5">ms</p>
              </div>
            </div>

            {/* Formula with substituted values */}
            <div className="mt-4 bg-blue-100 rounded-lg px-3 py-2 text-xs font-mono text-blue-700 space-y-0.5">
              <p>ω_n = √(k / m) = √({parseFloat(stiffness).toLocaleString()} / {parseFloat(mass)}) = {result.wn.toFixed(4)} rad/s</p>
              <p>f_n = ω_n / (2π) = {result.fn.toFixed(4)} Hz</p>
              <p>T   = 1 / f_n = {(result.T / 1000).toFixed(6)} s = {result.T.toFixed(3)} ms</p>
            </div>
          </div>

          {/* ---- Resonance reference table -------------------------------- */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Excitation Frequency Reference</h3>
            <p className="text-xs text-gray-400 mb-3">
              Rows highlighted in yellow are within ±20% of your calculated f<sub>n</sub> — possible
              resonance overlap.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 pr-4">Source</th>
                  <th className="text-right pb-2">Typical frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {EXCITATION_SOURCES.map(row => {
                  const overlap = isResonanceOverlap(result.fn, row.fLow, row.fHigh);
                  // Format the frequency cell: single value vs a range
                  const freqLabel = row.fLow === row.fHigh
                    ? `${row.fLow} Hz`
                    : `${row.fLow}–${row.fHigh} Hz`;

                  return (
                    <tr
                      key={row.source}
                      className={overlap ? "bg-yellow-50" : ""}
                    >
                      <td className={`py-2 pr-4 ${overlap ? "text-yellow-800 font-medium" : "text-gray-600"}`}>
                        {row.source}
                        {/* Resonance warning badge */}
                        {overlap && (
                          <span className="ml-2 text-xs text-yellow-700 font-semibold">
                            ⚠ Possible resonance overlap — consider design changes.
                          </span>
                        )}
                      </td>
                      <td className={`py-2 text-right font-mono text-xs ${overlap ? "text-yellow-700 font-semibold" : "text-gray-500"}`}>
                        {freqLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DISCLAIMER                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
        <strong>Disclaimer:</strong> Simple 1-DOF model. Real assemblies have multiple modes,
        frequency-dependent stiffness, damping effects, and boundary condition sensitivities.
        Verify critical assemblies with modal FEA and physical shake-table testing.
      </div>
    </div>
  );
}
