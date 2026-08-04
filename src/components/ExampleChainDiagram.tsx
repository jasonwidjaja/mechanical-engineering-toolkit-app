/**
 * Filled-in Dimension Chain Diagram
 *
 * Draws ONE worked example's actual numbers as a to-scale picture, rather than
 * the generic abstract chain the builder shows. The layout is the classic way
 * of drawing a 1-D stackup:
 *
 *   ├───────────────── opening dimension (full span) ─────────────────┤
 *   ├─ closer 1 ─┤─ c2 ─┤─── closer 3 ───┤═ RESULT ═┤
 *
 * The closing dimensions are laid end-to-end inside the opening dimension, so
 * what's physically left over at the right-hand end IS the resultant. That
 * makes the subtraction visible instead of something you have to take on faith.
 *
 * Everything is scaled off the opening dimension, which always spans the full
 * drawing width — so the relative size of each contributor is honest.
 *
 * Named ExampleChainDiagram to distinguish it from the tolerance-stackup page's
 * own local StackupChainDiagram, which draws the GENERIC chain from whatever
 * rows the user has typed into the builder. This one draws a fixed worked
 * example with its real numbers.
 *
 * Pure display component (no state), so no "use client" needed.
 */

type ChainItem = {
  label: string;
  value: number; // mm
};

type Props = {
  /** The single dimension that OPENS the gap — becomes the full-width span. */
  opener: ChainItem;
  /** Dimensions that CLOSE the gap, in stack order. */
  closers: ChainItem[];
  /** The leftover — computed by the caller from the same engine the page uses. */
  result: ChainItem;
};

// ─── Drawing constants ───────────────────────────────────────────────────────
const W = 620;              // viewBox width
const PAD = 12;             // left/right margin
const USABLE = W - PAD * 2; // full span of the opening dimension
const DIM_Y = 38;           // y of the opening dimension line
const BLOCK_Y = 58;         // top of the segment blocks
const BLOCK_H = 34;
const BLOCK_BOT = BLOCK_Y + BLOCK_H;

export default function ExampleChainDiagram({ opener, closers, result }: Props) {
  // Everything is measured against the opener, which spans the drawing.
  const scale = USABLE / opener.value;

  // Walk the closers left-to-right, accumulating x as we go. The result block
  // then occupies whatever span is left before the right-hand extension line.
  let cursor = PAD;
  const segments = closers.map((c, i) => {
    const width = c.value * scale;
    const seg = { ...c, x: cursor, width, index: i + 1 };
    cursor += width;
    return seg;
  });
  const resultX = cursor;
  const resultW = Math.max(result.value * scale, 2); // never collapse to nothing

  const fmt = (v: number) => v.toFixed(2);

  return (
    <figure className="my-1">
      <svg
        viewBox={`0 0 ${W} 132`}
        className="w-full h-auto"
        role="img"
        aria-label={`Dimension chain: ${opener.label} of ${fmt(opener.value)} millimetres, minus ${closers
          .map(c => `${c.label} ${fmt(c.value)}`)
          .join(", minus ")}, leaving ${result.label} of ${fmt(result.value)} millimetres.`}
      >
        <defs>
          {/* Small arrowheads for the dimension line — drawn as open "V" ticks,
              which is the engineering-drawing convention rather than solid blocks */}
          <marker id="chainArrowL" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M7,1 L1,4 L7,7" fill="none" stroke="#2B4C7E" strokeWidth="1.3" />
          </marker>
          <marker id="chainArrowR" markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto">
            <path d="M1,1 L7,4 L1,7" fill="none" stroke="#2B4C7E" strokeWidth="1.3" />
          </marker>
        </defs>

        {/* ── The opening dimension, spanning everything ── */}
        <text x={W / 2} y="16" textAnchor="middle" fontSize="11" fontWeight="600" fill="#2B4C7E">
          {opener.label}
        </text>
        <text x={W / 2} y="28" textAnchor="middle" fontSize="10" fill="#2B4C7E">
          {fmt(opener.value)} mm — opens (+)
        </text>
        <line
          x1={PAD} y1={DIM_Y} x2={W - PAD} y2={DIM_Y}
          stroke="#2B4C7E" strokeWidth="1.3"
          markerStart="url(#chainArrowL)" markerEnd="url(#chainArrowR)"
        />

        {/* Extension lines tying the dimension span to the blocks below it */}
        <line x1={PAD} y1={DIM_Y - 6} x2={PAD} y2={BLOCK_BOT + 6}
              stroke="#BFC9D8" strokeWidth="1" />
        <line x1={W - PAD} y1={DIM_Y - 6} x2={W - PAD} y2={BLOCK_BOT + 6}
              stroke="#BFC9D8" strokeWidth="1" />

        {/* ── Closing dimensions, laid end to end ── */}
        {segments.map(seg => (
          <g key={seg.label}>
            <rect
              x={seg.x} y={BLOCK_Y} width={seg.width} height={BLOCK_H}
              fill="#F4F0E7" stroke="#A17D36" strokeWidth="1.2"
            />
            {/* Index ties this block to the numbered legend below the drawing —
                the block is far too narrow to hold the full dimension name. */}
            <text x={seg.x + seg.width / 2} y={BLOCK_Y + 13} textAnchor="middle"
                  fontSize="8.5" fill="#A17D36">
              {seg.index}
            </text>
            <text x={seg.x + seg.width / 2} y={BLOCK_Y + 27} textAnchor="middle"
                  fontSize="10.5" fontWeight="700" fill="#7E6027">
              {fmt(seg.value)}
            </text>
          </g>
        ))}

        {/* ── The resultant — what's physically left over ── */}
        <rect
          x={resultX} y={BLOCK_Y - 4} width={resultW} height={BLOCK_H + 8}
          fill="#E9EFEA" stroke="#3A6039" strokeWidth="1.8"
        />
        <text x={resultX + resultW / 2} y={BLOCK_Y + 13} textAnchor="middle"
              fontSize="8.5" fontWeight="600" fill="#3A6039">
          =
        </text>
        <text x={resultX + resultW / 2} y={BLOCK_Y + 27} textAnchor="middle"
              fontSize="10.5" fontWeight="700" fill="#3A6039">
          {fmt(result.value)}
        </text>

        {/* ── The arithmetic, spelled out under the picture ── */}
        <text x={W / 2} y={BLOCK_BOT + 26} textAnchor="middle" fontSize="10.5"
              fontFamily="ui-monospace, monospace" fill="#5F6164">
          {fmt(opener.value)}
          {closers.map(c => ` − ${fmt(c.value)}`).join("")}
          {" = "}
          <tspan fontWeight="700" fill="#3A6039">{fmt(result.value)} mm</tspan>
        </text>
      </svg>

      {/* ── Legend ──
          Rendered as HTML rather than SVG text so the long dimension names wrap
          responsively instead of overflowing a fixed viewBox. */}
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
        {segments.map(seg => (
          <span key={seg.label} className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-sm border border-signal-amber bg-signal-amber-tint text-[9px] font-semibold text-signal-amber-deep"
              aria-hidden="true"
            >
              {seg.index}
            </span>
            <span className="text-graphite/70">
              {seg.label} <span className="font-mono text-graphite/60">{fmt(seg.value)}</span>
            </span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-4 rounded-sm border-2 border-phosphor-green bg-phosphor-green-tint"
            aria-hidden="true"
          />
          <span className="text-graphite/80 font-medium">
            {result.label} <span className="font-mono">{fmt(result.value)}</span>
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
