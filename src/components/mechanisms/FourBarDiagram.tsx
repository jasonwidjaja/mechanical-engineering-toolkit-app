/**
 * Four-Bar Linkage Diagram
 *
 * Draws the linkage in a real, solved position rather than a generic cartoon —
 * so changing a length actually changes the picture, and a linkage that can't
 * close says so instead of drawing something impossible.
 *
 * The geometry:
 *   A = (0, 0) and D = (L1, 0) are the two fixed pivots (the ground link).
 *   B = A + L2·(cos θ, sin θ) is the input link's moving end.
 *   C is where the coupler (L3, from B) meets the output link (L4, from D) —
 *   found by intersecting a circle of radius L3 about B with one of radius L4
 *   about D.
 *
 * That intersection only exists when |L3 − L4| ≤ |BD| ≤ L3 + L4. Sweeping θ
 * through 360° and recording which angles satisfy it gives, for free, the exact
 * thing the diagram needs to show: whether the input link can rotate all the
 * way round (Grashof) or only rock through a limited arc.
 *
 * Pure display component (no state), so no "use client" needed.
 */

type Props = {
  /** Ground / fixed link. */
  l1: number;
  /** Input link, pinned to ground at A. */
  l2: number;
  /** Coupler — the floating link opposite ground. */
  l3: number;
  /** Output link, pinned to ground at D. */
  l4: number;
};

// Drawing area inside the viewBox.
const VB_W = 460;
const VB_H = 300;
const PAD_X = 46;
const PAD_TOP = 54;
const PAD_BOT = 62;

const EPS = 1e-9;

type Pt = { x: number; y: number };

export default function FourBarDiagram({ l1, l2, l3, l4 }: Props) {
  const lengths = [l1, l2, l3, l4];
  const shortestIdx = lengths.indexOf(Math.min(...lengths));

  const A: Pt = { x: 0, y: 0 };
  const D: Pt = { x: l1, y: 0 };

  /** Can the loop close with the input link at this angle? */
  const closes = (deg: number) => {
    const t = (deg * Math.PI) / 180;
    const bx = l2 * Math.cos(t);
    const by = l2 * Math.sin(t);
    const d = Math.hypot(D.x - bx, D.y - by);
    return d <= l3 + l4 + 1e-6 && d >= Math.abs(l3 - l4) - 1e-6;
  };

  // Sample the full revolution once; everything below reads off this.
  const valid = Array.from({ length: 360 }, (_, deg) => closes(deg));
  const validCount = valid.filter(Boolean).length;
  const fullRotation = validCount === 360;

  // Nothing to draw — these four lengths never form a closed loop.
  if (validCount === 0) {
    return (
      <svg viewBox={`0 0 ${VB_W} 160`} className="w-full h-auto" role="img"
           aria-label="These four link lengths cannot form a closed four-bar linkage.">
        <rect x="1" y="1" width={VB_W - 2} height="158" rx="10"
              fill="#fef2f2" stroke="#fecaca" strokeWidth="1.5" />
        <text x={VB_W / 2} y="70" textAnchor="middle" fontSize="13" fontWeight="700" fill="#b91c1c">
          These lengths cannot form a closed loop
        </text>
        <text x={VB_W / 2} y="94" textAnchor="middle" fontSize="10.5" fill="#991b1b">
          One link is longer than the other three combined, so the linkage can never close.
        </text>
        <text x={VB_W / 2} y="112" textAnchor="middle" fontSize="10.5" fill="#991b1b">
          Shorten it, or lengthen the others, and the diagram will appear.
        </text>
      </svg>
    );
  }

  // Pick a representative angle to draw: 60° if reachable, else the nearest
  // reachable angle to it.
  let theta = 60;
  if (!valid[60]) {
    for (let off = 1; off < 360; off++) {
      if (valid[(60 + off) % 360]) { theta = (60 + off) % 360; break; }
      if (valid[(60 - off + 360) % 360]) { theta = (60 - off + 360) % 360; break; }
    }
  }

  // Walk out from theta in both directions to find the contiguous band of
  // angles the input link can actually sweep through.
  let startDeg = theta;
  let endDeg = theta;
  if (!fullRotation) {
    let steps = 0;
    while (valid[(startDeg - 1 + 360) % 360] && steps++ < 360) startDeg = (startDeg - 1 + 360) % 360;
    steps = 0;
    while (valid[(endDeg + 1) % 360] && steps++ < 360) endDeg = (endDeg + 1) % 360;
  }
  const sweepDeg = fullRotation ? 360 : ((endDeg - startDeg + 360) % 360) + 1;

  // ── Solve the loop at the chosen angle ──
  const t = (theta * Math.PI) / 180;
  const B: Pt = { x: l2 * Math.cos(t), y: l2 * Math.sin(t) };

  const dBD = Math.hypot(D.x - B.x, D.y - B.y);
  // Standard circle–circle intersection: `a` is the distance from B to the
  // radical line, `h` the half-chord. Two roots exist; taking the same sign
  // every time keeps the linkage in one branch instead of flipping mid-drag.
  const a = (l3 * l3 - l4 * l4 + dBD * dBD) / (2 * Math.max(dBD, EPS));
  const hSq = l3 * l3 - a * a;
  const h = Math.sqrt(Math.max(hSq, 0));
  const ux = (D.x - B.x) / Math.max(dBD, EPS);
  const uy = (D.y - B.y) / Math.max(dBD, EPS);
  const mid: Pt = { x: B.x + a * ux, y: B.y + a * uy };
  const C: Pt = { x: mid.x - h * uy, y: mid.y + h * ux };

  // ── Fit the model to the viewBox ──
  // Bounds cover both pivot circles, which contain every point we draw.
  const minX = Math.min(-l2, l1 - l4, 0);
  const maxX = Math.max(l2, l1 + l4, l1);
  const minY = Math.min(-l2, -l4);
  const maxY = Math.max(l2, l4);

  const availW = VB_W - PAD_X * 2;
  const availH = VB_H - PAD_TOP - PAD_BOT;
  const scale = Math.min(
    availW / Math.max(maxX - minX, EPS),
    availH / Math.max(maxY - minY, EPS),
  );

  // Aspect ratio is preserved, so one axis usually has slack. Rather than
  // leaving a band of empty SVG, shrink the viewBox to the height actually
  // used — otherwise a wide linkage renders as a small drawing floating in
  // whitespace.
  const usedH = (maxY - minY) * scale;
  const vbH = PAD_TOP + usedH + PAD_BOT;

  // Centre horizontally, and flip Y (model Y is up, SVG Y is down).
  const offX = PAD_X + (availW - (maxX - minX) * scale) / 2 - minX * scale;
  const offY = PAD_TOP + maxY * scale;
  const sx = (x: number) => offX + x * scale;
  const sy = (y: number) => offY - y * scale;

  /** Arc of the input link's reachable travel, drawn about pivot A. */
  const travelArc = () => {
    const r = l2 * scale;
    if (fullRotation) return null;
    const p1 = { x: sx(l2 * Math.cos((startDeg * Math.PI) / 180)), y: sy(l2 * Math.sin((startDeg * Math.PI) / 180)) };
    const p2 = { x: sx(l2 * Math.cos((endDeg * Math.PI) / 180)), y: sy(l2 * Math.sin((endDeg * Math.PI) / 180)) };
    const large = sweepDeg > 180 ? 1 : 0;
    // Y is flipped, so an increasing model angle sweeps counter-clockwise on
    // screen — which is sweep-flag 0 in SVG.
    return `M${p1.x.toFixed(2)},${p1.y.toFixed(2)} A${r.toFixed(2)},${r.toFixed(2)} 0 ${large} 0 ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  };

  const linkColor = (idx: number) => (idx === shortestIdx ? "#dc2626" : "#2563eb");
  const arc = travelArc();

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${vbH.toFixed(1)}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Four-bar linkage with ground ${l1}, input ${l2}, coupler ${l3}, output ${l4}. The input link ${fullRotation ? "rotates a full 360 degrees" : `rocks through about ${sweepDeg} degrees`}.`}
    >
      <defs>
        <pattern id="fbGround" width="6" height="6" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="1.4" />
        </pattern>
        <marker id="fbArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,1.5 L6.5,4 L0,6.5 Z" fill="#7c3aed" />
        </marker>
      </defs>

      {/* ── Reachable travel of the input link ── */}
      {fullRotation ? (
        <circle cx={sx(0)} cy={sy(0)} r={l2 * scale} fill="none" stroke="#16a34a"
                strokeWidth="1.3" strokeDasharray="5 4" opacity="0.8" />
      ) : (
        arc && (
          <path d={arc} fill="none" stroke="#d97706" strokeWidth="2.4"
                strokeDasharray="5 4" opacity="0.9" markerEnd="url(#fbArrow)" />
        )
      )}

      {/* ── Links ── */}
      {/* Ground link (L1) drawn as a plain baseline between the fixed pivots */}
      <line x1={sx(A.x)} y1={sy(A.y)} x2={sx(D.x)} y2={sy(D.y)}
            stroke={linkColor(0)} strokeWidth="3" strokeLinecap="round" />
      {/* Input (L2) */}
      <line x1={sx(A.x)} y1={sy(A.y)} x2={sx(B.x)} y2={sy(B.y)}
            stroke={linkColor(1)} strokeWidth="4" strokeLinecap="round" />
      {/* Coupler (L3) */}
      <line x1={sx(B.x)} y1={sy(B.y)} x2={sx(C.x)} y2={sy(C.y)}
            stroke={linkColor(2)} strokeWidth="4" strokeLinecap="round" />
      {/* Output (L4) */}
      <line x1={sx(C.x)} y1={sy(C.y)} x2={sx(D.x)} y2={sy(D.y)}
            stroke={linkColor(3)} strokeWidth="4" strokeLinecap="round" />

      {/* ── Ground symbols under the two fixed pivots ── */}
      {[A, D].map((P, i) => (
        <g key={i}>
          <path d={`M${sx(P.x)},${sy(P.y)} L${sx(P.x) - 11},${sy(P.y) + 17} L${sx(P.x) + 11},${sy(P.y) + 17} Z`}
                fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2" />
          <rect x={sx(P.x) - 15} y={sy(P.y) + 17} width="30" height="6" fill="url(#fbGround)"
                stroke="#94a3b8" strokeWidth="1" />
        </g>
      ))}

      {/* ── Pin joints ── */}
      {[
        { p: A, label: "A" },
        { p: B, label: "B" },
        { p: C, label: "C" },
        { p: D, label: "D" },
      ].map(({ p, label }) => (
        <g key={label}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r="5" fill="#ffffff" stroke="#334155" strokeWidth="1.8" />
          <text x={sx(p.x) + 9} y={sy(p.y) - 7} fontSize="10" fontWeight="700" fill="#334155"
                stroke="#ffffff" strokeWidth="3" paintOrder="stroke" strokeLinejoin="round">
            {label}
          </text>
        </g>
      ))}

      {/* ── Link length labels ──
             Pushed radially OUTWARD from the middle of the linkage rather than
             straight up. A fixed vertical offset works for horizontal links and
             fails for diagonal ones, where the link runs straight through the
             text. Offsetting away from the centroid clears every link at any
             angle, and lands the labels on the outside where there's room. */}
      {(() => {
        const cxScreen = (sx(A.x) + sx(B.x) + sx(C.x) + sx(D.x)) / 4;
        const cyScreen = (sy(A.y) + sy(B.y) + sy(C.y) + sy(D.y)) / 4;

        return [
          { p1: A, p2: D, idx: 0, name: "L1 ground", v: l1, push: 34 },
          { p1: A, p2: B, idx: 1, name: "L2 input", v: l2, push: 22 },
          { p1: B, p2: C, idx: 2, name: "L3 coupler", v: l3, push: 22 },
          { p1: C, p2: D, idx: 3, name: "L4 output", v: l4, push: 22 },
        ].map(({ p1, p2, idx, name, v, push }) => {
          const x1 = sx(p1.x), y1 = sy(p1.y), x2 = sx(p2.x), y2 = sy(p2.y);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;

          // Offset PERPENDICULAR to the link, on whichever side faces away from
          // the middle of the linkage.
          const dx = x2 - x1, dy = y2 - y1;
          const dLen = Math.hypot(dx, dy) || 1;
          let nx = -dy / dLen, ny = dx / dLen;
          if (nx * (mx - cxScreen) + ny * (my - cyScreen) < 0) { nx = -nx; ny = -ny; }

          return (
            <text
              key={name}
              x={mx + nx * push}
              y={my + ny * push + 3}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight={idx === shortestIdx ? 700 : 600}
              fill={idx === shortestIdx ? "#dc2626" : "#1d4ed8"}
              /*
                White halo behind the glyphs. A perpendicular offset alone can't
                guarantee clearance — a ~100px-wide horizontal label set against
                a steeply sloped link will always be crossed at one end, however
                far out it's pushed. paintOrder="stroke" draws the fat white
                outline first and the fill over it, so the text stays readable
                wherever a link runs behind it.
              */
              stroke="#ffffff"
              strokeWidth="3.5"
              paintOrder="stroke"
              strokeLinejoin="round"
            >
              {name} = {v}
              {idx === shortestIdx ? "  (S)" : ""}
            </text>
          );
        });
      })()}

      {/* ── Verdict banner ── */}
      <text x={VB_W / 2} y="22" textAnchor="middle" fontSize="11" fontWeight="700"
            fill={fullRotation ? "#16a34a" : "#b45309"}>
        {fullRotation
          ? "✓ Input link rotates continuously — 360°"
          : `✗ Input link rocks only — about ${sweepDeg}° of travel`}
      </text>
      <text x={VB_W / 2} y="37" textAnchor="middle" fontSize="9" fill="#64748b">
        {fullRotation
          ? "dashed green circle = the crank's full path; a motor can drive this directly"
          : "amber arc = the limited range the input link can reach before the loop jams"}
      </text>

      {/* Legend note: the shortest link is what the Grashof test turns on. */}
      <text x={VB_W / 2} y={vbH - 12} textAnchor="middle" fontSize="9" fill="#94a3b8"
            fontStyle="italic">
        Shortest link (S) shown in red. Drawn at input angle {theta}° — a valid closed position.
      </text>
    </svg>
  );
}
