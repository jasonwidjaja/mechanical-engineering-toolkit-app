/**
 * Surface Roughness Profile Comparison
 *
 * The same surface texture drawn at five finish levels, hugely magnified — the
 * kind of view you'd get from a profilometer trace rather than anything visible
 * by eye.
 *
 * Every strip uses the SAME underlying profile shape, only scaled. That's
 * deliberate: it isolates the one variable that changes (how deep the peaks and
 * valleys run) instead of implying that a finer finish is also a different kind
 * of texture.
 *
 * ⚠ The vertical scale is compressed — see the footnote. At true relative
 * scale a 0.4 µm trace next to a 12.5 µm one would be a flat line, which would
 * be honest but would teach nothing.
 *
 * Pure display component (no state), so no "use client" needed.
 */

import { SURFACE_FINISHES } from "@/lib/mechanisms-data";

const X0 = 96;      // left edge of the traces
const X1 = 436;     // right edge
const SAMPLES = 68;
const MAX_AMP = 13; // drawn amplitude of the roughest surface, in px

/**
 * One fixed profile shape, generated once at module load.
 *
 * A seeded generator rather than Math.random(): the server and the browser must
 * produce byte-identical SVG, and a random profile would differ between them
 * and trip a hydration mismatch.
 */
const PROFILE: number[] = (() => {
  let seed = 20260801; // any fixed value; this one is just the date
  const next = () => {
    // Numerical Recipes LCG — small, deterministic, good enough for texture.
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: SAMPLES }, (_, i) => {
    // Periodic tool marks plus irregularity, which is what a machined
    // surface actually looks like under magnification.
    const toolMarks = Math.sin(i * 0.62) * 0.55 + Math.sin(i * 1.9) * 0.18;
    const irregular = (next() * 2 - 1) * 0.45;
    return Math.max(-1, Math.min(1, toolMarks + irregular));
  });
})();

/**
 * Peak height scales with the square root of Ra, not linearly.
 * The range here spans 30×, so a linear mapping would flatten everything below
 * ~3 µm into the baseline. Compression is called out in the footnote.
 */
function amplitudeFor(raUm: number, maxRa: number) {
  return (Math.sqrt(raUm) / Math.sqrt(maxRa)) * MAX_AMP;
}

export default function SurfaceProfileDiagram() {
  const maxRa = Math.max(...SURFACE_FINISHES.map(f => f.profileUm));
  const step = (X1 - X0) / (SAMPLES - 1);
  const rowH = 46;

  return (
    <svg
      viewBox="0 0 460 300"
      className="w-full h-auto"
      role="img"
      aria-label="Magnified surface profiles at five roughness levels, from a rough as-cast surface with deep peaks and valleys down to a polished bearing surface that is nearly flat."
    >
      <defs>
        <pattern id="spHatch" width="5" height="5" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#CDD2D5" strokeWidth="1.1" />
        </pattern>
      </defs>

      <text x="10" y="16" fontSize="10" fontWeight="700" fill="#5F6164">
        Surface profile, greatly magnified
      </text>

      {SURFACE_FINISHES.map((f, k) => {
        const baseY = 48 + k * rowH;
        const amp = amplitudeFor(f.profileUm, maxRa);
        const bodyBot = baseY + 17;

        // Trace across the surface, then close the path down through the bulk
        // material so the solid side of the boundary is obvious.
        const top = PROFILE.map((v, i) => {
          const x = X0 + i * step;
          const y = baseY - v * amp;
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");

        return (
          <g key={f.raUm}>
            {/* Highlight the row that governs static O-ring sealing */}
            {f.sealRelevant && (
              <rect x="4" y={baseY - MAX_AMP - 9} width="452" height={rowH - 2} rx="6"
                    fill="#E9EFEA" stroke="#E9EFEA" strokeWidth="1.2" />
            )}

            {/* Bulk material below the surface */}
            <path d={`${top} L${X1},${bodyBot} L${X0},${bodyBot} Z`}
                  fill="#E7EAEC" stroke="none" />
            <path d={`${top} L${X1},${bodyBot} L${X0},${bodyBot} Z`}
                  fill="url(#spHatch)" stroke="none" opacity="0.7" />
            {/* The surface itself */}
            <path d={top} fill="none"
                  stroke={f.sealRelevant ? "#3A6039" : "#5F6164"} strokeWidth="1.5" />

            {/* Mean line — Ra is the average deviation from exactly this */}
            <line x1={X0} y1={baseY} x2={X1} y2={baseY}
                  stroke="#98999B" strokeWidth="0.7" strokeDasharray="4 3" />

            {/* Row label */}
            <text x="88" y={baseY - 1} textAnchor="end" fontSize="10" fontWeight="700"
                  fill={f.sealRelevant ? "#3A6039" : "#1A1D21"}>
              Ra {f.raUm}
            </text>
            <text x="88" y={baseY + 10} textAnchor="end" fontSize="8" fill="#98999B">
              µm
            </text>

            {f.sealRelevant && (
              <text x={X1} y={baseY - MAX_AMP - 1} textAnchor="end" fontSize="8.5"
                    fontWeight="700" fill="#3A6039">
                ← static O-ring seal surfaces
              </text>
            )}
          </g>
        );
      })}

      {/* Mean-line explainer, tied to the first row */}
      <line x1={X0 + 6} y1="48" x2="70" y2="30" stroke="#98999B" strokeWidth="0.8" />
      <text x="100" y="28" fontSize="8.5" fill="#98999B">
        dashed = mean line; Ra is the average deviation from it
      </text>

      <text x="230" y="288" textAnchor="middle" fontSize="8.5" fill="#98999B" fontStyle="italic">
        Vertical scale compressed (∝ √Ra). A 12.5 µm surface is ~30× rougher than 0.4 µm, not ~5×.
      </text>
    </svg>
  );
}
