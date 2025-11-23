import { useState, useCallback } from 'react';
import Papa from 'papaparse';

interface CSVRow {
  [key: string]: string;
}

interface ImportedData {
  volumes?: Array<{ date: string; time: string; volume: number }>;
  aht?: Array<{ channel: string; skill: string; aht: number }>;
  shrinkage?: Array<{ category: string; percentage: number }>;
}

interface CSVImportProps {
  onDataImported: (data: ImportedData) => void;
}

export default function CSVImport({ onDataImported }: CSVImportProps) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CSVRow[] | null>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as CSVRow[];
          setPreview(data.slice(0, 5)); // Show first 5 rows

          // Auto-detect CSV type based on headers
          const headers = Object.keys(data[0] || {}).map(h => h.toLowerCase());

          if (headers.includes('volume') && (headers.includes('date') || headers.includes('time'))) {
            // Volume data
            const volumes = data.map(row => ({
              date: row.Date || row.date || '',
              time: row.Time || row.time || '',
              volume: parseFloat(row.Volume || row.volume || '0')
            }));
            onDataImported({ volumes });
          } else if (headers.includes('aht') && (headers.includes('channel') || headers.includes('skill'))) {
            // AHT data
            const aht = data.map(row => ({
              channel: row.Channel || row.channel || 'Voice',
              skill: row.Skill || row.skill || 'General',
              aht: parseFloat(row.AHT || row.aht || row.AHT_Seconds || '0')
            }));
            onDataImported({ aht });
          } else if (headers.includes('category') && headers.includes('percentage')) {
            // Shrinkage data
            const shrinkage = data.map(row => ({
              category: row.Category || row.category || '',
              percentage: parseFloat(row.Percentage || row.percentage || '0')
            }));
            onDataImported({ shrinkage });
          } else {
            setError('Unrecognized CSV format. Please use volume, AHT, or shrinkage template.');
          }

          setImporting(false);
        } catch (err) {
          setError('Error parsing CSV: ' + (err as Error).message);
          setImporting(false);
        }
      },
      error: (err) => {
        setError('Error reading file: ' + err.message);
        setImporting(false);
      }
    });
  }, [onDataImported]);

  const downloadTemplate = (type: 'volume' | 'aht' | 'shrinkage') => {
    let csvContent = '';

    switch (type) {
      case 'volume':
        csvContent = 'Date,Time,Channel,Skill,Volume\n2025-01-15,09:00,Voice,Sales,120\n2025-01-15,09:30,Voice,Sales,145\n2025-01-15,10:00,Voice,Sales,160';
        break;
      case 'aht':
        csvContent = 'Channel,Skill,AHT_Seconds\nVoice,Sales,420\nVoice,Support,360\nChat,Sales,180\nEmail,Support,300';
        break;
      case 'shrinkage':
        csvContent = 'Category,Percentage\nBreaks,8.33\nLunch,4.17\nTraining,5.00\nMeetings,3.00\nAbsenteeism,4.00';
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">CSV Import</h3>

      <div className="space-y-4">
        {/* Upload area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {importing ? 'Importing...' : 'Click to upload CSV or drag and drop'}
            </span>
            <span className="text-xs text-gray-500">
              Volume data, AHT, or Shrinkage configuration
            </span>
          </label>
        </div>

        {/* Download templates */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Download CSV Templates:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => downloadTemplate('volume')}
              className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded hover:bg-primary-100"
            >
              📊 Volume Template
            </button>
            <button
              onClick={() => downloadTemplate('aht')}
              className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded hover:bg-primary-100"
            >
              ⏱️ AHT Template
            </button>
            <button
              onClick={() => downloadTemplate('shrinkage')}
              className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded hover:bg-primary-100"
            >
              📉 Shrinkage Template
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows):</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0]).map((header) => (
                      <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-3 py-2 whitespace-nowrap text-gray-900">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">CSV Format Guide</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li><strong>Volume Data:</strong> Columns: Date, Time, Channel, Skill, Volume</li>
          <li><strong>AHT Data:</strong> Columns: Channel, Skill, AHT_Seconds</li>
          <li><strong>Shrinkage Data:</strong> Columns: Category, Percentage</li>
          <li>Headers are case-insensitive</li>
          <li>Download templates above for examples</li>
        </ul>
      </div>
    </div>
  );
}
