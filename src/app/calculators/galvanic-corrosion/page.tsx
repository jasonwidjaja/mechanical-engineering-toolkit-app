/**
 * Galvanic Corrosion Compatibility
 *
 * Reference: MIL-STD-889C (Dissimilar Metals)
 *
 * How galvanic corrosion works:
 *   When two dissimilar metals are in electrical contact in the presence of
 *   an electrolyte (water, humidity, salt spray), they form a galvanic cell.
 *   The more "anodic" metal (lower in the galvanic series) acts as the anode
 *   and corrodes preferentially. The more "noble" metal (higher in the series)
 *   is protected.
 *
 * Risk estimate:
 *   The further apart two metals are in the galvanic series, the greater the
 *   potential difference and the more aggressive the corrosion. This page uses
 *   the index gap as a simple proxy for risk.
 *
 * "use client" is required here because the dropdowns use React state to
 * dynamically update the risk display without a full page reload.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import Gauge from "@/components/ui/Gauge";
import {
  GALVANIC_SERIES,
  GALVANIC_ZONES,
  GALVANIC_MAX_SEPARATION,
  getRisk,
} from "@/lib/galvanic";

export default function GalvanicCorrosionPage() {
  // Default to Al 6061 (index 3) vs. Stainless passive (index 13)
  // to immediately show an interesting result when the page loads.
  const [metalAIdx, setMetalAIdx] = useState(3);
  const [metalBIdx, setMetalBIdx] = useState(13);

  const metalA = GALVANIC_SERIES[metalAIdx];
  const metalB = GALVANIC_SERIES[metalBIdx];
  const risk   = getRisk(metalA.index, metalB.index);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-graphite mb-1">Galvanic Corrosion Compatibility</h1>
      <p className="text-graphite/60 text-sm mb-6">
        Reference per MIL-STD-889C (Dissimilar Metals)
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Metal picker card                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg border border-panel-gray p-6 flex flex-col gap-5">

        {/* Two-column: Metal A left, Metal B right */}
        <div className="grid grid-cols-2 gap-4">

          {/* Metal A dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-graphite/80">
              Metal A{" "}
              <span className="font-normal text-graphite/50">(anodic end → corrodes)</span>
            </label>
            <select
              value={metalAIdx}
              onChange={(e) => setMetalAIdx(Number(e.target.value))}
              className="rounded-lg border border-graphite/20 bg-white px-3 py-2 text-sm transition"
            >
              {GALVANIC_SERIES.map((m, i) => (
                <option key={m.name} value={i}>{m.name}</option>
              ))}
            </select>
            {/* Show galvanic index to help user orient themselves */}
            <p className="text-xs text-graphite/50">
              Galvanic index: {metalA.index} (lower = more anodic)
            </p>
          </div>

          {/* Metal B dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-graphite/80">
              Metal B{" "}
              <span className="font-normal text-graphite/50">(noble end → protected)</span>
            </label>
            <select
              value={metalBIdx}
              onChange={(e) => setMetalBIdx(Number(e.target.value))}
              className="rounded-lg border border-graphite/20 bg-white px-3 py-2 text-sm transition"
            >
              {GALVANIC_SERIES.map((m, i) => (
                <option key={m.name} value={i}>{m.name}</option>
              ))}
            </select>
            <p className="text-xs text-graphite/50">
              Galvanic index: {metalB.index} (higher = more noble)
            </p>
          </div>
        </div>

        {/* Index separation — shown inline so the user sees the math */}
        <p className="text-xs text-graphite/60 font-mono bg-instrument-white border border-panel-gray rounded-lg px-3 py-2">
          Index separation = |{metalA.index} − {metalB.index}| = {Math.abs(metalA.index - metalB.index)}
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Risk result card                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="panel mt-6 p-6">
        <h2 className="label-caps mb-5">Compatibility Result</h2>

        {/* Separation dial. Zones come from src/lib/galvanic.ts, the same
            module the Materials Database comparison reads, so the two views
            can never disagree about what counts as high risk. */}
        <Gauge
          value={Math.abs(metalA.index - metalB.index)}
          min={0}
          max={GALVANIC_MAX_SEPARATION}
          zones={GALVANIC_ZONES}
          label="Galvanic series separation"
          decimals={0}
          statusText={risk.label}
        />

        {/* Recommended mitigations */}
        <div className="subpanel mt-6 p-4">
          <p className="label-caps mb-2">Recommended mitigations</p>
          <p className="text-sm leading-relaxed text-graphite/70">{risk.mitigation}</p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Galvanic series reference table                                     */}
      {/* Shows all metals from anodic (top) to noble (bottom).              */}
      {/* Selected metals are highlighted in their respective colors.         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6 bg-white rounded-lg border border-panel-gray p-5">
        <h3 className="text-sm font-semibold text-graphite/80 mb-1">
          Galvanic Series Reference
        </h3>
        <p className="text-xs text-graphite/50 mb-3">
          Anodic (corrodes) at top → Noble (protected) at bottom
        </p>

        {/* Scrollable table wrapper */}
        <div className="overflow-y-auto max-h-72 rounded-lg border border-panel-gray">
          <table className="w-full text-xs text-graphite/70">
            <thead className="sticky top-0 bg-instrument-white">
              <tr className="border-b border-panel-gray">
                <th className="text-left px-3 py-2 font-medium text-graphite/60">Material</th>
                <th className="text-right px-3 py-2 font-medium text-graphite/60">Index</th>
                <th className="text-right px-3 py-2 font-medium text-graphite/60">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-gray">
              {GALVANIC_SERIES.map((m, i) => {
                // Determine if this row is one of the selected metals
                const isA = i === metalAIdx;
                const isB = i === metalBIdx;
                const isBoth = isA && isB; // same metal selected for both

                // Row highlight classes
                let rowClass = "";
                if (isBoth)      rowClass = "bg-panel-gray";
                else if (isA)    rowClass = "bg-steel-blue-tint";
                else if (isB)    rowClass = "bg-panel-gray";

                return (
                  <tr key={m.name} className={rowClass}>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        {/* Color dot for selected metals */}
                        {isA && !isBoth && (
                          <span className="inline-block w-2 h-2 rounded-full bg-steel-blue flex-shrink-0" />
                        )}
                        {isB && !isBoth && (
                          <span className="inline-block w-2 h-2 rounded-full bg-graphite/60 flex-shrink-0" />
                        )}
                        {isBoth && (
                          <span className="inline-block w-2 h-2 rounded-full bg-graphite/60 flex-shrink-0" />
                        )}
                        {!isA && !isB && (
                          <span className="inline-block w-2 h-2 flex-shrink-0" /> // spacer
                        )}
                        <span className={`${(isA || isB) ? "font-semibold" : ""}`}>
                          {m.name}
                        </span>
                        {/* Labels for selected rows */}
                        {isA && !isBoth && (
                          <span className="ml-1 text-steel-blue font-medium">(A)</span>
                        )}
                        {isB && !isBoth && (
                          <span className="ml-1 text-graphite/70 font-medium">(B)</span>
                        )}
                        {isBoth && (
                          <span className="ml-1 text-graphite/70 font-medium">(A & B)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{m.index}</td>
                    <td className="px-3 py-2 text-right text-graphite/50">
                      {/* Plain-English pole labels at the extremes */}
                      {m.index === 0 && "← most anodic"}
                      {m.index === 14 && "most noble →"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Disclaimer                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6 bg-signal-amber-tint border border-signal-amber-line rounded-lg p-5">
        <p className="text-xs text-signal-amber-deep leading-relaxed">
          <span className="font-semibold">Risk level is based on relative position in the galvanic series per MIL-STD-889C.</span>{" "}
          Actual corrosion severity depends on electrolyte (type, concentration, temperature),
          area ratio (small anode/large cathode = accelerated attack), galvanic couple geometry,
          and service environment. Consult a corrosion engineer for safety-critical structures.
        </p>
      </div>
    </div>
  );
}
