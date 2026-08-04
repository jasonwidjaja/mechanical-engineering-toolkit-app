/**
 * Heat Sink Thermal Path Diagram
 *
 * An original section view of the whole thermal path, bottom to top:
 *
 *   PCB → component (the heat source) → TIM → heat sink base → fins → air
 *
 * Three things are being communicated at once:
 *   1. The STACK — every layer heat has to cross to get out.
 *   2. The GRADIENT — the sink is filled red at the base and blue at the fin
 *      tips, because that is physically what happens: the base runs near
 *      component temperature and the tips approach ambient.
 *   3. The AIRFLOW — arrows drawn *behind* the fins, so they show through the
 *      gaps. That's the whole point of fins: surface area with air moving
 *      between it.
 *
 * The temperature labels are live — they read the calculator's current inputs,
 * so the picture matches the numbers the user is actually working with.
 *
 * Pure display component (no state), so no "use client" needed.
 */

type Props = {
  /** Ambient air temperature, °C. null → show the generic symbol instead. */
  tAmb: number | null;
  /** Max allowable component temperature, °C. null → generic symbol. */
  tMax: number | null;
};

// ─── Geometry ────────────────────────────────────────────────────────────────
const FIN_TOP = 104;
const FIN_BOT = 168;
const BASE_TOP = 168;
const BASE_BOT = 184;
const COMP_TOP = 188;
const COMP_BOT = 216;
const PCB_TOP = 216;
const PCB_BOT = 226;

// Seven fins, 12 wide on a 26 pitch, centred over the 158–352 base.
const FIN_XS = [171, 197, 223, 249, 275, 301, 327];
const FIN_W = 12;

/**
 * Cropped from the top — nothing is drawn above y ≈ 62, and leaving that empty
 * band in made the whole figure render small inside its card.
 */
const VIEW_BOX = "0 58 470 204";

export default function HeatSinkDiagram({ tAmb, tMax }: Props) {
  // Only show ΔT when we actually have both ends of it.
  const deltaT = tAmb !== null && tMax !== null ? tMax - tAmb : null;

  const ambLabel = tAmb !== null ? `${tAmb} °C` : "T_amb";
  const compLabel = tMax !== null ? `${tMax} °C` : "T_comp";

  return (
    <svg
      viewBox={VIEW_BOX}
      className="w-full h-auto"
      role="img"
      aria-label="Section view of a component on a PCB with a finned heat sink above it. A colour gradient runs from hot red at the sink base to cool blue at the fin tips, and airflow arrows pass between the fins."
    >
      <defs>
        {/*
          userSpaceOnUse (not the default objectBoundingBox) is essential here:
          it makes the base and all seven fins share ONE gradient spanning the
          whole sink height. With the default, every fin would restart the ramp
          at red and the gradient would say nothing.
        */}
        <linearGradient id="hsHeat" gradientUnits="userSpaceOnUse"
                        x1="0" y1={BASE_BOT} x2="0" y2={FIN_TOP}>
          <stop offset="0" stopColor="#9B3B3E" />
          <stop offset="0.45" stopColor="#A17D36" />
          <stop offset="1" stopColor="#BFC9D8" />
        </linearGradient>

        <linearGradient id="hsColumn" gradientUnits="userSpaceOnUse"
                        x1="0" y1="212" x2="0" y2="92">
          <stop offset="0" stopColor="#9B3B3E" />
          <stop offset="0.5" stopColor="#A17D36" />
          <stop offset="1" stopColor="#2B4C7E" />
        </linearGradient>

        <marker id="hsAir" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
          <path d="M0,1.5 L8,4.5 L0,7.5 Z" fill="#2B4C7E" />
        </marker>
        <marker id="hsDim" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M4,0.5 L1,4 L4,7.5" fill="none" stroke="#5F6164" strokeWidth="1.1" />
        </marker>
      </defs>

      {/* ══ Heat-flow column — the legend for the gradient used on the sink ══ */}
      <polygon points="34,78 24,94 44,94" fill="#2B4C7E" />
      <rect x="26" y="92" width="16" height="120" rx="7" fill="url(#hsColumn)" />
      <text x="16" y="152" fontSize="9" fill="#5F6164" transform="rotate(-90 16 152)"
            textAnchor="middle">
        heat flow
      </text>
      <text x="34" y="224" textAnchor="middle" fontSize="8" fill="#9B3B3E" fontWeight="600">
        hot
      </text>
      <text x="34" y="72" textAnchor="middle" fontSize="8" fill="#2B4C7E" fontWeight="600">
        cool
      </text>

      {/* ══ Airflow — drawn BEFORE the fins so the fins occlude it, leaving the
             arrows visible in the gaps where the air actually travels ══ */}
      {[118, 136, 154].map(y => (
        <line key={y} x1="122" y1={y} x2="372" y2={y}
              stroke="#2B4C7E" strokeWidth="1.6" markerEnd="url(#hsAir)" opacity="0.9" />
      ))}

      {/* ══ Heat sink ══ */}
      {FIN_XS.map(x => (
        <rect key={x} x={x} y={FIN_TOP} width={FIN_W} height={FIN_BOT - FIN_TOP}
              fill="url(#hsHeat)" stroke="#98999B" strokeWidth="0.9" />
      ))}
      <rect x="158" y={BASE_TOP} width="194" height={BASE_BOT - BASE_TOP}
            fill="url(#hsHeat)" stroke="#5F6164" strokeWidth="1.2" />

      {/* ══ Thermal interface material — the thin layer people forget ══ */}
      <rect x="206" y={BASE_BOT} width="98" height={COMP_TOP - BASE_BOT}
            fill="#A17D36" stroke="#A17D36" strokeWidth="0.8" />

      {/* ══ Component (the heat source) and PCB ══ */}
      <rect x="210" y={COMP_TOP} width="90" height={COMP_BOT - COMP_TOP}
            fill="#9B3B3E" stroke="#7A2B2E" strokeWidth="1.2" rx="1.5" />
      <rect x="78" y={PCB_TOP} width="328" height={PCB_BOT - PCB_TOP}
            fill="#3A6039" stroke="#3A6039" strokeWidth="1" rx="1" />

      {/* ══ Labels ══ */}

      {/* Ambient air */}
      <text x="122" y="94" fontSize="9" fontWeight="600" fill="#2B4C7E">
        cool ambient air in
      </text>
      <text x="386" y="120" fontSize="9" fill="#2B4C7E">warmed</text>
      <text x="386" y="130" fontSize="9" fill="#2B4C7E">air out</text>
      <text x="386" y="150" fontSize="9" fontWeight="700" fill="#2B4C7E">
        T_amb
      </text>
      <text x="386" y="161" fontSize="10" fontWeight="700" fill="#2B4C7E">
        {ambLabel}
      </text>

      {/* Heat sink */}
      <line x1="352" y1="176" x2="372" y2="186" stroke="#5F6164" strokeWidth="0.9" />
      <text x="374" y="190" fontSize="9" fill="#5F6164">heat sink</text>

      {/* TIM */}
      <line x1="206" y1="186" x2="150" y2="196" stroke="#A17D36" strokeWidth="0.9" />
      <text x="104" y="199" fontSize="9" fill="#A17D36">TIM</text>

      {/* Component — both label lines kept ABOVE the PCB's top edge (y=216),
          which is why the temperature is one line rather than two. */}
      <line x1="300" y1="202" x2="314" y2="200" stroke="#7A2B2E" strokeWidth="0.9" />
      <text x="316" y="199" fontSize="9" fontWeight="600" fill="#7A2B2E">component</text>
      <text x="316" y="211" fontSize="9" fontWeight="700" fill="#9B3B3E">
        T_comp = {compLabel}
      </text>

      {/* PCB */}
      <text x="84" y="240" fontSize="9" fill="#3A6039" fontWeight="600">PCB</text>

      {/* ΔT bracket — the driving force the R = ΔT / P formula uses */}
      <line x1="452" y1="156" x2="452" y2="212" stroke="#5F6164" strokeWidth="1"
            markerStart="url(#hsDim)" markerEnd="url(#hsDim)" />
      <text x="446" y="184" fontSize="9" fontWeight="700" fill="#5F6164"
            textAnchor="middle" transform="rotate(-90 446 184)">
        {deltaT !== null ? `ΔT = ${deltaT} °C` : "ΔT"}
      </text>

      {/* Footnote */}
      <text x="235" y="256" textAnchor="middle" fontSize="8.5" fill="#98999B" fontStyle="italic">
        Heat crosses every layer in series — the TIM and the sink each add resistance.
      </text>
    </svg>
  );
}
