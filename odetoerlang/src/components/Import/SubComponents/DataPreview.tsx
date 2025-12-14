interface DataPreviewProps {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  rowCount: number;
}

export default function DataPreview({ headers, rows, rowCount }: DataPreviewProps) {
  return (
    <div className="bg-bg-surface rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">
        Preview (First 5 Rows of {rowCount})
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-subtle text-sm">
          <thead className="bg-bg-elevated">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-bg-surface divide-y divide-border-subtle">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-bg-hover">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-2 whitespace-nowrap text-text-primary">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
