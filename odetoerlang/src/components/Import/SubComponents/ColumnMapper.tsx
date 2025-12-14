interface ColumnMapperProps {
  mappings: {
    field: string;
    label: string;
    required: boolean;
    mappedTo: string | null;
    description: string;
  }[];
  headers: string[];
  onMappingChange: (field: string, header: string | null) => void;
  onImport: () => void;
  isLoading: boolean;
  canApply: boolean;
  onApply: () => void;
}

export default function ColumnMapper({
  mappings,
  headers,
  onMappingChange,
  onImport,
  isLoading,
  canApply,
  onApply,
}: ColumnMapperProps) {
  return (
    <div className="bg-bg-surface rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">Step 2: Map Your Columns</h3>
      <p className="text-sm text-text-secondary mb-4">
        Match your CSV columns to our fields. Required fields are marked with *
      </p>

      <div className="space-y-3">
        {mappings.map((mapping) => (
          <div key={mapping.field} className="grid grid-cols-12 gap-4 items-center p-3 bg-bg-elevated rounded-lg">
            <div className="col-span-4">
              <label className="text-sm font-medium text-text-primary">
                {mapping.label}
                {mapping.required && <span className="text-red ml-1">*</span>}
              </label>
              <p className="text-xs text-text-muted mt-1">{mapping.description}</p>
            </div>
            <div className="col-span-1 text-center">
              <svg className="w-5 h-5 text-text-muted mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <div className="col-span-7">
              <select
                value={mapping.mappedTo || ''}
                onChange={(e) => onMappingChange(mapping.field, e.target.value || null)}
                className="w-full px-3 py-2 border border-border-subtle rounded-md bg-bg-surface text-text-primary focus:ring-2 focus:ring-cyan text-sm"
              >
                <option value="">-- Not Mapped --</option>
                {headers.map((header, idx) => (
                  <option key={idx} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onImport}
          disabled={isLoading}
          className="px-6 py-2 bg-cyan/20 text-cyan border border-cyan/50 rounded-lg hover:bg-cyan/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-xs"
        >
          {isLoading ? 'Processing...' : 'Import Data'}
        </button>
        {canApply && (
          <button
            onClick={onApply}
            className="px-6 py-2 bg-green/20 text-green border border-green/50 rounded-lg hover:bg-green/30 transition-colors font-medium uppercase tracking-wide text-xs"
          >
            Apply to Calculator
          </button>
        )}
      </div>
    </div>
  );
}
