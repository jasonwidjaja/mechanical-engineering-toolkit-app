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
import Gauge from "@/components/ui/Gauge";

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

/**
 * Governing resonance margin — the scalar behind the dial.
 *
 * The table can only say "this row overlaps"; it can't say whether f_n cleared
 * the nearest source by 3% or by 300%. This collapses all six sources into one
 * number: how many times clear f_n is of the closest ±20% guard band.
 *
 *   f_n above a band  → fn / (fHigh × 1.2)
 *   f_n below a band  → (fLow × 0.8) / fn
 *   f_n inside a band → both terms <= 1
 *
 * Taking max() of the two picks whichever side applies, and taking min() across
 * sources gives the worst — i.e. governing — case. So margin < 1 means an
 * overlap exists, and margin = 2 means twice clear of the nearest source.
 */
function resonanceMargin(fn: number): { margin: number; nearest: string } {
  let margin = Infinity;
  let nearest = "";
  for (const s of EXCITATION_SOURCES) {
    const lo = s.fLow * 0.8;
    const hi = s.fHigh * 1.2;
    const m = Math.max(fn / hi, lo / fn);
    if (m < margin) {
      margin = m;
      nearest = s.source;
    }
  }
  return { margin, nearest };
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
      <Link href="/" className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-graphite mb-1">Natural Frequency Estimator</h1>
      <p className="text-graphite/60 text-sm mb-6">
        Simple mass-spring model — first-pass estimate only
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* INPUT CARD                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg border border-panel-gray p-6 flex flex-col gap-5 mb-4">

        {/* Mass input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-graphite/80">
            Effective Mass <span className="font-normal text-graphite/50">(m)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={mass}
              onChange={e => { setMass(e.target.value); setResult(null); }}
              placeholder="e.g. 2.5"
              className={`
 flex-1 rounded-lg border px-3 py-2 text-sm font-mono tabular-nums
 transition
 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
 ${errors.mass ? "border-signal-red-line bg-signal-red-tint" : "border-graphite/20 bg-white"}
 `}
            />
            <span className="unit-chip min-w-[3.5rem]">
              kg
            </span>
          </div>
          {errors.mass && <p className="text-xs text-signal-red">{errors.mass}</p>}
          {!errors.mass && (
            <p className="text-xs text-graphite/50">
              Lumped mass of the moving body (include attached components)
            </p>
          )}
        </div>

        {/* Stiffness input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-graphite/80">
            Effective Stiffness <span className="font-normal text-graphite/50">(k)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={stiffness}
              onChange={e => { setStiffness(e.target.value); setResult(null); }}
              placeholder="e.g. 10000"
              className={`
 flex-1 rounded-lg border px-3 py-2 text-sm font-mono tabular-nums
 transition
 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
 ${errors.stiffness ? "border-signal-red-line bg-signal-red-tint" : "border-graphite/20 bg-white"}
 `}
            />
            <span className="unit-chip min-w-[3.5rem]">
              N/m
            </span>
          </div>
          {errors.stiffness && <p className="text-xs text-signal-red">{errors.stiffness}</p>}
          {!errors.stiffness && (
            <p className="text-xs text-graphite/50">
              Spring/structural stiffness resisting the motion (N/m = N per meter of deflection)
            </p>
          )}
        </div>

        {/* Calculate button */}
        <button
          onClick={handleCalculate}
          className="btn-primary"
        >
          Calculate Natural Frequency
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RESULTS — shown after a successful calculation                       */}
      {/* ------------------------------------------------------------------ */}
      {result && (() => {
        // Computed here rather than in the body above so it only runs when
        // there is a result to describe.
        const margin = resonanceMargin(result.fn);
        return (
        <>
          {/* Primary result panel */}
          <div className="panel mb-4 p-6">
            <h2 className="label-caps mb-5">Result</h2>

            {/* f_n — the main answer */}
            <div className="mb-5 text-center">
              <p className="readout text-4xl">{result.fn.toFixed(3)}</p>
              <p className="mt-0.5 font-mono text-sm text-graphite/60">Hz</p>
              <p className="label-caps mt-1">
                Natural frequency f<sub>n</sub>
              </p>
            </div>

            {/* Resonance margin dial — see resonanceMargin() above. */}
            <div className="border-t border-panel-gray pt-5">
              <Gauge
                value={Math.min(margin.margin, 3)}
                min={0}
                max={3}
                zones={[
                  { from: 0, to: 1, tone: "bad" },
                  { from: 1, to: 1.5, tone: "warn" },
                  { from: 1.5, to: 3, tone: "good" },
                ]}
                label="Resonance margin"
                unit="×"
                decimals={2}
                statusText={
                  margin.margin < 1
                    ? `f_n falls inside the ±20% band around ${margin.nearest}. Shift stiffness or mass to move it clear.`
                    : margin.margin < 1.5
                    ? `Closest source is ${margin.nearest}, only ${margin.margin.toFixed(2)}× clear. Tight — verify with modal FEA.`
                    : `Clear of all six reference sources. Closest is ${margin.nearest} at ${margin.margin.toFixed(2)}× separation.`
                }
              />
            </div>

            {/* Secondary results: ω_n and T side-by-side */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="subpanel px-3 py-3 text-center">
                <p className="label-caps mb-1">
                  Angular freq. ω<sub>n</sub>
                </p>
                <p className="readout text-xl">{result.wn.toFixed(3)}</p>
                <p className="mt-0.5 font-mono text-xs text-graphite/50">rad/s</p>
              </div>
              <div className="subpanel px-3 py-3 text-center">
                <p className="label-caps mb-1">Period T</p>
                <p className="readout text-xl">{result.T.toFixed(3)}</p>
                <p className="mt-0.5 font-mono text-xs text-graphite/50">ms</p>
              </div>
            </div>

            {/* Formula with substituted values */}
            <div className="subpanel mt-4 space-y-0.5 px-3 py-2 font-mono text-xs text-graphite/70">
              <p>ω_n = √(k / m) = √({parseFloat(stiffness).toLocaleString()} / {parseFloat(mass)}) = {result.wn.toFixed(4)} rad/s</p>
              <p>f_n = ω_n / (2π) = {result.fn.toFixed(4)} Hz</p>
              <p>T   = 1 / f_n = {(result.T / 1000).toFixed(6)} s = {result.T.toFixed(3)} ms</p>
            </div>
          </div>

          {/* ---- Resonance reference table -------------------------------- */}
          <div className="bg-white rounded-lg border border-panel-gray p-5 mb-4">
            <h3 className="text-sm font-semibold text-graphite/80 mb-1">Excitation Frequency Reference</h3>
            <p className="text-xs text-graphite/50 mb-3">
              Highlighted rows sit within ±20% of your calculated f<sub>n</sub>. The dial above
              shows the margin to the closest of them.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-graphite/50 border-b border-panel-gray">
                  <th className="text-left pb-2 pr-4">Source</th>
                  <th className="text-right pb-2">Typical frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-gray">
                {EXCITATION_SOURCES.map(row => {
                  const overlap = isResonanceOverlap(result.fn, row.fLow, row.fHigh);
                  // Format the frequency cell: single value vs a range
                  const freqLabel = row.fLow === row.fHigh
                    ? `${row.fLow} Hz`
                    : `${row.fLow}–${row.fHigh} Hz`;

                  return (
                    <tr
                      key={row.source}
                      className={overlap ? "bg-signal-amber-tint" : ""}
                    >
                      <td className={`py-2 pr-4 ${overlap ? "text-signal-amber-deep font-medium" : "text-graphite/70"}`}>
                        {row.source}
                        {/* Resonance warning badge */}
                        {overlap && (
                          <span className="ml-2 text-xs text-signal-amber-deep font-semibold">
                            ⚠ Possible resonance overlap — consider design changes.
                          </span>
                        )}
                      </td>
                      <td className={`py-2 text-right font-mono text-xs ${overlap ? "text-signal-amber-deep font-semibold" : "text-graphite/60"}`}>
                        {freqLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
        );
      })()}

      {/* ------------------------------------------------------------------ */}
      {/* DISCLAIMER                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-signal-amber-tint border border-signal-amber-line rounded-lg px-4 py-3 text-xs text-signal-amber-deep">
        <strong>Disclaimer:</strong> Simple 1-DOF model. Real assemblies have multiple modes,
        frequency-dependent stiffness, damping effects, and boundary condition sensitivities.
        Verify critical assemblies with modal FEA and physical shake-table testing.
      </div>
    </div>
  );
}
