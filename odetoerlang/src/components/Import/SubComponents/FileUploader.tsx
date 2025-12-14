import { useRef } from 'react';

interface FileUploaderProps {
  isLoading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
}

export default function FileUploader({ isLoading, onFileUpload, error }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-bg-surface rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Universal CSV Importer</h2>
          <p className="text-sm text-text-secondary mt-1">
            Upload any CSV file and map your columns to our fields. Works with any ACD export format!
          </p>
        </div>
      </div>

      <div className="border-2 border-dashed border-border-subtle rounded-lg p-8 text-center hover:border-cyan/50 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={onFileUpload}
          className="hidden"
          id="smart-csv-upload"
          disabled={isLoading}
        />
        <label htmlFor="smart-csv-upload" className={`cursor-pointer ${isLoading ? 'opacity-50' : ''}`}>
          <div className="flex flex-col items-center">
            {isLoading ? (
              <div className="w-12 h-12 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin mb-3" />
            ) : (
              <svg className="w-12 h-12 text-text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
            <p className="text-sm text-text-secondary mb-1">
              {isLoading ? (
                <span className="text-cyan font-semibold">Processing...</span>
              ) : (
                <>
                  <span className="text-cyan font-semibold">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-text-muted">Any CSV file with call center data (max 50MB)</p>
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red/10 border border-red/30 rounded-md">
          <p className="text-sm text-red">{error}</p>
        </div>
      )}
    </div>
  );
}
