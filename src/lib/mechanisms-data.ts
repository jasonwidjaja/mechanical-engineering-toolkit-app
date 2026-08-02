/**
 * Mechanisms & Design Reference — static content
 *
 * Same split as dfm-data.ts: the prose, tables and lists live here, and the
 * page under src/app/mechanisms-reference/ is purely their rendering. Anything
 * with a formula behind it (gear ratios, Grashof, thread engagement) lives in
 * the panel that owns it, not here.
 *
 * ⚠ Reference values throughout. Standard tables are quoted from common
 * engineering practice; the rules of thumb are labelled as such wherever they
 * appear on screen.
 */

import type { Resource } from "@/components/ui/ResourceList";

// ─── 1. Overview & resources ─────────────────────────────────────────────────

export const MECHANISMS_INTRO =
  "Mechanisms are the classic building blocks of mechanical motion — linkages, gears, cams, and the handful of ways they combine. There are far more of them than any one page could usefully catalog, so this section covers the two you will actually size by hand, and points you at the standard references for deeper exploration rather than trying to reproduce them.";

export const MECHANISM_RESOURCES: Resource[] = [
  {
    label: "Cornell KMODDL — Kinematic Models for Design Digital Library",
    url: "https://digital.library.cornell.edu/collections/kmoddl",
    note: "Scans and 3-D models of the Reuleaux mechanism collection, with the original descriptions.",
  },
  {
    label: "507 Mechanical Movements",
    url: "https://507movements.com/",
    note: "The 1868 Brown catalogue, animated. The fastest way to find a mechanism that does the motion you need.",
  },
  {
    label: "MIT OpenCourseWare 2.007 — Design and Manufacturing I",
    url: "https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/",
    note: "Full course materials covering mechanism selection, power transmission, and design process.",
  },
];

// ─── 4. Metric thread reference ──────────────────────────────────────────────

export type ThreadRow = {
  size: string;
  /** Nominal major diameter, mm. */
  major: number;
  /** Coarse-series pitch, mm. */
  pitch: number;
  /** Tap drill for a nominal 6H internal thread, mm. */
  tapDrill: number;
  /** Tensile stress area, mm² — what the proof loads below are computed from. */
  stressArea: number;
  /** Proof load in kN for each property class. */
  proof: { c88: number; c109: number; c129: number };
};

/**
 * ISO metric COARSE series, M3–M20.
 *
 * Proof load = tensile stress area × proof stress, using the ISO 898-1 proof
 * stresses: 580 MPa for class 8.8 up to M16 (600 MPa above it), 830 MPa for
 * 10.9, and 970 MPa for 12.9. Values are rounded to three significant figures.
 */
export const METRIC_THREADS: ThreadRow[] = [
  { size: "M3",  major: 3,  pitch: 0.5,  tapDrill: 2.5,  stressArea: 5.03, proof: { c88: 2.9,   c109: 4.2,   c129: 4.9 } },
  { size: "M4",  major: 4,  pitch: 0.7,  tapDrill: 3.3,  stressArea: 8.78, proof: { c88: 5.1,   c109: 7.3,   c129: 8.5 } },
  { size: "M5",  major: 5,  pitch: 0.8,  tapDrill: 4.2,  stressArea: 14.2, proof: { c88: 8.2,   c109: 11.8,  c129: 13.8 } },
  { size: "M6",  major: 6,  pitch: 1.0,  tapDrill: 5.0,  stressArea: 20.1, proof: { c88: 11.7,  c109: 16.7,  c129: 19.5 } },
  { size: "M8",  major: 8,  pitch: 1.25, tapDrill: 6.8,  stressArea: 36.6, proof: { c88: 21.2,  c109: 30.4,  c129: 35.5 } },
  { size: "M10", major: 10, pitch: 1.5,  tapDrill: 8.5,  stressArea: 58.0, proof: { c88: 33.6,  c109: 48.1,  c129: 56.3 } },
  { size: "M12", major: 12, pitch: 1.75, tapDrill: 10.2, stressArea: 84.3, proof: { c88: 48.9,  c109: 70.0,  c129: 81.8 } },
  { size: "M14", major: 14, pitch: 2.0,  tapDrill: 12.0, stressArea: 115,  proof: { c88: 66.7,  c109: 95.5,  c129: 111.6 } },
  { size: "M16", major: 16, pitch: 2.0,  tapDrill: 14.0, stressArea: 157,  proof: { c88: 91.1,  c109: 130.3, c129: 152.3 } },
  { size: "M20", major: 20, pitch: 2.5,  tapDrill: 17.5, stressArea: 245,  proof: { c88: 147.0, c109: 203.4, c129: 237.7 } },
];

export const THREAD_TABLE_NOTE =
  "Coarse series, ISO 898-1 property classes. Proof load = tensile stress area × proof stress (580 MPa for 8.8 up to M16 and 600 MPa above it, 830 MPa for 10.9, 970 MPa for 12.9). Tap drills are for a nominal 6H internal thread — a shop may deviate for tapping torque or material.";

// ─── 5. Thread engagement rules of thumb ─────────────────────────────────────

export type TappedMaterial = "steel" | "aluminum" | "other";

export type EngagementRule = {
  label: string;
  /** Short form, for places with no room for the full label (diagram titles). */
  short: string;
  /** Multiplier range on bolt diameter. */
  min: number;
  max: number;
  reasoning: string;
};

/**
 * The governing idea: the tapped threads must out-strength the bolt, so the
 * bolt yields before the threads strip. Into a material of comparable strength
 * one diameter is enough; into something weaker you need proportionally more
 * thread to make up the difference in shear area.
 */
export const ENGAGEMENT_RULES: Record<TappedMaterial, EngagementRule> = {
  steel: {
    label: "Steel of comparable strength",
    short: "steel",
    min: 1.0,
    max: 1.5,
    reasoning:
      "Tapped threads are about as strong as the bolt, so roughly one diameter of engagement puts thread shear strength above bolt tensile strength.",
  },
  aluminum: {
    label: "Aluminum",
    short: "aluminum",
    min: 1.5,
    max: 2.0,
    reasoning:
      "Aluminum is markedly weaker in shear than a steel bolt, so the engaged length has to grow to make up the shear area — otherwise the threads strip before the bolt reaches its rated load.",
  },
  other: {
    label: "Other / weaker (castings, plastics, soft alloys)",
    short: "a weaker material",
    min: 2.0,
    max: 2.5,
    reasoning:
      "Weaker and less predictable than aluminum. Treat 2× as a floor, and strongly prefer a threaded insert or helical coil over tapping the parent material directly.",
  },
};

/** Bolt property classes, with the proof stress that makes them differ. */
export const BOLT_CLASSES = [
  { value: "8.8", proofMPa: 580, note: "Most common general-purpose class." },
  { value: "10.9", proofMPa: 830, note: "High strength — pushes engagement toward the top of the range." },
  { value: "12.9", proofMPa: 970, note: "Highest common class — use the top of the range." },
] as const;

export type BoltClass = (typeof BOLT_CLASSES)[number]["value"];

// ─── 6. Surface finish reference ─────────────────────────────────────────────

export type SurfaceRow = {
  /** Display string for Ra in micrometres. */
  raUm: string;
  /** Display string for Ra in microinches. */
  raUin: string;
  process: string;
  application: string;
  /** Representative single value in µm, used to scale the profile diagram. */
  profileUm: number;
  /** Highlighted because it's the one that matters for the O-ring calculators. */
  sealRelevant?: boolean;
};

export const SURFACE_FINISHES: SurfaceRow[] = [
  {
    raUm: "~12.5",
    raUin: "~500",
    process: "As-cast, as-forged, flame cut",
    application: "Non-critical, non-mating surfaces. Anything that matters gets machined after.",
    profileUm: 12.5,
  },
  {
    raUm: "3.2 – 6.3",
    raUin: "125 – 250",
    process: "Standard machining (mill, turn, drill)",
    application: "General-purpose surfaces with no sealing or bearing duty. The default a shop delivers unless told otherwise.",
    profileUm: 5.0,
  },
  {
    raUm: "1.6",
    raUin: "63",
    process: "Good machining, finish pass",
    application: "General mating surfaces, bolted joint faces, locating features.",
    profileUm: 1.6,
  },
  {
    raUm: "0.8",
    raUin: "32",
    process: "Fine machining, honing, fine grinding",
    application: "Static seal surfaces — O-ring groove floors and the faces they seal against.",
    profileUm: 0.8,
    sealRelevant: true,
  },
  {
    raUm: "0.4 or better",
    raUin: "16 or better",
    process: "Grinding, lapping, polishing",
    application: "Bearing surfaces and dynamic seals, where a sliding element rides the surface continuously.",
    profileUm: 0.4,
  },
];

export const SURFACE_SEAL_CALLOUT =
  "Static O-ring seal surfaces typically want Ra 0.8 µm or better — rougher surfaces create leak paths along the scratches. The O-ring calculators size the groove; this decides whether that groove actually seals.";

// ─── 7. Weld symbols ─────────────────────────────────────────────────────────

export type WeldSymbol = {
  name: string;
  /** What the symbol looks like, in words. */
  appearance: string;
  meaning: string;
};

/**
 * Deliberately the handful you'd actually meet on a fabrication drawing, not
 * the full AWS A2.4 library.
 */
export const WELD_SYMBOLS: WeldSymbol[] = [
  {
    name: "Fillet weld",
    appearance: "Right triangle, vertical leg always drawn on the LEFT",
    meaning:
      "A triangular weld in the corner between two surfaces — the overwhelmingly common one. The number to the left of the triangle is the leg size.",
  },
  {
    name: "Square groove weld",
    appearance: "Two parallel vertical lines",
    meaning:
      "Butt joint with square-cut edges and a small gap, welded straight through. Used on thin material where no preparation is needed.",
  },
  {
    name: "V-groove weld",
    appearance: "A “V”",
    meaning:
      "Butt joint with both edges bevelled to form a V. Used on thicker material so the weld can reach full penetration. The included angle is written above the V.",
  },
  {
    name: "Arrow side",
    appearance: "Symbol drawn BELOW the reference line",
    meaning:
      "Weld goes on the side of the joint the arrow points to. This trips people up constantly — below the line means arrow side.",
  },
  {
    name: "Other side",
    appearance: "Symbol drawn ABOVE the reference line",
    meaning: "Weld goes on the far side of the joint from the arrow.",
  },
  {
    name: "Weld all around",
    appearance: "Circle at the elbow where arrow meets reference line",
    meaning: "The weld continues all the way around the joint rather than along one edge.",
  },
  {
    name: "Field weld",
    appearance: "Flag at the elbow, pointing up and back",
    meaning: "Welded during installation on site, not in the fabrication shop.",
  },
];

// ─── 8. Assembly DFM checklist ───────────────────────────────────────────────

export type ChecklistGroup = {
  title: string;
  icon: string;
  /** The "so what" — why this group of checks earns its place. */
  rationale: string;
  items: string[];
};

export const ASSEMBLY_CHECKLIST: ChecklistGroup[] = [
  {
    title: "Part Count Reduction",
    icon: "🧩",
    rationale:
      "The cheapest part is the one you deleted. Every part removed also removes its drawing, its inspection, its inventory line, and a tolerance from the stackup.",
    items: [
      "Can two adjacent parts be combined into one moulding or machining?",
      "Does this part move relative to its neighbour? If not, it may not need to be separate.",
      "Does it need a different material from its neighbour? If not, question the split.",
      "Could a feature replace a fastener — a snap fit, a formed tab, a living hinge?",
      "Are any parts there only to correct another part's tolerance? Fix the tolerance instead.",
    ],
  },
  {
    title: "Self-Locating Features",
    icon: "🎯",
    rationale:
      "An assembly that can only go together one way cannot be assembled wrong. Design the mistake out rather than training against it.",
    items: [
      "Chamfers or lead-ins on every pin, boss, and hole that has to find its mate.",
      "Deliberate asymmetry — an offset hole, a notch, a keyed corner — so a part physically will not seat backward.",
      "If a part is symmetric, make it truly symmetric so orientation genuinely doesn't matter. Near-symmetry is the trap.",
      "Locate on two pins and a face, not on four fasteners fighting each other.",
      "Make the correct orientation visible at a glance once installed, so an error is caught immediately rather than at test.",
    ],
  },
  {
    title: "Fastener Strategy",
    icon: "🔩",
    rationale:
      "Every distinct fastener is another bin, another tool, another chance to fit the wrong one. Variety costs more than the parts themselves.",
    items: [
      "Minimize the number of distinct fastener types and sizes in one assembly.",
      "Standardize on one drive type so the operator never swaps bits.",
      "Prefer captive hardware — PEM inserts, captive screws — so nothing is dropped inside the enclosure.",
      "Use self-aligning or shouldered hardware where a part has to be held while it's started.",
      "Check that thread engagement suits the tapped material (see the calculator in this section).",
      "Avoid fasteners that can only be reached with a specialty or custom tool.",
    ],
  },
  {
    title: "Assembly Access",
    icon: "🔧",
    rationale:
      "A joint that can't be reached with a real tool held by a real hand is not assemblable, no matter how good it looks in CAD.",
    items: [
      "Verify tool clearance with the actual driver and socket, including the swing arc — not just the fastener envelope.",
      "Prefer one-handed operations; if a step needs three hands, it needs a fixture or a redesign.",
      "Avoid joints requiring simultaneous engagement of multiple fasteners or snaps.",
      "Assemble in one direction where possible — ideally straight down, so gravity helps instead of fighting.",
      "Keep the operator's line of sight to the joint clear at the moment it's made.",
      "Check that the assembly can be disassembled for service in the reverse order.",
    ],
  },
];
