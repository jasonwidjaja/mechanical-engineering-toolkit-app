/**
 * O-Ring Groove Depth Comparison
 *
 * Two cross-sections of the SAME O-ring in two different grooves, side by side:
 *
 *   LEFT  — groove cut too DEEP. The ring drops in, never reaches the mating
 *           face, and a gap is left above it. No squeeze means no seal.
 *   RIGHT — groove cut to the target depth. The ring is compressed between
 *           floor and lid, and the dashed circle shows where its free
 *           (uncompressed) outline would have been — that overlap IS the squeeze.
 *
 * Note on direction: it is a groove that is too deep, not too shallow, that
 * causes insufficient squeeze. Squeeze % = (W − G) / W × 100, so a LARGER G
 * gives a SMALLER squeeze. A groove that is too shallow has the opposite
 * problem — over-compression, ring damage, and compression set.
 *
 * This is deliberately a different drawing from the shared
 * OringCrossSectionDiagram, which shows one groove at the computed depth. This
 * one exists to show the failure mode next to the correct case.
 *
 * Pure display component (no state), so no "use client" needed.
 */

type Props = {
  /** O-ring free cross-section diameter, mm — used for the printed labels. */
  W: number;
  /** The correctly-sized groove depth, mm. */
  G: number;
  /** Target squeeze, percent. Drives the correct groove's proportions. */
  squeezePct: number;
};

// ─── Fixed drawing geometry ──────────────────────────────────────────────────
const W_PX = 62;         // the ring's free diameter always draws this tall
const R_PX = W_PX / 2;
// Both grooves share the same top face and lid height — what differs between
// them is how deep the groove is cut BELOW that face, which is the whole point.
const FACE_Y = 94;
const LID_TOP = 74;
const BODY_BOT = 192;
const HALF_GROOVE = 53;  // groove half-width ≈ 1.7 × W, the usual proportion

/** How much deeper than the ring the "too deep" groove is cut. */
const TOO_DEEP_FACTOR = 1.3;

export default function OringGrooveComparisonDiagram({ W, G, squeezePct }: Props) {
  // Clamp so a wild input can't invert the drawing.
  const squeeze = Math.min(Math.max(squeezePct, 1), 50);

  // ── Correct groove (right) ──
  const gGoodPx = W_PX * (1 - squeeze / 100);
  const goodFloor = FACE_Y + gGoodPx;
  // Compressed ring: conserve cross-sectional area, so rx = r² / ry.
  const ry = gGoodPx / 2;
  const rx = Math.min((R_PX * R_PX) / ry, HALF_GROOVE - 6);

  // ── Too-deep groove (left) ──
  const badFloor = FACE_Y + W_PX * TOO_DEEP_FACTOR;
  const badCy = badFloor - R_PX;      // ring rests on the floor, uncompressed
  const badTop = badCy - R_PX;        // its highest point
  const gapPx = badTop - FACE_Y;      // the leak path

  const L_CX = 118;
  const R_CX = 342;

  return (
    <svg
      viewBox="0 0 460 230"
      className="w-full h-auto"
      role="img"
      aria-label="Two O-ring groove cross-sections side by side: a groove cut too deep, where the ring sits loose with a gap under the lid and cannot seal, and a correctly sized groove where the ring is compressed to the target squeeze."
    >
      <defs>
        <pattern id="ogHatch" width="7" height="7" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#E7EAEC" strokeWidth="1.5" />
        </pattern>
        <marker id="ogDim" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M4,0.6 L1,4 L4,7.4" fill="none" stroke="#2B4C7E" strokeWidth="1.1" />
        </marker>
        <marker id="ogGap" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M4,0.6 L1,4 L4,7.4" fill="none" stroke="#9B3B3E" strokeWidth="1.2" />
        </marker>
      </defs>

      {/* ══ Titles ══ */}
      <text x={L_CX} y="22" textAnchor="middle" fontSize="11" fontWeight="700" fill="#9B3B3E">
        ✗ Groove too deep
      </text>
      <text x={L_CX} y="36" textAnchor="middle" fontSize="9.5" fill="#9B3B3E">
        insufficient squeeze — leak risk
      </text>
      <text x={R_CX} y="22" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4B7B4E">
        ✓ Target squeeze achieved
      </text>
      <text x={R_CX} y="36" textAnchor="middle" fontSize="9.5" fill="#4B7B4E">
        {squeeze.toFixed(0)}% squeeze — ring seals on both faces
      </text>

      {/* ═════════════ LEFT — TOO DEEP ═════════════ */}

      {/* Lid / mating surface */}
      <rect x="40" y={LID_TOP} width="156" height={FACE_Y - LID_TOP}
            fill="#E7EAEC" stroke="#5F6164" strokeWidth="1.3" />
      <rect x="40" y={LID_TOP} width="156" height={FACE_Y - LID_TOP}
            fill="url(#ogHatch)" stroke="none" />

      {/* Part body with the groove cut into it */}
      <path
        d={`M40,${FACE_Y} L${L_CX - HALF_GROOVE},${FACE_Y} L${L_CX - HALF_GROOVE},${badFloor}
            L${L_CX + HALF_GROOVE},${badFloor} L${L_CX + HALF_GROOVE},${FACE_Y}
            L196,${FACE_Y} L196,${BODY_BOT} L40,${BODY_BOT} Z`}
        fill="#E7EAEC" stroke="#5F6164" strokeWidth="1.3" />
      <path
        d={`M40,${FACE_Y} L${L_CX - HALF_GROOVE},${FACE_Y} L${L_CX - HALF_GROOVE},${badFloor}
            L${L_CX + HALF_GROOVE},${badFloor} L${L_CX + HALF_GROOVE},${FACE_Y}
            L196,${FACE_Y} L196,${BODY_BOT} L40,${BODY_BOT} Z`}
        fill="url(#ogHatch)" stroke="none" />

      {/* The ring, uncompressed — it never touches the lid */}
      <circle cx={L_CX} cy={badCy} r={R_PX}
              fill="#F3E7E8" stroke="#9B3B3E" strokeWidth="1.8" />

      {/* The leak path */}
      <line x1={L_CX} y1={FACE_Y} x2={L_CX} y2={badTop}
            stroke="#9B3B3E" strokeWidth="1.3"
            markerStart="url(#ogGap)" markerEnd="url(#ogGap)" />
      <line x1={L_CX + 6} y1={FACE_Y + gapPx / 2} x2={176} y2={FACE_Y - 4}
            stroke="#9B3B3E" strokeWidth="0.9" />
      <text x="150" y={FACE_Y - 8} fontSize="9" fontWeight="700" fill="#9B3B3E">
        gap
      </text>

      {/* W dimension across the free ring */}
      <line x1={L_CX - R_PX} y1={badCy} x2={L_CX + R_PX} y2={badCy}
            stroke="#7A2B2E" strokeWidth="1" markerStart="url(#ogGap)" markerEnd="url(#ogGap)" />
      <text x={L_CX} y={badCy - 5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#7A2B2E">
        W = {W.toFixed(2)}
      </text>

      {/* Groove depth dimension. The label is rotated to run alongside the
          dimension line — horizontal text has nowhere near enough room between
          the groove wall and the ring. */}
      <line x1={L_CX - HALF_GROOVE + 13} y1={FACE_Y} x2={L_CX - HALF_GROOVE + 13} y2={badFloor}
            stroke="#9B3B3E" strokeWidth="1" markerStart="url(#ogGap)" markerEnd="url(#ogGap)" />
      <text
        x={L_CX - HALF_GROOVE + 8} y={(FACE_Y + badFloor) / 2}
        textAnchor="middle" fontSize="9" fontWeight="700" fill="#9B3B3E"
        transform={`rotate(-90 ${L_CX - HALF_GROOVE + 8} ${(FACE_Y + badFloor) / 2})`}
      >
        G &gt; W
      </text>

      {/* ═════════════ RIGHT — CORRECT ═════════════ */}

      <rect x="264" y={LID_TOP} width="156" height={FACE_Y - LID_TOP}
            fill="#E7EAEC" stroke="#5F6164" strokeWidth="1.3" />
      <rect x="264" y={LID_TOP} width="156" height={FACE_Y - LID_TOP}
            fill="url(#ogHatch)" stroke="none" />

      <path
        d={`M264,${FACE_Y} L${R_CX - HALF_GROOVE},${FACE_Y} L${R_CX - HALF_GROOVE},${goodFloor}
            L${R_CX + HALF_GROOVE},${goodFloor} L${R_CX + HALF_GROOVE},${FACE_Y}
            L420,${FACE_Y} L420,${BODY_BOT} L264,${BODY_BOT} Z`}
        fill="#E7EAEC" stroke="#5F6164" strokeWidth="1.3" />
      <path
        d={`M264,${FACE_Y} L${R_CX - HALF_GROOVE},${FACE_Y} L${R_CX - HALF_GROOVE},${goodFloor}
            L${R_CX + HALF_GROOVE},${goodFloor} L${R_CX + HALF_GROOVE},${FACE_Y}
            L420,${FACE_Y} L420,${BODY_BOT} L264,${BODY_BOT} Z`}
        fill="url(#ogHatch)" stroke="none" />

      {/* Free-state outline — the overlap with the lid is exactly the squeeze */}
      <circle cx={R_CX} cy={goodFloor - R_PX} r={R_PX}
              fill="none" stroke="#98999B" strokeWidth="1.1" strokeDasharray="4 3" />

      {/* The ring as actually compressed: touching floor AND lid */}
      <ellipse cx={R_CX} cy={goodFloor - ry} rx={rx} ry={ry}
               fill="#E9EFEA" stroke="#4B7B4E" strokeWidth="1.8" />

      {/* Contact call-outs — a seal needs BOTH faces loaded */}
      <circle cx={R_CX} cy={FACE_Y} r="2.6" fill="#4B7B4E" />
      <circle cx={R_CX} cy={goodFloor} r="2.6" fill="#4B7B4E" />
      <line x1={R_CX + rx - 4} y1={FACE_Y} x2="404" y2={FACE_Y - 16}
            stroke="#4B7B4E" strokeWidth="0.9" />
      <text x="368" y={FACE_Y - 20} fontSize="9" fontWeight="700" fill="#4B7B4E">
        sealing contact
      </text>

      {/* Groove depth dimension, rotated for the same reason as the left one */}
      <line x1={R_CX - HALF_GROOVE + 13} y1={FACE_Y} x2={R_CX - HALF_GROOVE + 13} y2={goodFloor}
            stroke="#2B4C7E" strokeWidth="1" markerStart="url(#ogDim)" markerEnd="url(#ogDim)" />
      <text
        x={R_CX - HALF_GROOVE + 8} y={(FACE_Y + goodFloor) / 2}
        textAnchor="middle" fontSize="9" fontWeight="700" fill="#2B4C7E"
        transform={`rotate(-90 ${R_CX - HALF_GROOVE + 8} ${(FACE_Y + goodFloor) / 2})`}
      >
        G = {G.toFixed(2)}
      </text>

      {/*
        Label the dashed free-state outline instead of trying to dimension the
        squeeze separately: the squeeze IS the region where that dashed circle
        overlaps the lid, which the drawing already shows. An earlier version
        drew a "squeeze" dimension off to the right, where it sat inside the lid
        and measured nothing.
      */}
      <line x1={R_CX - 21} y1={goodFloor - W_PX + 9} x2="286" y2={LID_TOP - 8}
            stroke="#98999B" strokeWidth="0.9" />
      <text x="284" y={LID_TOP - 11} textAnchor="end" fontSize="8.5" fill="#5F6164">
        free-state outline — overlap = squeeze
      </text>

      {/* ══ Footnote ══ */}
      <text x="230" y="216" textAnchor="middle" fontSize="9" fill="#98999B" fontStyle="italic">
        Squeeze % = (W − G) / W × 100 — a deeper groove gives LESS squeeze, not more.
      </text>
    </svg>
  );
}
