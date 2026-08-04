/**
 * Reference table.
 *
 * The app had the same ~25 lines of Tailwind table markup copied across the IP
 * Rating page and every table in the DFM hub. This is that markup, once.
 *
 * Cells are ReactNode, not string, so a caller can drop a badge, a <span
 * className="font-mono">, or a two-line cell in without this component needing
 * to know about any of it. Column-level `className` handles the common case of
 * "this whole column is monospaced / narrow / muted".
 */

export type Column = {
  header: React.ReactNode;
  /** Applied to every <td> in this column — e.g. "font-mono", "w-40". */
  className?: string;
  /** Applied to this column's <th> only. */
  headerClassName?: string;
};

export type Row = {
  /** Stable React key — usually the row's first-column value. */
  key: string;
  cells: React.ReactNode[];
};

export default function DataTable({
  columns,
  rows,
  /** Aligns cell text to the top. Use when any cell wraps to several lines. */
  alignTop = true,
}: {
  columns: Column[];
  rows: Row[];
  alignTop?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-panel-gray bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-instrument-white border-b border-panel-gray text-left text-xs text-graphite/60">
            {columns.map((c, i) => (
              <th
                key={i}
                scope="col"
                className={`px-4 py-3 font-semibold ${c.headerClassName ?? ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-panel-gray">
          {rows.map(row => (
            <tr
              key={row.key}
              className={`hover:bg-instrument-white transition-colors ${alignTop ? "align-top" : ""}`}
            >
              {row.cells.map((cell, i) => (
                <td key={i} className={`px-4 py-3 ${columns[i]?.className ?? "text-graphite/70"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
