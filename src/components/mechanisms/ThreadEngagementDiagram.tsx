/**
 * Thread Engagement Diagram
 *
 * The same bolt tapped into two different materials, side by side, so the
 * difference in required engagement length is a length you can see rather than
 * a multiplier you have to trust.
 *
 * Both halves are drawn at the same scale off the bolt diameter, so the bars
 * are directly comparable: the aluminum side really is ~1.75× as deep as the
 * steel side, because that's the rule being illustrated.
 *
 * Pure display component (no state), so no "use client" needed.
 */

type Props = {
  /** Bolt nominal diameter, mm — sets the scale and the printed values. */
  diameter: number;
  /** Engagement multiplier for the steel-into-steel case. */
  steelMult: number;
  /** Engagement multiplier for the weaker material. */
  weakMult: number;
  /** Name of the weaker material, e.g. "Aluminum". */
  weakLabel: string;
  /** Which half the user's current selection corresponds to. */
  highlight: "steel" | "weak";
};

// The bolt is always drawn this wide, so engagement depth in pixels works out
// to (multiplier × D_PX) regardless of the actual diameter in millimetres.
const D_PX = 26;
const HEAD_TOP = 66;
const PLATE_TOP = 88;
const BLOCK_TOP = 106;
const BLOCK_BOT = 222;

export default function ThreadEngagementDiagram({
  diameter,
  steelMult,
  weakMult,
  weakLabel,
  highlight,
}: Props) {
  const halves = [
    {
      key: "steel" as const,
      cx: 115,
      title: "Steel into steel",
      mult: steelMult,
      blockFill: "#e2e8f0",
      blockStroke: "#94a3b8",
      accent: "#2563eb",
      note: "comparable strength",
    },
    {
      key: "weak" as const,
      cx: 345,
      title: `Steel into ${weakLabel.toLowerCase()}`,
      mult: weakMult,
      blockFill: "#e0f2fe",
      blockStroke: "#7dd3fc",
      accent: "#0369a1",
      note: "weaker — needs more thread",
    },
  ];

  return (
    <svg
      viewBox="0 0 460 268"
      className="w-full h-auto"
      role="img"
      aria-label={`A bolt of ${diameter} millimetres diameter tapped into steel, needing ${(diameter * steelMult).toFixed(1)} millimetres of engagement, next to the same bolt in ${weakLabel.toLowerCase()}, needing ${(diameter * weakMult).toFixed(1)} millimetres.`}
    >
      <defs>
        <pattern id="teHatch" width="6" height="6" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="1.3" />
        </pattern>
        <marker id="teDim" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M4,0.6 L1,4 L4,7.4" fill="none" stroke="#b45309" strokeWidth="1.2" />
        </marker>
      </defs>

      {halves.map(h => {
        const lePx = D_PX * h.mult;
        const leMm = diameter * h.mult;
        const boltBot = BLOCK_TOP + lePx;
        const holeBot = boltBot + 9;        // tapped hole runs a little deeper
        const xL = h.cx - D_PX / 2;
        const xR = h.cx + D_PX / 2;
        const isOn = highlight === h.key;

        return (
          <g key={h.key}>
            {/* Selection highlight for whichever material is chosen above */}
            {isOn && (
              <rect x={h.cx - 108} y="44" width="216" height="212" rx="10"
                    fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5" />
            )}

            <text x={h.cx} y="22" textAnchor="middle" fontSize="11" fontWeight="700"
                  fill={h.accent}>
              {h.title}
            </text>
            <text x={h.cx} y="35" textAnchor="middle" fontSize="9" fill="#64748b">
              {h.note}
            </text>

            {/* ── Tapped block ── */}
            <rect x={h.cx - 72} y={BLOCK_TOP} width="144" height={BLOCK_BOT - BLOCK_TOP}
                  fill={h.blockFill} stroke={h.blockStroke} strokeWidth="1.4" />
            <rect x={h.cx - 72} y={BLOCK_TOP} width="144" height={BLOCK_BOT - BLOCK_TOP}
                  fill="url(#teHatch)" stroke="none" opacity="0.55" />

            {/* Tapped hole, drawn slightly deeper than the engaged length so the
                two aren't confused with each other */}
            <rect x={xL} y={BLOCK_TOP} width={D_PX} height={holeBot - BLOCK_TOP}
                  fill="#ffffff" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />

            {/* ── Clamped plate the bolt passes through ── */}
            <rect x={h.cx - 72} y={PLATE_TOP} width="144" height={BLOCK_TOP - PLATE_TOP}
                  fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2" />

            {/* ── Bolt ── */}
            <rect x={h.cx - 21} y={HEAD_TOP} width="42" height={PLATE_TOP - HEAD_TOP}
                  fill="#64748b" stroke="#475569" strokeWidth="1.2" rx="1.5" />
            <rect x={xL} y={PLATE_TOP} width={D_PX} height={boltBot - PLATE_TOP}
                  fill="#94a3b8" stroke="#475569" strokeWidth="1.2" />

            {/* Thread ticks, only along the ENGAGED portion */}
            {Array.from(
              { length: Math.max(Math.floor(lePx / 5), 1) },
              (_, i) => BLOCK_TOP + 3 + i * 5,
            )
              .filter(y => y < boltBot - 1)
              .map(y => (
                <g key={y}>
                  <path d={`M${xL},${y} l4,3`} stroke="#334155" strokeWidth="1" />
                  <path d={`M${xR},${y} l-4,3`} stroke="#334155" strokeWidth="1" />
                </g>
              ))}

            {/* ── Engagement dimension ── */}
            <line x1={h.cx + 44} y1={BLOCK_TOP} x2={h.cx + 44} y2={boltBot}
                  stroke="#b45309" strokeWidth="1.2"
                  markerStart="url(#teDim)" markerEnd="url(#teDim)" />
            <line x1={xR} y1={BLOCK_TOP} x2={h.cx + 48} y2={BLOCK_TOP}
                  stroke="#d97706" strokeWidth="0.7" strokeDasharray="2 2" />
            <line x1={xR} y1={boltBot} x2={h.cx + 48} y2={boltBot}
                  stroke="#d97706" strokeWidth="0.7" strokeDasharray="2 2" />
            <text x={h.cx + 52} y={(BLOCK_TOP + boltBot) / 2 - 2} fontSize="10"
                  fontWeight="700" fill="#b45309">
              Lₑ
            </text>
            <text x={h.cx + 52} y={(BLOCK_TOP + boltBot) / 2 + 10} fontSize="9.5"
                  fill="#b45309">
              {leMm.toFixed(1)} mm
            </text>

            {/* Multiplier, stated under the block */}
            <text x={h.cx} y={BLOCK_BOT + 18} textAnchor="middle" fontSize="10"
                  fontWeight="700" fill={h.accent}>
              {h.mult.toFixed(2)} × d
            </text>

            {/* Bolt diameter dimension across the head */}
            <line x1={xL} y1={HEAD_TOP - 10} x2={xR} y2={HEAD_TOP - 10}
                  stroke="#475569" strokeWidth="0.9" />
            <text x={h.cx} y={HEAD_TOP - 14} textAnchor="middle" fontSize="8.5" fill="#475569">
              d = {diameter} mm
            </text>
          </g>
        );
      })}

      <text x="230" y="262" textAnchor="middle" fontSize="9" fill="#94a3b8" fontStyle="italic">
        Both halves drawn at the same scale — the depth difference is the rule, not emphasis.
      </text>
    </svg>
  );
}
