"use client";

/**
 * Mechanisms & Design Reference — /mechanisms-reference
 *
 * A mix of reference tables and small calculators, organised into tabs the same
 * way the DFM hub is. Two of the tabs compute (gear trains, Grashof), one is
 * half table and half calculator (threads), and the rest are reference.
 *
 * Static content lives in src/lib/mechanisms-data.ts. The formulas live in the
 * panel that owns them, right next to the UI that shows their working — a
 * reader should be able to see the inputs, the arithmetic, and the answer
 * without jumping between files.
 *
 * Tables, tabs, headings and link lists come from src/components/ui/, shared
 * with the DFM Reference Hub.
 */

import Link from "next/link";
import { useState } from "react";

import DataTable from "@/components/ui/DataTable";
import ResourceList from "@/components/ui/ResourceList";
import SectionHeading from "@/components/ui/SectionHeading";
import TabButton from "@/components/ui/TabButton";

import FourBarDiagram from "@/components/mechanisms/FourBarDiagram";
import GearPairDiagram from "@/components/mechanisms/GearPairDiagram";
import OrientationDiagram from "@/components/mechanisms/OrientationDiagram";
import SurfaceProfileDiagram from "@/components/mechanisms/SurfaceProfileDiagram";
import ThreadEngagementDiagram from "@/components/mechanisms/ThreadEngagementDiagram";
import WeldSymbolDiagram from "@/components/mechanisms/WeldSymbolDiagram";

import {
  ASSEMBLY_CHECKLIST,
  BOLT_CLASSES,
  ENGAGEMENT_RULES,
  MECHANISMS_INTRO,
  MECHANISM_RESOURCES,
  METRIC_THREADS,
  SURFACE_FINISHES,
  SURFACE_SEAL_CALLOUT,
  THREAD_TABLE_NOTE,
  WELD_SYMBOLS,
  type BoltClass,
  type TappedMaterial,
} from "@/lib/mechanisms-data";

// ─── Shared bits ─────────────────────────────────────────────────────────────

/**
 * Tab labels are kept short deliberately. Seven full titles
 * ("Four-Bar Linkages", "Threads & Fasteners", …) overflow the max-w-4xl
 * container, which pushes the last tab off-screen behind a horizontal scroll
 * where nobody finds it. The fuller descriptions live on the Overview tab.
 */
const TABS = [
  { key: "overview", icon: "📚", label: "Overview", full: "Overview & resources" },
  { key: "gears", icon: "⚙️", label: "Gear Trains", full: "Gear train ratio" },
  { key: "fourbar", icon: "🔗", label: "Four-Bar", full: "Four-bar linkages" },
  { key: "threads", icon: "🔩", label: "Threads", full: "Threads & fasteners" },
  { key: "surface", icon: "🪞", label: "Surface Finish", full: "Surface finish (Ra)" },
  { key: "welds", icon: "🔥", label: "Welds", full: "Weld symbols" },
  { key: "assembly", icon: "🧰", label: "Assembly", full: "Assembly DFM" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Parses a numeric field, returning null for blank or nonsense input. */
function num(s: string): number | null {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

/** Shared input styling, matching the calculators elsewhere in the app. */
const INPUT_CLASS =
  "w-full border border-graphite/20 rounded-lg px-3 py-2 text-sm  ";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-graphite/70 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-graphite/50 mt-1">{hint}</span>}
    </label>
  );
}

/** Amber "this is a rule of thumb" strip, used under several panels. */
function Caveat({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start bg-signal-amber-tint border border-signal-amber-line rounded-lg px-4 py-3">
      <span className="text-base leading-none mt-0.5">⚠️</span>
      <p className="text-xs text-signal-amber-deep leading-relaxed">{children}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════

export default function MechanismsReferencePage() {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6"
      >
        ← Back to all calculators
      </Link>

      <h1 className="text-2xl font-bold text-graphite mb-1">Mechanisms &amp; Design Reference</h1>
      <p className="text-sm text-graphite/60 mb-6">
        Motion building blocks, thread and finish standards, and the design conventions
        that decide whether a part can actually be made and assembled.
      </p>

      <div className="flex gap-1 mb-6 border-b border-panel-gray overflow-x-auto" role="tablist">
        {TABS.map(t => (
          <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
          </TabButton>
        ))}
      </div>

      {tab === "overview" && <OverviewPanel />}
      {tab === "gears" && <GearTrainPanel />}
      {tab === "fourbar" && <FourBarPanel />}
      {tab === "threads" && <ThreadsPanel />}
      {tab === "surface" && <SurfacePanel />}
      {tab === "welds" && <WeldPanel />}
      {tab === "assembly" && <AssemblyPanel />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Overview
// ═══════════════════════════════════════════════════════════════════════════

function OverviewPanel() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="bg-white rounded-lg border border-panel-gray p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl leading-none">📚</span>
            <h2 className="text-lg font-semibold text-graphite">Mechanisms Library</h2>
          </div>
          <p className="text-sm text-graphite/70 leading-relaxed">{MECHANISMS_INTRO}</p>
        </div>
      </section>

      <section>
        <SectionHeading>Where to explore further</SectionHeading>
        <ResourceList resources={MECHANISM_RESOURCES} />
      </section>

      <section>
        <SectionHeading>What&apos;s in this section</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TABS.filter(t => t.key !== "overview").map(t => (
            <div
              key={t.key}
              className="bg-white rounded-lg border border-panel-gray px-4 py-3 flex items-start gap-2.5"
            >
              <span className="text-base leading-none mt-0.5">{t.icon}</span>
              <div>
                <div className="text-sm font-medium text-graphite">{t.full}</div>
                <div className="text-xs text-graphite/60 leading-snug">{TAB_BLURBS[t.key]}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const TAB_BLURBS: Record<Exclude<TabKey, "overview">, string> = {
  gears: "Ratio, speed and torque through a single pair or a compound train.",
  fourbar: "Grashof test — will a motor drive it, or does it only rock?",
  threads: "Metric coarse thread table plus minimum engagement length.",
  surface: "Ra levels, what process gets you there, and what needs which.",
  welds: "Reading the symbols you'll actually meet on a fabrication drawing.",
  assembly: "Checklist for designing an assembly that goes together right.",
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. Gear trains
// ═══════════════════════════════════════════════════════════════════════════

type Stage = { id: number; n1: string; n2: string };

function GearTrainPanel() {
  const [stages, setStages] = useState<Stage[]>([{ id: 1, n1: "12", n2: "36" }]);
  const [rpm, setRpm] = useState("1500");
  const [torque, setTorque] = useState("2.5");
  const nextId = useState({ current: 2 })[0];

  function addStage() {
    setStages(s => [...s, { id: nextId.current++, n1: "20", n2: "40" }]);
  }
  function removeStage(id: number) {
    setStages(s => (s.length > 1 ? s.filter(r => r.id !== id) : s));
  }
  function update(id: number, key: "n1" | "n2", value: string) {
    setStages(s => s.map(r => (r.id === id ? { ...r, [key]: value } : r)));
  }

  // ── The maths ──
  // Each stage's ratio is N2/N1. A compound train multiplies them, because each
  // stage's OUTPUT shaft is the next stage's INPUT shaft.
  const parsed = stages.map(s => {
    const n1 = num(s.n1);
    const n2 = num(s.n2);
    const ok = n1 !== null && n2 !== null && n1 > 0 && n2 > 0;
    return { ...s, n1v: n1 ?? 0, n2v: n2 ?? 0, ok, ratio: ok ? n2! / n1! : null };
  });

  const allOk = parsed.every(p => p.ok);
  const overall = allOk ? parsed.reduce((acc, p) => acc * (p.ratio as number), 1) : null;

  const rpmIn = num(rpm);
  const torqueIn = num(torque);

  // Speed divides by the ratio, torque multiplies by it — power in = power out
  // in the ideal case, which is exactly what "frictionless" means here.
  const rpmOut = overall !== null && rpmIn !== null ? rpmIn / overall : null;
  const torqueOut = overall !== null && torqueIn !== null ? torqueIn * overall : null;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="bg-white rounded-lg border border-panel-gray p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl leading-none">⚙️</span>
            <h2 className="text-lg font-semibold text-graphite">Gear Train Ratio</h2>
          </div>
          <p className="text-sm text-graphite/70 leading-relaxed">
            A gear pair trades speed for torque in exact proportion. Reduce the speed by
            3× and you multiply the torque by 3× — the power passing through is
            unchanged. Chaining stages multiplies their ratios, which is how a small
            motor ends up turning something very slowly and very hard.
          </p>
        </div>
      </section>

      {/* ── Inputs ── */}
      <section>
        <SectionHeading>Train</SectionHeading>
        <div className="bg-white rounded-lg border border-panel-gray p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Input speed (RPM)">
              <input
                type="number" inputMode="decimal" value={rpm}
                onChange={e => setRpm(e.target.value)} className={INPUT_CLASS}
              />
            </Field>
            <Field label="Input torque (N·m)" hint="Optional — leave blank to skip torque.">
              <input
                type="number" inputMode="decimal" value={torque}
                onChange={e => setTorque(e.target.value)} className={INPUT_CLASS}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            {parsed.map((s, i) => (
              <div key={s.id} className="flex items-end gap-3 flex-wrap">
                <span className="text-xs font-semibold text-graphite/50 w-14 pb-2.5">
                  Stage {i + 1}
                </span>
                <div className="w-28">
                  <Field label="Driver N₁">
                    <input
                      type="number" inputMode="numeric" value={s.n1}
                      onChange={e => update(s.id, "n1", e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>
                <div className="w-28">
                  <Field label="Driven N₂">
                    <input
                      type="number" inputMode="numeric" value={s.n2}
                      onChange={e => update(s.id, "n2", e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>
                <span className="text-sm font-mono text-graphite/70 pb-2.5">
                  {s.ratio !== null ? `${s.ratio.toFixed(3)} : 1` : "—"}
                </span>
                {stages.length > 1 && (
                  <button
                    onClick={() => removeStage(s.id)}
                    className="text-xs text-graphite/50 hover:text-signal-red pb-2.5 transition-colors"
                    aria-label={`Remove stage ${i + 1}`}
                  >
                    remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addStage}
            className="self-start text-xs bg-instrument-white border border-panel-gray hover:border-steel-blue-line hover:bg-steel-blue-tint text-graphite/70 hover:text-steel-blue-deep px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add Stage
          </button>
        </div>
      </section>

      {/* ── Results ── */}
      {allOk && overall !== null && (
        <section>
          <SectionHeading>Result</SectionHeading>
          <div className="bg-steel-blue-tint border border-steel-blue-line rounded-lg p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <Stat label="Overall ratio" value={`${overall.toFixed(3)} : 1`} big />
              <Stat
                label="Output speed"
                value={rpmOut !== null ? `${rpmOut.toFixed(1)} RPM` : "—"}
              />
              <Stat
                label="Output torque"
                value={torqueOut !== null ? `${torqueOut.toFixed(2)} N·m` : "—"}
              />
            </div>

            {/* Show the working, the way the tolerance stackup page does */}
            <div className="bg-white rounded-lg border border-steel-blue-line px-4 py-3 text-xs font-mono text-graphite/70 leading-relaxed">
              <div>
                overall ratio ={" "}
                {parsed.map(p => `(${p.n2v}/${p.n1v})`).join(" × ")} = {overall.toFixed(4)}
              </div>
              {rpmIn !== null && (
                <div>
                  output speed = {rpmIn} ÷ {overall.toFixed(4)} = {rpmOut!.toFixed(2)} RPM
                </div>
              )}
              {torqueIn !== null && (
                <div>
                  output torque = {torqueIn} × {overall.toFixed(4)} = {torqueOut!.toFixed(3)} N·m
                </div>
              )}
            </div>

            <p className="text-xs text-steel-blue-deep mt-3">
              {overall > 1
                ? `Reduction — output turns ${overall.toFixed(2)}× slower and ${overall.toFixed(2)}× harder than the input.`
                : overall < 1
                  ? `Overdrive — output turns ${(1 / overall).toFixed(2)}× faster with ${(1 / overall).toFixed(2)}× less torque.`
                  : "1:1 — direction reverses each mesh, but speed and torque are unchanged."}
            </p>
          </div>
        </section>
      )}

      {/* ── Diagrams, one per stage ── */}
      <section>
        <SectionHeading>Train layout</SectionHeading>
        <div className="bg-white rounded-lg border border-panel-gray p-4">
          <div className="flex flex-wrap items-center gap-2">
            {parsed.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                {i > 0 && (
                  <div className="flex flex-col items-center text-graphite/50 shrink-0 px-1">
                    <span className="text-lg leading-none">⇢</span>
                    <span className="text-[9px] leading-tight text-center">
                      shared
                      <br />
                      shaft
                    </span>
                  </div>
                )}
                <div className="w-[210px] shrink-0">
                  {s.ok ? (
                    <GearPairDiagram
                      n1={s.n1v}
                      n2={s.n2v}
                      stage={i + 1}
                      /* Every external mesh reverses direction, so the driver of
                         each successive stage spins opposite the last one. */
                      driverClockwise={i % 2 === 0}
                    />
                  ) : (
                    <div className="h-32 flex items-center justify-center text-xs text-graphite/50 border border-dashed border-panel-gray rounded-lg">
                      Enter tooth counts
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-graphite/60 mt-3 pt-3 border-t border-panel-gray leading-relaxed">
            Pitch radius is drawn proportional to tooth count. Each stage&apos;s driven gear
            shares a shaft with the next stage&apos;s driver, so its speed carries forward
            while the ratios multiply. Note the arrows: an external mesh reverses
            direction every stage.
          </p>
        </div>
      </section>

      <Caveat>
        <strong>Ideal / frictionless.</strong> Real trains lose roughly 2–5% per stage to
        friction and mesh inefficiency, so actual output torque will be below the figure
        above and the loss compounds across stages. Spur and helical gears sit at the good
        end of that band; worm drives are far worse.
      </Caveat>
    </div>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-steel-blue-line px-4 py-3 text-center">
      <div className="text-xs text-graphite/50 mb-0.5">{label}</div>
      <div className={`font-bold text-steel-blue-deep ${big ? "text-xl" : "text-base"}`}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Four-bar / Grashof
// ═══════════════════════════════════════════════════════════════════════════

type GrashofClass =
  | "double-crank"
  | "crank-rocker"
  | "double-rocker"
  | "triple-rocker"
  | "change-point";

const GRASHOF_COPY: Record<GrashofClass, { title: string; plain: string; driveable: boolean }> = {
  "double-crank": {
    title: "Grashof — double-crank (drag link)",
    plain:
      "Both the input and output links rotate all the way round. A motor can drive either one continuously.",
    driveable: true,
  },
  "crank-rocker": {
    title: "Grashof — crank-rocker",
    plain:
      "The short link rotates continuously while the opposite link rocks back and forth. This is the classic motor-driven linkage — a motor can continuously drive this.",
    driveable: true,
  },
  "double-rocker": {
    title: "Grashof — double-rocker",
    plain:
      "The coupler rotates fully, but neither link attached to ground does. A motor cannot drive the input link round; both grounded links only rock.",
    driveable: false,
  },
  "triple-rocker": {
    title: "Non-Grashof — triple-rocker",
    plain:
      "No link rotates fully. This linkage only rocks back and forth — you cannot drive it with a continuously rotating motor without adding a slider or reworking the lengths.",
    driveable: false,
  },
  "change-point": {
    title: "Change-point mechanism",
    plain:
      "Borderline case: S + L exactly equals P + Q. The links become collinear at certain positions, where the mechanism can lock or flip unpredictably into either branch. Avoid designing here — nudge a length.",
    driveable: false,
  },
};

function FourBarPanel() {
  const [l1, setL1] = useState("100"); // ground
  const [l2, setL2] = useState("40");  // input
  const [l3, setL3] = useState("95");  // coupler
  const [l4, setL4] = useState("75");  // output

  const vals = [num(l1), num(l2), num(l3), num(l4)];
  const ok = vals.every(v => v !== null && v > 0);
  const [g, a, b, c] = vals as number[];

  let result: {
    S: number; L: number; P: number; Q: number;
    sumSL: number; sumPQ: number;
    cls: GrashofClass;
    shortestRole: string;
  } | null = null;

  if (ok) {
    const links = [g, a, b, c];
    const sorted = [...links].sort((x, y) => x - y);
    const [S, P, Q, L] = sorted;
    const sumSL = S + L;
    const sumPQ = P + Q;

    // Which physical link is the shortest decides the Grashof sub-type.
    // indexOf takes the first on a tie — noted under the result.
    const shortestIdx = links.indexOf(S);
    const ROLES = ["ground", "input", "coupler", "output"];

    let cls: GrashofClass;
    if (Math.abs(sumSL - sumPQ) < 1e-9) {
      cls = "change-point";
    } else if (sumSL < sumPQ) {
      // Grashof: exactly one link can fully rotate; which one depends on where
      // the shortest link sits relative to ground.
      if (shortestIdx === 0) cls = "double-crank";        // shortest IS ground
      else if (shortestIdx === 2) cls = "double-rocker";  // shortest is the coupler
      else cls = "crank-rocker";                          // shortest adjoins ground
    } else {
      cls = "triple-rocker";
    }

    result = { S, L, P, Q, sumSL, sumPQ, cls, shortestRole: ROLES[shortestIdx] };
  }

  const copy = result ? GRASHOF_COPY[result.cls] : null;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="bg-white rounded-lg border border-panel-gray p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl leading-none">🔗</span>
            <h2 className="text-lg font-semibold text-graphite">Four-Bar Grashof Condition</h2>
          </div>
          <p className="text-sm text-graphite/70 leading-relaxed">
            The Grashof condition answers one practical question before you build
            anything: can a motor spin this linkage continuously, or will it only rock?
            Add the shortest and longest links together. If that total is less than the
            other two added together, at least one link can make full revolutions.
          </p>
        </div>
      </section>

      <section>
        <SectionHeading>Link lengths</SectionHeading>
        <div className="bg-white rounded-lg border border-panel-gray p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Link 1 — ground" hint="fixed to the frame">
              <input type="number" inputMode="decimal" value={l1}
                     onChange={e => setL1(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Link 2 — input" hint="driven end">
              <input type="number" inputMode="decimal" value={l2}
                     onChange={e => setL2(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Link 3 — coupler" hint="opposite ground">
              <input type="number" inputMode="decimal" value={l3}
                     onChange={e => setL3(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Link 4 — output" hint="follower end">
              <input type="number" inputMode="decimal" value={l4}
                     onChange={e => setL4(e.target.value)} className={INPUT_CLASS} />
            </Field>
          </div>
          <p className="text-xs text-graphite/50 mt-3">
            Enter them in any order — S, L, P and Q are identified automatically. Units
            just have to be consistent; the test is a comparison, not a dimension.
          </p>
        </div>
      </section>

      {result && copy && (
        <section>
          <SectionHeading>Classification</SectionHeading>
          <div
            className={`rounded-lg border p-5 ${
 copy.driveable
 ? "bg-phosphor-green-tint border-phosphor-green-line"
 : result.cls === "change-point"
 ? "bg-signal-amber-tint border-signal-amber-line"
 : "bg-signal-amber-tint border-signal-amber-line"
 }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg leading-none">{copy.driveable ? "✓" : "⚠️"}</span>
              <h3
                className={`text-base font-bold ${
 copy.driveable ? "text-phosphor-green-deep" : "text-signal-amber-deep"
 }`}
              >
                {copy.title}
              </h3>
            </div>
            <p
              className={`text-sm leading-relaxed mb-3 ${
 copy.driveable ? "text-phosphor-green-deep" : "text-signal-amber-deep"
 }`}
            >
              {copy.plain}
            </p>

            {/* The test itself, spelled out */}
            <div className="bg-white/70 rounded-lg border border-white px-4 py-3 text-xs font-mono text-graphite/80 leading-relaxed">
              <div>S = {result.S} (shortest, the {result.shortestRole} link)</div>
              <div>L = {result.L} (longest)</div>
              <div>P = {result.P}, Q = {result.Q} (the remaining two)</div>
              <div className="mt-1.5 font-bold">
                S + L = {result.sumSL} {result.sumSL < result.sumPQ ? "<" : result.sumSL > result.sumPQ ? ">" : "="}{" "}
                P + Q = {result.sumPQ}
              </div>
            </div>

            {result.S === result.P && (
              <p className="text-xs text-graphite/60 mt-2">
                Note: two links tie for shortest. The sub-classification uses the first of
                them, but a tie means the mechanism is close to a change-point — treat the
                result as borderline.
              </p>
            )}
          </div>
        </section>
      )}

      <section>
        <SectionHeading>Linkage</SectionHeading>
        <div className="bg-white rounded-lg border border-panel-gray p-4">
          {ok ? (
            <FourBarDiagram l1={g} l2={a} l3={b} l4={c} />
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-graphite/50">
              Enter four positive link lengths.
            </div>
          )}
        </div>
      </section>

      <Caveat>
        <strong>Classical planar kinematics.</strong> Assumes rigid links and simple pin
        joints, all moving in one plane, with no clearance, friction or deflection. Real
        joints have play, real links bend, and a mechanism that passes on paper can still
        bind — check the transmission angle before committing to a design.
      </Caveat>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Threads & fasteners
// ═══════════════════════════════════════════════════════════════════════════

function ThreadsPanel() {
  const [dia, setDia] = useState("6");
  const [cls, setCls] = useState<BoltClass>("8.8");
  const [material, setMaterial] = useState<TappedMaterial>("aluminum");

  const d = num(dia);
  const rule = ENGAGEMENT_RULES[material];

  /**
   * Where in the rule-of-thumb range to land.
   *
   * The class doesn't get its own invented formula — a stronger bolt simply
   * needs more thread to out-strength it, so it pushes you toward the top of
   * the published range rather than off the end of it.
   */
  const pick = (min: number, max: number) =>
    cls === "8.8" ? min : cls === "10.9" ? (min + max) / 2 : max;

  const mult = pick(rule.min, rule.max);
  const le = d !== null && d > 0 ? d * mult : null;

  const steelRule = ENGAGEMENT_RULES.steel;
  const weakKey: TappedMaterial = material === "steel" ? "aluminum" : material;
  const weakRule = ENGAGEMENT_RULES[weakKey];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Metric thread table ── */}
      <section>
        <div className="bg-white rounded-lg border border-panel-gray p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl leading-none">🔩</span>
            <h2 className="text-lg font-semibold text-graphite">Metric Thread Quick Reference</h2>
          </div>
          <p className="text-sm text-graphite/70 leading-relaxed">
            ISO metric coarse series — the sizes you'll specify most of the time. Proof
            load is the axial load a bolt of that class can carry without taking any
            permanent set; design working loads sit well below it.
          </p>
        </div>

        <DataTable
          columns={[
            { header: "Size", className: "font-semibold text-graphite" },
            { header: "Major ⌀ (mm)", className: "font-mono text-graphite/80" },
            { header: "Coarse pitch (mm)", className: "font-mono text-graphite/80" },
            { header: "Tap drill (mm)", className: "font-mono text-steel-blue-deep font-medium" },
            { header: "Stress area (mm²)", className: "font-mono text-graphite/60" },
            { header: "8.8 (kN)", className: "font-mono text-graphite/80" },
            { header: "10.9 (kN)", className: "font-mono text-graphite/80" },
            { header: "12.9 (kN)", className: "font-mono text-graphite/80" },
          ]}
          rows={METRIC_THREADS.map(t => ({
            key: t.size,
            cells: [
              t.size,
              t.major.toFixed(1),
              t.pitch.toFixed(2),
              t.tapDrill.toFixed(1),
              t.stressArea,
              t.proof.c88.toFixed(1),
              t.proof.c109.toFixed(1),
              t.proof.c129.toFixed(1),
            ],
          }))}
        />
        <p className="text-xs text-graphite/60 mt-2 leading-relaxed">{THREAD_TABLE_NOTE}</p>
      </section>

      {/* ── Engagement calculator ── */}
      <section>
        <SectionHeading>Minimum Thread Engagement</SectionHeading>
        <div className="bg-white rounded-lg border border-panel-gray p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Bolt diameter (mm)">
              <input type="number" inputMode="decimal" value={dia}
                     onChange={e => setDia(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Bolt class">
              <select value={cls} onChange={e => setCls(e.target.value as BoltClass)}
                      className={INPUT_CLASS}>
                {BOLT_CLASSES.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.value} — {c.proofMPa} MPa proof
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tapped material">
              <select value={material}
                      onChange={e => setMaterial(e.target.value as TappedMaterial)}
                      className={INPUT_CLASS}>
                <option value="steel">Steel (comparable strength)</option>
                <option value="aluminum">Aluminum</option>
                <option value="other">Other / weaker</option>
              </select>
            </Field>
          </div>
        </div>
      </section>

      {le !== null && (
        <section>
          <div className="bg-steel-blue-tint border border-steel-blue-line rounded-lg p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Stat label="Recommended minimum engagement" value={`${le.toFixed(1)} mm`} big />
              <Stat
                label="Rule-of-thumb range"
                value={`${(d! * rule.min).toFixed(1)} – ${(d! * rule.max).toFixed(1)} mm`}
              />
            </div>
            <div className="bg-white rounded-lg border border-steel-blue-line px-4 py-3 text-xs font-mono text-graphite/70">
              Lₑ = {d} mm × {mult.toFixed(2)} = {le.toFixed(2)} mm
              <span className="text-graphite/50">
                {"  "}({rule.min}–{rule.max}× d for {rule.short}
                {cls === "8.8" ? ", low end for class 8.8" : cls === "10.9" ? ", mid for class 10.9" : ", top end for class 12.9"})
              </span>
            </div>
            <p className="text-xs text-steel-blue-deep mt-3 leading-relaxed">{rule.reasoning}</p>
          </div>
        </section>
      )}

      <section>
        <SectionHeading>Why the material matters</SectionHeading>
        <div className="bg-white rounded-lg border border-panel-gray p-4">
          {d !== null && d > 0 ? (
            <ThreadEngagementDiagram
              diameter={d}
              steelMult={pick(steelRule.min, steelRule.max)}
              weakMult={pick(weakRule.min, weakRule.max)}
              weakLabel={weakRule.short}
              highlight={material === "steel" ? "steel" : "weak"}
            />
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-graphite/50">
              Enter a bolt diameter.
            </div>
          )}
        </div>
      </section>

      <Caveat>
        <strong>Rule of thumb — verify with a full thread shear calculation for critical
        joints.</strong> The real requirement is that the engaged thread&apos;s shear area
        out-strengths the bolt&apos;s tensile stress area, which depends on the actual
        thread form, the tapped material&apos;s shear strength, and the fit class. For
        anything safety-related, or into a material you haven&apos;t used before, run the
        numbers properly or specify a threaded insert.
      </Caveat>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Surface finish
// ═══════════════════════════════════════════════════════════════════════════

function SurfacePanel() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="bg-white rounded-lg border border-panel-gray p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl leading-none">🪞</span>
            <h2 className="text-lg font-semibold text-graphite">Surface Finish (Ra)</h2>
          </div>
          <p className="text-sm text-graphite/70 leading-relaxed">
            Ra is the arithmetic mean deviation of the surface from its mean line — one
            number summarising how rough it is. Specifying a finer finish than the
            function needs is one of the easiest ways to make a part expensive, since each
            step down usually means another operation.
          </p>
        </div>
      </section>

      <section>
        <SectionHeading>Reference</SectionHeading>
        <DataTable
          columns={[
            { header: "Ra (µm)", className: "font-mono font-semibold text-graphite" },
            { header: "Ra (µin)", className: "font-mono text-graphite/60" },
            { header: "Typical process", className: "text-graphite/80" },
            { header: "Typical application", className: "text-graphite/70 text-xs leading-relaxed" },
          ]}
          rows={SURFACE_FINISHES.map(f => ({
            key: f.raUm,
            cells: [
              <span key="ra" className={f.sealRelevant ? "text-phosphor-green-deep" : undefined}>
                {f.raUm}
              </span>,
              f.raUin,
              f.process,
              f.application,
            ],
          }))}
        />
      </section>

      {/* Tie back to the O-ring calculators, which is where this actually bites */}
      <section>
        <div className="flex gap-2.5 items-start bg-phosphor-green-tint border border-phosphor-green-line rounded-lg px-4 py-3">
          <span className="text-base leading-none mt-0.5">💧</span>
          <div>
            <p className="text-xs text-phosphor-green-deep leading-relaxed">{SURFACE_SEAL_CALLOUT}</p>
            <div className="flex gap-3 mt-2">
              <Link href="/calculators/oring-squeeze"
                    className="text-xs font-medium text-phosphor-green-deep hover:text-phosphor-green-deep underline">
                O-Ring Squeeze →
              </Link>
              <Link href="/calculators/oring-groove"
                    className="text-xs font-medium text-phosphor-green-deep hover:text-phosphor-green-deep underline">
                O-Ring Groove Sizing →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading>What the numbers look like</SectionHeading>
        <div className="bg-white rounded-lg border border-panel-gray p-4">
          <SurfaceProfileDiagram />
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. Weld symbols
// ═══════════════════════════════════════════════════════════════════════════

function WeldPanel() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="bg-white rounded-lg border border-panel-gray p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl leading-none">🔥</span>
            <h2 className="text-lg font-semibold text-graphite">Reading Weld Symbols</h2>
          </div>
          <p className="text-sm text-graphite/70 leading-relaxed">
            A weld symbol packs the joint type, which side it goes on, and how big it is
            into one mark on a drawing. This covers the handful you&apos;ll actually meet
            on a fabrication drawing — not the full AWS A2.4 library, which runs to
            dozens of symbols most engineers never specify.
          </p>
        </div>
      </section>

      <section>
        <SectionHeading>Anatomy of a weld symbol</SectionHeading>
        <div className="bg-white rounded-lg border border-panel-gray p-4">
          <WeldSymbolDiagram />
          <p className="text-xs text-graphite/60 mt-3 pt-3 border-t border-panel-gray leading-relaxed">
            The side convention is the part people get backwards: a symbol drawn{" "}
            <strong>below</strong> the reference line means the weld goes on the side the
            arrow touches. Above the line means the far side. Symbols on both sides, as
            drawn here, means weld both.
          </p>
        </div>
      </section>

      <section>
        <SectionHeading>Symbol reference</SectionHeading>
        <DataTable
          columns={[
            { header: "Element", className: "font-medium text-graphite", headerClassName: "w-40" },
            { header: "What it looks like", className: "text-graphite/70 text-xs" },
            { header: "What it means", className: "text-graphite/70 text-xs leading-relaxed" },
          ]}
          rows={WELD_SYMBOLS.map(w => ({
            key: w.name,
            cells: [w.name, w.appearance, w.meaning],
          }))}
        />
      </section>

      <Caveat>
        A drawing symbol specifies the weld, not whether the joint is adequate. Weld
        sizing, procedure qualification, and inspection level are separate decisions —
        and for structural or pressure work they are governed by the applicable code, not
        by a reference table.
      </Caveat>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. Assembly DFM
// ═══════════════════════════════════════════════════════════════════════════

function AssemblyPanel() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="bg-white rounded-lg border border-panel-gray p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl leading-none">🧰</span>
            <h2 className="text-lg font-semibold text-graphite">Assembly DFM Checklist</h2>
          </div>
          <p className="text-sm text-graphite/70 leading-relaxed">
            Design for assembly is mostly about removing chances to get it wrong. Run this
            before releasing an assembly — most of the findings cost nothing to fix at
            design stage and a great deal to fix once tooling exists.
          </p>
        </div>
      </section>

      <section>
        <SectionHeading>Designing out the wrong orientation</SectionHeading>
        <div className="bg-white rounded-lg border border-panel-gray p-4">
          <OrientationDiagram />
        </div>
      </section>

      <section>
        <SectionHeading>Checklist</SectionHeading>
        <div className="flex flex-col gap-4">
          {ASSEMBLY_CHECKLIST.map(group => (
            <div key={group.title} className="bg-white rounded-lg border border-panel-gray p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base leading-none">{group.icon}</span>
                <h3 className="text-sm font-semibold text-graphite">{group.title}</h3>
              </div>
              <p className="text-xs text-graphite/60 leading-relaxed mb-3">{group.rationale}</p>
              <ul className="flex flex-col gap-2">
                {group.items.map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    {/* Decorative box — this is a printed checklist, not a
                        stateful form, so it isn't an interactive checkbox. */}
                    <span
                      className="mt-0.5 shrink-0 w-3.5 h-3.5 rounded border border-graphite/20 bg-instrument-white"
                      aria-hidden="true"
                    />
                    <span className="text-xs text-graphite/80 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
