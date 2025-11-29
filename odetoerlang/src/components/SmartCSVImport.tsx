import { useState } from 'react';
import Papa from 'papaparse';
import { useCalculatorStore } from '../store/calculatorStore';

interface ColumnMapping {
  field: string;
  label: string;
  required: boolean;
  mappedTo: string | null;
  description: string;
}

interface PreviewData {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  rowCount: number;
}

export default function SmartCSVImport() {
  const setInput = useCalculatorStore((state) => state.setInput);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([
    { field: 'volume', label: 'Call Volume', required: true, mappedTo: null, description: 'Total incoming calls/contacts' },
    { field: 'answered', label: 'Answered Calls', required: false, mappedTo: null, description: 'Calls answered by agents' },
    { field: 'aht', label: 'Average Handle Time', required: true, mappedTo: null, description: 'Talk time in seconds or HH:MM:SS' },
    { field: 'answerRate', label: 'Answer Rate %', required: false, mappedTo: null, description: 'Percentage of calls answered' },
    { field: 'abandoned', label: 'Abandoned Calls', required: false, mappedTo: null, description: 'Calls abandoned before answer' },
    { field: 'serviceLevel', label: 'Service Level %', required: false, mappedTo: null, description: 'Achieved service level percentage' },
    { field: 'asa', label: 'Average Speed of Answer', required: false, mappedTo: null, description: 'Average wait time in seconds or HH:MM:SS' },
    { field: 'waitingTime', label: 'Waiting Time', required: false, mappedTo: null, description: 'Average queue wait time' },
    { field: 'threshold', label: 'SL Threshold', required: false, mappedTo: null, description: 'Service level threshold in seconds' }
  ]);
  const [importedData, setImportedData] = useState<Record<string, number>[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);
    setImportedData(null);

    Papa.parse(file, {
      complete: (results) => {
        if (results.data.length < 2) {
          setError('File must have at least a header row and one data row');
          return;
        }

        const headers = results.data[0] as string[];
        const rows = results.data.slice(1, 6) as (string | number | null | undefined)[][]; // First 5 rows for preview

        setPreview({
          headers,
          rows,
          rowCount: results.data.length - 1
        });

        // Auto-detect mappings
        autoDetectMappings(headers);
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const autoDetectMappings = (headers: string[]) => {
    const detectionRules: { [key: string]: string[] } = {
      volume: ['incoming', 'volume', 'calls', 'contacts', 'offered'],
      answered: ['answered', 'handled', 'connected'],
      aht: ['aht', 'handle time', 'talk time', 'talk duration', 'duration'],
      answerRate: ['answer rate', 'answered %', 'answer %'],
      abandoned: ['abandoned', 'lost', 'dropped'],
      serviceLevel: ['service level', 'sl %', 'sla', 'service %'],
      asa: ['asa', 'answer speed', 'avg speed', 'speed of answer'],
      waitingTime: ['wait', 'waiting time', 'queue time'],
      threshold: ['threshold', 'target seconds', 'sl threshold']
    };

    const newMappings = [...mappings];

    newMappings.forEach(mapping => {
      const rules = detectionRules[mapping.field];
      if (!rules) return;

      const matchedHeader = headers.find(header => {
        const headerLower = header.toLowerCase().trim();
        return rules.some(rule => headerLower.includes(rule.toLowerCase()));
      });

      if (matchedHeader) {
        mapping.mappedTo = matchedHeader;
      }
    });

    setMappings(newMappings);
  };

  const handleMappingChange = (field: string, header: string | null) => {
    setMappings(mappings.map(m =>
      m.field === field ? { ...m, mappedTo: header } : m
    ));
  };

  const parseTimeToSeconds = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value || value.toString().trim() === '') return 0;

    const str = value.toString().trim();

    // Check for HH:MM:SS format
    if (str.includes(':')) {
      const parts = str.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        const seconds = parseInt(parts[2], 10) || 0;
        return hours * 3600 + minutes * 60 + seconds;
      }
      if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10) || 0;
        const seconds = parseInt(parts[1], 10) || 0;
        return minutes * 60 + seconds;
      }
    }

    // Try parsing as number
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const parsePercentage = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    const str = value.toString().trim();
    const cleaned = str.replace('%', '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const validateAndImport = () => {
    if (!preview) {
      setError('No file loaded');
      return;
    }

    // Check required fields are mapped
    const unmappedRequired = mappings.filter(m => m.required && !m.mappedTo);
    if (unmappedRequired.length > 0) {
      setError(`Required fields not mapped: ${unmappedRequired.map(m => m.label).join(', ')}`);
      return;
    }

    // Re-parse full file with mappings
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const headers = results.data[0] as string[];
        const dataRows = results.data.slice(1) as (string | number | null | undefined)[][];

        const processedData = dataRows
          .filter(row => row.some(cell => cell && cell.toString().trim() !== ''))
          .map((row, index) => {
            const rowData: Record<string, number> = { index: index + 1 };

            mappings.forEach(mapping => {
              if (!mapping.mappedTo) return;

              const columnIndex = headers.indexOf(mapping.mappedTo);
              if (columnIndex === -1) return;

              const value = row[columnIndex];
              const valueStr = value != null ? String(value) : '';
              const valueNum = typeof value === 'number' ? value : parseFloat(valueStr) || 0;

              // Parse based on field type
              if (mapping.field === 'aht' || mapping.field === 'asa' || mapping.field === 'waitingTime') {
                rowData[mapping.field] = parseTimeToSeconds(valueStr || valueNum);
              } else if (mapping.field === 'answerRate' || mapping.field === 'serviceLevel') {
                rowData[mapping.field] = parsePercentage(valueStr || valueNum);
              } else {
                rowData[mapping.field] = valueNum;
              }
            });

            // Calculate derived fields
            if (rowData.volume && rowData.answerRate && !rowData.answered) {
              rowData.answered = Math.round(rowData.volume * (rowData.answerRate / 100));
            }
            if (rowData.volume && rowData.answered && !rowData.abandoned) {
              rowData.abandoned = rowData.volume - rowData.answered;
            }

            return rowData;
          });

        setImportedData(processedData);
        setError(null);
      },
      error: (error) => {
        setError(`Import error: ${error.message}`);
      }
    });
  };

  const applyToCalculator = () => {
    if (!importedData || importedData.length === 0) return;

    // Calculate aggregates
    const totalVolume = importedData.reduce((sum, row) => sum + (row.volume || 0), 0);
    const totalAnswered = importedData.reduce((sum, row) => sum + (row.answered || 0), 0);

    // Weighted average AHT (by answered contacts)
    const totalTalkTime = importedData.reduce((sum, row) => sum + ((row.aht || 0) * (row.answered || row.volume || 0)), 0);
    const avgAHT = totalAnswered > 0
      ? Math.round(totalTalkTime / totalAnswered)
      : Math.round(totalTalkTime / totalVolume) || 240;

    // Average per interval (for typical 30-min interval calculation)
    const avgVolumePerInterval = Math.round(totalVolume / importedData.length);

    // Average service level
    const avgSL = importedData.reduce((sum, row) => sum + (row.serviceLevel || 0), 0) / importedData.length;

    console.log('Imported Data Summary:', {
      intervals: importedData.length,
      totalVolume,
      avgVolumePerInterval,
      totalAnswered,
      avgAHT,
      avgSL: avgSL.toFixed(2) + '%'
    });

    // Actually update the calculator store with imported values
    setInput('volume', avgVolumePerInterval > 0 ? avgVolumePerInterval : totalVolume);
    setInput('aht', avgAHT > 0 ? avgAHT : 240);

    // If service level threshold was imported, use it
    const avgThreshold = importedData.reduce((sum, row) => sum + (row.threshold || 0), 0) / importedData.length;
    if (avgThreshold > 0) {
      setInput('thresholdSeconds', Math.round(avgThreshold));
    }

    alert(`Data applied to calculator!\n\nVolume: ${avgVolumePerInterval > 0 ? avgVolumePerInterval : totalVolume} contacts\nAHT: ${avgAHT}s\n\nSwitch to Calculator tab to see results.`);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Universal CSV Importer</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload any CSV file and map your columns to our fields. Works with any ACD export format!
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="smart-csv-upload"
          />
          <label htmlFor="smart-csv-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600 mb-1">
                <span className="text-primary-600 font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">Any CSV file with call center data</p>
            </div>
          </label>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">⚠️ {error}</p>
          </div>
        )}
      </div>

      {/* Column Mapping */}
      {preview && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Step 2: Map Your Columns
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Match your CSV columns to our fields. Required fields are marked with *
          </p>

          <div className="space-y-3">
            {mappings.map(mapping => (
              <div key={mapping.field} className="grid grid-cols-12 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                <div className="col-span-4">
                  <label className="text-sm font-medium text-gray-700">
                    {mapping.label}
                    {mapping.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">{mapping.description}</p>
                </div>
                <div className="col-span-1 text-center">
                  <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <div className="col-span-7">
                  <select
                    value={mapping.mappedTo || ''}
                    onChange={(e) => handleMappingChange(mapping.field, e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="">-- Not Mapped --</option>
                    {preview.headers.map((header, idx) => (
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
              onClick={validateAndImport}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Import Data
            </button>
            {importedData && (
              <button
                onClick={applyToCalculator}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Apply to Calculator
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Preview (First 5 Rows of {preview.rowCount})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {preview.headers.map((header, idx) => (
                    <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Imported Data Summary */}
      {importedData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-900 mb-3">
            ✓ Data Imported Successfully!
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-green-700 font-medium">Intervals</p>
              <p className="text-2xl font-bold text-green-900">{importedData.length}</p>
            </div>
            <div>
              <p className="text-green-700 font-medium">Total Volume</p>
              <p className="text-2xl font-bold text-green-900">
                {importedData.reduce((sum, row) => sum + (row.volume || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-green-700 font-medium">Avg AHT</p>
              <p className="text-2xl font-bold text-green-900">
                {Math.round(
                  importedData.reduce((sum, row) => sum + (row.aht || 0), 0) / importedData.length
                )}s
              </p>
            </div>
            <div>
              <p className="text-green-700 font-medium">Avg SL</p>
              <p className="text-2xl font-bold text-green-900">
                {(importedData.reduce((sum, row) => sum + (row.serviceLevel || 0), 0) / importedData.length).toFixed(1)}%
              </p>
            </div>
          </div>
          <button
            onClick={applyToCalculator}
            className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            📊 Apply This Data to Calculator
          </button>
        </div>
      )}
    </div>
  );
}
