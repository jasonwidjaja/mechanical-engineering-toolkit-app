/**
 * Tool Icons
 *
 * One small, original line icon per calculator, drawn on a shared 24×24 grid.
 *
 * Deliberate constraints, so eighteen of these on one page stay scannable
 * rather than turning into visual noise:
 *   • Stroke only — no fills, no gradients, no multiple colours.
 *   • `stroke="currentColor"`, so the icon inherits whatever text colour the
 *     card sets. One icon works on a hover state, a muted "coming soon" card,
 *     or anywhere else without a second variant.
 *   • Every icon is a schematic of the thing being calculated (a bolt, a
 *     sagging beam, a tripod), not a decorative symbol.
 *
 * Adding a calculator: add a path here and reference its key from the tool's
 * `icon` field in the home page's CATEGORIES array. TypeScript will flag the
 * key if it doesn't exist.
 *
 * Pure display component — no state, so no "use client" needed.
 */

/** Every available icon, keyed by name. Values are the inner SVG markup. */
const ICON_PATHS = {
  // ── Fasteners ──
  /** Hex-head bolt, side on, with a threaded shank. */
  bolt: (
    <>
      <path d="M8 3h8l2 3-2 3H8L6 6z" />
      <path d="M10 9v11M14 9v11" />
      <path d="M10 12h4M10 15h4M10 18h4" />
    </>
  ),
  /** Bolt circle — a pattern of fasteners on a pitch diameter. */
  boltCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" strokeDasharray="2.5 2" />
      <circle cx="12" cy="4.5" r="1.4" />
      <circle cx="19.5" cy="12" r="1.4" />
      <circle cx="12" cy="19.5" r="1.4" />
      <circle cx="4.5" cy="12" r="1.4" />
    </>
  ),

  // ── Sealing & IP ──
  /** O-ring squashed between two faces — the squeeze itself. */
  oringSqueeze: (
    <>
      <path d="M3 6.5h18M3 17.5h18" />
      <ellipse cx="12" cy="12" rx="6" ry="4" />
    </>
  ),
  /** A machined groove in section, with the ring seated in it. */
  oringGroove: (
    <>
      <path d="M3 8h5v8h8V8h5" />
      <circle cx="12" cy="12.5" r="3" />
    </>
  ),
  /** Water droplet — ingress protection. */
  droplet: <path d="M12 3s-6 6.7-6 10.5a6 6 0 0 0 12 0C18 9.7 12 3 12 3z" />,

  // ── Thermal ──
  /** Thermometer. */
  thermometer: (
    <>
      <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z" />
      <path d="M16 8h-2M16 11h-2" />
    </>
  ),
  /** Finned heat sink sitting on a component. */
  heatsink: (
    <>
      <path d="M3 15h18" />
      <path d="M5 15V5M8.2 15V5M11.4 15V5M14.6 15V5M17.8 15V5" />
      <path d="M9 15v4h6v-4" />
    </>
  ),

  // ── Materials ──
  /** Two bonded bars growing by different amounts — differential expansion. */
  expansion: (
    <>
      <path d="M3 8h11M3 15h15" />
      <path d="M14 8h4.5M18.5 8l-2-1.6M18.5 8l-2 1.6" />
      <path d="M18 15h2.5M20.5 15l-2-1.6M20.5 15l-2 1.6" />
    </>
  ),
  /** Two dissimilar plates with electrolyte bridging them. */
  galvanic: (
    <>
      <path d="M7 4v16M17 4v16" />
      <path d="M9.5 12h5M14.5 12l-1.8-1.5M14.5 12l-1.8 1.5" />
      <path d="M12 5.5s-1.8 2-1.8 3.1a1.8 1.8 0 0 0 3.6 0C13.8 7.5 12 5.5 12 5.5z" />
    </>
  ),

  // ── Structural, general ──
  /** A dimension chain — the tolerance stackup. */
  dimensionChain: (
    <>
      <path d="M3 12h18" />
      <path d="M3 8.5v7M21 8.5v7M9 9.5v5M15 9.5v5" />
    </>
  ),
  /** Sine wave — natural frequency. */
  wave: <path d="M2 12q2.5-6 5 0t5 0 5 0 5 0" />,
  /** A simply supported beam sagging under a point load. */
  beam: (
    <>
      <path d="M3 9q9 8 18 0" />
      <path d="M3 9l-2 3.5h4zM21 9l-2 3.5h4z" />
      <path d="M12 2v4M12 6.5l-1.5-1.8M12 6.5l1.5-1.8" />
    </>
  ),

  // ── Mast & tripod ──
  /** Wind streamlines curling past an obstruction. */
  wind: (
    <>
      <path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M3 12h13a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M3 16h7" />
    </>
  ),
  /** A cantilever mast bent over by load, with its undeflected axis dashed. */
  mastBend: (
    <>
      <path d="M7 21V10c0-4 2-6 6-7.5" />
      <path d="M7 21V3" strokeDasharray="2 2" opacity="0.45" />
      <path d="M3.5 21h7" />
      <path d="M13 2.5l-2.4.3M13 2.5l-.6 2.3" />
    </>
  ),
  /**
   * Three-legged tripod carrying a payload.
   * The payload is a flat plate, not a circle — a circle on top of three legs
   * reads as a stick figure rather than a tripod.
   */
  tripod: (
    <>
      <path d="M7.5 4.5h9" />
      <path d="M12 4.5v5" />
      <path d="M12 9.5L5.5 20M12 9.5v10.5M12 9.5L18.5 20" />
    </>
  ),
  /** A guyed mast — two stays running to ground anchors. */
  guyWire: (
    <>
      <path d="M12 3v17" />
      <path d="M12 5.5L4 20M12 5.5L20 20" />
      <path d="M2 20h20" />
    </>
  ),
  /** A column on a base plate with anchor bolts. */
  basePlate: (
    <>
      <path d="M4 14h16v5H4z" />
      <path d="M10 14V4h4v10" />
      <circle cx="6.8" cy="16.5" r="1.1" />
      <circle cx="17.2" cy="16.5" r="1.1" />
    </>
  ),
  /** Vortices shedding off a mast — the resonance driver. */
  vortex: (
    <>
      <path d="M8 3v18" />
      <path d="M13.5 8.5a2.2 2.2 0 1 1-1.6-2.1" />
      <path d="M18.5 15.5a2.2 2.2 0 1 0-1.6 2.1" />
    </>
  ),
} as const;

/** Union of every valid icon key — misspellings become compile errors. */
export type IconName = keyof typeof ICON_PATHS;

export default function ToolIcon({
  name,
  className = "h-6 w-6",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Decorative: the card's heading already names the tool, so announcing
      // the icon too would just make screen readers say everything twice.
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
