"use client";

/**
 * DFM Reference Hub — /dfm-guide
 *
 * Design for Manufacturability reference covering four processes, plus a
 * cross-process comparison. Unlike the calculators, this page computes nothing —
 * but it isn't static either: the tab switcher, the chart, and the table
 * disclosure all need client-side state, hence "use client" at the top.
 *
 * Content lives in src/lib/dfm-data.ts, not here. This file is purely the
 * *rendering* of that content, so adding a fifth process (CNC machining, say)
 * means adding one object to PROCESSES and one entry to DIAGRAMS below.
 *
 * Every process tab follows the same five-part template, in this order:
 *   1. Process overview
 *   2. Key DFM Guidelines table
 *   3. Common Defects table
 *   4. An original SVG diagram of the process's key geometric concept
 *   5. Further Resources (external links)
 */

import Link from "next/link";
import { useState } from "react";

import {
  DECISION_GUIDE,
  DISCLAIMER,
  PROCESSES,
  TOLERANCE_CATEGORIES,
  TOLERANCE_DISCLAIMER,
  TOLERANCE_MATERIAL_NOTE,
  TOLERANCE_ROWS,
  type Comparison,
  type Defect,
  type Guideline,
  type ProcessContent,
  type ProcessKey,
  type ToleranceCategory,
} from "@/lib/dfm-data";

import DataTable from "@/components/ui/DataTable";
import ResourceList from "@/components/ui/ResourceList";
import SectionHeading from "@/components/ui/SectionHeading";
import TabButton from "@/components/ui/TabButton";

import CastingSectionDiagram from "@/components/dfm/CastingSectionDiagram";
import DraftAngleDiagram from "@/components/dfm/DraftAngleDiagram";
import MinWallChart from "@/components/dfm/MinWallChart";
import OverhangDiagram from "@/components/dfm/OverhangDiagram";
import PrecisionSpectrumChart from "@/components/dfm/PrecisionSpectrumChart";
import SheetMetalBendDiagram from "@/components/dfm/SheetMetalBendDiagram";

// ─── Diagram lookup ──────────────────────────────────────────────────────────
// Maps each process to its illustration. Keeping this as a plain object (rather
// than a field on the data) keeps dfm-data.ts free of JSX and importable
// anywhere, including from server components.
const DIAGRAMS: Record<ProcessKey, () => React.JSX.Element> = {
  "injection-molding": DraftAngleDiagram,
  "sheet-metal": SheetMetalBendDiagram,
  "3d-printing": OverhangDiagram,
  casting: CastingSectionDiagram,
};

/** Tabs are the four processes plus the cross-process tolerance chart. */
type TabKey = ProcessKey | "tolerances";

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════

export default function DfmGuidePage() {
  const [tab, setTab] = useState<TabKey>("injection-molding");

  // The process object for the active tab — undefined while on "tolerances".
  const active = PROCESSES.find(p => p.key === tab);

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6"
      >
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">DFM Reference Hub</h1>
      <p className="text-sm text-gray-500 mb-5">
        Design for Manufacturability guidelines across four common processes — what each
        one can hold, how parts typically fail, and the geometry that drives both.
      </p>

      {/* ── Module-wide disclaimer. Shown above the tabs so it applies to
             everything, not just whichever tab happens to be open. ── */}
      <div className="flex gap-2.5 items-start bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
        <span className="text-base leading-none mt-0.5">⚠️</span>
        <p className="text-xs text-amber-900 leading-relaxed">{DISCLAIMER}</p>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {PROCESSES.map(p => (
          <TabButton key={p.key} active={tab === p.key} onClick={() => setTab(p.key)}>
            <span className="mr-1.5">{p.icon}</span>
            {p.label}
          </TabButton>
        ))}
        <TabButton active={tab === "tolerances"} onClick={() => setTab("tolerances")}>
          <span className="mr-1.5">📏</span>
          Process Tolerance Chart
        </TabButton>
      </div>

      {active ? <ProcessPanel process={active} /> : <TolerancePanel />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Process panel — the shared template every process renders through
// ═══════════════════════════════════════════════════════════════════════════

function ProcessPanel({ process }: { process: ProcessContent }) {
  const Diagram = DIAGRAMS[process.key];

  return (
    <div className="flex flex-col gap-8">
      {/* ── 1. Overview ── */}
      <section>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl leading-none">{process.icon}</span>
            <h2 className="text-lg font-semibold text-gray-800">{process.label}</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{process.overview}</p>
        </div>
      </section>

      {/* ── 2. Key DFM Guidelines ──
             Most processes use a two-column topic/guidance table. 3D printing
             instead compares three technologies side by side, so it supplies
             `comparison` rather than `guidelines`. */}
      <section>
        <SectionHeading>Key DFM Guidelines</SectionHeading>
        {process.guidelines && <GuidelinesTable rows={process.guidelines} />}
        {process.comparison && <ComparisonTable comparison={process.comparison} />}

        {/* The one chart in the module, shown directly beneath the table whose
            "Min wall thickness" row it visualizes. Bar length answers "which
            process goes thinnest?" faster than three strings of text do. */}
        {process.key === "3d-printing" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mt-4">
            <MinWallChart />
          </div>
        )}
      </section>

      {/* ── 3. Common Defects ── */}
      <section>
        <SectionHeading>Common Defects</SectionHeading>
        <DefectsTable rows={process.defects} />
      </section>

      {/* ── 4. Diagram ── */}
      <section>
        <SectionHeading>Key Concept</SectionHeading>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <Diagram />
          <p className="text-xs text-gray-500 leading-relaxed mt-3 pt-3 border-t border-gray-100">
            {process.diagramCaption}
          </p>
        </div>
      </section>

      {/* ── 5. Further Resources ── */}
      <section>
        <SectionHeading>Further Resources</SectionHeading>
        <ResourceList resources={process.resources} />
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Process Tolerance Chart panel
// ═══════════════════════════════════════════════════════════════════════════

/** "All" is a filter state but not a real category, so it gets its own literal. */
type CategoryFilter = ToleranceCategory | "All";

function TolerancePanel() {
  const [filter, setFilter] = useState<CategoryFilter>("All");

  // Filtering is cheap on 15 rows, so it runs inline on every render rather
  // than being memoized — useMemo here would cost more than it saves.
  const rows =
    filter === "All" ? TOLERANCE_ROWS : TOLERANCE_ROWS.filter(r => r.category === filter);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl leading-none">📏</span>
            <h2 className="text-lg font-semibold text-gray-800">Process Tolerance Chart</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            What each process holds by default, and what it can hold when you explicitly
            call the tolerance out on the print. The gap between those two columns is
            usually the gap between a normal quote and an expensive one — every tightened
            tolerance costs setup time, tooling, or inspection.
          </p>
        </div>
      </section>

      {/* ── Precision Spectrum ──
             Placed above the table: the chart answers "which processes are even
             in range?" and the table then answers "what exactly, and in what
             material?" for the handful that survive. */}
      <section>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <PrecisionSpectrumChart />
        </div>
      </section>

      {/* ── Category filter ── */}
      <section>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
            Show by category
          </span>
          <FilterChip active={filter === "All"} onClick={() => setFilter("All")}>
            All
          </FilterChip>
          {TOLERANCE_CATEGORIES.map(cat => (
            <FilterChip key={cat} active={filter === cat} onClick={() => setFilter(cat)}>
              {cat}
            </FilterChip>
          ))}
        </div>

        {/* Representative-values caveat, immediately above the numbers it qualifies */}
        <p className="text-xs text-gray-500 italic mb-2">{TOLERANCE_DISCLAIMER}</p>

        {/* ── The table ── */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-semibold">Process</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Common Materials</th>
                <th className="px-4 py-3 font-semibold">Standard Tolerance</th>
                <th className="px-4 py-3 font-semibold">Precision / Tight Tolerance</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.process} className="hover:bg-gray-50 transition-colors align-top">
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                    {r.process}
                  </td>
                  <td className="px-4 py-3">
                    <CategoryChip category={r.category} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs leading-relaxed">
                    {r.materials}
                  </td>
                  {/* Tolerances are monospaced so the ± figures line up column-wise */}
                  <td className="px-4 py-3 text-gray-700 text-xs font-mono leading-relaxed">
                    {r.standard}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono leading-relaxed">
                    {r.precision ? (
                      <span className="text-blue-700">{r.precision}</span>
                    ) : (
                      // An em dash, not an empty cell — "no tighter grade published"
                      // should look deliberate rather than like missing data.
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs leading-relaxed">
                    {r.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Material caveat */}
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          {TOLERANCE_MATERIAL_NOTE}
        </p>
      </section>

      {/* ── Quick Decision Guide ── */}
      <section>
        <SectionHeading>Quick Decision Guide</SectionHeading>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs text-blue-900/70 mb-4">
            Work backwards — start from the tolerance the design actually needs, then
            pick the loosest (cheapest) process that holds it.
          </p>
          <ul className="flex flex-col gap-3">
            {DECISION_GUIDE.map(entry => (
              <li key={entry.band} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="font-mono text-sm font-semibold text-blue-800 sm:w-44 shrink-0">
                  {entry.band}
                </span>
                <span className="text-blue-400 hidden sm:inline">→</span>
                <span className="text-sm text-blue-900 leading-relaxed">{entry.answer}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tables — thin wrappers that map this page's data shapes onto the shared
// DataTable. The markup lives in src/components/ui/DataTable.tsx.
// ═══════════════════════════════════════════════════════════════════════════

/** Two-column guidelines table: topic → rule of thumb. */
function GuidelinesTable({ rows }: { rows: Guideline[] }) {
  return (
    <DataTable
      columns={[
        { header: "Topic", className: "font-medium text-gray-800", headerClassName: "w-48" },
        { header: "Guideline", className: "text-gray-600 leading-relaxed" },
      ]}
      rows={rows.map(r => ({ key: r.topic, cells: [r.topic, r.guidance] }))}
    />
  );
}

/** N-column comparison table — used by 3D printing (FDM | SLA | SLS/MJF). */
function ComparisonTable({ comparison }: { comparison: Comparison }) {
  return (
    <DataTable
      columns={[
        { header: "Parameter", className: "font-medium text-gray-800", headerClassName: "w-44" },
        ...comparison.columns.map(c => ({ header: c })),
      ]}
      rows={comparison.rows.map(r => ({ key: r.topic, cells: [r.topic, ...r.values] }))}
    />
  );
}

/** Three-column defects table: what you see → why → what to change. */
function DefectsTable({ rows }: { rows: Defect[] }) {
  return (
    <DataTable
      columns={[
        { header: "Defect", className: "font-medium text-red-700", headerClassName: "w-44" },
        { header: "Typical Cause", className: "text-gray-600 text-xs leading-relaxed" },
        { header: "Design Fix", className: "text-gray-700 text-xs leading-relaxed" },
      ]}
      rows={rows.map(r => ({ key: r.defect, cells: [r.defect, r.cause, r.fix] }))}
    />
  );
}

/**
 * Category filter chip.
 *
 * A plain <button>, not a <select>: with six options that all fit on one row,
 * showing every choice at once is faster to scan and to click than a dropdown
 * the reader has to open to discover what's in it.
 */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-700"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The in-table category label.
 *
 * Each family gets its own tint so the eye can group rows while scrolling the
 * unfiltered table — but the word is always present, so the color is never
 * carrying the meaning on its own.
 */
function CategoryChip({ category }: { category: ToleranceCategory }) {
  const styles: Record<ToleranceCategory, string> = {
    Machining: "bg-blue-50 text-blue-700 border-blue-200",
    Cutting: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Casting: "bg-amber-50 text-amber-700 border-amber-200",
    Molding: "bg-violet-50 text-violet-700 border-violet-200",
    Additive: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${styles[category]}`}
    >
      {category}
    </span>
  );
}

// TabButton, SectionHeading, ResourceList and DataTable now live in
// src/components/ui/ — shared with the Mechanisms reference page.
