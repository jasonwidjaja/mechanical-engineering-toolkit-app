/**
 * 3D Printing — Overhang Angle Diagram
 *
 * An original SVG cross-section through a part being built layer by layer,
 * drawn twice:
 *
 *   LEFT  — a 45° overhang. Each new layer is offset from the one below by
 *           roughly one layer height, so a solid majority of it lands on
 *           existing material and bonds normally.
 *   RIGHT — a much steeper overhang. Each layer is offset so far that its outer
 *           end is extruded into open air, so it sags before it solidifies —
 *           and the sag compounds as the layers stack.
 *
 * The staircase rendering is deliberate: an FDM part really is a stack of
 * discrete layers, and drawing it as a smooth ramp would hide exactly the
 * mechanism the diagram exists to explain.
 *
 * Note this rule is specific to FDM and SLA. SLS/MJF parts sit in a bed of
 * unsintered powder that supports overhangs on its own, which is why the
 * guidelines table lists "none needed" for that column.
 *
 * Pure display component — no state, so no "use client" needed.
 */

// Layer height in SVG units — one "layer" of the printed part as drawn.
const LH = 9;
// Column (vertical wall) width, shared by both halves.
const COL_W = 34;

export default function OverhangDiagram() {
  const PLATE_Y = 236;            // top surface of the build plate
  const COL_TOP = 182;            // y where the vertical wall stops and the overhang starts

  // ─── LEFT: 45° overhang ────────────────────────────────────────────────────
  const L_X = 58;                                   // left edge of the wall
  const L_STEP = LH;                                // offset per layer → tan(45°) = 1
  const L_COUNT = 7;
  // Right edge of overhang layer k (k = 0 is the first layer past the wall)
  const lRight = (k: number) => L_X + COL_W + L_STEP * (k + 1);

  // ─── RIGHT: too-steep overhang ─────────────────────────────────────────────
  const R_X = 272;
  const R_STEP = 17;                                // ≈ tan(62°) × LH
  const R_COUNT = 5;
  const rRight = (k: number) => R_X + COL_W + R_STEP * (k + 1);
  // The x that layer k actually has material beneath: the right edge of layer k-1.
  const rSupported = (k: number) => (k === 0 ? R_X + COL_W : rRight(k - 1));

  // Six wall layers below the overhang on each side, drawn bottom-up.
  const wallLayers = [0, 1, 2, 3, 4, 5].map(i => PLATE_Y - LH * (i + 1));

  return (
    <svg viewBox="0 0 460 300" className="w-full h-auto" role="img"
         aria-label="Layer-by-layer cross-section comparing a 45 degree overhang printing cleanly against a steeper unsupported overhang drooping">
      <defs>
        <pattern id="plateHatch" width="6" height="6" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="1.4" />
        </pattern>
      </defs>

      {/* ══ Titles ══ */}
      <text x={L_X + 48} y="18" textAnchor="middle" fontSize="11" fontWeight="600" fill="#16a34a">
        ✓ ~45° from vertical
      </text>
      <text x={L_X + 48} y="31" textAnchor="middle" fontSize="9" fill="#64748b">
        each layer lands on the one below
      </text>
      <text x={R_X + 60} y="18" textAnchor="middle" fontSize="11" fontWeight="600" fill="#dc2626">
        ✗ steeper than ~45°
      </text>
      <text x={R_X + 60} y="31" textAnchor="middle" fontSize="9" fill="#64748b">
        outer end extruded into open air
      </text>

      {/* ═══════════════ LEFT — CLEAN 45° ═══════════════ */}

      {/* Vertical wall, drawn as discrete layers so the stacking reads clearly */}
      {wallLayers.map(y => (
        <rect key={`lw-${y}`} x={L_X} y={y} width={COL_W} height={LH}
              fill="#bfdbfe" stroke="#2563eb" strokeWidth="1" />
      ))}

      {/* Overhang layers — left edge fixed, each one reaching further right */}
      {Array.from({ length: L_COUNT }, (_, k) => {
        const y = COL_TOP - LH * (k + 1);
        return (
          <rect key={`lo-${k}`} x={L_X} y={y} width={lRight(k) - L_X} height={LH}
                fill="#bfdbfe" stroke="#2563eb" strokeWidth="1" />
        );
      })}

      {/* Angle annotation: vertical reference + the staircase's actual slope */}
      <line x1={L_X + COL_W} y1={COL_TOP} x2={L_X + COL_W} y2={COL_TOP - 68}
            stroke="#1e40af" strokeWidth="1" strokeDasharray="3 3" />
      <line x1={L_X + COL_W} y1={COL_TOP} x2={lRight(L_COUNT - 1)} y2={COL_TOP - LH * L_COUNT}
            stroke="#1e40af" strokeWidth="1.2" strokeDasharray="4 2" />
      <path d={`M${L_X + COL_W},${COL_TOP - 46} A 46 46 0 0 1 ${L_X + COL_W + 32.5},${COL_TOP - 32.5}`}
            fill="none" stroke="#1e40af" strokeWidth="1.2" />
      <text x={L_X + COL_W + 6} y={COL_TOP - 52} fontSize="10" fontWeight="700" fill="#1e40af">
        45°
      </text>

      <text x={L_X - 8} y={COL_TOP - LH * L_COUNT - 16} fontSize="9" fill="#16a34a" fontWeight="600">
        bonds normally
      </text>

      {/* ═══════════════ RIGHT — DROOPING ═══════════════ */}

      {wallLayers.map(y => (
        <rect key={`rw-${y}`} x={R_X} y={y} width={COL_W} height={LH}
              fill="#fecaca" stroke="#dc2626" strokeWidth="1" />
      ))}

      {/*
        Each drooping layer is a polygon whose OUTER bottom corner is pulled
        below the nominal layer line, with a curve back to the point where the
        layer below actually supports it. The sag grows with height because
        each layer droops onto an already-drooping one.
      */}
      {Array.from({ length: R_COUNT }, (_, k) => {
        const y = COL_TOP - LH * (k + 1);   // top of this layer
        const xR = rRight(k);
        const xS = rSupported(k);
        const sag = 4 + k * 2.4;            // compounding droop
        return (
          <path
            key={`ro-${k}`}
            d={`M${R_X},${y}
                L${xR},${y}
                L${xR},${y + LH + sag}
                Q${xS + (xR - xS) * 0.45},${y + LH + sag * 0.85} ${xS},${y + LH}
                L${R_X},${y + LH} Z`}
            fill="#fecaca" stroke="#dc2626" strokeWidth="1" strokeLinejoin="round"
          />
        );
      })}

      {/* Angle annotation for the steep side */}
      <line x1={R_X + COL_W} y1={COL_TOP} x2={R_X + COL_W} y2={COL_TOP - 58}
            stroke="#991b1b" strokeWidth="1" strokeDasharray="3 3" />
      <line x1={R_X + COL_W} y1={COL_TOP} x2={rRight(R_COUNT - 1)} y2={COL_TOP - LH * R_COUNT}
            stroke="#991b1b" strokeWidth="1.2" strokeDasharray="4 2" />
      <path d={`M${R_X + COL_W},${COL_TOP - 38} A 38 38 0 0 1 ${R_X + COL_W + 33.5},${COL_TOP - 20.5}`}
            fill="none" stroke="#991b1b" strokeWidth="1.2" />
      <text x={R_X + COL_W + 4} y={COL_TOP - 44} fontSize="10" fontWeight="700" fill="#991b1b">
        ~62°
      </text>

      {/* Droop callout */}
      <line x1={rRight(R_COUNT - 1) - 2} y1={COL_TOP - LH * R_COUNT + LH + 14}
            x2={rRight(R_COUNT - 1) + 16} y2={COL_TOP - LH * R_COUNT - 6}
            stroke="#dc2626" strokeWidth="1" />
      <text x={rRight(R_COUNT - 1) - 34} y={COL_TOP - LH * R_COUNT - 12}
            fontSize="9" fontWeight="600" fill="#dc2626">
        sags before it sets
      </text>

      {/* ══ Build plate ══ */}
      <rect x="20" y={PLATE_Y} width="420" height="13" fill="#e2e8f0"
            stroke="#64748b" strokeWidth="1.4" />
      <rect x="20" y={PLATE_Y} width="420" height="13" fill="url(#plateHatch)" stroke="none" />
      <text x="230" y={PLATE_Y + 25} textAnchor="middle" fontSize="9" fill="#64748b">
        build plate
      </text>

      {/* ══ Footnote ══ */}
      <text x="230" y="282" textAnchor="middle" fontSize="9" fill="#94a3b8" fontStyle="italic">
        FDM and SLA rule — SLS/MJF needs no supports, since unsintered powder holds the overhang up.
      </text>
    </svg>
  );
}
