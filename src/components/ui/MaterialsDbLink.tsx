import Link from "next/link";

/**
 * "View full details in Materials Database" — the link that sits beside every
 * material selector in the calculators.
 *
 * Its own component because it appears on four pages and the wording should be
 * identical on all of them; a copy-pasted <Link> drifts.
 */
export default function MaterialsDbLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/materials"
      className={`inline-flex items-center gap-1 text-xs text-steel-blue underline decoration-steel-blue-line underline-offset-2 transition-colors hover:text-steel-blue-deep ${className}`}
    >
      View full details in Materials Database
    </Link>
  );
}
