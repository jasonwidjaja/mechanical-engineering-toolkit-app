/**
 * Casting — Draft, Fillets, and Hot Spots Diagram
 *
 * An original SVG cross-section through a die, drawn twice, at the place where
 * castings most often go wrong: a rib meeting a wall.
 *
 *   LEFT  — a rib proportioned to the wall, with generous fillets and draft on
 *           the rib faces. The largest circle you can inscribe at the junction
 *           is close to the wall thickness, so that region freezes at about the
 *           same time as everything around it, and the part lifts out cleanly.
 *   RIGHT — a heavy rib with sharp internal corners and no draft. The inscribed
 *           circle at the junction is much larger, meaning that pocket of metal
 *           is still liquid after its surroundings have solidified. With no
 *           feed path left, it shrinks into a void.
 *
 * The "largest inscribed circle" is the standard foundry way of spotting a hot
 * spot by eye: wherever you can fit a noticeably bigger circle than the
 * neighbouring wall, that's what solidifies last.
 *
 * Pure display component — no state, so no "use client" needed.
 */

export default function CastingSectionDiagram() {
  const DIE_TOP = 120;    // top face of the die = the parting line
  const DIE_BOT = 244;
  const BASE_TOP = 196;   // top surface of the horizontal wall
  const BASE_BOT = 214;   // bottom of the wall (wall thickness = 18)

  // ─── LEFT: well-proportioned rib ───────────────────────────────────────────
  // Rib is thinner than the wall it joins, filleted, and drafted (121→118).
  const LEFT_PART =
    `M40,${BASE_BOT} L180,${BASE_BOT} L180,${BASE_TOP} L133,${BASE_TOP}
     A12,12 0 0 1 121,184 L118,${DIE_TOP} L102,${DIE_TOP} L99,184
     A12,12 0 0 1 87,${BASE_TOP} L40,${BASE_TOP} Z`;

  // ─── RIGHT: heavy rib, sharp corners, zero draft ───────────────────────────
  const RIGHT_PART =
    `M270,${BASE_BOT} L410,${BASE_BOT} L410,${BASE_TOP} L356,${BASE_TOP}
     L356,${DIE_TOP} L324,${DIE_TOP} L324,${BASE_TOP} L270,${BASE_TOP} Z`;

  return (
    <svg viewBox="0 0 460 314" className="w-full h-auto" role="img"
         aria-label="Die cross-section comparing a drafted filleted rib that releases cleanly against an undrafted sharp-cornered rib with a shrinkage porosity hot spot">
      <defs>
        <pattern id="dieHatch" width="7" height="7" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#cbd5e1" strokeWidth="1.6" />
        </pattern>
        <marker id="castArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,1 L7,4 L0,7 Z" fill="#475569" />
        </marker>
      </defs>

      {/* ══ Titles ══ */}
      <text x="110" y="18" textAnchor="middle" fontSize="11" fontWeight="600" fill="#16a34a">
        ✓ Drafted + filleted
      </text>
      <text x="110" y="31" textAnchor="middle" fontSize="9" fill="#64748b">
        uniform section, cools evenly
      </text>
      <text x="340" y="18" textAnchor="middle" fontSize="11" fontWeight="600" fill="#dc2626">
        ✗ Sharp corners + no draft
      </text>
      <text x="340" y="31" textAnchor="middle" fontSize="9" fill="#64748b">
        heavy junction freezes last
      </text>

      {/* Ejection arrows */}
      <line x1="110" y1="104" x2="110" y2="72" stroke="#475569" strokeWidth="1.6"
            markerEnd="url(#castArrow)" />
      <text x="118" y="88" fontSize="9" fill="#64748b">ejection</text>
      <line x1="340" y1="104" x2="340" y2="72" stroke="#475569" strokeWidth="1.6"
            markerEnd="url(#castArrow)" />
      <text x="348" y="88" fontSize="9" fill="#64748b">ejection</text>

      {/* ═══════════════ LEFT ═══════════════ */}

      {/* Die steel: outer block with the part shape subtracted via evenodd fill */}
      <path d={`M20,${DIE_TOP} H200 V${DIE_BOT} H20 Z ${LEFT_PART}`}
            fillRule="evenodd" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
      <path d={`M20,${DIE_TOP} H200 V${DIE_BOT} H20 Z ${LEFT_PART}`}
            fillRule="evenodd" fill="url(#dieHatch)" stroke="none" />

      {/* The casting itself */}
      <path d={LEFT_PART} fill="#bfdbfe" stroke="#2563eb" strokeWidth="1.7"
            strokeLinejoin="round" />

      {/* Largest inscribed circle at the junction — close to the wall thickness */}
      <circle cx="110" cy="190" r="11" fill="none" stroke="#16a34a" strokeWidth="1.4"
              strokeDasharray="4 3" />
      <line x1="121" y1="190" x2="152" y2="172" stroke="#16a34a" strokeWidth="1" />
      <text x="150" y="168" fontSize="9" fontWeight="600" fill="#16a34a">no hot spot</text>

      {/* Fillet callout */}
      <line x1="92" y1="190" x2="52" y2="170" stroke="#2563eb" strokeWidth="1" />
      <text x="24" y="166" fontSize="9" fontWeight="600" fill="#2563eb">fillet</text>

      {/* Draft callout on the rib face */}
      <line x1="119" y1="150" x2="156" y2="140" stroke="#2563eb" strokeWidth="1" />
      <text x="152" y="136" fontSize="9" fontWeight="600" fill="#2563eb">draft ≥ 1°</text>

      {/* ═══════════════ RIGHT ═══════════════ */}

      <path d={`M250,${DIE_TOP} H430 V${DIE_BOT} H250 Z ${RIGHT_PART}`}
            fillRule="evenodd" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
      <path d={`M250,${DIE_TOP} H430 V${DIE_BOT} H250 Z ${RIGHT_PART}`}
            fillRule="evenodd" fill="url(#dieHatch)" stroke="none" />

      <path d={RIGHT_PART} fill="#fecaca" stroke="#dc2626" strokeWidth="1.7" />

      {/* Much larger inscribed circle → this is the hot spot */}
      <circle cx="340" cy="190" r="16" fill="#fca5a5" stroke="#dc2626" strokeWidth="1.4"
              strokeDasharray="4 3" />
      {/* The void that forms when it finally freezes with nothing left to feed it */}
      <path d="M336,186 q5,-3 8,1 q4,4 -1,7 q-6,3 -8,-2 q-2,-4 1,-6 Z"
            fill="#7f1d1d" stroke="none" />

      <line x1="356" y1="186" x2="392" y2="168" stroke="#dc2626" strokeWidth="1" />
      <text x="366" y="153" fontSize="9" fontWeight="600" fill="#dc2626">hot spot →</text>
      <text x="366" y="164" fontSize="9" fontWeight="600" fill="#dc2626">shrinkage porosity</text>

      {/* Sharp corner callout */}
      <line x1="324" y1="196" x2="288" y2="172" stroke="#dc2626" strokeWidth="1" />
      <text x="256" y="168" fontSize="9" fontWeight="600" fill="#dc2626">sharp corner</text>

      {/* Scuff marks — zero draft means the rib rubs the die all the way out */}
      {[136, 150, 164, 178].map(y => (
        <g key={y}>
          <path d={`M320,${y} l8,4`} stroke="#dc2626" strokeWidth="1.3" />
          <path d={`M352,${y} l8,-4`} stroke="#dc2626" strokeWidth="1.3" />
        </g>
      ))}

      {/* ══ Parting line ══ */}
      <line x1="14" y1={DIE_TOP} x2="446" y2={DIE_TOP} stroke="#f59e0b" strokeWidth="1.3"
            strokeDasharray="10 3 2 3" opacity="0.85" />
      <text x="446" y={DIE_TOP - 6} textAnchor="end" fontSize="9" fontWeight="600" fill="#b45309">
        parting line
      </text>

      {/* Wall-thickness note, kept below the die block so it doesn't sit on the hatch */}
      <text x="230" y={DIE_BOT + 18} textAnchor="middle" fontSize="9" fill="#64748b">
        Keep every section within ~2× the thinnest wall.
      </text>

      {/* ══ Footnote ══ */}
      <text x="230" y="292" textAnchor="middle" fontSize="9" fill="#94a3b8" fontStyle="italic">
        Largest-inscribed-circle test: if a junction fits a noticeably bigger circle than its
      </text>
      <text x="230" y="304" textAnchor="middle" fontSize="9" fill="#94a3b8" fontStyle="italic">
        neighbouring walls, that is what solidifies last — and where porosity forms.
      </text>
    </svg>
  );
}
