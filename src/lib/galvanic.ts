/**
 * Galvanic series and dissimilar-metal risk logic.
 *
 * Reference: MIL-STD-889C (Dissimilar Metals)
 *
 * This lived inside the Galvanic Corrosion page until the Materials Database
 * needed the same risk call for its two-metal comparison banner. Rather than
 * copy the thresholds — which is exactly how two parts of an app start giving
 * different answers to the same question — it moved here and both import it.
 *
 * How galvanic corrosion works:
 *   When two dissimilar metals are in electrical contact in the presence of an
 *   electrolyte (water, humidity, salt spray), they form a galvanic cell. The
 *   more anodic metal (lower in the series) corrodes preferentially; the more
 *   noble metal (higher in the series) is protected.
 *
 * Risk estimate:
 *   The further apart two metals sit in the series, the greater the potential
 *   difference and the more aggressive the attack. The index gap is used as a
 *   simple proxy for that.
 */

import type { GaugeZone } from "@/components/ui/Gauge";

// ---------------------------------------------------------------------------
// Galvanic series data — ordered anodic (index 0) to noble (index 14).
// Lower index = more active/anodic = more likely to corrode.
// Higher index = more noble/cathodic = tends to be protected.
//
// Source: representative ordering per MIL-STD-889C and common references.
// Passive vs. active stainless depends on surface oxide condition.
// ---------------------------------------------------------------------------
export const GALVANIC_SERIES = [
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

/** Widest possible separation on the series — the dial's end stop. */
export const GALVANIC_MAX_SEPARATION = 14;

export type GalvanicRisk = {
  level: "none" | "low" | "moderate" | "high";
  label: string;
  color: "green" | "yellow" | "red";
  mitigation: string;
};

// ---------------------------------------------------------------------------
// Risk classification based on galvanic series index separation.
//
// separation = |index_A − index_B|
//   0:    Same material, no galvanic risk
//   1–2:  Low risk
//   3–5:  Moderate risk
//   6+:   High risk
// ---------------------------------------------------------------------------
export function getRisk(indexA: number, indexB: number): GalvanicRisk {
  const sep = Math.abs(indexA - indexB);

  if (sep === 0) return {
    level: "none",
    label: "Same material — no galvanic risk",
    color: "green",
    mitigation: "No special action required. Ensure good drainage to prevent water pooling.",
  };
  if (sep <= 2) return {
    level: "low",
    label: "Low risk — generally acceptable in most environments",
    color: "green",
    mitigation: "No special action required. Ensure good drainage to prevent water pooling.",
  };
  if (sep <= 5) return {
    level: "moderate",
    label: "Moderate risk — consider isolation in wet or outdoor environments",
    color: "yellow",
    mitigation:
      "Apply compatible primer or coating at the interface. Use aluminum or stainless hardware where possible. Ensure good drainage.",
  };
  return {
    level: "high",
    label: "High risk — isolation required (anodizing, isolating washers, compatible coating)",
    color: "red",
    mitigation:
      "Isolate with anodized aluminum, PTFE/nylon washers, isolating bushings, or a compatible sealant. Avoid salt and marine environments without isolation.",
  };
}

/**
 * The thresholds above as dial zones, so the separation reads as a measurement
 * rather than a badge. Shared by the calculator and the Materials compare view.
 */
export const GALVANIC_ZONES: GaugeZone[] = [
  { from: 0, to: 2, tone: "good" },
  { from: 2, to: 5, tone: "warn" },
  { from: 5, to: GALVANIC_MAX_SEPARATION, tone: "bad" },
];
