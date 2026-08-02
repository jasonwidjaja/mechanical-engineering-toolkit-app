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
  icon: string;
  tools: Tool[];
};

const CATEGORIES: Category[] = [
  {
    label: "Fasteners",
    icon: "🔩",
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
        description: "Elastic-method load distribution across a bolt group under in-plane force and moment. SVG diagram + critical bolt callout.",
        href: "/calculators/bolt-pattern",
        icon: "boltCircle",
        status: "available",
      },
    ],
  },
  {
    label: "Sealing & IP",
    icon: "💧",
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
    icon: "🌡️",
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
        description: "Required thermal resistance from power, ambient temp, and max component temp. Guidance flags by cooling method.",
        href: "/calculators/heatsink-sizing",
        icon: "heatsink",
        status: "available",
      },
    ],
  },
  {
    label: "Materials & Reliability",
    icon: "🧱",
    tools: [
      {
        title: "CTE Mismatch",
        description: "Differential thermal expansion between two dissimilar materials over a ΔT — flags high-mismatch interface risk.",
        href: "/calculators/cte-mismatch",
        icon: "expansion",
        status: "available",
      },
      {
        title: "Galvanic Corrosion",
        description: "Compatibility lookup per MIL-STD-889C — risk flag and mitigation guidance for any two metals.",
        href: "/calculators/galvanic-corrosion",
        icon: "galvanic",
        status: "available",
      },
    ],
  },
  {
    label: "Structural — General",
    icon: "📐",
    tools: [
      {
        title: "Tolerance Stackup Analyzer",
        description: "Interactive worst-case + RSS builder with live \"show your work\", a dimension-chain diagram, worked examples, and a tutorial.",
        href: "/tolerance-stackup",
        icon: "dimensionChain",
        status: "available",
      },
      {
        title: "Natural Frequency",
        description: "Simple mass-spring model f = (1/2π)√(k/m) with resonance overlap check against common excitation sources.",
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
    icon: "📡",
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
        description: "Cantilever tip deflection and pointing error (mrad) from point load + distributed wind. Radar cross-range error.",
        href: "/calculators/mast-deflection",
        icon: "mastBend",
        status: "available",
      },
      {
        title: "Tripod Stability",
        description: "Tip-over factor of safety: restoring vs. overturning moment. Color-coded FS ≥ 2.0 / 1.5–2.0 / < 1.5.",
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
        description: "Anchor bolt tension from overturning moment on a circular bolt pattern — elastic method, compressive weight offset.",
        href: "/calculators/base-plate",
        icon: "basePlate",
        status: "available",
      },
      {
        title: "Mast Vortex Shedding",
        description: "Cantilever natural frequency vs. Strouhal shedding range — flags resonance risk across the design wind speed range.",
        href: "/calculators/mast-frequency",
        icon: "vortex",
        status: "available",
      },
    ],
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const totalAvailable = CATEGORIES.flatMap(c => c.tools).filter(t => t.status === "available").length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Engineering Toolkit</h1>
      <p className="text-gray-500 mb-8">
        {totalAvailable} calculators across{" "}
        {CATEGORIES.length} disciplines. More coming soon.
      </p>

      <div className="flex flex-col gap-10">
        {CATEGORIES.map(cat => (
          <section key={cat.label}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">{cat.icon}</span>
              <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wide">
                {cat.label}
              </h2>
              <span className="text-xs text-gray-400 ml-1">
                ({cat.tools.filter(t => t.status === "available").length} available)
              </span>
            </div>

            {/* Tool cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

// ─── ToolCard component ───────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: Tool }) {
  const available = tool.status === "available";

  const card = (
    <div
      className={`
        bg-white rounded-xl border p-5 flex flex-col gap-2.5 h-full
        transition-all duration-150
        ${available
          ? "border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          : "border-gray-100 opacity-55 cursor-not-allowed"
        }
      `}
    >
      {/*
        Line icon in a tinted tile. The icon strokes with `currentColor`, so the
        two states below are the only styling either one needs — no separate
        icon variant for the disabled case.
      */}
      <div
        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${
          available ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"
        }`}
      >
        <ToolIcon name={tool.icon} className="h-5 w-5" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-gray-800">{tool.title}</h3>
          {!available && (
            <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{tool.description}</p>
      </div>
      {available && (
        <span className="mt-auto text-xs font-medium text-blue-600">
          Open →
        </span>
      )}
    </div>
  );

  return available ? <Link href={tool.href}>{card}</Link> : <div>{card}</div>;
}
