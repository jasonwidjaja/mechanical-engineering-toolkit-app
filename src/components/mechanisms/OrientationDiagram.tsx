/**
 * Self-Locating Features — before / after
 *
 * The same bracket twice. On the left its four mounting holes are symmetric
 * about both axes, so it bolts up perfectly when rotated 180° — and the
 * connector ends up facing the wrong way. Nothing about the part resists the
 * mistake; the only defence is the operator noticing.
 *
 * On the right, one corner is notched and the chassis has a rib that only the
 * notch clears. The wrong orientation now physically will not seat. Same part
 * count, same fasteners, one extra feature.
 *
 * This is the cheapest error-proofing there is: geometry that makes the wrong
 * answer impossible, rather than a work instruction telling someone to be
 * careful.
 *
 * Pure display component (no state), so no "use client" needed.
 */

const TOP = 66;
const BOT = 178;

export default function OrientationDiagram() {
  return (
    <svg
      viewBox="0 0 460 250"
      className="w-full h-auto"
      role="img"
      aria-label="Two brackets compared. The first has four symmetric mounting holes and can be installed rotated 180 degrees with its connector facing the wrong way. The second has a notched corner and a matching rib in the chassis, so only the correct orientation will seat."
    >
      <defs>
        <pattern id="odHatch" width="5" height="5" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#CDD2D5" strokeWidth="1.1" />
        </pattern>
        <marker id="odRot" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,1.5 L6.5,4 L0,6.5 Z" fill="#9B3B3E" />
        </marker>
      </defs>

      {/* ═══════════════ BEFORE ═══════════════ */}
      <text x="115" y="20" textAnchor="middle" fontSize="11" fontWeight="700" fill="#9B3B3E">
        ✗ Symmetric — installs either way
      </text>
      <text x="115" y="34" textAnchor="middle" fontSize="9" fill="#9B3B3E">
        nothing stops a 180° mistake
      </text>

      {/* Chassis it mounts to */}
      <rect x="42" y="54" width="146" height="136" rx="4" fill="none" stroke="#98999B"
            strokeWidth="1.2" strokeDasharray="4 3" />

      {/* The bracket */}
      <rect x="56" y={TOP} width="118" height={BOT - TOP} rx="3"
            fill="#E5EAF0" stroke="#2B4C7E" strokeWidth="1.6" />

      {/* Four holes, symmetric about both axes — that's the problem */}
      {[
        [76, 86], [154, 86], [76, 158], [154, 158],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.5" fill="#ffffff"
                stroke="#2B4C7E" strokeWidth="1.4" />
      ))}

      {/* The feature that has to end up on the right-hand side */}
      <rect x="146" y="110" width="26" height="24" rx="2" fill="#A17D36"
            stroke="#A17D36" strokeWidth="1.2" />
      <text x="159" y="126" textAnchor="middle" fontSize="7" fontWeight="700" fill="#7E6027">
        I/O
      </text>

      {/* 180° rotation arrow through the part centre */}
      <path d="M92,122 A23,23 0 1 1 106,143" fill="none" stroke="#9B3B3E" strokeWidth="1.5"
            strokeDasharray="4 3" markerEnd="url(#odRot)" />
      <text x="115" y="126" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#9B3B3E">
        180°
      </text>

      <text x="115" y="204" textAnchor="middle" fontSize="8.5" fill="#9B3B3E">
        Rotated, all four holes still line up —
      </text>
      <text x="115" y="215" textAnchor="middle" fontSize="8.5" fill="#9B3B3E">
        but the I/O now faces the wrong way.
      </text>

      {/* ═══════════════ AFTER ═══════════════ */}
      <text x="345" y="20" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4B7B4E">
        ✓ Keyed — only one way fits
      </text>
      <text x="345" y="34" textAnchor="middle" fontSize="9" fill="#4B7B4E">
        notched corner + matching rib
      </text>

      <rect x="272" y="54" width="146" height="136" rx="4" fill="none" stroke="#98999B"
            strokeWidth="1.2" strokeDasharray="4 3" />

      {/* Chassis rib — occupies the top-left corner, so only a notched part drops in */}
      <path d="M276,58 L306,58 L276,88 Z" fill="#E7EAEC" stroke="#5F6164" strokeWidth="1.2" />
      <path d="M276,58 L306,58 L276,88 Z" fill="url(#odHatch)" stroke="none" />

      {/*
        The bracket, with its top-left corner cut away to clear the rib.
        Rotated 180° that notch would land bottom-right, leaving the corner
        material to collide with the rib — so it simply won't sit down.
      */}
      <path
        d={`M304,${TOP} L404,${TOP} L404,${BOT} L286,${BOT} L286,88 Z`}
        fill="#E9EFEA" stroke="#4B7B4E" strokeWidth="1.6" strokeLinejoin="round"
      />

      {[
        [308, 90], [384, 90], [308, 158], [384, 158],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.5" fill="#ffffff"
                stroke="#4B7B4E" strokeWidth="1.4" />
      ))}

      <rect x="376" y="110" width="26" height="24" rx="2" fill="#A17D36"
            stroke="#A17D36" strokeWidth="1.2" />
      <text x="389" y="126" textAnchor="middle" fontSize="7" fontWeight="700" fill="#7E6027">
        I/O
      </text>

      {/* Callouts */}
      <line x1="296" y1="78" x2="330" y2="104" stroke="#4B7B4E" strokeWidth="0.9" />
      <text x="334" y="107" fontSize="8.5" fontWeight="700" fill="#4B7B4E">
        keying notch
      </text>
      <line x1="286" y1="64" x2="250" y2="48" stroke="#5F6164" strokeWidth="0.9" />
      <text x="246" y="45" textAnchor="end" fontSize="8.5" fill="#5F6164">
        chassis rib
      </text>

      <text x="345" y="204" textAnchor="middle" fontSize="8.5" fill="#4B7B4E">
        Rotated, the notch lands away from the rib —
      </text>
      <text x="345" y="215" textAnchor="middle" fontSize="8.5" fill="#4B7B4E">
        the corner fouls it and the part never seats.
      </text>

      <text x="230" y="240" textAnchor="middle" fontSize="8.5" fill="#98999B" fontStyle="italic">
        One added feature, no extra parts or fasteners — the wrong build becomes impossible, not just discouraged.
      </text>
    </svg>
  );
}
