/**
 * Annotated Weld Symbol
 *
 * One fully labelled symbol pointing at a real joint, plus a row of the basic
 * shapes underneath.
 *
 * The single most misread convention in the whole notation is which side is
 * which — a symbol BELOW the reference line means the arrow side, and ABOVE
 * means the far side. It reads backwards to most people the first several
 * times, so this drawing shows both at once with the joint attached, rather
 * than describing them separately.
 *
 * Scope is the handful you'd meet on a fabrication drawing, not AWS A2.4 in
 * full.
 *
 * Pure display component (no state), so no "use client" needed.
 */

const REF_Y = 120;    // the reference line
const REF_X0 = 150;   // tail end
const REF_X1 = 320;   // elbow end, where the arrow leaves

export default function WeldSymbolDiagram() {
  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-auto"
      role="img"
      aria-label="An annotated weld symbol: a horizontal reference line with a tail at one end and an arrow at the other pointing to a T-joint, a fillet symbol below the line for the arrow side and above the line for the other side, and a circle at the elbow meaning weld all around. Below, the basic fillet, square groove, V-groove and field weld symbols."
    >
      <defs>
        <marker id="wsArrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5"
                orient="auto">
          <path d="M0,1.5 L8,4.5 L0,7.5 Z" fill="#1e293b" />
        </marker>
        <pattern id="wsHatch" width="5" height="5" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#cbd5e1" strokeWidth="1.1" />
        </pattern>
      </defs>

      {/* ══════════ The joint the arrow points at ══════════ */}
      {/* Horizontal member */}
      <rect x="344" y="172" width="98" height="14" fill="#e2e8f0" stroke="#64748b"
            strokeWidth="1.2" />
      <rect x="344" y="172" width="98" height="14" fill="url(#wsHatch)" stroke="none" />
      {/* Vertical member, forming a T */}
      <rect x="382" y="124" width="14" height="48" fill="#e2e8f0" stroke="#64748b"
            strokeWidth="1.2" />
      <rect x="382" y="124" width="14" height="48" fill="url(#wsHatch)" stroke="none" />

      {/* ══════════ Reference line, tail and arrow ══════════ */}
      <line x1={REF_X0} y1={REF_Y} x2={REF_X1} y2={REF_Y} stroke="#1e293b" strokeWidth="2" />
      {/* Tail — where the process or spec goes, omitted when there isn't one */}
      <path d={`M${REF_X0},${REF_Y} L${REF_X0 - 17},${REF_Y - 11} M${REF_X0},${REF_Y} L${REF_X0 - 17},${REF_Y + 11}`}
            stroke="#1e293b" strokeWidth="2" fill="none" />
      {/* Arrow, from the elbow to the joint */}
      <line x1={REF_X1} y1={REF_Y} x2="378" y2="168" stroke="#1e293b" strokeWidth="2"
            markerEnd="url(#wsArrow)" />

      {/* ══════════ Weld symbols on the reference line ══════════ */}
      {/* OTHER side — above the line */}
      <path d={`M200,${REF_Y} L200,${REF_Y - 20} L220,${REF_Y} Z`}
            fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="1.8" />
      <text x="194" y={REF_Y - 7} textAnchor="end" fontSize="10.5" fontWeight="700" fill="#1d4ed8">
        6
      </text>

      {/* ARROW side — below the line */}
      <path d={`M244,${REF_Y} L244,${REF_Y + 20} L264,${REF_Y} Z`}
            fill="#fed7aa" stroke="#c2410c" strokeWidth="1.8" />
      <text x="238" y={REF_Y + 15} textAnchor="end" fontSize="10.5" fontWeight="700" fill="#c2410c">
        6
      </text>

      {/* Weld-all-around circle, at the elbow */}
      <circle cx={REF_X1} cy={REF_Y} r="6.5" fill="none" stroke="#7c3aed" strokeWidth="2" />

      {/* ══════════ Callouts ══════════ */}
      {/* Other side */}
      <line x1="210" y1={REF_Y - 21} x2="196" y2="60" stroke="#1d4ed8" strokeWidth="0.8" />
      <text x="192" y="52" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d4ed8">
        OTHER side
      </text>
      <text x="192" y="42" textAnchor="middle" fontSize="8.5" fill="#3b82f6">
        symbol ABOVE the line
      </text>

      {/* Arrow side */}
      <line x1="254" y1={REF_Y + 21} x2="268" y2="182" stroke="#c2410c" strokeWidth="0.8" />
      <text x="272" y="192" fontSize="9" fontWeight="700" fill="#c2410c">
        ARROW side
      </text>
      <text x="272" y="202" fontSize="8.5" fill="#ea580c">
        symbol BELOW the line
      </text>

      {/* Reference line */}
      <line x1="172" y1={REF_Y + 1} x2="150" y2="158" stroke="#64748b" strokeWidth="0.8" />
      <text x="146" y="168" textAnchor="end" fontSize="8.5" fill="#475569">
        reference line
      </text>

      {/* Tail */}
      <line x1="138" y1={REF_Y - 8} x2="120" y2="82" stroke="#64748b" strokeWidth="0.8" />
      <text x="116" y="76" textAnchor="end" fontSize="8.5" fill="#475569">
        tail — process / spec
      </text>
      <text x="116" y="66" textAnchor="end" fontSize="8" fill="#94a3b8">
        (omitted if unused)
      </text>

      {/* All around */}
      <line x1={REF_X1 + 6} y1={REF_Y - 6} x2="356" y2="84" stroke="#7c3aed" strokeWidth="0.8" />
      <text x="360" y="80" fontSize="8.5" fontWeight="700" fill="#7c3aed">
        weld all around
      </text>

      {/* Arrow. Sits under the joint rather than beside it — to the right there
          were only ~60px before the viewBox edge, which clipped the last word. */}
      <text x="393" y="215" textAnchor="middle" fontSize="8.5" fill="#475569">
        arrow → the joint
      </text>

      {/* Leg size. Parked bottom-left, clear of the reference-line and
          arrow-side leaders that cross the middle of the drawing. */}
      <text x="14" y="206" fontSize="8" fill="#94a3b8">
        number left of the symbol = leg size (mm)
      </text>

      {/* ══════════ Basic shapes row ══════════ */}
      <line x1="14" y1="228" x2="446" y2="228" stroke="#e2e8f0" strokeWidth="1" />
      <text x="14" y="222" fontSize="9" fontWeight="700" fill="#475569">
        Basic symbols
      </text>

      {[
        { cx: 68, name: "Fillet", draw: "fillet" },
        { cx: 178, name: "Square groove", draw: "square" },
        { cx: 288, name: "V-groove", draw: "vee" },
        { cx: 396, name: "Field weld", draw: "field" },
      ].map(s => {
        const y = 256; // mini reference line
        return (
          <g key={s.name}>
            <line x1={s.cx - 28} y1={y} x2={s.cx + 28} y2={y} stroke="#1e293b" strokeWidth="1.6" />

            {s.draw === "fillet" && (
              <path d={`M${s.cx - 10},${y} L${s.cx - 10},${y + 15} L${s.cx + 5},${y} Z`}
                    fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
            )}
            {s.draw === "square" && (
              <>
                <line x1={s.cx - 6} y1={y} x2={s.cx - 6} y2={y + 15} stroke="#c2410c" strokeWidth="1.8" />
                <line x1={s.cx + 6} y1={y} x2={s.cx + 6} y2={y + 15} stroke="#c2410c" strokeWidth="1.8" />
              </>
            )}
            {s.draw === "vee" && (
              <path d={`M${s.cx - 9},${y + 15} L${s.cx},${y} L${s.cx + 9},${y + 15}`}
                    fill="none" stroke="#c2410c" strokeWidth="1.8" />
            )}
            {s.draw === "field" && (
              <>
                {/* Flag at the elbow: staff up, pennant to the right */}
                <line x1={s.cx + 28} y1={y} x2={s.cx + 28} y2={y - 17} stroke="#7c3aed" strokeWidth="1.8" />
                <path d={`M${s.cx + 28},${y - 17} L${s.cx + 41},${y - 12} L${s.cx + 28},${y - 7} Z`}
                      fill="#7c3aed" />
                <path d={`M${s.cx - 8},${y} L${s.cx - 8},${y + 13} L${s.cx + 5},${y} Z`}
                      fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.3" />
              </>
            )}

            <text x={s.cx} y={y + 30} textAnchor="middle" fontSize="8.5" fill="#475569">
              {s.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
