/**
 * Gear Pair Diagram — one stage of a gear train
 *
 * Two meshing external gears drawn to scale: pitch radius is proportional to
 * tooth count, because that IS the relationship (r ∝ N for a given module).
 * So a 3:1 stage visibly looks like 3:1 rather than being asserted in text.
 *
 * The rotation arrows point opposite ways. That's not decoration — an external
 * mesh always reverses direction, and it's the thing people forget when they
 * chain stages together and end up driving their output backwards.
 *
 * A compound train renders one of these per stage, chained left to right by the
 * panel that owns it.
 *
 * Pure display component (no state), so no "use client" needed.
 */

type Props = {
  /** Driver tooth count. */
  n1: number;
  /** Driven tooth count. */
  n2: number;
  /** 1-based stage number, shown in the corner. */
  stage: number;
  /**
   * Rotation sense of the DRIVER, as a screen direction. Each external mesh
   * flips it, so stage 2's driver spins opposite stage 1's driver.
   */
  driverClockwise: boolean;
};

const CX = 110;   // horizontal centre of the drawing
const CY = 80;    // vertical centre of both gear axes
const R_MAX = 42; // pitch radius of the larger gear
const R_MIN = 14; // floor, so a tiny pinion is still drawable

/** Point on a circle, in SVG coordinates (y grows downward). */
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Radial tooth ticks around a pitch circle. Capped so a 90-tooth gear
 *  doesn't turn into a solid ring of ink. */
function teeth(cx: number, cy: number, r: number, n: number) {
  const count = Math.min(Math.max(n, 6), 28);
  return Array.from({ length: count }, (_, i) => {
    const deg = (360 / count) * i;
    const a = polar(cx, cy, r, deg);
    const b = polar(cx, cy, r + 5, deg);
    return `M${a.x.toFixed(2)},${a.y.toFixed(2)} L${b.x.toFixed(2)},${b.y.toFixed(2)}`;
  }).join(" ");
}

/** Curved rotation arrow arcing over the top of a gear. */
function rotationArc(cx: number, cy: number, r: number, clockwise: boolean) {
  const R = r + 13;
  // 200°–340° in SVG coords traces an arc across the top of the circle.
  const from = clockwise ? 200 : 340;
  const to = clockwise ? 340 : 200;
  const p1 = polar(cx, cy, R, from);
  const p2 = polar(cx, cy, R, to);
  // sweep=1 walks angles upward, sweep=0 downward.
  const sweep = clockwise ? 1 : 0;
  return `M${p1.x.toFixed(2)},${p1.y.toFixed(2)} A${R},${R} 0 0 ${sweep} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
}

export default function GearPairDiagram({ n1, n2, stage, driverClockwise }: Props) {
  // Pitch radius ∝ tooth count, normalised so the larger gear is always R_MAX.
  const biggest = Math.max(n1, n2, 1);
  const r1 = Math.max((R_MAX * n1) / biggest, R_MIN);
  const r2 = Math.max((R_MAX * n2) / biggest, R_MIN);

  // Centre distance is r1 + r2 for an external mesh — the pitch circles touch.
  const x1 = CX - (r1 + r2) / 2;
  const x2 = CX + (r1 + r2) / 2;

  const ratio = n1 > 0 ? n2 / n1 : 0;

  return (
    <svg
      viewBox="0 0 220 172"
      className="w-full h-auto"
      role="img"
      aria-label={`Stage ${stage}: a ${n1}-tooth driver gear meshing with a ${n2}-tooth driven gear, giving a ${ratio.toFixed(2)} to 1 reduction. The two gears turn in opposite directions.`}
    >
      <defs>
        <marker id={`gearArr${stage}`} markerWidth="7" markerHeight="7" refX="5.5" refY="3.5"
                orient="auto">
          <path d="M0,1 L6,3.5 L0,6 Z" fill="#2563eb" />
        </marker>
      </defs>

      <text x="6" y="14" fontSize="9" fontWeight="700" fill="#94a3b8">
        STAGE {stage}
      </text>

      {/* ── Driver ── */}
      <path d={teeth(x1, CY, r1, n1)} stroke="#1d4ed8" strokeWidth="1.5" fill="none" />
      <circle cx={x1} cy={CY} r={r1} fill="#dbeafe" stroke="#2563eb" strokeWidth="1.6" />
      <circle cx={x1} cy={CY} r={r1} fill="none" stroke="#1d4ed8" strokeWidth="0.7"
              strokeDasharray="3 2" opacity="0.55" />
      <circle cx={x1} cy={CY} r="3.4" fill="#1e3a8a" />
      <path d={rotationArc(x1, CY, r1, driverClockwise)} fill="none" stroke="#2563eb"
            strokeWidth="1.4" markerEnd={`url(#gearArr${stage})`} />

      {/* ── Driven — always turns the opposite way on an external mesh ── */}
      <path d={teeth(x2, CY, r2, n2)} stroke="#047857" strokeWidth="1.5" fill="none" />
      <circle cx={x2} cy={CY} r={r2} fill="#d1fae5" stroke="#059669" strokeWidth="1.6" />
      <circle cx={x2} cy={CY} r={r2} fill="none" stroke="#047857" strokeWidth="0.7"
              strokeDasharray="3 2" opacity="0.55" />
      <circle cx={x2} cy={CY} r="3.4" fill="#064e3b" />
      <path d={rotationArc(x2, CY, r2, !driverClockwise)} fill="none" stroke="#059669"
            strokeWidth="1.4" markerEnd={`url(#gearArr${stage})`} />

      {/* ── Labels ── */}
      <text x={x1} y={CY + r1 + 20} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1d4ed8">
        N₁ = {n1}
      </text>
      <text x={x1} y={CY + r1 + 31} textAnchor="middle" fontSize="8.5" fill="#60a5fa">
        driver
      </text>

      <text x={x2} y={CY + r2 + 20} textAnchor="middle" fontSize="10" fontWeight="700" fill="#047857">
        N₂ = {n2}
      </text>
      <text x={x2} y={CY + r2 + 31} textAnchor="middle" fontSize="8.5" fill="#34d399">
        driven
      </text>

      <text x={CX} y="166" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#475569">
        ratio {ratio.toFixed(2)} : 1
      </text>
    </svg>
  );
}
