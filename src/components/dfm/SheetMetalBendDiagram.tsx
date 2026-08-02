/**
 * Sheet Metal — Flat Pattern vs. Formed Part Diagram
 *
 * An original SVG showing the same bracket in its two forms:
 *
 *   LEFT  — the FLAT PATTERN as it gets laser-cut, viewed from above. This is
 *           where the three distances that matter get dimensioned:
 *             • hole-to-bend  (1.5T + R)
 *             • hole-to-edge  (1.5–2T)
 *             • the bend line itself (dash-dot, the drawing convention)
 *   RIGHT — the same blank after the press brake folds it, viewed from the
 *           side, with the inside bend radius R and the flange length called out.
 *
 * The reason to draw both is that these constraints are invisible in the 3-D
 * model — a hole that looks fine on the finished bracket may be sitting right
 * on top of a bend line in the flat, where forming will stretch it into a
 * teardrop.
 *
 * Pure display component — no state, so no "use client" needed.
 */

export default function SheetMetalBendDiagram() {
  // ─── LEFT: flat pattern (top view) ─────────────────────────────────────────
  const F_X = 30,  F_Y = 62;        // top-left corner of the blank
  const F_W = 168, F_H = 118;       // blank width and height
  const BEND_X = F_X + 104;         // x of the bend line within the blank

  const HOLE_R  = 11;
  const HOLE_CX = F_X + 62;         // hole center — safely left of the bend line
  const HOLE_CY = F_Y + 59;

  // ─── RIGHT: formed part (side view) ────────────────────────────────────────
  const T   = 9;                    // material thickness as drawn
  const R_IN = 15;                  // inside bend radius as drawn
  const B_X = 268, B_Y = 92;        // start of the horizontal web (top surface)
  const WEB_LEN = 96;               // length of the flat web before the bend
  const FLANGE  = 62;               // length of the vertical flange after the bend

  // Bend geometry: the web runs right, then turns 90° downward.
  const cx = B_X + WEB_LEN;                 // x where the bend's inside arc begins
  const innerR = R_IN, outerR = R_IN + T;

  return (
    <svg viewBox="0 0 460 242" className="w-full h-auto" role="img"
         aria-label="Sheet metal flat pattern with hole-to-bend and hole-to-edge distances, next to the formed part showing inside bend radius">
      <defs>
        <marker id="smArrowS" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M6,0.7 L0.5,3.5 L6,6.3" fill="none" stroke="#2563eb" strokeWidth="1.2" />
        </marker>
        <marker id="smArrowE" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <path d="M1,0.7 L6.5,3.5 L1,6.3" fill="none" stroke="#2563eb" strokeWidth="1.2" />
        </marker>
      </defs>

      {/* ══ Titles ══ */}
      <text x={F_X + F_W / 2} y="30" textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
        Flat pattern (as cut)
      </text>
      <text x={F_X + F_W / 2} y="44" textAnchor="middle" fontSize="9" fill="#94a3b8">
        top view
      </text>
      <text x="352" y="30" textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
        Formed part (after brake)
      </text>
      <text x="352" y="44" textAnchor="middle" fontSize="9" fill="#94a3b8">
        side view
      </text>

      {/* ═══════════════ LEFT — FLAT PATTERN ═══════════════ */}

      <rect x={F_X} y={F_Y} width={F_W} height={F_H} rx="2"
            fill="#f1f5f9" stroke="#64748b" strokeWidth="1.6" />

      {/* Bend line — dash-dot is the standard drawing convention for a bend */}
      <line x1={BEND_X} y1={F_Y} x2={BEND_X} y2={F_Y + F_H}
            stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="10 3 2 3" />
      <text x={BEND_X + 5} y={F_Y + F_H + 13} fontSize="9" fontWeight="600" fill="#b45309">
        bend line
      </text>

      {/* The hole */}
      <circle cx={HOLE_CX} cy={HOLE_CY} r={HOLE_R}
              fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
      {/* Center mark */}
      <line x1={HOLE_CX - HOLE_R - 5} y1={HOLE_CY} x2={HOLE_CX + HOLE_R + 5} y2={HOLE_CY}
            stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="5 2 1 2" />
      <line x1={HOLE_CX} y1={HOLE_CY - HOLE_R - 5} x2={HOLE_CX} y2={HOLE_CY + HOLE_R + 5}
            stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="5 2 1 2" />

      {/* — Dimension: hole edge → bend line (the 1.5T + R rule) — */}
      <line x1={HOLE_CX + HOLE_R} y1={HOLE_CY} x2={BEND_X} y2={HOLE_CY}
            stroke="#2563eb" strokeWidth="1.1"
            markerStart="url(#smArrowS)" markerEnd="url(#smArrowE)" />
      <text x={(HOLE_CX + HOLE_R + BEND_X) / 2} y={HOLE_CY - 7} textAnchor="middle"
            fontSize="9" fontWeight="600" fill="#2563eb">
        1.5T + R
      </text>
      <text x={(HOLE_CX + HOLE_R + BEND_X) / 2} y={HOLE_CY + 15} textAnchor="middle"
            fontSize="8" fill="#60a5fa">
        hole→bend
      </text>

      {/* — Dimension: hole edge → left part edge (1.5–2T) — */}
      <line x1={F_X} y1={HOLE_CY} x2={HOLE_CX - HOLE_R} y2={HOLE_CY}
            stroke="#2563eb" strokeWidth="1.1"
            markerStart="url(#smArrowS)" markerEnd="url(#smArrowE)" />
      <text x={(F_X + HOLE_CX - HOLE_R) / 2} y={HOLE_CY - 7} textAnchor="middle"
            fontSize="9" fontWeight="600" fill="#2563eb">
        1.5–2T
      </text>
      <text x={(F_X + HOLE_CX - HOLE_R) / 2} y={HOLE_CY + 15} textAnchor="middle"
            fontSize="8" fill="#60a5fa">
        hole→edge
      </text>

      {/* Why the hole→bend dimension exists. Worded as the consequence of going
          BELOW it, so it doesn't read as a criticism of the (correct) part drawn. */}
      <text x={F_X} y={F_Y - 6} fontSize="8.5" fill="#dc2626">
        go below this and the hole pulls into a teardrop
      </text>

      {/* ═══════════════ RIGHT — FORMED PART ═══════════════ */}

      {/*
        The formed section is one closed path traced around the outside of the
        material and back along the inside:
          start at the top-left of the web → right along the top (outer) surface
          → around the OUTER bend arc → down the outside of the flange
          → across the flange tip → back up the inside of the flange
          → around the INNER bend arc → back left along the underside.
      */}
      <path
        d={`M${B_X},${B_Y}
            L${cx + innerR},${B_Y}
            A ${outerR} ${outerR} 0 0 1 ${cx + innerR + outerR},${B_Y + outerR}
            L${cx + innerR + outerR},${B_Y + outerR + FLANGE}
            L${cx + innerR},${B_Y + outerR + FLANGE}
            L${cx + innerR},${B_Y + T + innerR}
            A ${innerR} ${innerR} 0 0 0 ${cx},${B_Y + T}
            L${B_X},${B_Y + T} Z`}
        fill="#cbd5e1" stroke="#475569" strokeWidth="1.6" strokeLinejoin="round" />

      {/* Inside radius callout — leader line pointing at the inner arc */}
      <line x1={cx + 4} y1={B_Y + T + 4} x2={cx - 30} y2={B_Y + 48}
            stroke="#2563eb" strokeWidth="1" />
      <text x={cx - 78} y={B_Y + 58} fontSize="9" fontWeight="600" fill="#2563eb">
        inside R ≥ 1× t
      </text>

      {/* Material thickness dimension on the web */}
      <line x1={B_X - 9} y1={B_Y} x2={B_X - 9} y2={B_Y + T}
            stroke="#2563eb" strokeWidth="1.1"
            markerStart="url(#smArrowS)" markerEnd="url(#smArrowE)" />
      <text x={B_X - 13} y={B_Y + T / 2 + 3} textAnchor="end" fontSize="9"
            fontWeight="600" fill="#2563eb">t</text>

      {/* Flange length dimension */}
      <line x1={cx + innerR + outerR + 12} y1={B_Y + outerR}
            x2={cx + innerR + outerR + 12} y2={B_Y + outerR + FLANGE}
            stroke="#2563eb" strokeWidth="1.1"
            markerStart="url(#smArrowS)" markerEnd="url(#smArrowE)" />
      <text x={cx + innerR + outerR + 17} y={B_Y + outerR + FLANGE / 2 - 3}
            fontSize="9" fontWeight="600" fill="#2563eb">flange</text>
      <text x={cx + innerR + outerR + 17} y={B_Y + outerR + FLANGE / 2 + 8}
            fontSize="9" fill="#2563eb">≥ 4× t</text>

      {/* Show where the hole ends up on the formed part */}
      <ellipse cx={B_X + 40} cy={B_Y + T / 2} rx={11} ry={2.6}
               fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />

      {/* ══ Footnote ══ */}
      <text x="230" y="216" textAnchor="middle" fontSize="9" fill="#94a3b8" fontStyle="italic">
        T = material thickness, R = inside bend radius.
      </text>
      <text x="230" y="230" textAnchor="middle" fontSize="9" fill="#94a3b8">
        Bend perpendicular to the mill grain for the lowest cracking risk.
      </text>
    </svg>
  );
}
