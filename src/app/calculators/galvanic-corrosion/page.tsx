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

// ---------------------------------------------------------------------------
// Galvanic series data — ordered anodic (index 0) to noble (index 14).
// Lower index = more active/anodic = more likely to corrode.
// Higher index = more noble/cathodic = tends to be protected.
//
// Source: representative ordering per MIL-STD-889C and common references.
// Passive vs. active stainless depends on surface oxide condition.
// ---------------------------------------------------------------------------
const GALVANIC_SERIES = [
  { name: "Magnesium alloys",              index: 0  },
  { name: "Zinc (hot-dip galvanized)",     index: 1  },
  { name: "Aluminum alloys (2xxx)",        index: 2  },
  { name: "Aluminum alloys (6061, 7075)",  index: 3  },
  { name: "Mild/carbon steel",             index: 4  },
  { name: "Zinc-plated steel",             index: 5  },
  { name: "Cast iron",                     index: 6  },
  { name: "Stainless 304/316 (active)",   index: 7  },
  { name: "Lead",                          index: 8  },
  { name: "Tin",                           index: 9  },
  { name: "Copper alloys (brass, bronze)", index: 10 },
  { name: "Copper",                        index: 11 },
  { name: "Titanium",                      index: 12 },
  { name: "Stainless 304/316 (passive)",  index: 13 },
  { name: "Gold / Platinum",              index: 14 },
] as const;

// ---------------------------------------------------------------------------
// Risk classification based on galvanic series index separation.
//
// separation = |index_A − index_B|
//   0:    Same material, no galvanic risk
//   1–2:  Low risk
//   3–5:  Moderate risk
//   6+:   High risk
// ---------------------------------------------------------------------------
function getRisk(indexA: number, indexB: number) {
  const sep = Math.abs(indexA - indexB);

  if (sep === 0) return {
    level: "none" as const,
    label: "Same material — no galvanic risk",
    color: "green" as const,
    mitigation: "No special action required. Ensure good drainage to prevent water pooling.",
  };
  if (sep <= 2) return {
    level: "low" as const,
    label: "Low risk — generally acceptable in most environments",
    color: "green" as const,
    mitigation: "No special action required. Ensure good drainage to prevent water pooling.",
  };
  if (sep <= 5) return {
    level: "moderate" as const,
    label: "Moderate risk — consider isolation in wet/outdoor environments",
    color: "yellow" as const,
    mitigation:
      "Apply compatible primer or coating at the interface. Use aluminum or stainless hardware where possible. Ensure good drainage.",
  };
  return {
    level: "high" as const,
    label: "High risk — isolation required (anodizing, isolating washers, compatible coating)",
    color: "red" as const,
    mitigation:
      "Isolate with anodized aluminum, PTFE/nylon washers, isolating bushings, or a compatible sealant. Avoid using in salt/marine environments without isolation.",
  };
}

// Tailwind color classes for each risk color
const riskBadgeClasses: Record<string, string> = {
  green:  "bg-green-50 border-green-300 text-green-800",
  yellow: "bg-yellow-50 border-yellow-300 text-yellow-800",
  red:    "bg-red-50 border-red-300 text-red-800",
};

// Section header dot color for the mitigation box
const riskDotClasses: Record<string, string> = {
  green:  "bg-green-500",
  yellow: "bg-yellow-500",
  red:    "bg-red-500",
};

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
      <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Galvanic Corrosion Compatibility</h1>
      <p className="text-gray-500 text-sm mb-6">
        Reference per MIL-STD-889C (Dissimilar Metals)
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Metal picker card                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">

        {/* Two-column: Metal A left, Metal B right */}
        <div className="grid grid-cols-2 gap-4">

          {/* Metal A dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Metal A{" "}
              <span className="font-normal text-gray-400">(anodic end → corrodes)</span>
            </label>
            <select
              value={metalAIdx}
              onChange={(e) => setMetalAIdx(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              {GALVANIC_SERIES.map((m, i) => (
                <option key={m.name} value={i}>{m.name}</option>
              ))}
            </select>
            {/* Show galvanic index to help user orient themselves */}
            <p className="text-xs text-gray-400">
              Galvanic index: {metalA.index} (lower = more anodic)
            </p>
          </div>

          {/* Metal B dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Metal B{" "}
              <span className="font-normal text-gray-400">(noble end → protected)</span>
            </label>
            <select
              value={metalBIdx}
              onChange={(e) => setMetalBIdx(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              {GALVANIC_SERIES.map((m, i) => (
                <option key={m.name} value={i}>{m.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              Galvanic index: {metalB.index} (higher = more noble)
            </p>
          </div>
        </div>

        {/* Index separation — shown inline so the user sees the math */}
        <p className="text-xs text-gray-500 font-mono bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          Index separation = |{metalA.index} − {metalB.index}| = {Math.abs(metalA.index - metalB.index)}
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Risk result card                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Compatibility Result</h2>

        {/* Risk badge */}
        <div className={`rounded-lg border px-4 py-3 mb-4 text-sm font-medium ${riskBadgeClasses[risk.color]}`}>
          {risk.label}
        </div>

        {/* Recommended mitigations */}
        <div className="bg-white rounded-lg border border-blue-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${riskDotClasses[risk.color]}`} />
            <p className="text-xs font-semibold text-gray-700">Recommended Mitigations</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{risk.mitigation}</p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Galvanic series reference table                                     */}
      {/* Shows all metals from anodic (top) to noble (bottom).              */}
      {/* Selected metals are highlighted in their respective colors.         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Galvanic Series Reference
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Anodic (corrodes) at top → Noble (protected) at bottom
        </p>

        {/* Scrollable table wrapper */}
        <div className="overflow-y-auto max-h-72 rounded-lg border border-gray-100">
          <table className="w-full text-xs text-gray-600">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left px-3 py-2 font-medium text-gray-500">Material</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">Index</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {GALVANIC_SERIES.map((m, i) => {
                // Determine if this row is one of the selected metals
                const isA = i === metalAIdx;
                const isB = i === metalBIdx;
                const isBoth = isA && isB; // same metal selected for both

                // Row highlight classes
                let rowClass = "";
                if (isBoth)      rowClass = "bg-purple-50";
                else if (isA)    rowClass = "bg-blue-50";
                else if (isB)    rowClass = "bg-violet-50";

                return (
                  <tr key={m.name} className={rowClass}>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        {/* Color dot for selected metals */}
                        {isA && !isBoth && (
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        {isB && !isBoth && (
                          <span className="inline-block w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                        )}
                        {isBoth && (
                          <span className="inline-block w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                        )}
                        {!isA && !isB && (
                          <span className="inline-block w-2 h-2 flex-shrink-0" /> // spacer
                        )}
                        <span className={`${(isA || isB) ? "font-semibold" : ""}`}>
                          {m.name}
                        </span>
                        {/* Labels for selected rows */}
                        {isA && !isBoth && (
                          <span className="ml-1 text-blue-600 font-medium">(A)</span>
                        )}
                        {isB && !isBoth && (
                          <span className="ml-1 text-violet-600 font-medium">(B)</span>
                        )}
                        {isBoth && (
                          <span className="ml-1 text-purple-600 font-medium">(A & B)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{m.index}</td>
                    <td className="px-3 py-2 text-right text-gray-400">
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
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Risk level is based on relative position in the galvanic series per MIL-STD-889C.</span>{" "}
          Actual corrosion severity depends on electrolyte (type, concentration, temperature),
          area ratio (small anode/large cathode = accelerated attack), galvanic couple geometry,
          and service environment. Consult a corrosion engineer for safety-critical structures.
        </p>
      </div>
    </div>
  );
}
