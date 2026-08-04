/**
 * Root layout — wraps every page in the app.
 * In Next.js App Router, this file is required. It sets the <html> and <body>
 * tags and anything you put here (nav, footer, etc.) appears on every page.
 */
import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/**
 * Typography is loaded here and exposed to Tailwind as CSS variables — see the
 * `fontFamily` block in tailwind.config.ts, which points `font-sans` and
 * `font-mono` at these.
 *
 * The two families do different jobs and the split is functional, not
 * decorative: Plex Sans carries all prose (headings, labels, hints), Plex Mono
 * carries every number, unit and calculated output in the app. A result should
 * never be mistakable for the sentence describing it.
 *
 * next/font self-hosts these at build time — no runtime request to Google, and
 * no layout shift while a webfont loads.
 */
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

// Metadata exported from layout.tsx automatically sets <title> and <meta> tags.
export const metadata: Metadata = {
  title: "Engineering Toolkit",
  description: "A collection of calculators for mechanical engineers",
};

/** Top-level sections, in nav order. Add a route here and it appears sitewide. */
const NAV_LINKS = [
  { href: "/", label: "Calculators" },
  { href: "/materials", label: "Materials" },
  { href: "/tolerance-stackup", label: "Tolerance Stackup" },
  { href: "/dfm-guide", label: "DFM Guide" },
  { href: "/mechanisms-reference", label: "Mechanisms" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // "children" is whatever page is currently being shown
}) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-instrument-white font-sans text-graphite antialiased">
        {/* Site-wide top navigation bar */}
        <header className="border-b border-panel-gray bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4">
            {/*
              Reticle mark. The old wrench glyph was generic clip-art; a
              crosshair reads as an instrument and is 6 elements of SVG.
            */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 text-oxide-rust"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="8.5" />
              <circle cx="12" cy="12" r="3" strokeWidth={1} />
              <path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" strokeLinecap="round" />
            </svg>

            <a
              href="/"
              className="text-lg font-semibold tracking-tight text-graphite transition-colors hover:text-steel-blue"
            >
              Engineering Toolkit
            </a>

            {/*
              `ml-auto` pushes the nav to the right edge. Plain <a> keeps this a
              server component — a client-side active-link highlight would
              require usePathname and therefore "use client".
            */}
            <nav className="ml-auto flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-2.5 py-1.5 text-graphite/70 transition-colors hover:bg-steel-blue-tint hover:text-steel-blue"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        {/* Page content is injected here */}
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
