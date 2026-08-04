/**
 * External resource links.
 *
 * Extracted from the DFM Reference Hub when the Mechanisms reference needed
 * the same treatment.
 *
 * target="_blank" opens a new tab; rel="noopener noreferrer" is the required
 * companion — without it the opened page gets a handle back to this one via
 * window.opener, which is both a security and a performance problem.
 */

export type Resource = {
  label: string;
  url: string;
  /** Optional one-line description of what the reader will find there. */
  note?: string;
};

export default function ResourceList({ resources }: { resources: Resource[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {resources.map(r => (
        <li key={r.url}>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2.5 bg-white rounded-lg border border-panel-gray px-4 py-3 hover:border-steel-blue-line hover: transition-all"
          >
            <span className="text-steel-blue mt-0.5 shrink-0">🔗</span>
            <span className="min-w-0">
              <span className="block text-sm text-graphite/80 group-hover:text-steel-blue-deep leading-snug">
                {r.label}
              </span>
              {r.note && (
                <span className="block text-xs text-graphite/50 mt-0.5 leading-snug">{r.note}</span>
              )}
            </span>
            {/* External-link glyph, so it's clear this leaves the site */}
            <svg
              className="h-3.5 w-3.5 text-graphite/30 group-hover:text-steel-blue shrink-0 ml-auto mt-1"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
