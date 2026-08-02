/**
 * Root layout — wraps every page in the app.
 * In Next.js App Router, this file is required. It sets the <html> and <body>
 * tags and anything you put here (nav, footer, etc.) appears on every page.
 */
import type { Metadata } from "next";
import "./globals.css";

// Metadata exported from layout.tsx automatically sets <title> and <meta> tags.
export const metadata: Metadata = {
  title: "Engineering Toolkit",
  description: "A collection of calculators for mechanical engineers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // "children" is whatever page is currently being shown
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {/* Site-wide top navigation bar */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
            {/* Wrench icon (pure SVG — no extra library needed) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <a href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
              Engineering Toolkit
            </a>

            {/* Top-level sections. `ml-auto` pushes the nav to the right edge.
                Plain <a> keeps this a server component — a client-side active-link
                highlight would require usePathname and therefore "use client". */}
            <nav className="ml-auto flex items-center gap-1 sm:gap-2 text-sm">
              <a
                href="/"
                className="px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Calculators
              </a>
              <a
                href="/tolerance-stackup"
                className="px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Tolerance Stackup
              </a>
              <a
                href="/dfm-guide"
                className="px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                DFM Guide
              </a>
              <a
                href="/mechanisms-reference"
                className="px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Mechanisms
              </a>
            </nav>
          </div>
        </header>

        {/* Page content is injected here */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
