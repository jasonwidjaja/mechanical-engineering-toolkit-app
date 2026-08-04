/**
 * Shared O-Ring Cross-Section Diagram
 *
 * Renders an engineering-drawing-style SVG cross-section showing:
 *   - The groove machined into the part body (gray)
 *   - The mating surface closing the groove from above (gray)
 *   - The O-ring in its FREE STATE (dashed circle, diameter W)
 *   - The O-ring COMPRESSED into the groove (solid colored ellipse, height = G)
 *   - Dimension annotations for W and G
 *
 * The dashed free-state circle will visually overlap the mating surface by the
 * squeeze amount — this is intentional and shows WHY compression happens when
 * the housing closes.
 *
 * Used by both the O-Ring Squeeze and O-Ring Groove Sizing calculators.
 * It lives in src/components/ so neither page has to duplicate the code.
 *
 * This is a pure display component (no state, no event handlers), so it
 * does NOT need "use client".
 */

type Props = {
  W: number;  // O-ring free cross-section diameter (mm) — any positive number
  G: number;  // Groove depth (mm) — should be > 0 and typically < W
  status: "green" | "yellow" | "red" | null;  // null = not yet calculated
};

export default function OringCrossSectionDiagram({ W, G, status }: Props) {
  // --- Scale everything so W always appears at a fixed visual size ---
  const W_PX = 68;                        // W always draws this many px tall
  const scale = W_PX / W;                 // multiply any real mm value by this
  const G_PX = Math.max(G * scale, 8);   // groove depth in px (min 8 for visibility)

  // --- Groove and body geometry ---
  const grooveW_PX = W_PX * 1.42;        // typical groove width ≈ 1.4–1.5 × W
  const CX = 200;                         // horizontal center of the 400-wide SVG
  const floorY  = 170;                    // y of groove floor
  const topY    = floorY - G_PX;         // y of groove top = mating surface bottom
  const gLeft   = CX - grooveW_PX / 2;  // left groove wall x
  const gRight  = CX + grooveW_PX / 2;  // right groove wall x
  const bodyExt = 28;                    // part body extends this far past groove walls
  const bodyL   = gLeft  - bodyExt;
  const bodyR   = gRight + bodyExt;
  const bodyBot = floorY + 14;           // bottom edge of part body
  const plateH  = 22;                    // mating surface height
  const plateTop = topY - plateH;

  // --- O-ring geometry ---
  const circR   = W_PX / 2;             // uncompressed circle radius (= W_PX/2)
  const circCY  = floorY - circR;       // circle center y — rests on groove floor

  // Compressed ellipse: conserve cross-sectional area → rx = r² / ry
  const ell_ry  = G_PX / 2;
  const ell_rx  = Math.min((circR * circR) / ell_ry, grooveW_PX / 2 - 3);
  const ellCY   = floorY - G_PX / 2;

  // --- Color: matches squeeze status ---
  const color = status === "green"  ? "#4B7B4E"
              : status === "yellow" ? "#A17D36"
              : status === "red"    ? "#9B3B3E"
              : "#2B4C7E"; // neutral blue when not yet calculated

  // Whether actual compression is happening (G must be less than W)
  const isCompressed = G > 0 && G < W;

  // SVG path for the part body — a rectangle with a rectangular groove cut out.
  // The groove is represented as a U-shaped notch in the top face.
  const bodyPath = [
    `M ${bodyL} ${topY}`,
    `L ${gLeft}  ${topY}`,
    `L ${gLeft}  ${floorY}`,
    `L ${gRight} ${floorY}`,
    `L ${gRight} ${topY}`,
    `L ${bodyR}  ${topY}`,
    `L ${bodyR}  ${bodyBot}`,
    `L ${bodyL}  ${bodyBot}`,
    "Z",
  ].join(" ");

  // --- Dimension annotation helpers ---
  // DIM_X: x of the W annotation line (left side)
  const dimWX = bodyL - 24;
  // DIM_X: x of the G annotation line (right side)
  const dimGX = bodyR + 24;

  return (
    <svg viewBox="0 0 400 200" className="w-full">

      {/* ── Metal parts ── */}
      {/* Mating surface (top plate) */}
      <rect
        x={bodyL} y={plateTop}
        width={bodyR - bodyL} height={plateH}
        fill="#E7EAEC" stroke="#98999B" strokeWidth={1}
      />
      {/* Part body with groove cut out */}
      <path d={bodyPath} fill="#E7EAEC" stroke="#98999B" strokeWidth={1} />

      {/* ── O-ring ── */}

      {/* Free-state circle (dashed) — always drawn so W is always visible */}
      <circle
        cx={CX} cy={circCY} r={circR}
        fill="none"
        stroke={color} strokeWidth={1.5} strokeDasharray="5 3"
        opacity={0.55}
      />

      {/* Compressed ellipse — only when G < W */}
      {isCompressed && (
        <ellipse
          cx={CX} cy={ellCY} rx={ell_rx} ry={ell_ry}
          fill={color} fillOpacity={0.65}
          stroke={color} strokeWidth={2}
        />
      )}

      {/* ── W dimension (left side) ── */}
      {/* Leader lines: thin dashed horizontals from the circle edges to the dim line */}
      <line x1={dimWX} y1={circCY - circR} x2={gLeft - 2}  y2={circCY - circR}
        stroke="#98999B" strokeWidth={0.7} strokeDasharray="3 2" />
      <line x1={dimWX} y1={circCY + circR} x2={gLeft - 2}  y2={circCY + circR}
        stroke="#98999B" strokeWidth={0.7} strokeDasharray="3 2" />
      {/* Main vertical dim line */}
      <line x1={dimWX} y1={circCY - circR} x2={dimWX} y2={circCY + circR}
        stroke="#5F6164" strokeWidth={1} />
      {/* Arrowheads (apex outward, base inward) */}
      <polygon points={`${dimWX},${circCY - circR} ${dimWX - 3},${circCY - circR + 7} ${dimWX + 3},${circCY - circR + 7}`} fill="#5F6164" />
      <polygon points={`${dimWX},${circCY + circR} ${dimWX - 3},${circCY + circR - 7} ${dimWX + 3},${circCY + circR - 7}`} fill="#5F6164" />
      {/* W label */}
      <text x={dimWX - 12} y={circCY + 4} textAnchor="middle"
        fill="#1A1D21" fontSize={15} fontWeight="700" fontStyle="italic">
        W
      </text>

      {/* ── G dimension (right side) ── */}
      {/* Leader lines from groove floor and groove top to dim line */}
      <line x1={dimGX} y1={topY}    x2={gRight + 2} y2={topY}
        stroke="#98999B" strokeWidth={0.7} strokeDasharray="3 2" />
      <line x1={dimGX} y1={floorY}  x2={gRight + 2} y2={floorY}
        stroke="#98999B" strokeWidth={0.7} strokeDasharray="3 2" />
      {/* Main vertical dim line */}
      <line x1={dimGX} y1={topY} x2={dimGX} y2={floorY}
        stroke="#5F6164" strokeWidth={1} />
      {/* Arrowheads */}
      <polygon points={`${dimGX},${topY}    ${dimGX - 3},${topY + 7}    ${dimGX + 3},${topY + 7}`}    fill="#5F6164" />
      <polygon points={`${dimGX},${floorY}  ${dimGX - 3},${floorY - 7}  ${dimGX + 3},${floorY - 7}`}  fill="#5F6164" />
      {/* G label */}
      <text x={dimGX + 12} y={(topY + floorY) / 2 + 4} textAnchor="middle"
        fill="#1A1D21" fontSize={15} fontWeight="700" fontStyle="italic">
        G
      </text>

      {/* ── Legend (bottom-left) ── */}
      <line x1={12} y1={192} x2={28} y2={192} stroke={color} strokeWidth={1.5} strokeDasharray="5 3" opacity={0.6} />
      <text x={32} y={196} fill="#5F6164" fontSize={9}>free state (W)</text>
      {isCompressed && (
        <>
          <rect x={112} y={187} width={16} height={10} fill={color} fillOpacity={0.65} rx={1} />
          <text x={132} y={196} fill="#5F6164" fontSize={9}>compressed</text>
        </>
      )}
    </svg>
  );
}
