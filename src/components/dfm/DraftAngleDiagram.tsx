/**
 * Injection Molding — Draft Angle Diagram
 *
 * An original engineering-style SVG cross-section through one wall of a molded
 * part, drawn twice side by side:
 *
 *   LEFT  — a DRAFTED wall. Because the cavity tapers (wider at the opening,
 *           narrower at the floor), the moment the part starts moving up it
 *           separates from the steel on both sides. Clean release.
 *   RIGHT — an UNDRAFTED (0°) wall. The part sides stay in full contact with
 *           the steel for the entire ejection stroke, so it scrapes the whole
 *           way out — drag marks, scuffing, and ejector-pin stress.
 *
 * The draft angle here is drawn at roughly 10° rather than the real-world 1–2°.
 * At true scale the taper would be about one pixel and invisible; the point of
 * the drawing is the *mechanism*, not the magnitude.
 *
 * Pure display component — no state, no props, no event handlers, so it does
 * NOT need "use client".
 */

export default function DraftAngleDiagram() {
  // ─── Shared vertical geometry (same for both halves) ───────────────────────
  const MOLD_TOP = 118;   // y of the mold's parting surface (top face of steel)
  const MOLD_BOT = 232;   // y of the bottom of the steel block
  const FLOOR    = 214;   // y of the cavity floor
  const LIFT     = 30;    // how far the part has been pushed up by the ejectors

  // ─── LEFT: drafted wall ────────────────────────────────────────────────────
  const L_CX     = 108;   // horizontal center of the left cavity
  const L_HW_BOT = 40;    // cavity half-width at the floor (narrow end)
  const L_HW_TOP = 58;    // cavity half-width at the opening (wide end)

  // Cavity wall x-positions at the floor and at the parting surface
  const Lw_botL = L_CX - L_HW_BOT, Lw_botR = L_CX + L_HW_BOT;
  const Lw_topL = L_CX - L_HW_TOP, Lw_topR = L_CX + L_HW_TOP;

  // The part, drawn already lifted by LIFT. It keeps the cavity's taper, so its
  // narrow bottom end now sits in a wider part of the cavity → visible clearance.
  const Lp_botY = FLOOR - LIFT;          // 184
  const Lp_topY = MOLD_TOP - LIFT;       // 88  (part top clears the mold face)

  // ─── RIGHT: undrafted wall ─────────────────────────────────────────────────
  const R_CX = 340;
  const R_HW = 40;                        // same half-width top and bottom → 0° draft
  const Rw_L = R_CX - R_HW, Rw_R = R_CX + R_HW;
  const Rp_botY = FLOOR - LIFT;
  const Rp_topY = MOLD_TOP - LIFT;

  return (
    <svg viewBox="0 0 460 300" className="w-full h-auto" role="img"
         aria-label="Cross-section comparing a drafted mold wall releasing cleanly against an undrafted wall dragging on ejection">
      <defs>
        {/* Diagonal hatch = the classic section-view convention for cut steel */}
        <pattern id="draftHatch" width="7" height="7" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#CDD2D5" strokeWidth="1.6" />
        </pattern>
        {/* Arrowhead for the ejection-direction arrows */}
        <marker id="draftArrow" markerWidth="8" markerHeight="8" refX="4" refY="4"
                orient="auto">
          <path d="M0,1 L7,4 L0,7 Z" fill="#5F6164" />
        </marker>
      </defs>

      {/* ══ Titles ══ */}
      <text x={L_CX} y="18" textAnchor="middle" fontSize="11" fontWeight="600" fill="#4B7B4E">
        ✓ 1–2° draft — releases cleanly
      </text>
      <text x={R_CX} y="18" textAnchor="middle" fontSize="11" fontWeight="600" fill="#9B3B3E">
        ✗ 0° draft — drags on the steel
      </text>

      {/* ══════════════════ LEFT — DRAFTED ══════════════════ */}

      {/* Ejection direction */}
      <line x1={L_CX} y1="80" x2={L_CX} y2="48" stroke="#5F6164" strokeWidth="1.6"
            markerEnd="url(#draftArrow)" />
      <text x={L_CX + 8} y="62" fontSize="9" fill="#5F6164">ejection</text>

      {/* Mold steel, drawn as one path: outer block with the tapered cavity cut out */}
      <path
        d={`M20,${MOLD_TOP} L${Lw_topL},${MOLD_TOP} L${Lw_botL},${FLOOR}
            L${Lw_botR},${FLOOR} L${Lw_topR},${MOLD_TOP} L196,${MOLD_TOP}
            L196,${MOLD_BOT} L20,${MOLD_BOT} Z`}
        fill="#E7EAEC" stroke="#98999B" strokeWidth="1.5" />
      <path
        d={`M20,${MOLD_TOP} L${Lw_topL},${MOLD_TOP} L${Lw_botL},${FLOOR}
            L${Lw_botR},${FLOOR} L${Lw_topR},${MOLD_TOP} L196,${MOLD_TOP}
            L196,${MOLD_BOT} L20,${MOLD_BOT} Z`}
        fill="url(#draftHatch)" stroke="none" />

      {/* The molded part, lifted — note the wedge of daylight on both sides */}
      <path
        d={`M${Lw_topL},${Lp_topY} L${Lw_topR},${Lp_topY}
            L${Lw_botR},${Lp_botY} L${Lw_botL},${Lp_botY} Z`}
        fill="#BFC9D8" stroke="#2B4C7E" strokeWidth="1.8" />

      {/* Angle annotation, hung off the part's TOP-LEFT corner. That corner sits
          in open air above the mold face, so the reference line, the arc, and the
          label all stay clear of both the part fill and the steel hatch. */}
      <line x1={Lw_topL} y1={Lp_topY} x2={Lw_topL} y2={Lp_topY + 34}
            stroke="#2B4C7E" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
      {/* Arc swept from the vertical reference across to the drafted face */}
      <path d={`M${Lw_topL},${Lp_topY + 28} A 28 28 0 0 0 ${Lw_topL + 5.2},${Lp_topY + 27.5}`}
            fill="none" stroke="#2B4C7E" strokeWidth="1.3" />
      {/* Leader from the label down to the arc */}
      <line x1={Lw_topL - 4} y1={Lp_topY - 6} x2={Lw_topL + 3} y2={Lp_topY + 24}
            stroke="#2B4C7E" strokeWidth="1" />
      {/* Anchored at the START, not the end — right-anchoring here ran the text
          off the left edge of the viewBox and clipped the first letter. */}
      <text x="4" y={Lp_topY - 10} fontSize="10" fontWeight="600" fill="#2B4C7E">
        draft angle
      </text>

      {/* Call out the gap that draft buys you */}
      <text x={Lw_botR + 16} y={Lp_botY + 4} fontSize="9" fill="#4B7B4E" fontWeight="600">
        gap opens
      </text>
      <text x={Lw_botR + 16} y={Lp_botY + 14} fontSize="9" fill="#4B7B4E">
        immediately
      </text>

      {/* ══════════════════ RIGHT — UNDRAFTED ══════════════════ */}

      <line x1={R_CX} y1="80" x2={R_CX} y2="48" stroke="#5F6164" strokeWidth="1.6"
            markerEnd="url(#draftArrow)" />
      <text x={R_CX + 8} y="62" fontSize="9" fill="#5F6164">ejection</text>

      <path
        d={`M252,${MOLD_TOP} L${Rw_L},${MOLD_TOP} L${Rw_L},${FLOOR}
            L${Rw_R},${FLOOR} L${Rw_R},${MOLD_TOP} L428,${MOLD_TOP}
            L428,${MOLD_BOT} L252,${MOLD_BOT} Z`}
        fill="#E7EAEC" stroke="#98999B" strokeWidth="1.5" />
      <path
        d={`M252,${MOLD_TOP} L${Rw_L},${MOLD_TOP} L${Rw_L},${FLOOR}
            L${Rw_R},${FLOOR} L${Rw_R},${MOLD_TOP} L428,${MOLD_TOP}
            L428,${MOLD_BOT} L252,${MOLD_BOT} Z`}
        fill="url(#draftHatch)" stroke="none" />

      {/* Straight-sided part — same width top and bottom */}
      <rect x={Rw_L} y={Rp_topY} width={R_HW * 2} height={Rp_botY - Rp_topY}
            fill="#F3E7E8" stroke="#9B3B3E" strokeWidth="1.8" />

      {/* Scuff marks where the part is still rubbing the cavity walls */}
      {[128, 140, 152, 164, 176].map(y => (
        <g key={y}>
          <path d={`M${Rw_L - 4},${y} l8,4`} stroke="#9B3B3E" strokeWidth="1.4" />
          <path d={`M${Rw_R - 4},${y} l8,-4`} stroke="#9B3B3E" strokeWidth="1.4" />
        </g>
      ))}

      <text x={Rw_R + 14} y={Rp_botY - 2} fontSize="9" fill="#9B3B3E" fontWeight="600">
        full-height
      </text>
      <text x={Rw_R + 14} y={Rp_botY + 8} fontSize="9" fill="#9B3B3E">
        contact
      </text>

      {/* ══ Footnote ══ */}
      <text x="230" y="256" textAnchor="middle" fontSize="9" fill="#98999B" fontStyle="italic">
        Draft exaggerated for clarity — real draft is typically 1–2° per side.
      </text>
      <text x="230" y="270" textAnchor="middle" fontSize="9" fill="#98999B">
        Rule of thumb: ~1° per 25 mm (1 in) of cavity depth.
      </text>
    </svg>
  );
}
