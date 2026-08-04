/**
 * Home page — shows calculators organized by engineering discipline.
 * To add a new calculator: add an entry to the relevant category's `tools` array.
 * To add a new category: add a new object to the `CATEGORIES` array.
 */
import Link from "next/link";
import ToolIcon, { type IconName } from "@/components/ToolIcon";

// ─── Data ────────────────────────────────────────────────────────────────────

type Status = "available" | "coming-soon";

type Tool = {
  title: string;
  description: string;
  href: string;
  /** Key into the shared line-icon set — see src/components/ToolIcon.tsx. */
  icon: IconName;
  status: Status;
};

type Category = {
  label: string;
  tools: Tool[];
};

const CATEGORIES: Category[] = [
  {
    label: "Fasteners",
    tools: [
      {
        title: "Bolt Torque",
        description: "Tightening torque from clamp force, bolt diameter, and friction coefficient K. Metric and imperial units.",
        href: "/calculators/bolt-torque",
        icon: "bolt",
        status: "available",
      },
      {
        title: "Bolt Pattern",
        description: "Elastic-method load distribution across a bolt group under in-plane force and moment. SVG diagram and critical bolt callout.",
        href: "/calculators/bolt-pattern",
        icon: "boltCircle",
        status: "available",
      },
    ],
  },
  {
    label: "Sealing & IP",
    tools: [
      {
        title: "O-Ring Squeeze",
        description: "Check whether your groove depth produces squeeze in the recommended range (15–30% static, 10–20% dynamic).",
        href: "/calculators/oring-squeeze",
        icon: "oringSqueeze",
        status: "available",
      },
      {
        title: "O-Ring Groove Sizing",
        description: "Reverse-calculate required groove depth and width from a target squeeze percentage.",
        href: "/calculators/oring-groove",
        icon: "oringGroove",
        status: "available",
      },
      {
        title: "IP Rating Guide",
        description: "IP54–IP68 reference: sealing method, minimum squeeze, O-ring material selection, and design checklist.",
        href: "/calculators/ip-rating",
        icon: "droplet",
        status: "available",
      },
    ],
  },
  {
    label: "Thermal Management",
    tools: [
      {
        title: "TIM Resistance",
        description: "Thermal interface material resistance (R = t / k·A) and resulting temperature rise ΔT. AS568 TIM presets.",
        href: "/calculators/tim-resistance",
        icon: "thermometer",
        status: "available",
      },
      {
        title: "Heat Sink Sizing",
        description: "Required thermal resistance from power, ambient temp, and max component temp. Guidance bands by cooling method.",
        href: "/calculators/heatsink-sizing",
        icon: "heatsink",
        status: "available",
      },
    ],
  },
  {
    label: "Materials & Reliability",
    tools: [
      {
        title: "CTE Mismatch",
        description: "Differential thermal expansion between two dissimilar materials over a ΔT. Flags high-mismatch interface risk.",
        href: "/calculators/cte-mismatch",
        icon: "expansion",
        status: "available",
      },
      {
        title: "Galvanic Corrosion",
        description: "Compatibility lookup per MIL-STD-889C. Risk level and mitigation guidance for any two metals.",
        href: "/calculators/galvanic-corrosion",
        icon: "galvanic",
        status: "available",
      },
    ],
  },
  {
    label: "Structural — General",
    tools: [
      {
        title: "Tolerance Stackup Analyzer",
        description: "Worst-case and RSS builder with live show-your-work, a dimension-chain diagram, worked examples, and a tutorial.",
        href: "/tolerance-stackup",
        icon: "dimensionChain",
        status: "available",
      },
      {
        title: "Natural Frequency",
        description: "Mass-spring model f = (1/2π)√(k/m) with a resonance overlap check against common excitation sources.",
        href: "/calculators/vibration",
        icon: "wave",
        status: "available",
      },
      {
        title: "Beam Deflection",
        description: "Max deflection for simply supported and cantilever beams under point and distributed loads.",
        href: "/calculators/beam-deflection",
        icon: "beam",
        status: "coming-soon",
      },
    ],
  },
  {
    label: "Mast & Tripod Structural",
    tools: [
      {
        title: "Wind Load",
        description: "F = 0.5 × Cd × ρ × V² × A — wind force on a mast-mounted structure. Shape presets, m/s or mph toggle.",
        href: "/calculators/wind-load",
        icon: "wind",
        status: "available",
      },
      {
        title: "Mast Tip Deflection",
        description: "Cantilever tip deflection and pointing error (mrad) from point load and distributed wind. Radar cross-range error.",
        href: "/calculators/mast-deflection",
        icon: "mastBend",
        status: "available",
      },
      {
        title: "Tripod Stability",
        description: "Tip-over factor of safety: restoring versus overturning moment, gauged against FS 1.5 and 2.0.",
        href: "/calculators/tripod-stability",
        icon: "tripod",
        status: "available",
      },
      {
        title: "Guy Wire Tension",
        description: "Conservative single-wire tension T = F / cos(θ) for a guyed mast. Upper-bound per-wire design load.",
        href: "/calculators/guy-wire",
        icon: "guyWire",
        status: "available",
      },
      {
        title: "Base Plate Bolts",
        description: "Anchor bolt tension from overturning moment on a circular bolt pattern. Elastic method, compressive weight offset.",
        href: "/calculators/base-plate",
        icon: "basePlate",
        status: "available",
      },
      {
        title: "Mast Vortex Shedding",
        description: "Cantilever natural frequency against the Strouhal shedding range. Flags resonance across the design wind speed range.",
        href: "/calculators/mast-frequency",
        icon: "vortex",
        status: "available",
      },
    ],
  },
];

/** Reference sections — not calculators, so they sit in their own strip. */
const REFERENCES = [
  { label: "Materials Database", href: "/materials", note: "15 materials · properties, comparison, selection" },
  { label: "DFM Guide", href: "/dfm-guide", note: "Process capabilities and tolerance chart" },
  { label: "Mechanisms Reference", href: "/mechanisms-reference", note: "Linkages, gears, GD&T, weld symbols" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const totalAvailable = CATEGORIES.flatMap(c => c.tools).filter(t => t.status === "available").length;

  return (
    <div>
      {/* ── Hero ──
          The one decorative moment in the app. A slow radar sweep sits behind
          the title: static range rings, plus a thin rotating bright line at low
          opacity. It is deliberately a *line* and not a filled glowing wedge —
          a soft conic wedge is just a gradient hero in costume.
          The sweep freezes (rather than disappearing) under
          prefers-reduced-motion; see globals.css. */}
      <section className="relative mb-14 overflow-hidden">
        {/* Decorative layer — pointer-events-none so it never eats a click.
            The disc is mask-faded at its edges, so it can sit partly outside
            the section without showing a cut edge. */}
        <div
          className="pointer-events-none absolute -top-6 left-1/2 h-[400px] w-[400px] -translate-x-[58%] select-none sm:left-6 sm:translate-x-0"
          aria-hidden="true"
        >
          <div className="radar-rings absolute inset-0 opacity-[0.18]" />
          <div className="radar-sweep absolute inset-0 animate-radar-sweep opacity-[0.4]" />
        </div>

        <div className="relative py-14">
          <p className="label-caps mb-3">Mechanical engineering</p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-graphite sm:text-5xl">
            Engineering Toolkit
          </h1>
          <p className="max-w-xl text-graphite/70">
            <span className="font-mono font-semibold text-graphite">{totalAvailable}</span> calculators
            across <span className="font-mono font-semibold text-graphite">{CATEGORIES.length}</span> disciplines,
            plus material, DFM, and mechanism references.
          </p>
        </div>
      </section>

      {/* ── Reference strip ── */}
      <section className="mb-14">
        <CategoryHeader label="Reference" count={REFERENCES.length} countLabel="SECTIONS" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {REFERENCES.map(ref => (
            <Link key={ref.href} href={ref.href} className="group relative block">
              <div className="panel h-full overflow-hidden p-5 transition-colors group-hover:border-steel-blue-line">
                <EdgeMarker />
                <h3 className="mb-1 text-sm font-semibold text-graphite group-hover:text-steel-blue">
                  {ref.label}
                </h3>
                <p className="text-xs leading-relaxed text-graphite/60">{ref.note}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Calculators by discipline ── */}
      <div className="flex flex-col gap-14">
        {CATEGORIES.map(cat => (
          <section key={cat.label}>
            <CategoryHeader
              label={cat.label}
              count={cat.tools.filter(t => t.status === "available").length}
              countLabel="TOOLS"
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cat.tools.map(tool => (
                <ToolCard key={tool.href} tool={tool} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * Section header: small-caps label, hairline rule filling the gap, mono count.
 * Replaces the old emoji-and-title row — the emoji set read as generic stock
 * icons, and a ruled legend line is what a panel label actually looks like.
 */
function CategoryHeader({
  label,
  count,
  countLabel,
}: {
  label: string;
  count: number;
  countLabel: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <h2 className="label-caps whitespace-nowrap text-graphite/70">{label}</h2>
      <span className="h-px flex-1 bg-panel-gray" />
      <span className="whitespace-nowrap font-mono text-xs text-graphite/45">
        {String(count).padStart(2, "0")} {countLabel}
      </span>
    </div>
  );
}

/**
 * The 2px oxide-rust edge that appears on hover/focus.
 *
 * This replaces the old `hover:-translate-y-0.5 hover:shadow-md` lift, which is
 * the standard SaaS card-grid gesture. The card stays put and a marker lights
 * up its edge instead — the way a selected channel reads on a panel. Rust is
 * used here because selection is exactly the "sparing, signature" role it's
 * reserved for.
 */
function EdgeMarker() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-oxide-rust transition-transform duration-200 group-hover:scale-y-100 group-focus-visible:scale-y-100"
    />
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const available = tool.status === "available";

  const card = (
    <div
      className={`panel relative flex h-full flex-col gap-3 overflow-hidden p-5 transition-colors ${
        available ? "group-hover:border-steel-blue-line" : "opacity-55"
      }`}
    >
      {available && <EdgeMarker />}

      {/*
        Line icon in a tinted tile. The icon strokes with `currentColor`, so the
        two states below are the only styling either one needs — no separate
        icon variant for the disabled case.
      */}
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
          available
            ? "bg-steel-blue-tint text-steel-blue"
            : "bg-panel-gray text-graphite/40"
        }`}
      >
        <ToolIcon name={tool.icon} className="h-5 w-5" />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <h3
            className={`text-sm font-semibold text-graphite ${
              available ? "group-hover:text-steel-blue" : ""
            }`}
          >
            {tool.title}
          </h3>
          {!available && (
            <span className="rounded-sm bg-panel-gray px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-graphite/50">
              Soon
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed text-graphite/60">{tool.description}</p>
      </div>
    </div>
  );

  // The whole card is the link target, so the old "Open →" affordance was
  // redundant text on 17 cards. The edge marker carries it instead.
  return available ? (
    <Link href={tool.href} className="group block">
      {card}
    </Link>
  ) : (
    <div className="cursor-not-allowed">{card}</div>
  );
}
