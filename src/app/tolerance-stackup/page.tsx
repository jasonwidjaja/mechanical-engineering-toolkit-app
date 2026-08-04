/**
 * Tolerance Stackup Analyzer & Tutorial
 * ======================================
 *
 * This is a fuller module than the other single-purpose calculators, so it lives
 * on its own top-level route (/tolerance-stackup) instead of the /calculators grid.
 *
 * It has two tabs:
 *   1. "Builder"  — an interactive 1-D stackup builder with a live "show your work"
 *                    panel that prints every formula step (never a black-box answer).
 *   2. "Learn"    — a plain-language tutorial (pancake analogy), a worst-case vs RSS
 *                    method comparison with a bar chart, and two fully worked examples
 *                    that pre-load into the Builder.
 *
 * The math engine (`computeStackup`) is a single pure function used by BOTH the
 * live builder and the worked examples, so the numbers can never disagree.
 *
 * ── The two formulas ──
 *   Nominal result   = Σ (signed nominal)      (opening dims +, closing dims −)
 *   Worst-case tol   = Σ |Tᵢ|                   (every part at its extreme at once)
 *   RSS tol          = √(Σ Tᵢ²)                 (statistical, ASME Y14.5 assumption)
 */
"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

import ExampleChainDiagram from "@/components/ExampleChainDiagram";

// ===========================================================================
// Types
// ===========================================================================

/** Whether a dimension makes the final gap bigger (+) or smaller (−). */
type Direction = "opens" | "closes";

/** One dimension in the loop. Numbers are kept as strings so the <input> shows
 *  exactly what the user typed. */
type DimRow = {
  id: number;
  label: string;
  nominal: string; // mm
  tol: string;     // ± mm
  direction: Direction;
};

/** Everything the math engine produces — both the numbers and the fully
 *  substituted formula strings used by the "show your work" panel. */
type Computed = {
  // Per-row parsed data (used by the diagram and breakdowns)
  rows: Array<{
    label: string;
    nominalNum: number;
    tolNum: number;
    direction: Direction;
    signedNominal: number;
  }>;
  nominal: number;
  wcTol: number;   // worst-case tolerance
  rssTol: number;  // RSS tolerance
  sumSquares: number;
  wcMin: number; wcMax: number;
  rssMin: number; rssMax: number;
  // Fully-substituted formula strings, e.g. "26.00 − 15.00 − 1.60 − 8.00 = 1.40 mm"
  nominalExpr: string;
  wcExpr: string;
  rssExpr: string;
};

// ===========================================================================
// Math engine — one pure function, shared by the builder and the examples
// ===========================================================================

/** parseFloat that treats blank / invalid entries as 0 so live typing never crashes. */
function num(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function computeStackup(rows: DimRow[]): Computed {
  // Parse each row and attach the sign implied by its direction.
  const parsed = rows.map((r) => {
    const nominalNum = num(r.nominal);
    const tolNum = Math.abs(num(r.tol)); // tolerance magnitude is what matters
    const sign = r.direction === "opens" ? 1 : -1;
    return {
      label: r.label,
      nominalNum,
      tolNum,
      direction: r.direction,
      signedNominal: sign * nominalNum,
    };
  });

  // --- Nominal result: add opening dims, subtract closing dims ---
  const nominal = parsed.reduce((sum, r) => sum + r.signedNominal, 0);

  // --- Worst-case tolerance: sum of absolute tolerances ---
  const wcTol = parsed.reduce((sum, r) => sum + r.tolNum, 0);

  // --- RSS tolerance: square root of the sum of squared tolerances ---
  const sumSquares = parsed.reduce((sum, r) => sum + r.tolNum * r.tolNum, 0);
  const rssTol = Math.sqrt(sumSquares);

  // --- Build the "show your work" substitution strings ---
  // Nominal: "26.00 − 15.00 − 1.60 − 8.00"
  const nominalExpr =
    parsed
      .map((r, i) => {
        const v = r.nominalNum.toFixed(2);
        if (i === 0) return r.direction === "opens" ? v : `−${v}`;
        return `${r.direction === "opens" ? "+" : "−"} ${v}`;
      })
      .join(" ") + ` = ${nominal.toFixed(2)} mm`;

  // Worst-case: "|0.15| + |0.05| + |0.08| + |0.20| = 0.48 mm"
  const wcExpr =
    parsed.map((r) => `|${r.tolNum.toFixed(2)}|`).join(" + ") +
    ` = ${wcTol.toFixed(2)} mm`;

  // RSS: "√(0.15² + 0.05² + 0.08² + 0.20²) = √0.0714 = 0.267 mm"
  const rssExpr =
    `√(${parsed.map((r) => `${r.tolNum.toFixed(2)}²`).join(" + ")})` +
    ` = √${sumSquares.toFixed(4)} = ${rssTol.toFixed(3)} mm`;

  return {
    rows: parsed,
    nominal,
    wcTol,
    rssTol,
    sumSquares,
    wcMin: nominal - wcTol,
    wcMax: nominal + wcTol,
    rssMin: nominal - rssTol,
    rssMax: nominal + rssTol,
    nominalExpr,
    wcExpr,
    rssExpr,
  };
}

// ===========================================================================
// Worked example data (pre-loaded, selectable, populates the builder)
// ===========================================================================

type Example = {
  key: string;
  title: string;
  subtitle: string;
  loopEquation: string;
  /** Name of the resultant, used to label it in the filled-in chain diagram. */
  resultLabel: string;
  interpretation: string;
  rows: Array<{
    label: string;
    nominal: string;
    tol: string;
    direction: Direction;
    reason: string; // why this dimension opens or closes the gap
  }>;
};

const EXAMPLES: Example[] = [
  {
    key: "A",
    title: "Example A — Radar PCB-to-lid clearance",
    subtitle: "Will the tallest component clear the housing lid?",
    loopEquation:
      "Gap = Housing internal depth − Standoff height − PCB thickness − Tallest component height",
    resultLabel: "Gap",
    interpretation:
      "Worst-case minimum (0.92 mm) stays positive, so there is no interference risk even in the extreme case.",
    rows: [
      {
        label: "Housing internal depth",
        nominal: "26.00",
        tol: "0.15",
        direction: "opens",
        reason: "A deeper housing adds space between lid and base, opening the gap.",
      },
      {
        label: "Standoff height",
        nominal: "15.00",
        tol: "0.05",
        direction: "closes",
        reason: "A taller standoff lifts the PCB toward the lid, consuming clearance.",
      },
      {
        label: "PCB thickness",
        nominal: "1.60",
        tol: "0.08",
        direction: "closes",
        reason: "A thicker board pushes its components up, consuming clearance.",
      },
      {
        label: "Tallest component height",
        nominal: "8.00",
        tol: "0.20",
        direction: "closes",
        reason: "A taller component reaches closer to the lid, consuming clearance.",
      },
    ],
  },
  {
    key: "B",
    title: "Example B — Bolted flange thread engagement",
    subtitle: "How much thread is left to engage after the clamped stack?",
    loopEquation:
      "Thread engagement = Bolt effective length − Mast flange − Housing flange − Compressed gasket",
    resultLabel: "Remaining thread engagement",
    interpretation:
      "Even worst-case engagement (9.14 mm) clears a typical 1.5×D minimum guideline for an M6 fastener (~9 mm) — always verify against the actual bolt and tapped-material combination for a real design.",
    rows: [
      {
        label: "Bolt effective length",
        nominal: "25.00",
        tol: "0.10",
        direction: "opens",
        reason: "A longer bolt provides more length available to engage threads, opening the result.",
      },
      {
        label: "Mast flange thickness",
        nominal: "8.00",
        tol: "0.08",
        direction: "closes",
        reason: "Material the bolt passes through before reaching threads, consuming length.",
      },
      {
        label: "Housing flange thickness",
        nominal: "6.00",
        tol: "0.08",
        direction: "closes",
        reason: "More clamped material consumes bolt length before thread engagement.",
      },
      {
        label: "Compressed gasket thickness",
        nominal: "1.50",
        tol: "0.10",
        direction: "closes",
        reason: "The compressed gasket adds to the clamped stack, consuming length.",
      },
    ],
  },
];

// Turn an example's plain rows into builder DimRows with fresh IDs.
function exampleToRows(ex: Example, startId: number): DimRow[] {
  return ex.rows.map((r, i) => ({
    id: startId + i,
    label: r.label,
    nominal: r.nominal,
    tol: r.tol,
    direction: r.direction,
  }));
}

// ===========================================================================
// Page component
// ===========================================================================

export default function ToleranceStackupPage() {
  const [tab, setTab] = useState<"builder" | "learn">("builder");

  // ID counter for new rows (a ref so bumping it never triggers a re-render).
  const nextId = useRef(100);

  // Start with Example A pre-loaded so the builder is immediately illustrative.
  const [rows, setRows] = useState<DimRow[]>(() => exampleToRows(EXAMPLES[0], 1));

  // Recompute the whole analysis whenever the rows change. useMemo avoids
  // redoing the math on unrelated re-renders (like switching tabs).
  const computed = useMemo(() => computeStackup(rows), [rows]);

  // --- Row mutations ---
  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: nextId.current++, label: "", nominal: "", tol: "", direction: "closes" },
    ]);
  }
  function removeRow(id: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }
  function updateRow(id: number, field: keyof DimRow, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  // Load a worked example into the builder and jump to the Builder tab.
  function loadExample(ex: Example) {
    setRows(exampleToRows(ex, nextId.current));
    nextId.current += ex.rows.length;
    setTab("builder");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6"
      >
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-graphite mb-1">Tolerance Stackup Analyzer</h1>
      <p className="text-sm text-graphite/60 mb-6">
        Build a 1-D tolerance chain and see every step of the worst-case and RSS math —
        or switch to the tutorial to learn how stackups work.
      </p>

      {/* ── Tab switcher ── */}
      <div className="flex gap-2 mb-6 border-b border-panel-gray">
        <TabButton active={tab === "builder"} onClick={() => setTab("builder")}>
          Stackup Builder
        </TabButton>
        <TabButton active={tab === "learn"} onClick={() => setTab("learn")}>
          Learn Tolerance Stackups
        </TabButton>
      </div>

      {tab === "builder" ? (
        <BuilderTab
          rows={rows}
          computed={computed}
          onAdd={addRow}
          onRemove={removeRow}
          onUpdate={updateRow}
          onLoadExample={loadExample}
        />
      ) : (
        <LearnTab computed={computed} onLoadExample={loadExample} onGoToBuilder={() => setTab("builder")} />
      )}
    </div>
  );
}

// ===========================================================================
// PART 1 — Builder tab
// ===========================================================================

function BuilderTab({
  rows,
  computed,
  onAdd,
  onRemove,
  onUpdate,
  onLoadExample,
}: {
  rows: DimRow[];
  computed: Computed;
  onAdd: () => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, field: keyof DimRow, value: string) => void;
  onLoadExample: (ex: Example) => void;
}) {
  const interference = computed.wcMin < 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Example loader */}
      <div className="bg-white rounded-lg border border-panel-gray p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-graphite/70">Load a worked example:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.key}
            onClick={() => onLoadExample(ex)}
            className="text-xs bg-instrument-white border border-panel-gray hover:border-steel-blue-line hover:bg-steel-blue-tint text-graphite/70 hover:text-steel-blue-deep px-3 py-1.5 rounded-lg transition-colors"
          >
            {ex.title.replace(/^Example [AB] — /, `Example ${ex.key}: `)}
          </button>
        ))}
      </div>

      {/* Dimension chain table */}
      <div className="bg-white rounded-lg border border-panel-gray p-5">
        <h2 className="text-sm font-semibold text-graphite/80 mb-3">
          Dimension Loop <span className="font-normal text-graphite/50">({rows.length} dimensions)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-xs text-graphite/50 border-b border-panel-gray text-left">
                <th className="pb-2 pr-2 w-6">#</th>
                <th className="pb-2 pr-2">Label</th>
                <th className="pb-2 pr-2 w-24">Nominal (mm)</th>
                <th className="pb-2 pr-2 w-24">± Tol (mm)</th>
                <th className="pb-2 pr-2 w-40">Direction</th>
                <th className="pb-2 w-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-gray">
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="py-1.5 pr-2 text-graphite/50 text-xs">{i + 1}</td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="text"
                      value={r.label}
                      onChange={(e) => onUpdate(r.id, "label", e.target.value)}
                      placeholder="e.g. Standoff height"
                      className="w-full border border-panel-gray rounded px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={r.nominal}
                      onChange={(e) => onUpdate(r.id, "nominal", e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-panel-gray rounded px-2 py-1 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={r.tol}
                      onChange={(e) => onUpdate(r.id, "tol", e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-panel-gray rounded px-2 py-1 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    {/* Direction select — opens (+) grows the gap, closes (−) shrinks it */}
                    <select
                      value={r.direction}
                      onChange={(e) => onUpdate(r.id, "direction", e.target.value)}
                      className={`w-full border rounded px-2 py-1 text-xs bg-white ${
 r.direction === "opens"
 ? "border-steel-blue-line text-steel-blue-deep"
 : "border-signal-amber-line text-signal-amber-deep"
 }`}
                    >
                      <option value="opens">Opens gap (+)</option>
                      <option value="closes">Closes gap (−)</option>
                    </select>
                  </td>
                  <td className="py-1.5 text-center">
                    <button
                      onClick={() => onRemove(r.id)}
                      disabled={rows.length <= 1}
                      className="text-graphite/30 hover:text-signal-red disabled:opacity-20 text-lg leading-none px-1 transition-colors"
                      title="Remove dimension"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={onAdd}
          className="mt-3 text-sm text-steel-blue hover:text-steel-blue-deep font-medium transition-colors"
        >
          + Add dimension
        </button>
      </div>

      {/* Dimension chain diagram */}
      <div className="bg-white rounded-lg border border-panel-gray p-5">
        <h2 className="text-sm font-semibold text-graphite/80 mb-3">Dimension Chain</h2>
        <StackupChainDiagram computed={computed} />
      </div>

      {/* Live "show your work" panel */}
      <ShowYourWork computed={computed} />

      {/* Output card */}
      <OutputCard computed={computed} interference={interference} />
    </div>
  );
}

/** The live formula-substitution panel — updates on every keystroke. */
function ShowYourWork({ computed }: { computed: Computed }) {
  return (
    <div className="bg-graphite rounded-lg p-5 text-instrument-white">
      <h2 className="text-sm font-semibold text-graphite/30 mb-3 flex items-center gap-2">
        <span>📝</span> Show your work
        <span className="text-xs font-normal text-graphite/60">(updates live)</span>
      </h2>
      <div className="flex flex-col gap-4 font-mono text-xs sm:text-sm">
        <WorkLine label="Nominal result" expr={computed.nominalExpr} accent="text-phosphor-green-line" />
        <WorkLine label="Worst-case tolerance" expr={computed.wcExpr} accent="text-signal-red-line" />
        <WorkLine label="RSS tolerance" expr={computed.rssExpr} accent="text-steel-blue-tint" />
      </div>
    </div>
  );
}

function WorkLine({ label, expr, accent }: { label: string; expr: string; accent: string }) {
  return (
    <div>
      <p className="text-graphite/60 text-xs mb-1">{label}</p>
      <p className={`${accent} break-words leading-relaxed`}>{expr}</p>
    </div>
  );
}

/** The final results: nominal, worst-case range, RSS range, with interference flag. */
function OutputCard({ computed, interference }: { computed: Computed; interference: boolean }) {
  return (
    <div
      className={`rounded-lg border p-5 ${
 interference ? "bg-signal-red-tint border-signal-red-line" : "bg-steel-blue-tint border-steel-blue-line"
 }`}
    >
      <h2 className="text-base font-semibold text-graphite mb-4">Result</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Nominal */}
        <div className="bg-white rounded-lg border border-panel-gray px-4 py-3 text-center">
          <p className="text-xs text-graphite/60 font-medium mb-1">Nominal</p>
          <p className="text-2xl font-bold text-graphite">{computed.nominal.toFixed(2)}</p>
          <p className="text-xs text-graphite/50">mm</p>
        </div>

        {/* Worst-case range */}
        <div className="bg-white rounded-lg border border-signal-red-line px-4 py-3 text-center">
          <p className="text-xs text-signal-red font-medium mb-1">Worst-case ± {computed.wcTol.toFixed(2)}</p>
          <p className="text-lg font-bold text-graphite">
            {computed.wcMin.toFixed(2)} – {computed.wcMax.toFixed(2)}
          </p>
          <p className="text-xs text-graphite/50">mm (arithmetic)</p>
        </div>

        {/* RSS range */}
        <div className="bg-white rounded-lg border border-steel-blue-line px-4 py-3 text-center">
          <p className="text-xs text-steel-blue font-medium mb-1">RSS ± {computed.rssTol.toFixed(3)}</p>
          <p className="text-lg font-bold text-graphite">
            {computed.rssMin.toFixed(2)} – {computed.rssMax.toFixed(2)}
          </p>
          <p className="text-xs text-graphite/50">mm (statistical)</p>
        </div>
      </div>

      {/* Interference flag */}
      {interference ? (
        <p className="mt-4 text-sm text-signal-red-deep bg-signal-red-tint rounded-lg px-3 py-2 font-medium">
          ⚠ Worst-case minimum is {computed.wcMin.toFixed(2)} mm (negative) — possible interference.
          The parts may not assemble in the extreme case. Tighten tolerances or increase the nominal gap.
        </p>
      ) : (
        <p className="mt-4 text-sm text-phosphor-green-deep bg-phosphor-green-tint rounded-lg px-3 py-2">
          ✓ Worst-case minimum is {computed.wcMin.toFixed(2)} mm (positive) — clearance is maintained even
          in the extreme case.
        </p>
      )}
    </div>
  );
}

// ===========================================================================
// Dimension chain SVG diagram (reactive)
// ===========================================================================

/**
 * Draws the loop as a labeled bar chart:
 *   - Blue bars, arrowhead pointing right  = opening dimensions (+)
 *   - Amber bars, arrowhead pointing left  = closing dimensions (−)
 *   - Green bar at the bottom               = the resultant gap
 * Bar length is proportional to each nominal value, so relative sizes are visible.
 */
function StackupChainDiagram({ computed }: { computed: Computed }) {
  const rows = computed.rows.filter((r) => r.nominalNum !== 0 || r.label.trim() !== "");

  if (rows.length === 0) {
    return (
      <div className="min-h-[120px] flex items-center justify-center text-graphite/50 text-sm border border-dashed border-panel-gray rounded-lg">
        Add a dimension to see the chain
      </div>
    );
  }

  // Layout constants (SVG user units)
  const W = 640;
  const labelW = 165;   // left column reserved for text labels
  const valueW = 74;    // right column reserved for value text
  const rowH = 32;
  const top = 12;
  const chartW = W - labelW - valueW;

  // Scale so the largest magnitude fills the available width.
  const maxNom = Math.max(
    ...rows.map((r) => Math.abs(r.nominalNum)),
    Math.abs(computed.nominal),
    1
  );
  const scale = chartW / maxNom;

  const resultY = top + rows.length * rowH + 22;
  const H = resultY + rowH;

  const gapPositive = computed.nominal >= 0;
  const gapColor = gapPositive ? "#4B7B4E" : "#9B3B3E";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Each dimension row */}
      {rows.map((r, i) => {
        const y = top + i * rowH + rowH / 2;
        const barLen = Math.max(Math.abs(r.nominalNum) * scale, 3);
        const opens = r.direction === "opens";
        const color = opens ? "#2B4C7E" : "#A17D36";
        const x0 = labelW;

        return (
          <g key={i}>
            {/* Label (truncated by the fixed column width) */}
            <text x={4} y={y + 4} fontSize={11} fill="#1A1D21">
              {truncate(r.label || `Dim ${i + 1}`, 24)}
            </text>
            {/* Bar */}
            <rect x={x0} y={y - 5} width={barLen} height={10} rx={2} fill={color} fillOpacity={0.75} />
            {/* Direction arrowhead: right for opening, left for closing */}
            {opens ? (
              <polygon
                points={`${x0 + barLen},${y} ${x0 + barLen - 7},${y - 5} ${x0 + barLen - 7},${y + 5}`}
                fill={color}
              />
            ) : (
              <polygon points={`${x0},${y} ${x0 + 7},${y - 5} ${x0 + 7},${y + 5}`} fill={color} />
            )}
            {/* Value + sign */}
            <text x={x0 + barLen + 8} y={y + 4} fontSize={11} fill="#5F6164" fontFamily="monospace">
              {opens ? "+" : "−"}
              {Math.abs(r.nominalNum).toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* Divider before the resultant */}
      <line x1={labelW} y1={resultY - 14} x2={W - 8} y2={resultY - 14} stroke="#E7EAEC" strokeWidth={1} />

      {/* Resultant gap bar (green if positive, red if negative) */}
      <text x={4} y={resultY + rowH / 2 + 4} fontSize={11} fontWeight={700} fill="#1A1D21">
        Resultant gap
      </text>
      <rect
        x={labelW}
        y={resultY + rowH / 2 - 6}
        width={Math.max(Math.abs(computed.nominal) * scale, 3)}
        height={12}
        rx={2}
        fill={gapColor}
        fillOpacity={0.85}
      />
      <text
        x={labelW + Math.max(Math.abs(computed.nominal) * scale, 3) + 8}
        y={resultY + rowH / 2 + 4}
        fontSize={12}
        fontWeight={700}
        fontFamily="monospace"
        fill={gapColor}
      >
        {computed.nominal.toFixed(2)} mm
      </text>

      {/* Legend */}
      <g fontSize={9.5} fill="#98999B">
        <rect x={labelW} y={0} width={10} height={7} fill="#2B4C7E" fillOpacity={0.75} rx={1} />
        <text x={labelW + 14} y={7}>opens (+)</text>
        <rect x={labelW + 78} y={0} width={10} height={7} fill="#A17D36" fillOpacity={0.75} rx={1} />
        <text x={labelW + 92} y={7}>closes (−)</text>
      </g>
    </svg>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// ===========================================================================
// PART 2 — Learn tab
// ===========================================================================

function LearnTab({
  computed,
  onLoadExample,
  onGoToBuilder,
}: {
  computed: Computed;
  onLoadExample: (ex: Example) => void;
  onGoToBuilder: () => void;
}) {
  // Which worked example is expanded in the solution panel.
  const [selectedKey, setSelectedKey] = useState(EXAMPLES[0].key);
  const selected = EXAMPLES.find((e) => e.key === selectedKey) ?? EXAMPLES[0];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Plain-language explainer (pancake analogy) */}
      <section className="bg-white rounded-lg border border-panel-gray p-6">
        <h2 className="text-lg font-semibold text-graphite mb-3">🥞 The pancake analogy</h2>
        <div className="text-sm text-graphite/70 leading-relaxed space-y-3">
          <p>
            Imagine stacking pancakes, each meant to be the same thickness but each actually a little
            thicker or thinner than the target. You want to know how tall the finished stack will be.
          </p>
          <p>
            If <strong>every</strong> pancake happened to come out at its <em>thickest</em> allowed
            value at the same time, the stack reaches its absolute maximum height. That is the{" "}
            <strong className="text-signal-red">worst case</strong> — you just add up every tolerance,
            because they all push the same direction at once.
          </p>
          <p>
            But in reality, some pancakes are thick and some are thin, and they tend to partly cancel
            out. It is very unlikely that all of them hit their extreme in the same direction. So the
            <em> typical</em> spread of the finished stack is noticeably smaller. That smaller,
            realistic spread is the <strong className="text-steel-blue">RSS</strong> (root-sum-square)
            estimate — valid when each tolerance is an independent, roughly normally distributed
            variable.
          </p>
        </div>
      </section>

      {/* 2. Method comparison + bar chart */}
      <section className="bg-white rounded-lg border border-panel-gray p-6">
        <h2 className="text-lg font-semibold text-graphite mb-4">Worst-case vs. RSS</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-signal-red-line bg-signal-red-tint p-4">
            <p className="text-sm font-semibold text-signal-red-deep mb-1">Worst-Case (Arithmetic)</p>
            <p className="font-mono text-sm text-signal-red-deep mb-2">T = Σ |Tᵢ|</p>
            <p className="text-xs text-signal-red-deep/80 leading-relaxed">
              Guarantees the bound no matter which direction each dimension lands. Simple and safe —
              but gets <strong>overly conservative</strong> as the chain grows longer, since it
              assumes every part hits its extreme simultaneously.
            </p>
          </div>
          <div className="rounded-lg border border-steel-blue-line bg-steel-blue-tint p-4">
            <p className="text-sm font-semibold text-steel-blue-deep mb-1">RSS (Statistical)</p>
            <p className="font-mono text-sm text-steel-blue-deep mb-2">T = √(Σ Tᵢ²)</p>
            <p className="text-xs text-steel-blue-deep/80 leading-relaxed">
              Assumes independent, normally distributed tolerances (the standard ASME Y14.5
              statistical tolerancing assumption). <strong>Less conservative</strong> and standard for
              longer, high-part-count chains where extremes rarely align.
            </p>
          </div>
        </div>

        {/* Live bar chart comparing band widths for the currently-loaded example */}
        <BandComparison computed={computed} />
      </section>

      {/* 3. Worked examples */}
      <section className="bg-white rounded-lg border border-panel-gray p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-graphite">Worked examples</h2>
          {/* Dropdown selects which solution to show */}
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="border border-graphite/20 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            {EXAMPLES.map((ex) => (
              <option key={ex.key} value={ex.key}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>

        <WorkedExample example={selected} onLoad={() => onLoadExample(selected)} />
      </section>

      {/* 4. Try-it-yourself callout */}
      <section className="bg-steel-blue-tint border border-steel-blue-line rounded-lg p-6 text-center">
        <h2 className="text-base font-semibold text-steel-blue-deep mb-1">Try it yourself</h2>
        <p className="text-sm text-steel-blue-deep mb-4 max-w-lg mx-auto">
          Load Example A into the builder, then change any nominal, tolerance, or direction and watch
          the worst-case and RSS results update live.
        </p>
        <button
          onClick={() => {
            onLoadExample(EXAMPLES[0]);
            onGoToBuilder();
          }}
          className="bg-steel-blue hover:bg-steel-blue-deep text-white font-semibold text-sm py-2.5 px-5 rounded-lg transition-colors"
        >
          Open Example A in the builder →
        </button>
      </section>
    </div>
  );
}

/** Two horizontal bars comparing the total tolerance band width (worst-case vs RSS). */
function BandComparison({ computed }: { computed: Computed }) {
  const wcWidth = computed.wcTol * 2; // full band = ± tolerance
  const rssWidth = computed.rssTol * 2;
  const max = Math.max(wcWidth, rssWidth, 0.0001);
  const wcPct = (wcWidth / max) * 100;
  const rssPct = (rssWidth / max) * 100;
  const reduction = wcWidth > 0 ? ((1 - rssWidth / wcWidth) * 100) : 0;

  return (
    <div>
      <p className="text-xs text-graphite/60 mb-3">
        Total tolerance band width for the currently-loaded chain (smaller is tighter):
      </p>
      <div className="space-y-3">
        {/* Worst-case bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-signal-red font-medium">Worst-case band</span>
            <span className="text-graphite/60 font-mono">±{computed.wcTol.toFixed(3)} → {wcWidth.toFixed(3)} mm wide</span>
          </div>
          <div className="h-5 bg-panel-gray rounded-md overflow-hidden">
            <div className="h-full bg-signal-red rounded-md transition-all" style={{ width: `${wcPct}%` }} />
          </div>
        </div>
        {/* RSS bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-steel-blue font-medium">RSS band</span>
            <span className="text-graphite/60 font-mono">±{computed.rssTol.toFixed(3)} → {rssWidth.toFixed(3)} mm wide</span>
          </div>
          <div className="h-5 bg-panel-gray rounded-md overflow-hidden">
            <div className="h-full bg-steel-blue rounded-md transition-all" style={{ width: `${rssPct}%` }} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-graphite/60">
        For this chain, RSS is{" "}
        <strong className="text-steel-blue">{reduction.toFixed(0)}% narrower</strong> than worst-case.
      </p>
    </div>
  );
}

/** Full step-by-step solution for one worked example, generated by the shared engine. */
function WorkedExample({ example, onLoad }: { example: Example; onLoad: () => void }) {
  // Reuse the exact same math engine so the displayed steps match the builder.
  const rows: DimRow[] = example.rows.map((r, i) => ({
    id: i,
    label: r.label,
    nominal: r.nominal,
    tol: r.tol,
    direction: r.direction,
  }));
  const c = computeStackup(rows);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-graphite/60">{example.subtitle}</p>

      {/* Loop equation */}
      <div className="bg-instrument-white border border-panel-gray rounded-lg px-4 py-3">
        <p className="text-xs text-graphite/50 mb-1">Loop equation</p>
        <p className="text-sm font-mono text-graphite/80 leading-relaxed">{example.loopEquation}</p>
      </div>

      {/*
        This example's chain, drawn to scale with its real numbers. Split the
        rows by direction: exactly one dimension opens the gap (it becomes the
        full-width span) and the rest close it. `c.nominal` is the resultant
        straight from the shared engine, so the picture can never drift out of
        step with the arithmetic shown below it.
      */}
      <div className="border border-panel-gray rounded-lg px-4 pt-3 pb-4">
        <p className="text-xs text-graphite/50 mb-2">Dimension chain (to scale)</p>
        <ExampleChainDiagram
          opener={(() => {
            const o = example.rows.find((r) => r.direction === "opens")!;
            return { label: o.label, value: num(o.nominal) };
          })()}
          closers={example.rows
            .filter((r) => r.direction === "closes")
            .map((r) => ({ label: r.label, value: num(r.nominal) }))}
          result={{ label: example.resultLabel, value: c.nominal }}
        />
      </div>

      {/* Why each dimension is + or − */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-xs text-graphite/50 border-b border-panel-gray text-left">
              <th className="pb-2 pr-3">Dimension</th>
              <th className="pb-2 pr-3 w-20">Nominal</th>
              <th className="pb-2 pr-3 w-16">± Tol</th>
              <th className="pb-2 pr-3 w-28">Direction</th>
              <th className="pb-2">Why</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-gray">
            {example.rows.map((r, i) => (
              <tr key={i}>
                <td className="py-2 pr-3 text-graphite/80">{r.label}</td>
                <td className="py-2 pr-3 font-mono text-xs text-graphite/70">{r.nominal}</td>
                <td className="py-2 pr-3 font-mono text-xs text-graphite/70">±{r.tol}</td>
                <td className="py-2 pr-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
 r.direction === "opens"
 ? "bg-steel-blue-tint text-steel-blue-deep"
 : "bg-signal-amber-tint text-signal-amber-deep"
 }`}
                  >
                    {r.direction === "opens" ? "Opens (+)" : "Closes (−)"}
                  </span>
                </td>
                <td className="py-2 text-xs text-graphite/60 leading-relaxed">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Full substitution steps (same engine as the builder) */}
      <div className="bg-graphite rounded-lg p-4 text-instrument-white font-mono text-xs sm:text-sm flex flex-col gap-3">
        <div>
          <p className="text-graphite/60 text-xs mb-1">Nominal</p>
          <p className="text-phosphor-green-line break-words">{c.nominalExpr}</p>
        </div>
        <div>
          <p className="text-graphite/60 text-xs mb-1">Worst-case tolerance</p>
          <p className="text-signal-red-line break-words">{c.wcExpr}</p>
        </div>
        <div>
          <p className="text-graphite/60 text-xs mb-1">RSS tolerance</p>
          <p className="text-steel-blue-tint break-words">{c.rssExpr}</p>
        </div>
      </div>

      {/* Ranges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-signal-red-line bg-signal-red-tint px-4 py-3">
          <p className="text-xs text-signal-red font-medium mb-0.5">Worst-case range</p>
          <p className="text-sm font-bold text-graphite">
            {c.nominal.toFixed(2)} ± {c.wcTol.toFixed(2)} mm
          </p>
          <p className="text-xs text-graphite/60 font-mono">
            {c.wcMin.toFixed(2)} to {c.wcMax.toFixed(2)} mm
          </p>
        </div>
        <div className="rounded-lg border border-steel-blue-line bg-steel-blue-tint px-4 py-3">
          <p className="text-xs text-steel-blue font-medium mb-0.5">RSS range</p>
          <p className="text-sm font-bold text-graphite">
            {c.nominal.toFixed(2)} ± {c.rssTol.toFixed(3)} mm
          </p>
          <p className="text-xs text-graphite/60 font-mono">
            {c.rssMin.toFixed(2)} to {c.rssMax.toFixed(2)} mm
          </p>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-signal-amber-tint border border-signal-amber-line rounded-lg px-4 py-3 text-sm text-signal-amber-deep">
        <strong>Interpretation:</strong> {example.interpretation}
      </div>

      {/* Cross-links for Example B */}
      {example.key === "B" && (
        <p className="text-xs text-graphite/50">
          Related tools:{" "}
          <Link href="/calculators/bolt-torque" className="text-steel-blue hover:underline">
            Bolt Torque
          </Link>{" "}
          ·{" "}
          <Link href="/calculators/base-plate" className="text-steel-blue hover:underline">
            Base Plate Bolts
          </Link>
        </p>
      )}

      <div>
        <button
          onClick={onLoad}
          className="text-sm text-steel-blue hover:text-steel-blue-deep font-medium transition-colors"
        >
          Load this example into the builder →
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Small shared UI
// ===========================================================================

function TabButton({
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
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
 active
 ? "border-steel-blue-deep text-steel-blue"
 : "border-transparent text-graphite/60 hover:text-graphite/80"
 }`}
    >
      {children}
    </button>
  );
}
