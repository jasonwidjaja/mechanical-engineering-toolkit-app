/**
 * DFM Reference Hub — content data
 *
 * All the *text* for the DFM guide lives here, separated from the components that
 * render it. Two reasons this is worth doing:
 *   1. Adding a new process (e.g. CNC machining) means adding one object to
 *      PROCESSES — you never touch the rendering code.
 *   2. The page component stays readable instead of being 900 lines of JSX prose.
 *
 * This mirrors how `oring-constants.ts` holds the AS568 data for the O-ring pages.
 *
 * ⚠ Everything here is EDUCATIONAL GUIDANCE. Numbers are typical industry
 * rules of thumb, not guarantees — real limits depend on resin, alloy, machine,
 * and vendor. See DISCLAIMER below, which is rendered on every tab.
 */

// ─── Shared disclaimer ───────────────────────────────────────────────────────

export const DISCLAIMER =
  "Educational reference — always confirm final DFM decisions with your manufacturing engineer or vendor's own DFM review.";

// ─── Types ───────────────────────────────────────────────────────────────────

/** One row of a "Key DFM Guidelines" table: a topic and the rule of thumb. */
export type Guideline = {
  topic: string;
  guidance: string;
};

/**
 * A 3-column comparison table (used only by 3D printing, where the useful
 * framing is FDM vs. SLA vs. SLS/MJF rather than a single set of numbers).
 */
export type Comparison = {
  columns: string[];                       // e.g. ["FDM", "SLA", "SLS / MJF"]
  rows: { topic: string; values: string[] }[]; // values.length must match columns.length
};

/** One row of a "Common Defects" table: what goes wrong → why → what to change. */
export type Defect = {
  defect: string;
  cause: string;
  fix: string;
};

/** An external link. Rendered with target="_blank" + rel="noopener noreferrer". */
export type Resource = {
  label: string;
  url: string;
};

/** The union of tab ids. Using a string-literal union (not plain `string`) means
 *  TypeScript catches typos like "injection-moulding" at compile time. */
export type ProcessKey =
  | "injection-molding"
  | "sheet-metal"
  | "3d-printing"
  | "casting";

export type ProcessContent = {
  key: ProcessKey;
  label: string;      // tab label
  icon: string;       // emoji, matching the icon style used on the home page
  overview: string;   // 2-3 sentence process overview
  /** Standard guidelines table. Mutually exclusive with `comparison`. */
  guidelines?: Guideline[];
  /** 3-column guidelines table. Mutually exclusive with `guidelines`. */
  comparison?: Comparison;
  defects: Defect[];
  resources: Resource[];
  /** Short caption shown under the process's SVG diagram. */
  diagramCaption: string;
};

// ─── Process content ─────────────────────────────────────────────────────────

export const PROCESSES: ProcessContent[] = [
  // ═══ INJECTION MOLDING ═══════════════════════════════════════════════════
  {
    key: "injection-molding",
    label: "Injection Molding",
    icon: "🧩",
    overview:
      "Molten thermoplastic is injected under high pressure into a steel or aluminum mold, cooled until solid, then ejected. Tooling is expensive and slow to produce, but the per-part cost at volume is extremely low — so the process only makes economic sense in the thousands of units. Nearly every design rule below exists to serve one of two goals: filling the cavity completely, and getting the part back out of the mold without damaging it.",
    guidelines: [
      {
        topic: "Wall thickness",
        guidance:
          "Typically 1–4 mm depending on resin. Keep it uniform throughout the part, and avoid more than a 2:1 ratio between adjacent walls.",
      },
      {
        topic: "Draft angle",
        guidance:
          "1–2° per side minimum on smooth walls; a common rule of thumb is ~1° per 25 mm (1 in) of cavity depth. Textured surfaces need roughly +1° per 0.025 mm of texture depth — heavy texture can require 5°+. As low as 0.25–0.5° is achievable in some cases with the right geometry and resin.",
      },
      {
        topic: "Ribs",
        guidance:
          "Thickness ~50–60% of the adjoining wall; height typically ≤ 3× wall thickness. Draft the rib walls too — they need to release just like everything else.",
      },
      {
        topic: "Fillets",
        guidance:
          "Inside and outside corners ≥ 0.5× wall thickness. Sharp internal corners concentrate stress and restrict resin flow.",
      },
      {
        topic: "Tolerances",
        guidance:
          "Typically ±0.1–0.5 mm depending on feature size and the resin's shrinkage rate. Larger features and higher-shrink resins sit at the loose end of that band.",
      },
    ],
    defects: [
      {
        defect: "Sink marks",
        cause: "Ribs or bosses too thick relative to the wall they attach to — the thick section cools and contracts last, pulling the visible surface inward.",
        fix: "Reduce rib thickness to 50–60% of the adjoining wall; core out thick bosses.",
      },
      {
        defect: "Warping",
        cause: "Uneven wall thickness or uneven cooling, so different regions shrink by different amounts and at different times.",
        fix: "Make walls uniform; add gradual transitions rather than abrupt steps between thick and thin.",
      },
      {
        defect: "Short shots",
        cause: "Walls too thin or the flow path too long — resin freezes off before the cavity is full.",
        fix: "Thicken thin sections, shorten the flow length, or add/reposition gates.",
      },
      {
        defect: "Weld lines",
        cause: "Two flow fronts meeting and only partially re-fusing (typically downstream of a hole or core pin), leaving a weaker line.",
        fix: "Avoid locating weld lines near high-stress areas; move the gate so fronts meet somewhere structurally unimportant.",
      },
      {
        defect: "Flash",
        cause: "Worn tooling, or a part that needs more clamp pressure than is being applied, letting resin escape the parting line.",
        fix: "A tooling and process fix more than a design one — but reducing projected area and required clamp force helps.",
      },
    ],
    resources: [
      {
        label: "Protolabs — Improving Part Moldability with Draft",
        url: "https://www.protolabs.com/resources/design-tips/improving-part-moldability-with-draft/",
      },
      {
        label: "Protolabs — Improving Part Design with Uniform Wall Thickness",
        url: "https://www.protolabs.com/resources/design-tips/improving-part-design-with-uniform-wall-thickness/",
      },
      {
        label: "MIT OpenCourseWare 2.008 — Design and Manufacturing II (Injection Molding I & II lectures)",
        url: "https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2025/",
      },
    ],
    diagramCaption:
      "Draft is the single highest-leverage moldability feature: a few degrees of taper is the difference between a part that drops out of the mold and one that scrapes itself on the way.",
  },

  // ═══ SHEET METAL ═════════════════════════════════════════════════════════
  {
    key: "sheet-metal",
    label: "Sheet Metal",
    icon: "📐",
    overview:
      "Flat stock is cut (laser, punch, or waterjet) and then bent on a press brake into its final 3-D shape. Because everything starts as one continuous flat sheet, the governing constraint is that the material has to survive being folded — it stretches on the outside of every bend and compresses on the inside. Tooling costs are far lower than molding, which makes it the default for low-to-mid volume enclosures and brackets.",
    guidelines: [
      {
        topic: "Bend radius",
        guidance:
          "Inside radius ≥ material thickness (1× t). Use one consistent radius across the whole part to minimize tooling changes and setup time.",
      },
      {
        topic: "Hole-to-edge distance",
        guidance:
          "1.5–2× material thickness from any part edge, so the material between hole and edge doesn't bulge or tear during punching.",
      },
      {
        topic: "Hole-to-bend distance",
        guidance:
          "Roughly 1.5× thickness + bend radius (the \"1.5T+R\" rule), or a simplified ≥ 2× thickness. Too close and the hole deforms as the bend forms.",
      },
      {
        topic: "Min punched hole diameter",
        guidance:
          "≥ material thickness. Laser cutting can go smaller, since there's no punch to break.",
      },
      {
        topic: "Flange length",
        guidance:
          "≥ 4× thickness at 90°; 6–8× preferred so the press brake has enough material to grip reliably.",
      },
      {
        topic: "K-factor",
        guidance:
          "0.3–0.5 typical. This is the fraction of the thickness where the neutral axis sits, and it's what turns your 3-D model into a correct flat pattern length.",
      },
      {
        topic: "Grain direction",
        guidance:
          "Bend perpendicular to the mill rolling direction. Bending along the grain allows tighter radii with lower cracking risk than bending parallel to it.",
      },
    ],
    defects: [
      {
        defect: "Hole distortion (teardrop shape)",
        cause: "Hole placed too close to a bend, so it gets dragged and stretched as the material wraps the punch.",
        fix: "Move the hole out to at least 1.5T + R from the bend line — or bend first and drill after.",
      },
      {
        defect: "Cracking at the bend",
        cause: "Inside radius too tight for the material, or bending parallel to the grain direction.",
        fix: "Open the inside radius to ≥ 1× t and reorient the flat pattern so bends run across the grain.",
      },
      {
        defect: "Springback",
        cause: "Elastic recovery after the brake releases — worse with a generous radius, high-strength material, or no compensation in the program.",
        fix: "Overbend to compensate, or specify a tighter radius. Confirm the actual angle on a first article.",
      },
      {
        defect: "Tearing at bend reliefs",
        cause: "Missing or undersized relief notch where a bend runs into an adjacent flange, concentrating all the strain at one corner.",
        fix: "Add a relief notch at least as wide as the material thickness and slightly deeper than the bend radius.",
      },
    ],
    resources: [
      {
        label: "Protolabs — Sheet Metal Fabrication Design Guidelines",
        url: "https://www.protolabs.com/services/sheet-metal-fabrication/design-guidelines/",
      },
      {
        label: "MIT OpenCourseWare 2.008 — Design and Manufacturing II (Metal Cutting & Joining lectures)",
        url: "https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2025/",
      },
    ],
    diagramCaption:
      "Every sheet metal part exists in two forms at once — the flat pattern that gets cut and the formed part it becomes. Features placed too near a bend line in the flat get distorted by the fold.",
  },

  // ═══ 3D PRINTING ═════════════════════════════════════════════════════════
  {
    key: "3d-printing",
    label: "3D Printing",
    icon: "🖨️",
    overview:
      "Parts are built up one thin layer at a time, which removes most of the geometric constraints that molding and machining impose — no draft, no tooling, undercuts are free. What replaces them is a new set of layer-driven constraints: overhangs need something underneath, and the layer stacking direction makes the part measurably weaker across layers than along them. The three families below (FDM, SLA, SLS/MJF) behave differently enough that it's worth comparing them side by side.",
    comparison: {
      columns: ["FDM", "SLA", "SLS / MJF"],
      rows: [
        {
          topic: "Min wall thickness",
          values: ["1.0–1.2 mm", "0.4–0.6 mm", "0.7–1.0 mm"],
        },
        {
          topic: "Typical tolerance",
          values: ["±0.3–0.5 mm", "±0.1–0.2 mm", "±0.2–0.3 mm"],
        },
        {
          topic: "Max overhang w/o support",
          values: [
            "~45° from vertical",
            "~45° (varies)",
            "None needed — unsintered powder self-supports",
          ],
        },
        {
          topic: "Min hole diameter",
          values: ["~1.0 mm vertical", "Smaller feasible", "~1–2 mm"],
        },
        {
          topic: "Bridging",
          values: [
            "~10 mm reliable, up to ~30 mm with sag",
            "Less of a concern",
            "Not applicable",
          ],
        },
      ],
    },
    defects: [
      {
        defect: "Warping",
        cause: "Uneven cooling, especially on large flat FDM parts — the first layers contract while later ones are still hot, curling the corners up off the bed.",
        fix: "Break up large flat areas, add fillets at the base, or reorient so the biggest cross-section isn't on the bed.",
      },
      {
        defect: "Elephant's foot",
        cause: "FDM first-layer squish — the bottom layer is pressed into the bed and spreads outward past the nominal profile.",
        fix: "Chamfer the bottom edge ~0.5 mm, or account for it if the base is a mating surface.",
      },
      {
        defect: "Drooping / failed overhangs",
        cause: "Overhang angle steeper than ~45° from vertical with no support underneath, so each layer has nothing to bond to.",
        fix: "Reorient the part, redesign the overhang as a chamfer instead of a flat ledge, or accept supports and the surface finish they leave.",
      },
      {
        defect: "Thin features broken during support removal",
        cause: "Delicate geometry that survives printing but not the mechanical act of prying supports off.",
        fix: "Thicken fragile features, or orient the part so supports don't land on them in the first place.",
      },
      {
        defect: "Layer delamination",
        cause: "Poor interlayer adhesion, or an orientation that puts the primary load across the layer lines instead of along them.",
        fix: "Reorient so tensile load runs within the layer plane; raise temperature or reduce cooling for FDM.",
      },
    ],
    resources: [
      {
        label: "Hubs (Protolabs Network) — Key Design Considerations for 3D Printing",
        url: "https://www.hubs.com/knowledge-base/key-design-considerations-3d-printing/",
      },
    ],
    diagramCaption:
      "The ~45° rule: each layer needs enough of the layer below it to bond to. At 45° roughly half of each new layer is supported — push past that and the edge has nothing to sit on.",
  },

  // ═══ CASTING ═════════════════════════════════════════════════════════════
  {
    key: "casting",
    label: "Casting",
    icon: "🔥",
    overview:
      "Molten metal fills a cavity — sand, a reusable steel die, or a wax-pattern shell — and solidifies into the final shape. The dominant physics is solidification: metal shrinks as it freezes, and any region that freezes last with no reservoir of liquid to feed it will pull a void into itself. Most casting design rules therefore aim at uniform, directional cooling, plus the same release requirements that molding has.",
    guidelines: [
      {
        topic: "Draft",
        guidance:
          "0.5–2° typical, and prefer ≥ 1° as a working minimum. Deep pockets and blind holes need 2–3°. For die casting, a common rule of thumb is ~1° per 25 mm (1 in) of cavity depth.",
      },
      {
        topic: "Fillets",
        guidance:
          "Avoid sharp corners entirely — they create both hot spots and stress concentrations. Die casting inside radii are commonly ≥ 1.5× wall thickness; rib-to-wall junction fillets ≥ 50% of the thinner wall. Use an absolute floor of ~0.4 mm radius in place of any sharp edge.",
      },
      {
        topic: "Wall thickness",
        guidance:
          "Keep it uniform — generally within ~2× the thinnest section. Transition gradually between thick and thin rather than stepping abruptly.",
      },
      {
        topic: "Parting line",
        guidance:
          "Place it at the largest cross-section. This minimizes undercuts and keeps tooling complexity (and therefore cost) down.",
      },
    ],
    defects: [
      {
        defect: "Shrinkage porosity",
        cause: "A thick section cools more slowly than everything around it, so it solidifies last with no remaining liquid feed — and voids form internally.",
        fix: "Even out wall thickness, core out heavy sections, or work with the foundry to add a riser that feeds the hot spot.",
      },
      {
        defect: "Hot tearing",
        cause: "Sharp corners combined with a rapid change in cross-section — the part is still semi-solid and weak while contraction pulls it apart.",
        fix: "Add generous fillets and make section changes gradual.",
      },
      {
        defect: "Misruns / cold shuts",
        cause: "Walls too thin, so the metal loses heat and stops flowing before the cavity is filled — or two fronts meet after both have skinned over.",
        fix: "Thicken thin walls, shorten flow distance, and avoid long slender features far from the gate.",
      },
      {
        defect: "Flash",
        cause: "Worn tooling, or insufficient draft causing die wear and poor closure at the parting line.",
        fix: "Maintain adequate draft and design the parting line at the largest cross-section so the dies seat cleanly.",
      },
    ],
    resources: [
      {
        label: "Xometry — Die Casting Design Tips",
        url: "https://xometry.pro/en-uk/articles/die-casting-design-tips/",
      },
      {
        label: "MIT OpenCourseWare — Mechanical Engineering course list",
        url: "https://ocw.mit.edu/courses/mechanical-engineering/",
      },
    ],
    diagramCaption:
      "Casting punishes two things at once: no draft means the part fights the die on ejection, and a sharp internal corner creates a thick spot that freezes last and shrinks into a void.",
  },
];

// ─── Process tolerance chart ─────────────────────────────────────────────────

/**
 * The five families the tolerance table can be filtered by. Ordered loosest-to-
 * tightest capability is tempting, but they're kept in the order a reader scans
 * them: subtractive first, then formative, then additive.
 */
export const TOLERANCE_CATEGORIES = [
  "Machining",
  "Cutting",
  "Casting",
  "Molding",
  "Additive",
] as const;

export type ToleranceCategory = (typeof TOLERANCE_CATEGORIES)[number];

/**
 * Numeric bounds for the Precision Spectrum chart, in mm.
 * These are the machine-readable form of the `standard` / `precision` strings —
 * kept on the same row so the chart can never drift out of step with the table.
 */
export type SpectrumBand = {
  /** Tightest achievable, mm — the precision figure where one is published. */
  tight: number;
  /** Standard/default capability, mm — the loose end of the bar. */
  loose: number;
  /**
   * True when the mm figures were derived from a "% of dimension" spec.
   * Those processes are plotted at SPECTRUM_REFERENCE_MM.
   */
  fromPercent?: boolean;
  /** True when only one value is published — the mark is a point, not a range. */
  point?: boolean;
};

export type ToleranceRow = {
  process: string;
  category: ToleranceCategory;
  materials: string;
  /** What a shop holds by default, without a tolerance called out on the print. */
  standard: string;
  /** What's achievable when you explicitly ask (and pay) for it. `null` → "—". */
  precision: string | null;
  /** Extra context. `null` → blank cell. */
  notes: string | null;
  spectrum: SpectrumBand;
};

/**
 * Two processes (die casting, MIM) specify tolerance as a PERCENTAGE of the
 * dimension rather than an absolute figure, so they can't be placed on an
 * absolute-millimetre axis without picking a size. 100 mm is used, and the
 * chart says so — at a different part size those two bars move.
 */
export const SPECTRUM_REFERENCE_MM = 100;

/** Shown above the table — these are starting points, not vendor commitments. */
export const TOLERANCE_DISCLAIMER =
  "Representative values — always confirm with your vendor.";

/**
 * Why material matters less than people expect. Sits below the table.
 */
export const TOLERANCE_MATERIAL_NOTE =
  "Material affects tolerance mainly through rigidity (machining) or shrinkage rate (casting/molding) rather than setting it outright — treat these as starting points, not guarantees, for your specific material and geometry.";

export const TOLERANCE_ROWS: ToleranceRow[] = [
  // ═══ MACHINING ═══
  {
    process: "CNC Milling",
    category: "Machining",
    materials: "Aluminum, steel, stainless, brass, plastics",
    standard: "±0.13 mm (ISO 2768 medium, shop default)",
    precision: "±0.025 mm or better with a called-out tolerance",
    notes: "Turning/grinding hold tighter than milling on round features",
    spectrum: { tight: 0.025, loose: 0.13 },
  },
  {
    process: "CNC Turning (Lathe)",
    category: "Machining",
    materials: "Same, esp. cylindrical parts",
    standard: "±0.025 mm on diameters",
    precision: "Down to ~±0.0127 mm on precision-ground diameters",
    notes: "More consistent than milling — single rotating axis",
    spectrum: { tight: 0.0127, loose: 0.025 },
  },
  {
    process: "Reaming / Boring",
    category: "Machining",
    materials: "Same",
    standard: "±0.01 mm",
    precision: null,
    notes: null,
    // Single published figure, so this plots as a point rather than a range.
    spectrum: { tight: 0.01, loose: 0.01, point: true },
  },
  {
    process: "Grinding",
    category: "Machining",
    materials: "Same",
    standard: "±0.005 mm or better",
    precision: null,
    notes: null,
    spectrum: { tight: 0.005, loose: 0.005, point: true },
  },
  {
    process: "Wire EDM",
    category: "Machining",
    materials: "Any conductive metal incl. hardened tool steel / titanium",
    standard: "±0.005–0.01 mm",
    precision: "±0.002 mm (aerospace/medical)",
    notes: "Hardness doesn't affect achievable tolerance; slow, relatively expensive",
    spectrum: { tight: 0.002, loose: 0.01 },
  },

  // ═══ CUTTING ═══
  {
    process: "Laser Cutting",
    category: "Cutting",
    materials: "Steel, stainless, aluminum sheet (thin-to-medium)",
    standard: "±0.1 mm (<3 mm thick)",
    precision: "±0.05 mm optimized",
    notes: "Precision drops on thicker material (beam divergence / edge taper)",
    spectrum: { tight: 0.05, loose: 0.1 },
  },
  {
    process: "Waterjet Cutting",
    category: "Cutting",
    materials: "Nearly anything incl. thick plate, composites, glass",
    standard: "±0.1–0.25 mm",
    precision: "±0.05–0.1 mm high-precision mode",
    notes: "No heat-affected zone; best for thick / heat-sensitive material",
    spectrum: { tight: 0.05, loose: 0.25 },
  },

  // ═══ CASTING ═══
  {
    process: "Sand Casting",
    category: "Casting",
    materials: "Aluminum, iron, steel, bronze",
    standard: "±0.5–1.5 mm",
    precision: "Rarely below ±0.5 mm without machining",
    notes: "Cheapest tooling, good for large parts",
    spectrum: { tight: 0.5, loose: 1.5 },
  },
  {
    process: "Investment Casting",
    category: "Casting",
    materials: "Steel, stainless, aluminum, superalloys",
    standard: "±0.1–0.3 mm under 25 mm; ±0.3–0.5 mm up to 150 mm",
    precision: "Approaching ±0.1 mm with tight process control",
    notes: "Also called “precision casting” — excellent surface finish",
    spectrum: { tight: 0.1, loose: 0.5 },
  },
  {
    process: "Die Casting",
    category: "Casting",
    materials: "Aluminum, zinc, magnesium (non-ferrous only)",
    standard: "±0.05–0.3% of dimension as-cast",
    precision: "~±0.13 mm with secondary machining",
    notes: "Tightest as-cast tolerance of the casting family, non-ferrous only",
    // 0.05%–0.3% evaluated at SPECTRUM_REFERENCE_MM (100 mm).
    spectrum: { tight: 0.05, loose: 0.3, fromPercent: true },
  },

  // ═══ MOLDING ═══
  {
    process: "Metal Injection Molding (MIM)",
    category: "Molding",
    materials: "Stainless, tool steel, titanium — small parts, typically <150 mm / <300 g",
    standard: "±0.3–0.5% of nominal",
    precision: "±0.05–0.2% with optimized processing",
    notes: "Great for small, complex, high-volume metal parts",
    // 0.05% (optimized) – 0.5% (standard) at SPECTRUM_REFERENCE_MM (100 mm).
    spectrum: { tight: 0.05, loose: 0.5, fromPercent: true },
  },
  {
    process: "Injection Molding (plastic)",
    category: "Molding",
    materials: "ABS, PC, nylon, PP, most resins",
    standard: "±0.1 mm typical",
    precision: "±0.025 mm for tight / medical-grade parts",
    notes: "Larger parts harder to hold tight tolerance (shrinkage)",
    spectrum: { tight: 0.025, loose: 0.1 },
  },

  // ═══ ADDITIVE ═══
  {
    process: "3D Printing — FDM",
    category: "Additive",
    materials: "PLA, ABS, PETG, nylon",
    standard: "±0.3–0.5 mm",
    precision: "n/a",
    notes: "Least precise, most accessible",
    spectrum: { tight: 0.3, loose: 0.5 },
  },
  {
    process: "3D Printing — SLA",
    category: "Additive",
    materials: "Photopolymer resin",
    standard: "±0.1–0.2 mm",
    precision: "n/a",
    notes: "Best surface finish / detail",
    spectrum: { tight: 0.1, loose: 0.2 },
  },
  {
    process: "3D Printing — SLS/MJF",
    category: "Additive",
    materials: "Nylon PA12, TPU",
    standard: "±0.2–0.3 mm",
    precision: "n/a",
    notes: "No supports needed",
    spectrum: { tight: 0.2, loose: 0.3 },
  },
];

/** Fill colours for the spectrum chart, matching the table's category chips. */
export const CATEGORY_COLORS: Record<ToleranceCategory, string> = {
  Machining: "#2B4C7E", // blue-600
  Cutting: "#2B4C7E",   // cyan-600
  Casting: "#A17D36",   // amber-600
  Molding: "#5F6164",   // violet-600
  Additive: "#3A6039",  // emerald-600
};

/**
 * "Quick Decision Guide" — work backwards from the tolerance you actually need
 * to the processes that can hold it. Ordered loosest → tightest.
 */
export type DecisionGuideEntry = {
  band: string;
  answer: string;
};

export const DECISION_GUIDE: DecisionGuideEntry[] = [
  {
    band: "±0.5 mm or looser",
    answer: "Sand casting or any 3D printing",
  },
  {
    band: "±0.1–0.25 mm",
    answer: "CNC machining, laser/waterjet, injection molding, or investment casting",
  },
  {
    band: "±0.01–0.05 mm",
    answer: "Precision CNC machining, wire EDM, or fine-tolerance MIM",
  },
  {
    band: "Tighter than ±0.01 mm",
    answer:
      "EDM finish passes, precision grinding, or lapping — verify feasibility/cost with your vendor first",
  },
];

/**
 * Data for the minimum-wall-thickness bar chart.
 * Mirrors the "Min wall thickness" row of the 3D printing comparison table —
 * the bar plots `min` (the question is "minimum achievable"), and `max` is
 * surfaced in the tooltip so the range isn't lost.
 */
export const MIN_WALL_CHART_DATA = [
  { process: "FDM", min: 1.0, max: 1.2 },
  { process: "SLA", min: 0.4, max: 0.6 },
  { process: "SLS / MJF", min: 0.7, max: 1.0 },
];
