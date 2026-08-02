"use client";

/**
 * Underlined tab button.
 *
 * Originally written inline on the Tolerance Stackup page, then copied into the
 * DFM Reference Hub. Pulled out here when a third page needed it — the tab row
 * is now defined in exactly one place, so the three pages can't drift apart.
 *
 * Usage: wrap a row of these in
 *   <div className="flex gap-1 border-b border-gray-200"> … </div>
 * The `-mb-px` below pulls each button's own border down onto that container
 * border, so the active tab appears to punch through it.
 */
export default function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
