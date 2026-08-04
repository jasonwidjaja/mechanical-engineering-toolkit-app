import type { Config } from "tailwindcss";

/**
 * Design system for the Engineering Toolkit.
 *
 * The palette is deliberately small — six hues, no more. Everything in the app
 * pulls from these names, so a colour change happens here and nowhere else.
 *
 * Each accent hue carries three variants so that status surfaces don't need
 * ad-hoc opacity guesses scattered through the pages:
 *
 *   DEFAULT — the full-strength hue. Text, needles, strokes, filled buttons.
 *   tint    — the hue mixed ~12% over white. Panel fills behind status text.
 *   line    — the hue mixed ~30% over white. Borders on those panels.
 *   deep    — a darkened hue for text that has to sit on `tint`.
 *
 * Secondary text uses `graphite` at an opacity (text-graphite/70 etc.) rather
 * than introducing a separate grey ramp.
 */
const config: Config = {
  // Tell Tailwind which files to scan for class names
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /** Page background. Slightly cool off-white — printed drawing stock. */
        "instrument-white": "#F5F6F7",

        /**
         * Recessed surfaces: card borders, table headers, unit badges, formula
         * strips, diagram backplates. NOT the card surface itself — panel-gray
         * on instrument-white is only a ~4% luminance step, so cards would
         * disappear. Cards are white; panel-gray is what sits *behind* things.
         */
        "panel-gray": "#E7EAEC",

        /** Primary text. Near-black with a blue-grey cast, not pure #000. */
        graphite: "#1A1D21",

        /** Primary accent: links, primary buttons, active nav, data strokes. */
        "steel-blue": {
          DEFAULT: "#2B4C7E",
          tint: "#E5EAF0",
          line: "#BFC9D8",
          deep: "#1E3659",
        },

        /**
         * Signature accent. Used sparingly and on purpose: the hero radar
         * sweep, focus rings, the card selection edge. Never a general fill.
         */
        "oxide-rust": {
          DEFAULT: "#B5532C",
          tint: "#F6EAE5",
          line: "#E9CBC0",
          deep: "#8E3F20",
        },

        /** Pass / in-spec / good. */
        "phosphor-green": {
          DEFAULT: "#4B7B4E",
          tint: "#E9EFEA",
          line: "#C9D7CA",
          deep: "#3A6039",
        },

        /**
         * Warning. Derived to sit in the same desaturated band as
         * phosphor-green (~45% saturation, ~42% lightness) so the two read as
         * one instrument family. An ochre, not a highlighter yellow.
         */
        "signal-amber": {
          DEFAULT: "#A17D36",
          tint: "#F4F0E7",
          line: "#E1D5BF",
          deep: "#7E6027",
        },

        /**
         * Danger. Same treatment — a brick red. Kept at a bluer hue than
         * oxide-rust so a failing gauge zone never reads as the brand accent.
         */
        "signal-red": {
          DEFAULT: "#9B3B3E",
          tint: "#F3E7E8",
          line: "#E1C4C5",
          deep: "#7A2B2E",
        },
      },

      fontFamily: {
        /**
         * Prose: headings, labels, body copy.
         * Numbers: every calculated value, unit, table figure and dimension.
         * The split is functional — a result should never be mistakable for
         * the sentence describing it.
         *
         * The CSS variables are set by next/font in src/app/layout.tsx.
         */
        sans: ["var(--font-plex-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      keyframes: {
        /** Hero radar sweep. One slow revolution, no easing. */
        "radar-sweep": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "radar-sweep": "radar-sweep 9s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
