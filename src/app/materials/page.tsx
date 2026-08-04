/**
 * Materials Database — top-level reference section.
 *
 * Three views over the shared dataset in src/lib/materials.ts:
 *   Browse   — sortable, filterable table of the whole set
 *   Compare  — 2–4 materials side by side, plus a normalised radar chart
 *   Find     — pick an application, get a ranked shortlist with reasons
 *
 * All three read MATERIALS. Nothing here holds its own copy of a property.
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

import TabButton from "@/components/ui/TabButton";
import DataTable, { type Column, type Row } from "@/components/ui/DataTable";
import {
  MATERIALS,
  MATERIAL_CATEGORIES,
  APPLICATION_TAGS,
  DISCLAIMER,
  LOSS_TANGENT_RANK,
  costLabel,
  normalise,
  rangeOf,
  specificStrength,
  type ApplicationTag,
  type Material,
  type MaterialCategory,
} from "@/lib/materials";
import { getRisk } from "@/lib/galvanic";

type Tab = "browse" | "compare" | "find";

export default function MaterialsPage() {
  const [tab, setTab] = useState<Tab>("browse");

  return (
    <div>
      <p className="label-caps mb-3">Reference</p>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-graphite">Materials Database</h1>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-graphite/70">
        <span className="font-mono font-semibold text-graphite">{MATERIALS.length}</span> materials
        with mechanical, thermal, corrosion, and RF properties. The same dataset feeds the material
        dropdowns in the CTE Mismatch, Galvanic Corrosion, Mast Deflection, and Mast Vortex
        Shedding calculators.
      </p>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-panel-gray">
        <TabButton active={tab === "browse"} onClick={() => setTab("browse")}>
          Browse all
        </TabButton>
        <TabButton active={tab === "compare"} onClick={() => setTab("compare")}>
          Compare
        </TabButton>
        <TabButton active={tab === "find"} onClick={() => setTab("find")}>
          Find by application
        </TabButton>
      </div>

      {tab === "browse" && <BrowsePanel />}
      {tab === "compare" && <ComparePanel />}
      {tab === "find" && <FindPanel />}

      {/* The caveat sits on every view, not just the first one. */}
      <p className="mt-8 border-t border-panel-gray pt-4 text-xs leading-relaxed text-graphite/60">
        {DISCLAIMER}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// View 1 — Browse all
// ═══════════════════════════════════════════════════════════════════════════

/** Columns the table can sort by, with how to extract the sort key. */
const SORT_KEYS = {
  name: (m: Material) => m.name,
  category: (m: Material) => m.category,
  yield: (m: Material) => m.yieldStrength,
  specific: (m: Material) => specificStrength(m),
  cte: (m: Material) => m.cte,
  k: (m: Material) => m.thermalConductivity,
  corrosion: (m: Material) => m.corrosionResistance.score,
  cost: (m: Material) => m.costTier,
} as const;

type SortKey = keyof typeof SORT_KEYS;

function BrowsePanel() {
  const [category, setCategory] = useState<MaterialCategory | "All">("All");
  const [tag, setTag] = useState<ApplicationTag | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [asc, setAsc] = useState(true);

  /** Only the tags actually in use, so the dropdown has no dead options. */
  const usedTags = useMemo(() => {
    const s = new Set<ApplicationTag>();
    MATERIALS.forEach(m => m.applicationTags.forEach(t => s.add(t)));
    return APPLICATION_TAGS.filter(t => s.has(t));
  }, []);

  const rows = useMemo(() => {
    const filtered = MATERIALS.filter(
      m =>
        (category === "All" || m.category === category) &&
        (tag === "All" || m.applicationTags.includes(tag)),
    );

    const get = SORT_KEYS[sortKey];
    return [...filtered].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      // Nulls always sink to the bottom regardless of direction — a material
      // with no yield strength isn't "the weakest", it's not applicable.
      if (va === null) return 1;
      if (vb === null) return -1;
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return asc ? cmp : -cmp;
    });
  }, [category, tag, sortKey, asc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setAsc(a => !a);
    else {
      setSortKey(key);
      setAsc(true);
    }
  }

  /** Sortable column header. */
  const SortHeader = ({ label, k, align }: { label: string; k: SortKey; align?: "right" }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`flex w-full items-center gap-1 font-semibold transition-colors hover:text-steel-blue ${
        align === "right" ? "justify-end" : ""
      } ${sortKey === k ? "text-steel-blue" : ""}`}
      aria-sort={sortKey === k ? (asc ? "ascending" : "descending") : "none"}
    >
      {label}
      {/* Only the active column shows a caret — arrows on every header is noise. */}
      <span className="font-mono text-[10px]">{sortKey === k ? (asc ? "▲" : "▼") : ""}</span>
    </button>
  );

  const columns: Column[] = [
    { header: <SortHeader label="Material" k="name" />, className: "font-medium text-graphite" },
    { header: <SortHeader label="Category" k="category" />, className: "text-graphite/70" },
    {
      header: <SortHeader label="Yield (MPa)" k="yield" align="right" />,
      className: "text-right font-mono text-graphite/80",
      headerClassName: "text-right",
    },
    {
      header: <SortHeader label="Specific str." k="specific" align="right" />,
      className: "text-right font-mono text-graphite/80",
      headerClassName: "text-right",
    },
    {
      header: <SortHeader label="CTE (ppm/°C)" k="cte" align="right" />,
      className: "text-right font-mono text-graphite/80",
      headerClassName: "text-right",
    },
    {
      header: <SortHeader label="k (W/m·K)" k="k" align="right" />,
      className: "text-right font-mono text-graphite/80",
      headerClassName: "text-right",
    },
    { header: <SortHeader label="Corrosion" k="corrosion" />, className: "text-graphite/70" },
    {
      header: <SortHeader label="Cost" k="cost" align="right" />,
      className: "text-right font-mono text-graphite/80",
      headerClassName: "text-right",
    },
  ];

  const tableRows: Row[] = rows.map(m => {
    const ss = specificStrength(m);
    return {
      key: m.id,
      cells: [
        m.name,
        m.category,
        m.yieldStrength ?? <Dash />,
        ss === null ? <Dash /> : ss.toFixed(1),
        <span key="cte" title={m.approximate?.cte}>
          {m.cte}
          {m.approximate?.cte && <sup className="text-graphite/40">~</sup>}
        </span>,
        m.thermalConductivity ?? <Dash />,
        <CorrosionMark key="corr" score={m.corrosionResistance.score} label={m.corrosionResistance.label} />,
        costLabel(m.costTier),
      ],
    };
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="label-caps">Category</span>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as MaterialCategory | "All")}
            className="rounded-lg border border-graphite/20 bg-white px-3 py-2 text-sm"
          >
            <option value="All">All categories</option>
            {MATERIAL_CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="label-caps">Application tag</span>
          <select
            value={tag}
            onChange={e => setTag(e.target.value as ApplicationTag | "All")}
            className="rounded-lg border border-graphite/20 bg-white px-3 py-2 text-sm"
          >
            <option value="All">All tags</option>
            {usedTags.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <span className="ml-auto font-mono text-xs text-graphite/50">
          {String(rows.length).padStart(2, "0")} / {MATERIALS.length} SHOWN
        </span>
      </div>

      <DataTable columns={columns} rows={tableRows} alignTop={false} />

      <p className="mt-3 text-xs text-graphite/60">
        Specific strength is yield ÷ density, in kN·m/kg — computed, not stored. A{" "}
        <span className="font-mono">~</span> marks a value published as a range; the table shows the
        midpoint.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// View 2 — Compare
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Series colours for the radar. Four palette hues that stay distinguishable
 * from one another; this is the one place oxide-rust is used as a data colour,
 * because a comparison chart genuinely needs four separable series.
 */
const SERIES_COLORS = ["#2B4C7E", "#B5532C", "#4B7B4E", "#A17D36"];

const MAX_COMPARE = 4;

function ComparePanel() {
  const [selected, setSelected] = useState<string[]>(["al-6061-t6", "ti-6al-4v"]);

  const chosen = selected
    .map(id => MATERIALS.find(m => m.id === id))
    .filter((m): m is Material => Boolean(m));

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length >= MAX_COMPARE
        ? prev
        : [...prev, id],
    );
  }

  // Dataset-wide ranges, computed once, so each axis is normalised against the
  // whole database rather than only against the selected materials.
  const ranges = useMemo(
    () => ({
      specific: rangeOf(specificStrength),
      corrosion: rangeOf(m => m.corrosionResistance.score),
      k: rangeOf(m => m.thermalConductivity),
      cte: rangeOf(m => m.cte),
      cost: rangeOf(m => m.costTier),
    }),
    [],
  );

  /**
   * Radar data. Two axes are inverted because lower is better:
   * CTE Stability (a low CTE is dimensionally stable) and Cost Efficiency.
   */
  const radarData = useMemo(() => {
    const axes: { axis: string; pick: (m: Material) => number | null; range: { min: number; max: number }; invert?: boolean }[] = [
      { axis: "Specific strength", pick: specificStrength, range: ranges.specific },
      { axis: "Corrosion resist.", pick: m => m.corrosionResistance.score, range: ranges.corrosion },
      { axis: "Thermal cond.", pick: m => m.thermalConductivity, range: ranges.k },
      { axis: "CTE stability", pick: m => m.cte, range: ranges.cte, invert: true },
      { axis: "Cost efficiency", pick: m => m.costTier, range: ranges.cost, invert: true },
    ];
    return axes.map(a => {
      const row: Record<string, string | number> = { axis: a.axis };
      chosen.forEach(m => {
        row[m.name] = normalise(a.pick(m), a.range, a.invert);
      });
      return row;
    });
  }, [chosen, ranges]);

  // Galvanic check: only meaningful for exactly two metals.
  const metals = chosen.filter(m => m.galvanicIndex !== null);
  const galvanic =
    chosen.length === 2 && metals.length === 2
      ? getRisk(metals[0].galvanicIndex!, metals[1].galvanicIndex!)
      : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Selector */}
      <div className="panel p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="label-caps">Select 2–{MAX_COMPARE} materials</p>
          <span className="font-mono text-xs text-graphite/50">
            {selected.length} / {MAX_COMPARE}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map(m => {
            const on = selected.includes(m.id);
            const full = selected.length >= MAX_COMPARE && !on;
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                disabled={full}
                aria-pressed={on}
                className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  on
                    ? "border-steel-blue bg-steel-blue text-white"
                    : full
                    ? "cursor-not-allowed border-panel-gray text-graphite/30"
                    : "border-panel-gray bg-white text-graphite/70 hover:border-steel-blue-line hover:text-steel-blue"
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {chosen.length < 2 ? (
        <p className="panel p-5 text-sm text-graphite/60">Select at least two materials to compare.</p>
      ) : (
        <>
          {/* Galvanic warning — reuses the calculator's risk function verbatim. */}
          {galvanic && (
            <div
              className={`rounded-lg border p-4 ${
                galvanic.color === "red"
                  ? "border-signal-red-line bg-signal-red-tint"
                  : galvanic.color === "yellow"
                  ? "border-signal-amber-line bg-signal-amber-tint"
                  : "border-phosphor-green-line bg-phosphor-green-tint"
              }`}
            >
              <p className="label-caps mb-1">Galvanic couple</p>
              <p
                className={`text-sm font-medium ${
                  galvanic.color === "red"
                    ? "text-signal-red-deep"
                    : galvanic.color === "yellow"
                    ? "text-signal-amber-deep"
                    : "text-phosphor-green-deep"
                }`}
              >
                {metals[0].name} and {metals[1].name} sit{" "}
                <span className="font-mono">
                  {Math.abs(metals[0].galvanicIndex! - metals[1].galvanicIndex!)}
                </span>{" "}
                apart on the MIL-STD-889C series. {galvanic.label}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-graphite/70">
                {galvanic.mitigation}{" "}
                <Link
                  href="/calculators/galvanic-corrosion"
                  className="text-steel-blue underline hover:text-steel-blue-deep"
                >
                  Full galvanic corrosion reference
                </Link>
              </p>
            </div>
          )}

          {/* Radar */}
          <div className="panel p-5">
            <p className="label-caps mb-1">Normalised property profile</p>
            <p className="mb-4 text-xs text-graphite/60">
              Each axis is scaled 0–100 against the full dataset&apos;s range. CTE stability and
              cost efficiency are inverted, so further out is better on every axis.
            </p>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="#E7EAEC" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: "#5F6164", fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fill: "#98999B", fontSize: 9 }}
                    tickCount={5}
                    stroke="#E7EAEC"
                  />
                  {chosen.map((m, i) => (
                    <Radar
                      key={m.id}
                      name={m.name}
                      dataKey={m.name}
                      stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                      fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                      fillOpacity={0.12}
                      strokeWidth={2}
                      // Headless screenshots catch an animating chart mid-flight
                      // and it looks broken. Off everywhere in this app.
                      isAnimationActive={false}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12, color: "#5F6164" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full side-by-side */}
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-panel-gray bg-instrument-white text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-graphite/60">Property</th>
                  {chosen.map((m, i) => (
                    <th key={m.id} className="px-4 py-3 text-xs font-semibold text-graphite">
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                        style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
                      />
                      {m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-gray">
                {COMPARE_FIELDS.map(f => (
                  <tr key={f.label}>
                    <td className="px-4 py-2.5 text-xs text-graphite/70">{f.label}</td>
                    {chosen.map(m => (
                      <td
                        key={m.id}
                        className={`px-4 py-2.5 ${f.mono ? "font-mono tabular-nums" : ""} text-graphite/80`}
                      >
                        {f.render(m)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/** Every field, in the order an engineer reads a datasheet. */
const COMPARE_FIELDS: {
  label: string;
  mono?: boolean;
  render: (m: Material) => React.ReactNode;
}[] = [
  { label: "Category", render: m => m.category },
  { label: "Elastic modulus (GPa)", mono: true, render: m => m.approximate?.elasticModulus ?? m.elasticModulus ?? "—" },
  { label: "Yield strength (MPa)", mono: true, render: m => m.yieldStrength ?? "—" },
  { label: "Ultimate strength (MPa)", mono: true, render: m => m.ultimateStrength ?? "—" },
  {
    label: "Specific strength (kN·m/kg)",
    mono: true,
    render: m => {
      const s = specificStrength(m);
      return s === null ? "—" : s.toFixed(1);
    },
  },
  { label: "Density (kg/m³)", mono: true, render: m => m.density.toLocaleString() },
  { label: "CTE (ppm/°C)", mono: true, render: m => m.approximate?.cte ?? m.cte },
  {
    label: "Thermal conductivity (W/m·K)",
    mono: true,
    render: m => m.approximate?.thermalConductivity ?? m.thermalConductivity ?? "—",
  },
  { label: "Max service temp (°C)", mono: true, render: m => m.maxServiceTemp ?? "—" },
  { label: "Corrosion resistance", render: m => m.corrosionResistance.label },
  { label: "Galvanic index (0–14)", mono: true, render: m => m.galvanicIndex ?? "n/a" },
  { label: "Dielectric constant", mono: true, render: m => m.dielectricConstant ?? "—" },
  { label: "Loss tangent", render: m => m.lossTangent ?? "—" },
  { label: "Cost tier", mono: true, render: m => costLabel(m.costTier) },
  {
    label: "Compatible processes",
    render: m => (
      <span className="text-xs leading-relaxed">{m.compatibleProcesses.join(", ")}</span>
    ),
  },
  {
    label: "Application tags",
    render: m => <span className="text-xs leading-relaxed">{m.applicationTags.join(", ")}</span>,
  },
  {
    label: "Notes",
    render: m => <span className="text-xs leading-relaxed text-graphite/60">{m.note ?? "—"}</span>,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// View 3 — Find by application
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Each application defines its own filter and ranking. `reason` writes the
 * one-line rationale using the property that actually earned the placing, so
 * the copy can't drift away from the ranking rule.
 */
type Application = {
  key: string;
  label: string;
  blurb: string;
  filter: (m: Material) => boolean;
  /** Negative = a before b. */
  rank: (a: Material, b: Material) => number;
  reason: (m: Material, index: number) => string;
  limit?: number;
};

const num = (v: number | null) => (v === null ? -Infinity : v);

const APPLICATIONS: Application[] = [
  {
    key: "structural",
    label: "Structural / Load-Bearing",
    blurb: "Materials with a published yield strength, ranked by strength-to-weight.",
    filter: m => m.yieldStrength !== null,
    rank: (a, b) => num(specificStrength(b)) - num(specificStrength(a)),
    reason: m =>
      `${specificStrength(m)!.toFixed(1)} kN·m/kg specific strength at ${m.yieldStrength} MPa yield.`,
  },
  {
    key: "radome",
    label: "RF-Transparent / Radome",
    blurb:
      "Dielectrics only, ranked by loss tangent first, then by lowest dielectric constant.",
    filter: m => m.dielectricConstant !== null,
    rank: (a, b) => {
      const la = LOSS_TANGENT_RANK[a.lossTangent ?? "Moderate"];
      const lb = LOSS_TANGENT_RANK[b.lossTangent ?? "Moderate"];
      if (la !== lb) return la - lb;
      return (a.dielectricConstant ?? 99) - (b.dielectricConstant ?? 99);
    },
    reason: m => `${m.lossTangent} loss tangent, dielectric constant ${m.dielectricConstant}.`,
  },
  {
    key: "corrosion",
    label: "Corrosion-Resistant / Outdoor",
    blurb: "Ranked by corrosion resistance rating.",
    filter: () => true,
    rank: (a, b) => b.corrosionResistance.score - a.corrosionResistance.score,
    reason: m => m.corrosionResistance.label + ".",
  },
  {
    key: "thermal",
    label: "Thermal Management",
    blurb: "Ranked by thermal conductivity.",
    filter: m => m.thermalConductivity !== null,
    rank: (a, b) => num(b.thermalConductivity) - num(a.thermalConductivity),
    reason: m => `${m.thermalConductivity} W/m·K conductivity.`,
  },
  {
    key: "weight",
    label: "Weight-Critical",
    blurb: "Ranked by specific strength, with density breaking ties.",
    filter: m => m.yieldStrength !== null,
    rank: (a, b) => {
      const d = num(specificStrength(b)) - num(specificStrength(a));
      return d !== 0 ? d : a.density - b.density;
    },
    reason: m =>
      `${specificStrength(m)!.toFixed(1)} kN·m/kg at ${m.density.toLocaleString()} kg/m³.`,
  },
  {
    key: "lowcte",
    label: "Low-CTE / Precision",
    blurb: "Ranked by lowest coefficient of thermal expansion.",
    filter: () => true,
    rank: (a, b) => Math.abs(a.cte) - Math.abs(b.cte),
    reason: m => `${m.approximate?.cte ?? `${m.cte} ppm/°C`} thermal expansion.`,
  },
  {
    key: "cost",
    label: "Cost-Sensitive / General Purpose",
    blurb:
      "Tier 1–2 stock only, then ranked by whichever of those still carries real structural and corrosion capability.",
    filter: m => m.costTier <= 2,
    // Among cheap materials, the useful one is whichever still has strength AND
    // doesn't need a coating — so rank on the combination rather than on price,
    // which is nearly flat across the filtered set anyway.
    rank: (a, b) => {
      const score = (m: Material) =>
        num(specificStrength(m)) / 10 + m.corrosionResistance.score * 5 - m.costTier;
      return score(b) - score(a);
    },
    reason: m =>
      m.yieldStrength !== null
        ? `${costLabel(m.costTier)} stock, ${m.yieldStrength} MPa yield, ${m.corrosionResistance.label.toLowerCase()}.`
        : `${costLabel(m.costTier)} stock, ${m.corrosionResistance.label.toLowerCase()}.`,
  },
];

function FindPanel() {
  const [appKey, setAppKey] = useState(APPLICATIONS[0].key);
  const app = APPLICATIONS.find(a => a.key === appKey)!;

  const ranked = useMemo(
    () => MATERIALS.filter(app.filter).sort(app.rank).slice(0, app.limit ?? 5),
    [app],
  );

  return (
    <div>
      {/* Application picker */}
      <div className="mb-6 flex flex-wrap gap-2">
        {APPLICATIONS.map(a => (
          <button
            key={a.key}
            onClick={() => setAppKey(a.key)}
            aria-pressed={a.key === appKey}
            className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
              a.key === appKey
                ? "border-steel-blue bg-steel-blue text-white"
                : "border-panel-gray bg-white text-graphite/70 hover:border-steel-blue-line hover:text-steel-blue"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-graphite/70">{app.blurb}</p>

      <div className="flex flex-col gap-3">
        {ranked.map((m, i) => (
          <div key={m.id} className="panel flex items-start gap-4 p-4">
            {/* Rank number, mono — it's a figure, not a label. */}
            <span className="readout mt-0.5 w-7 shrink-0 text-lg text-graphite/40">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
                <h3 className="text-sm font-semibold text-graphite">{m.name}</h3>
                <span className="font-mono text-xs text-graphite/50">{m.category}</span>
              </div>
              <p className="text-xs leading-relaxed text-graphite/70">{app.reason(m, i)}</p>
              {m.note && <p className="mt-1 text-xs leading-relaxed text-graphite/50">{m.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Small shared bits
// ═══════════════════════════════════════════════════════════════════════════

/** Em dash for "not applicable" — deliberate, not missing data. */
function Dash() {
  return <span className="text-graphite/30">—</span>;
}

/**
 * Corrosion rating as filled blocks out of four. Faster to scan down a column
 * than "Good" / "Fair" / "Excellent", and the full label is on hover.
 */
function CorrosionMark({ score, label }: { score: number; label: string }) {
  // Filled and empty use *different glyphs*, not the same glyph at two
  // opacities. The opacity version rendered as four identical blocks on every
  // row — the distinction vanished at table text size.
  return (
    <span className="flex items-center gap-1.5" title={label}>
      <span className="font-mono text-xs tracking-widest text-graphite/75">
        {"■".repeat(score)}
        {"□".repeat(4 - score)}
      </span>
      <span className="font-mono text-[10px] text-graphite/45">{score}/4</span>
    </span>
  );
}
