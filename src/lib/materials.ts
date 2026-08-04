/**
 * Material property database — the single source of truth for material data
 * app-wide.
 *
 * Before this file, each calculator carried its own hardcoded list: CTE Mismatch
 * had eight entries with only a CTE, Mast Deflection and Mast Frequency each had
 * four with only a Young's modulus, and Galvanic Corrosion had a fifteen-row
 * series with only an index. The same alloy appeared under three different
 * names with three different subsets of its properties. Everything now reads
 * from MATERIALS below.
 *
 * ── On the numbers ──
 * Values are nominal/typical, drawn from common published ranges rather than a
 * single cert. See DISCLAIMER. Where a property is genuinely a range rather
 * than a point (PTFE's CTE, fiberglass modulus), the entry carries a numeric
 * midpoint for charting *plus* a display string and an `approximate` flag, so
 * the UI can show the range and say it is one.
 *
 * ── On galvanicIndex ──
 * This is the 0–14 MIL-STD-889C position from src/lib/galvanic.ts, NOT a
 * separate 1–10 scale. Keeping one scale means the Materials comparison and the
 * Galvanic Corrosion calculator physically cannot disagree about what counts as
 * a high-risk couple — they call the same getRisk().
 */

import { TOLERANCE_ROWS } from "@/lib/dfm-data";

// ---------------------------------------------------------------------------
// Shown wherever these figures are displayed.
// ---------------------------------------------------------------------------
export const DISCLAIMER =
  "Nominal/typical values for reference and preliminary selection — verify against current material certs and datasheets for final design.";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const MATERIAL_CATEGORIES = [
  "Aluminum",
  "Steel",
  "Titanium",
  "Other Metal",
  "Dielectric",
  "Plastic",
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/**
 * Every process name that appears in the DFM Process Tolerance Chart.
 *
 * Derived from TOLERANCE_ROWS rather than retyped, so a typo in a material's
 * `compatibleProcesses` is a compile error instead of a chip that silently
 * links nowhere.
 */
export type ProcessName = (typeof TOLERANCE_ROWS)[number]["process"];

export const APPLICATION_TAGS = [
  "Structural",
  "General Purpose",
  "High-Strength",
  "Corrosion-Resistant",
  "Outdoor",
  "Fastener",
  "Fitting",
  "Thermal",
  "Radome",
  "Radome-Window",
  "Structural-Dielectric",
  "Low-CTE",
  "Precision",
  "Weight-Critical",
  "Cost-Sensitive",
  "High-Machinability",
  "Chemical-Resistant",
  "Impact-Resistant",
  "Prototyping",
  "Seal",
  "Low-Load",
] as const;
export type ApplicationTag = (typeof APPLICATION_TAGS)[number];

export type LossTangent = "Very Low" | "Low" | "Moderate";

/** 1 = Poor, 4 = Excellent. The label carries the caveat where there is one. */
export type CorrosionRating = {
  score: 1 | 2 | 3 | 4;
  label: string;
};

export type Material = {
  id: string;
  name: string;
  category: MaterialCategory;

  /** Young's modulus, GPa. */
  elasticModulus: number | null;
  /** Yield strength, MPa. Null for brittle materials with no yield point. */
  yieldStrength: number | null;
  /** Ultimate tensile strength, MPa. */
  ultimateStrength: number | null;
  /** kg/m³. */
  density: number;
  /** Coefficient of thermal expansion, ppm/°C. */
  cte: number;
  /** Thermal conductivity, W/m·K. */
  thermalConductivity: number | null;
  /** Max continuous service temperature, °C. */
  maxServiceTemp: number | null;

  corrosionResistance: CorrosionRating;
  /** MIL-STD-889C series position 0–14. Null for non-metals. */
  galvanicIndex: number | null;

  /** Relative permittivity. Only populated for radome-relevant dielectrics. */
  dielectricConstant: number | null;
  lossTangent: LossTangent | null;

  /** 1 = $, 4 = $$$$. Relative raw stock cost, not finished part cost. */
  costTier: 1 | 2 | 3 | 4;

  compatibleProcesses: ProcessName[];
  applicationTags: ApplicationTag[];

  /**
   * Properties published as a range rather than a point. The numeric fields
   * above hold the midpoint; these strings are what the UI shows so a reader
   * isn't misled into treating a midpoint as a spec value.
   */
  approximate?: Partial<Record<"elasticModulus" | "cte" | "thermalConductivity", string>>;
  /** Anything that materially qualifies the row. */
  note?: string;
};

// ---------------------------------------------------------------------------
// The dataset
// ---------------------------------------------------------------------------

export const MATERIALS: Material[] = [
  {
    id: "al-6061-t6",
    name: "Aluminum 6061-T6",
    category: "Aluminum",
    elasticModulus: 68.9,
    yieldStrength: 276,
    ultimateStrength: 310,
    density: 2700,
    cte: 23.6,
    thermalConductivity: 167,
    maxServiceTemp: 150,
    corrosionResistance: { score: 3, label: "Good" },
    galvanicIndex: 3,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 1,
    compatibleProcesses: [
      "CNC Milling",
      "CNC Turning (Lathe)",
      "Sheet Metal Fabrication",
      "Die Casting",
    ],
    applicationTags: ["Structural", "General Purpose"],
  },
  {
    id: "al-7075-t6",
    name: "Aluminum 7075-T6",
    category: "Aluminum",
    elasticModulus: 71.7,
    yieldStrength: 503,
    ultimateStrength: 572,
    density: 2810,
    cte: 23.6,
    thermalConductivity: 130,
    maxServiceTemp: 120,
    corrosionResistance: {
      score: 2,
      label: "Fair — avoid in high-stress-corrosion environments",
    },
    galvanicIndex: 3,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 2,
    compatibleProcesses: ["CNC Milling", "CNC Turning (Lathe)"],
    applicationTags: ["Structural", "High-Strength"],
  },
  {
    id: "ss-304",
    name: "Stainless Steel 304",
    category: "Steel",
    elasticModulus: 193,
    yieldStrength: 215,
    ultimateStrength: 505,
    density: 8000,
    cte: 17.3,
    thermalConductivity: 16.2,
    maxServiceTemp: 870,
    corrosionResistance: { score: 4, label: "Excellent" },
    // Passive-film condition assumed; the active state sits at index 7.
    galvanicIndex: 13,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 2,
    compatibleProcesses: [
      "CNC Milling",
      "CNC Turning (Lathe)",
      "Sheet Metal Fabrication",
      "Investment Casting",
    ],
    applicationTags: ["Structural", "Fastener", "Corrosion-Resistant"],
  },
  {
    id: "ss-316",
    name: "Stainless Steel 316",
    category: "Steel",
    elasticModulus: 193,
    yieldStrength: 205,
    ultimateStrength: 515,
    density: 8000,
    cte: 16.0,
    thermalConductivity: 16.3,
    maxServiceTemp: 870,
    corrosionResistance: {
      score: 4,
      label: "Excellent — best for marine/chloride exposure",
    },
    galvanicIndex: 13,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 3,
    compatibleProcesses: [
      "CNC Milling",
      "CNC Turning (Lathe)",
      "Sheet Metal Fabrication",
      "Investment Casting",
    ],
    applicationTags: ["Structural", "Fastener", "Corrosion-Resistant", "Outdoor"],
  },
  {
    id: "ti-6al-4v",
    name: "Titanium Ti-6Al-4V",
    category: "Titanium",
    elasticModulus: 113.8,
    yieldStrength: 880,
    ultimateStrength: 950,
    density: 4430,
    cte: 8.6,
    thermalConductivity: 6.7,
    maxServiceTemp: 400,
    corrosionResistance: { score: 4, label: "Excellent" },
    galvanicIndex: 12,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 4,
    compatibleProcesses: ["CNC Milling", "Wire EDM"],
    applicationTags: ["Structural", "High-Strength", "Low-CTE", "Weight-Critical"],
  },
  {
    id: "steel-a36",
    name: "Mild Steel A36",
    category: "Steel",
    elasticModulus: 200,
    yieldStrength: 250,
    ultimateStrength: 475,
    density: 7850,
    cte: 12.0,
    thermalConductivity: 51.9,
    maxServiceTemp: 400,
    corrosionResistance: { score: 1, label: "Poor — needs coating" },
    galvanicIndex: 4,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 1,
    compatibleProcesses: ["CNC Milling", "Sheet Metal Fabrication", "Sand Casting"],
    applicationTags: ["Structural", "General Purpose"],
  },
  {
    id: "steel-zinc-plated",
    name: "Zinc-Plated Steel",
    category: "Steel",
    // Mechanical properties are A36's — plating is a surface treatment and
    // doesn't change the substrate. Only the corrosion and galvanic behaviour
    // differ, because the coating is what the environment actually sees.
    elasticModulus: 200,
    yieldStrength: 250,
    ultimateStrength: 475,
    density: 7850,
    cte: 12.0,
    thermalConductivity: 51.9,
    maxServiceTemp: 400,
    corrosionResistance: { score: 3, label: "Good — sacrificial coating" },
    // Index 5 in the MIL-STD series: the zinc layer is anodic to the steel
    // beneath it and corrodes preferentially, which is the whole point.
    galvanicIndex: 5,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 1,
    compatibleProcesses: ["CNC Milling", "Sheet Metal Fabrication"],
    applicationTags: ["Fastener", "Cost-Sensitive"],
    note: "Plating is sacrificial: it protects the steel by corroding first. Once it is breached the substrate rusts normally.",
  },
  {
    id: "brass-c360",
    name: "Brass (C360)",
    category: "Other Metal",
    elasticModulus: 97,
    yieldStrength: 200,
    ultimateStrength: 340,
    density: 8500,
    cte: 20.5,
    thermalConductivity: 115,
    maxServiceTemp: 200,
    corrosionResistance: { score: 3, label: "Good" },
    galvanicIndex: 10,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 2,
    compatibleProcesses: ["CNC Milling", "CNC Turning (Lathe)"],
    applicationTags: ["Fastener", "Fitting", "High-Machinability"],
    note: "Yield strength is an average — C360 varies substantially with temper.",
  },
  {
    id: "mg-az91d",
    name: "Magnesium AZ91D",
    category: "Other Metal",
    elasticModulus: 45,
    yieldStrength: 160,
    ultimateStrength: 230,
    density: 1810,
    cte: 26,
    thermalConductivity: 72,
    maxServiceTemp: 150,
    corrosionResistance: {
      score: 1,
      label: "Poor — needs coating, highly galvanically reactive",
    },
    galvanicIndex: 0,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 2,
    compatibleProcesses: ["Die Casting"],
    applicationTags: ["Weight-Critical"],
    note: "Most anodic material in the series. Coupling it to almost any other metal drives aggressive attack on the magnesium.",
  },
  {
    id: "ptfe",
    name: "PTFE",
    category: "Dielectric",
    elasticModulus: 0.5,
    yieldStrength: null,
    ultimateStrength: null,
    density: 2200,
    cte: 125,
    thermalConductivity: 0.25,
    maxServiceTemp: 260,
    corrosionResistance: { score: 4, label: "Excellent — chemically inert" },
    galvanicIndex: null,
    dielectricConstant: 2.1,
    lossTangent: "Very Low",
    costTier: 2,
    compatibleProcesses: ["CNC Milling"],
    applicationTags: ["Radome", "Seal", "Chemical-Resistant"],
    approximate: { cte: "100–150 ppm/°C" },
    note: "CTE is strongly non-linear with temperature — the 125 figure is a midpoint, not a design value. Machining needs specialised tooling and fixturing because the material creeps.",
  },
  {
    id: "fiberglass-epoxy",
    name: "Fiberglass/Epoxy (radome-grade)",
    category: "Dielectric",
    elasticModulus: 22.5,
    yieldStrength: null,
    ultimateStrength: null,
    density: 1900,
    cte: 13,
    thermalConductivity: 0.3,
    maxServiceTemp: null,
    corrosionResistance: { score: 4, label: "Excellent" },
    galvanicIndex: null,
    dielectricConstant: 4.4,
    lossTangent: "Moderate",
    costTier: 2,
    compatibleProcesses: ["Composite Layup"],
    applicationTags: ["Radome", "Structural-Dielectric"],
    approximate: {
      elasticModulus: "20–25 GPa",
      cte: "11–15 ppm/°C",
      thermalConductivity: "≈0.3 W/m·K",
    },
    note: "Properties depend heavily on layup, fibre fraction and resin system. The highest loss tangent of the three radome dielectrics here.",
  },
  {
    id: "quartz",
    name: "Quartz (fused silica)",
    category: "Dielectric",
    elasticModulus: 73,
    yieldStrength: null,
    ultimateStrength: null,
    density: 2200,
    cte: 0.55,
    thermalConductivity: null,
    maxServiceTemp: null,
    corrosionResistance: { score: 4, label: "Excellent" },
    galvanicIndex: null,
    dielectricConstant: 3.8,
    lossTangent: "Very Low",
    costTier: 4,
    compatibleProcesses: ["CNC Milling"],
    applicationTags: ["Radome", "Low-CTE", "Precision"],
    note: "Lowest CTE in the dataset by a wide margin. Brittle — no meaningful yield strength; design against fracture, not yield. Machining requires specialised diamond tooling.",
  },
  {
    id: "nylon-pa66",
    name: "Nylon PA6/66",
    category: "Plastic",
    elasticModulus: 2.75,
    yieldStrength: 75,
    ultimateStrength: null,
    density: 1140,
    cte: 90,
    thermalConductivity: 0.25,
    maxServiceTemp: 80,
    corrosionResistance: { score: 3, label: "Good — some moisture absorption" },
    galvanicIndex: null,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 1,
    compatibleProcesses: ["Injection Molding (plastic)", "3D Printing — SLS/MJF", "CNC Milling"],
    applicationTags: ["General Purpose", "Low-Load"],
    approximate: { elasticModulus: "2.5–3 GPa", cte: "80–100 ppm/°C" },
    note: "Absorbs moisture, which shifts both dimensions and stiffness. Condition parts before precision measurement.",
  },
  {
    id: "abs",
    name: "ABS",
    category: "Plastic",
    elasticModulus: 2.3,
    yieldStrength: 40,
    ultimateStrength: null,
    density: 1050,
    cte: 95,
    thermalConductivity: 0.17,
    maxServiceTemp: 80,
    corrosionResistance: { score: 3, label: "Good" },
    galvanicIndex: null,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 1,
    compatibleProcesses: ["Injection Molding (plastic)", "3D Printing — FDM"],
    applicationTags: ["General Purpose", "Prototyping"],
    approximate: { cte: "90–100 ppm/°C" },
  },
  {
    // Not in the original 15. Carried over so migrating the CTE Mismatch
    // dropdown onto this file doesn't silently drop an option the calculator
    // already offered.
    id: "fr4",
    name: "FR4 PCB (in-plane)",
    category: "Dielectric",
    elasticModulus: 24,
    yieldStrength: null,
    ultimateStrength: null,
    density: 1850,
    cte: 15.5,
    thermalConductivity: 0.3,
    maxServiceTemp: 130,
    corrosionResistance: { score: 4, label: "Excellent" },
    galvanicIndex: null,
    dielectricConstant: 4.4,
    lossTangent: "Moderate",
    costTier: 1,
    compatibleProcesses: ["Composite Layup"],
    applicationTags: ["Structural-Dielectric"],
    note: "In-plane CTE only. Through-thickness (Z-axis) expansion is far higher, roughly 50–70 ppm/°C, and is what drives plated-through-hole fatigue.",
  },
  {
    // Also carried over — the Mast Deflection and Mast Vortex Shedding
    // calculators both offered it before this file existed.
    id: "carbon-fiber-epoxy",
    name: "Carbon Fiber/Epoxy",
    category: "Dielectric",
    elasticModulus: 70,
    yieldStrength: null,
    ultimateStrength: null,
    density: 1600,
    cte: 2,
    thermalConductivity: 5,
    maxServiceTemp: 150,
    corrosionResistance: { score: 4, label: "Excellent — but see note" },
    galvanicIndex: null,
    dielectricConstant: null,
    lossTangent: null,
    costTier: 4,
    compatibleProcesses: ["Composite Layup"],
    applicationTags: ["Structural", "Weight-Critical", "Low-CTE"],
    approximate: { elasticModulus: "70 GPa axial (layup-dependent)", cte: "≈2 ppm/°C axial" },
    note: "Highly anisotropic — the axial figures here do not apply transverse to the fibres. Electrically conductive and strongly cathodic: bolting it directly to aluminium drives severe galvanic attack on the aluminium, even though the composite itself does not corrode. Not RF-transparent.",
  },
  {
    id: "polycarbonate",
    name: "Polycarbonate (PC)",
    category: "Plastic",
    elasticModulus: 2.4,
    yieldStrength: 62,
    ultimateStrength: null,
    density: 1200,
    cte: 67.5,
    thermalConductivity: 0.2,
    maxServiceTemp: 115,
    corrosionResistance: { score: 3, label: "Good" },
    galvanicIndex: null,
    dielectricConstant: 2.9,
    lossTangent: "Moderate",
    costTier: 2,
    compatibleProcesses: ["Injection Molding (plastic)", "CNC Milling"],
    applicationTags: ["Radome-Window", "Impact-Resistant"],
    approximate: { cte: "65–70 ppm/°C" },
  },
];

// ---------------------------------------------------------------------------
// Derived properties
//
// Computed, never stored — a stored copy is a second source of truth that goes
// stale the moment someone edits a yield strength.
// ---------------------------------------------------------------------------

/**
 * Specific strength (strength-to-weight), kN·m/kg.
 *
 * yieldStrength [MPa = N/mm² = 1e6 N/m²] / density [kg/m³] gives N·m/kg;
 * dividing by 1e3 puts it in the conventional kN·m/kg. Null where the material
 * has no meaningful yield point.
 */
export function specificStrength(m: Material): number | null {
  if (m.yieldStrength === null) return null;
  return (m.yieldStrength * 1e6) / m.density / 1e3;
}

/** Cost tier as a "$$$" string. */
export function costLabel(tier: Material["costTier"]): string {
  return "$".repeat(tier);
}

/** Lower loss tangent is better for RF; this orders them for ranking. */
export const LOSS_TANGENT_RANK: Record<LossTangent, number> = {
  "Very Low": 0,
  Low: 1,
  Moderate: 2,
};

/** Look up a material by id. */
export function getMaterial(id: string): Material | undefined {
  return MATERIALS.find(m => m.id === id);
}

/**
 * Min/max of a numeric property across the whole dataset, ignoring nulls.
 * Used to normalise the comparison radar chart onto a 0–100 axis.
 */
export function rangeOf(pick: (m: Material) => number | null): { min: number; max: number } {
  const vals = MATERIALS.map(pick).filter((v): v is number => v !== null && Number.isFinite(v));
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

/**
 * Normalise a value to 0–100 against the dataset range.
 * `invert` flips the scale for properties where lower is better (CTE, cost).
 */
export function normalise(
  value: number | null,
  range: { min: number; max: number },
  invert = false,
): number {
  if (value === null || !Number.isFinite(value)) return 0;
  const span = range.max - range.min;
  if (span === 0) return 50;
  const t = (value - range.min) / span;
  return Math.round((invert ? 1 - t : t) * 100);
}
