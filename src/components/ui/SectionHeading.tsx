/**
 * Section heading used inside reference pages.
 * Shared so the DFM hub and the Mechanisms reference stay typographically
 * identical without either page restating the classes.
 */
export default function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-gray-800 mb-3">{children}</h2>;
}
