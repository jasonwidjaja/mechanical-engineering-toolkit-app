/**
 * IP Rating Reference
 *
 * This is a STATIC reference page — no calculation, no state, no event handlers.
 * Because of that, it does NOT need "use client".
 * Next.js renders it once on the server and serves plain HTML — fastest possible load.
 *
 * The IP (Ingress Protection) code is defined by IEC 60529.
 * Format: IP [first digit] [second digit]
 *   First digit (0–6): protection against solid particles (dust)
 *   Second digit (0–9K): protection against liquids (water)
 *
 * IP6X (dust-tight) is required for the common IP65–IP68 ratings used in
 * sealed electronics enclosures.
 */

export default function IPRatingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back navigation — plain <a> works here since we're in a server component */}
      <a href="/" className="inline-flex items-center text-sm text-steel-blue hover:text-steel-blue-deep mb-6">
        ← Back to all calculators
      </a>

      <h1 className="text-2xl font-bold text-graphite mb-1">IP Rating Reference</h1>
      <p className="text-sm text-graphite/60 mb-8">
        Ingress Protection codes per IEC 60529. Use this as a design checklist —
        always test to the actual standard, since sealing performance depends on groove
        geometry, O-ring material, compression set, and installation quality.
      </p>

      {/* ── IP code structure explainer ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <CodeTable
          title="First Digit — Solid Particle Protection"
          rows={[
            ["0", "No protection"],
            ["1", "≥ 50 mm objects (hand)"],
            ["2", "≥ 12.5 mm objects (finger)"],
            ["3", "≥ 2.5 mm objects (tool)"],
            ["4", "≥ 1 mm objects (wire)"],
            ["5", "Dust protected — limited ingress, no harmful deposit"],
            ["6", "Dust tight — no ingress at all"],
          ]}
          highlightRows={[5, 6]}
        />
        <CodeTable
          title="Second Digit — Liquid Protection"
          rows={[
            ["0", "No protection"],
            ["1", "Dripping water (vertical)"],
            ["2", "Dripping water at 15° tilt"],
            ["3", "Spraying water up to 60° from vertical"],
            ["4", "Splashing water from any direction"],
            ["5", "Low-pressure jets (6.3 L/min, 30 kPa, any direction)"],
            ["6", "High-pressure jets (100 L/min, 100 kPa, any direction)"],
            ["7", "Temporary immersion: 1 m for 30 min"],
            ["8", "Continuous immersion — depth and duration per manufacturer"],
          ]}
          highlightRows={[5, 6, 7, 8]}
        />
      </div>

      {/* ── Common ratings for sealed enclosures ── */}
      <h2 className="text-lg font-semibold text-graphite mb-4">
        Common Ratings for Sealed Enclosures
      </h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-instrument-white border-b border-panel-gray text-left text-xs text-graphite/60">
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Protection Level</th>
              <th className="px-4 py-3 font-semibold">Typical Sealing Method</th>
              <th className="px-4 py-3 font-semibold">Min Squeeze</th>
              <th className="px-4 py-3 font-semibold">Design Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-gray">
            {RATINGS.map(r => (
              <tr key={r.code} className="hover:bg-instrument-white transition-colors">
                <td className="px-4 py-3">
                  <span className="font-bold text-steel-blue-deep text-base">{r.code}</span>
                </td>
                <td className="px-4 py-3 text-graphite/80">{r.protection}</td>
                <td className="px-4 py-3 text-graphite/70">{r.method}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-graphite/80">{r.minSqueeze}</span>
                </td>
                <td className="px-4 py-3 text-graphite/60 text-xs leading-relaxed">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── O-ring material quick reference ── */}
      <h2 className="text-lg font-semibold text-graphite mb-4">O-Ring Material Quick Reference</h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-instrument-white border-b border-panel-gray text-left text-xs text-graphite/60">
              <th className="px-4 py-3 font-semibold">Material</th>
              <th className="px-4 py-3 font-semibold">Temp Range</th>
              <th className="px-4 py-3 font-semibold">Good For</th>
              <th className="px-4 py-3 font-semibold">Avoid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-gray">
            {[
              ["NBR (Buna-N)", "−40 to +120°C", "Petroleum oils, hydraulic fluid, water", "Ozone, ketones, strong acids"],
              ["EPDM", "−55 to +150°C", "Water, steam, brake fluid, outdoor UV", "Petroleum oils, aromatic hydrocarbons"],
              ["Silicone (VMQ)", "−60 to +200°C", "High/low temps, food contact, dry air", "Steam, hydraulic fluid, fuels"],
              ["FKM (Viton®)", "−20 to +200°C", "Fuels, oils, acids, aerospace fluids", "Ketones, amines, hot water"],
              ["PTFE (encapsulated)", "−200 to +260°C", "Aggressive chemicals, universal", "Abrasion (hard, low resilience)"],
            ].map(([mat, temp, good, avoid]) => (
              <tr key={mat} className="hover:bg-instrument-white">
                <td className="px-4 py-3 font-medium text-graphite">{mat}</td>
                <td className="px-4 py-3 font-mono text-xs text-graphite/70">{temp}</td>
                <td className="px-4 py-3 text-graphite/70 text-xs">{good}</td>
                <td className="px-4 py-3 text-signal-red text-xs">{avoid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Design checklist ── */}
      <div className="bg-steel-blue-tint border border-steel-blue-line rounded-lg p-5">
        <h2 className="text-sm font-semibold text-steel-blue-deep mb-3">
          Seal Design Checklist
        </h2>
        <ul className="text-xs text-steel-blue-deep space-y-1.5 list-none">
          {[
            "Verify squeeze is within target range (15–30% static, 10–20% dynamic) after accounting for tolerance stack.",
            "Check groove fill ratio (O-ring cross-sectional area / groove cross-sectional area) — typically 75–85% for static seals.",
            "Confirm O-ring material is compatible with the process fluid and cleaning agents.",
            "Account for thermal expansion/contraction of both the O-ring and the housing across the operating temperature range.",
            "Inspect for compression set if the seal is used at elevated temperatures or over long duty cycles — replace before set exceeds ~30%.",
            "For IP67 and IP68: verify the groove retains the O-ring during assembly (consider a light groove lip or channel).",
            "For IP66 (high-pressure jet): consider a retained or dovetail groove to prevent O-ring blow-out under direct jet impingement.",
          ].map(item => (
            <li key={item} className="flex gap-2">
              <span className="text-steel-blue mt-0.5">▸</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const RATINGS = [
  {
    code: "IP54",
    protection: "Dust protected · Splash from any direction",
    method: "Foam gasket or face-seal O-ring with light contact",
    minSqueeze: "10–15%",
    notes: "Entry-level outdoor/industrial protection. Foam gaskets are common here — a full O-ring groove is often not required.",
  },
  {
    code: "IP65",
    protection: "Dust tight · Low-pressure jets (12.5 kPa)",
    method: "Face-seal O-ring in a standard groove",
    minSqueeze: "15–20%",
    notes: "Common for outdoor luminaires, sensors, and junction boxes. Ensure groove retains O-ring during assembly.",
  },
  {
    code: "IP66",
    protection: "Dust tight · High-pressure jets (100 kPa)",
    method: "Retained O-ring groove (shoulder or slight undercut)",
    minSqueeze: "20%",
    notes: "Industrial wash-down environments. The high-pressure jet can dislodge a loosely retained O-ring — verify groove design under direct impingement.",
  },
  {
    code: "IP67",
    protection: "Dust tight · Temporary immersion: 1 m / 30 min",
    method: "Face-seal with controlled squeeze",
    minSqueeze: "20–25%",
    notes: "Consumer electronics and handheld tools. Implies temporary immersion — verify no compression set over service life. Recheck after any disassembly.",
  },
  {
    code: "IP68",
    protection: "Dust tight · Continuous immersion (depth per manufacturer)",
    method: "Face-seal or bore seal; backup ring for high-pressure",
    minSqueeze: "22–30%",
    notes: "Depth and duration specified by manufacturer. Check O-ring material swell in the immersion fluid. Anti-extrusion backup ring recommended above ~3 bar.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

type CodeTableProps = {
  title: string;
  rows: [string, string][];
  highlightRows?: number[];
};

function CodeTable({ title, rows, highlightRows = [] }: CodeTableProps) {
  return (
    <div className="bg-white rounded-lg border border-panel-gray overflow-hidden">
      <div className="bg-instrument-white px-4 py-2.5 border-b border-panel-gray">
        <p className="text-xs font-semibold text-graphite/70">{title}</p>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([digit, desc], i) => (
            <tr
              key={digit}
              className={`border-b border-panel-gray last:border-0 ${
 highlightRows.includes(i) ? "bg-steel-blue-tint/50" : ""
 }`}
            >
              <td className={`px-4 py-2 font-bold w-8 ${highlightRows.includes(i) ? "text-steel-blue-deep" : "text-graphite/60"}`}>
                {digit}
              </td>
              <td className="px-4 py-2 text-graphite/70">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
