/**
 * Shared O-ring data used by both the squeeze and groove sizing calculators.
 *
 * Storing it here (src/lib/) means it lives in one place.
 * Both pages import from "@/lib/oring-constants" instead of duplicating the list.
 */

// AS568 is the most common O-ring standard in North America.
// It defines five cross-section (wire) diameters, each used across a range of IDs.
import type { GaugeZone } from "@/components/ui/Gauge";

export const AS568_CROSS_SECTIONS = [
  { label: '1.78 mm (0.070") — AS568 series -001', w: 1.78 },
  { label: '2.62 mm (0.103") — AS568 series -100', w: 2.62 },
  { label: '3.53 mm (0.139") — AS568 series -200', w: 3.53 },
  { label: '5.33 mm (0.210") — AS568 series -300', w: 5.33 },
  { label: '6.99 mm (0.275") — AS568 series -400', w: 6.99 },
] as const;

export type SealType = "static" | "dynamic";

// Recommended squeeze ranges per Parker O-Ring Handbook (ORD 5700)
// Green = within range, Yellow = borderline, Red = outside
export const SQUEEZE_RANGES = {
  static:  { green: [15, 30] as [number, number], yellow: [10, 35] as [number, number] },
  dynamic: { green: [10, 20] as [number, number], yellow: [7,  25] as [number, number] },
} as const;

/**
 * Upper end of the squeeze dial. 40% is past the point where any handbook
 * recommends going, so it puts every realistic value comfortably on scale.
 */
export const SQUEEZE_GAUGE_MAX = 40;

/**
 * The same ranges above, expressed as coloured bands for <Gauge />.
 *
 * `import type` is erased at compile time, so pulling the type out of a
 * "use client" component doesn't drag the component into this module.
 */
export function getSqueezeZones(sealType: SealType): GaugeZone[] {
  const r = SQUEEZE_RANGES[sealType];
  const [gLo, gHi] = r.green;
  const [yLo, yHi] = r.yellow;
  return [
    { from: 0, to: yLo, tone: "bad" },
    { from: yLo, to: gLo, tone: "warn" },
    { from: gLo, to: gHi, tone: "good" },
    { from: gHi, to: yHi, tone: "warn" },
    { from: yHi, to: SQUEEZE_GAUGE_MAX, tone: "bad" },
  ];
}

export function getSqueezeStatus(
  squeeze: number,
  sealType: SealType
): { status: "green" | "yellow" | "red"; message: string } {
  const r = SQUEEZE_RANGES[sealType];
  const [gLo, gHi] = r.green;
  const [yLo, yHi] = r.yellow;

  if (squeeze >= gLo && squeeze <= gHi) {
    return { status: "green", message: `Within recommended range (${gLo}–${gHi}%)` };
  }
  if (squeeze >= yLo && squeeze <= yHi) {
    return {
      status: "yellow",
      message: `Borderline — review design. Recommended: ${gLo}–${gHi}% for ${sealType} seals`,
    };
  }
  return {
    status: "red",
    message: `Outside recommended range. Recommended: ${gLo}–${gHi}% for ${sealType} seals`,
  };
}
