import { useState } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import { useDatabaseStore } from '../store/databaseStore';
import { useCSVWorker } from '../hooks/useCSVWorker';
import { useToast } from './ui/Toast';
import { type HistoricalData, saveHistoricalDataBatch } from '../lib/database/dataAccess';
import FileUploader from './Import/SubComponents/FileUploader';
import ColumnMapper from './Import/SubComponents/ColumnMapper';
import DataPreview from './Import/SubComponents/DataPreview';
import ImportSummary from './Import/SubComponents/ImportSummary';
import { cn } from '../utils/cn';

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

const SAMPLE_PASTED_DATA = [
  ['Date', 'Volume', 'AHT', 'Service Level'],
  ['2025-01-01', '950', '240', '82'],
  ['2025-01-01', '1000', '230', '85'],
  ['2025-01-01', '1050', '220', '86'],
].map((row) => row.join(',')).join('\n');

const DEFAULT_MAPPINGS: ColumnMapping[] = [
  { field: 'date', label: 'Date', required: true, mappedTo: null, description: 'Date of the interval (YYYY-MM-DD)' },
  { field: 'interval_start', label: 'Interval Start', required: false, mappedTo: null, description: 'Start time of the interval (HH:MM:SS)' },
  { field: 'interval_end', label: 'Interval End', required: false, mappedTo: null, description: 'End time of the interval (HH:MM:SS)' },
  { field: 'volume', label: 'Call Volume', required: true, mappedTo: null, description: 'Total incoming calls/contacts' },
  { field: 'answered', label: 'Answered Calls', required: false, mappedTo: null, description: 'Calls answered by agents' },
  { field: 'aht', label: 'Average Handle Time', required: true, mappedTo: null, description: 'Talk time in seconds or HH:MM:SS' },
  { field: 'answerRate', label: 'Answer Rate %', required: false, mappedTo: null, description: 'Percentage of calls answered' },
  { field: 'abandoned', label: 'Abandoned Calls', required: false, mappedTo: null, description: 'Calls abandoned before answer' },
  { field: 'serviceLevel', label: 'Service Level %', required: false, mappedTo: null, description: 'Achieved service level percentage' },
  { field: 'asa', label: 'Average Speed of Answer', required: false, mappedTo: null, description: 'Average wait time in seconds or HH:MM:SS' },
  { field: 'actual_agents', label: 'Actual Agents', required: false, mappedTo: null, description: 'Number of agents logged in' },
  { field: 'actual_fte', label: 'Actual FTE', required: false, mappedTo: null, description: 'Full-time equivalents logged in' },
  { field: 'threshold', label: 'SL Threshold', required: false, mappedTo: null, description: 'Service level threshold in seconds' }
];

export default function SmartCSVImport() {
  const setInput = useCalculatorStore((state) => state.setInput);
  const { selectedCampaignId, refreshAll } = useDatabaseStore();
  const { parseCSV, isLoading: isWorkerLoading, error: workerError } = useCSVWorker();
  const { addToast } = useToast();
  
  const [parsedData, setParsedData] = useState<(string | number | null | undefined)[][] | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>(DEFAULT_MAPPINGS);
  const [lastImportSummary, setLastImportSummary] = useState<{
    intervals: number;
    totalVolume: number;
    avgAHT: number;
    avgSL: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  const resetImportState = () => {
    setError(null);
    setPreview(null);
    setLastImportSummary(null);
    setMappings(DEFAULT_MAPPINGS);
    setParsedData(null);
    setSourceLabel(null);
  };

  const applyParsedData = (rows: (string | number | null | undefined)[][], label: string) => {
    if (!rows || rows.length < 2) {
      setError('Data must include a header row and at least one data row');
      return;
    }

    const headers = rows[0] as string[];
    const sampleRows = rows.slice(1, 6) as (string | number | null | undefined)[][];

    setParsedData(rows);
    setPreview({
      headers,
      rows: sampleRows,
      rowCount: rows.length - 1
    });
    setSourceLabel(label);

    autoDetectMappings(headers);
    addToast(`Loaded ${rows.length - 1} rows from ${label}`, 'info');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    resetImportState();

    try {
      const start = performance.now();
      const results = await parseCSV(file);
      setLastParseDuration(performance.now() - start);

      applyParsedData(results.data as (string | number | null | undefined)[][], file.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error parsing CSV';
      setError(message);
      addToast(message, 'error');
    }
  };

  const autoDetectMappings = (headers: string[]) => {
    const detectionRules: { [key: string]: string[] } = {
      date: ['date', 'day', 'yyyy-mm-dd'],
      interval_start: ['start time', 'time', 'interval'],
      interval_end: ['end time'],
      volume: ['incoming', 'volume', 'calls', 'contacts', 'offered'],
      answered: ['answered', 'handled', 'connected'],
      aht: ['aht', 'handle time', 'talk time', 'talk duration', 'duration'],
      answerRate: ['answer rate', 'answered %', 'answer %'],
      abandoned: ['abandoned', 'lost', 'dropped'],
      serviceLevel: ['service level', 'sl %', 'sla', 'service %'],
      asa: ['asa', 'answer speed', 'avg speed', 'speed of answer'],
      actual_agents: ['agents', 'staff', 'productive agents'],
      actual_fte: ['fte', 'full time equivalent'],
      threshold: ['threshold', 'target seconds', 'sl threshold']
    };

    setMappings(prev => {
      const newMappings = [...prev];
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
      return newMappings;
    });
  };

  const handleMappingChange = (field: string, header: string | null) => {
    setMappings(prev => prev.map(m =>
      m.field === field ? { ...m, mappedTo: header } : m
    ));
  };

  const parseTimeToSeconds = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value || value.toString().trim() === '') return 0;

    const str = value.toString().trim();

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

  const handlePasteImport = async () => {
    const text = pastedText.trim();
    if (!text) {
      setError('Paste rows from Excel/CSV first.');
      return;
    }

    const start = performance.now();
    await parseTextAndApply(text, 'pasted data');
    setLastParseDuration(performance.now() - start);
  };

  const parseTextAndApply = async (text: string, label: string) => {
    resetImportState();
    try {
      const Papa = await import('papaparse');
      const parsed = Papa.default.parse(text, {
        delimiter: '', // auto-detect (commas or tabs)
        skipEmptyLines: true,
      });

      if (parsed.errors && parsed.errors.length > 0) {
        addToast(`Warning: ${parsed.errors.length} parsing issues found. Using parsed rows.`, 'warning');
      }

      applyParsedData(parsed.data as (string | number | null | undefined)[][], label);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error parsing data';
      setError(message);
      addToast(message, 'error');
    }
  };

  const handleSampleImport = async () => {
    setPastedText(SAMPLE_PASTED_DATA);
    await parseTextAndApply(SAMPLE_PASTED_DATA, 'example data');
  };

  const validateAndImport = async () => {
    if (!preview || !parsedData) {
      setError('No data loaded');
      return;
    }

    if (selectedCampaignId === null) {
      const msg = 'Please select a campaign before importing historical data.';
      setError(msg);
      addToast(msg, 'warning');
      return;
    }

    const unmappedRequired = mappings.filter(m => m.required && !m.mappedTo);
    if (unmappedRequired.length > 0) {
      const message = `Required fields not mapped: ${unmappedRequired.map(m => m.label).join(', ')}`;
      setError(message);
      addToast(message, 'warning');
      return;
    }

    try {
      const headers = parsedData[0] as string[];
      const dataRows = parsedData.slice(1) as (string | number | null | undefined)[][];
      const importBatchId = Date.now();

      const historicalDataToSave: HistoricalData[] = dataRows
        .filter(row => row.some(cell => cell && cell.toString().trim() !== ''))
        .map((row, index) => {
          const rowData: Partial<HistoricalData> = {
            import_batch_id: importBatchId,
            campaign_id: selectedCampaignId,
            date: new Date().toISOString().split('T')[0],
          };

          let volume = 0;
          let answered = 0;
          let serviceLevel = 0;

          mappings.forEach(mapping => {
            if (!mapping.mappedTo) return;
            const columnIndex = headers.indexOf(mapping.mappedTo);
            if (columnIndex === -1) return;

            const value = row[columnIndex];
            const valueStr = value != null ? String(value) : '';
            const valueNum = typeof value === 'number' ? value : parseFloat(valueStr) || 0;

            switch (mapping.field) {
              case 'volume': volume = valueNum; rowData.volume = valueNum; break;
              case 'answered': answered = valueNum; rowData.actual_agents = valueNum; break;
              case 'aht': rowData.aht = parseTimeToSeconds(valueStr || valueNum); break;
              case 'abandoned': rowData.abandons = valueNum; break;
              case 'serviceLevel': 
                serviceLevel = parsePercentage(valueStr || valueNum);
                rowData.sla_achieved = serviceLevel / 100;
                break;
              case 'asa': rowData.asa = parseTimeToSeconds(valueStr || valueNum); break;
              case 'actual_agents': rowData.actual_agents = valueNum; break;
              case 'actual_fte': rowData.actual_fte = valueNum; break;
              case 'date':
                if (valueStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  rowData.date = valueStr;
                } else {
                  // Only warn once per batch to avoid spam
                  if (index === 0) addToast(`Invalid date format. Using current date.`, 'warning');
                }
                break;
              case 'interval_start': rowData.interval_start = valueStr; break;
              case 'interval_end': rowData.interval_end = valueStr; break;
            }
          });

          if (!rowData.abandons && volume && answered) rowData.abandons = volume - answered;
          if (!rowData.sla_achieved && serviceLevel) rowData.sla_achieved = serviceLevel / 100;
          if (!rowData.actual_agents && answered) rowData.actual_agents = answered;

          return rowData as HistoricalData;
        });

      saveHistoricalDataBatch(historicalDataToSave);
      addToast(`Successfully imported ${historicalDataToSave.length} records!`, 'success');
      setError(null);

      const totalVolume = historicalDataToSave.reduce((sum, row) => sum + (row.volume || 0), 0);
      const totalAHT = historicalDataToSave.reduce((sum, row) => sum + (row.aht || 0), 0);
      const totalSL = historicalDataToSave.reduce((sum, row) => sum + ((row.sla_achieved || 0) * 100), 0);
      const validRowsForAHT = historicalDataToSave.filter(row => row.aht !== undefined);
      const validRowsForSL = historicalDataToSave.filter(row => row.sla_achieved !== undefined);

      setLastImportSummary({
        intervals: historicalDataToSave.length,
        totalVolume,
        avgAHT: validRowsForAHT.length > 0 ? Math.round(totalAHT / validRowsForAHT.length) : 0,
        avgSL: validRowsForSL.length > 0 ? parseFloat((totalSL / validRowsForSL.length).toFixed(1)) : 0,
      });

      refreshAll();

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import error';
      setError(message);
      addToast(message, 'error');
    }
  };

  const applyToCalculator = () => {
    if (!lastImportSummary) {
      addToast('No data imported to apply.', 'warning');
      return;
    }

    const avgVolume = lastImportSummary.intervals > 0 
      ? Math.round(lastImportSummary.totalVolume / lastImportSummary.intervals) 
      : 0;

    setInput('volume', avgVolume > 0 ? avgVolume : lastImportSummary.totalVolume);
    setInput('aht', lastImportSummary.avgAHT > 0 ? lastImportSummary.avgAHT : 240);

    addToast(
      `Applied: ${avgVolume} contacts, ${lastImportSummary.avgAHT}s AHT. Switch to Calculator tab.`,
      'success',
      5000
    );
  };

  const displayError = error || workerError;
  const [lastParseDuration, setLastParseDuration] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <FileUploader 
          isLoading={isWorkerLoading} 
          onFileUpload={handleFileUpload} 
          error={displayError} 
        />

        <div className="bg-bg-surface rounded-lg shadow-md p-6 border border-border-subtle">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Paste from Excel</h2>
              <p className="text-xs text-text-secondary mt-1">
                Copy rows from Excel or Sheets (header row + data) and paste here. Works with commas or tabs.
              </p>
            </div>
            <span className="text-2xs text-text-muted uppercase tracking-wide bg-bg-elevated border border-border-muted rounded px-2 py-1">
              Quick ingest
            </span>
          </div>
          <textarea
            className={cn(
              'w-full h-32 p-3 rounded border border-border-subtle bg-bg-elevated text-sm text-text-primary',
              'focus:outline-none focus:ring-2 focus:ring-cyan/40 resize-y'
            )}
            placeholder="Date,Volume,AHT,Service Level&#10;2025-01-01,950,240,82&#10;2025-01-01,1000,230,85"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <div className="flex items-center flex-wrap gap-2 mt-3">
            <button
              type="button"
          onClick={handlePasteImport}
          className="px-3 py-2 bg-cyan text-bg-base rounded font-semibold text-xs hover:bg-cyan/90 transition-colors"
        >
          Parse Pasted Data
        </button>
            <button
              type="button"
              onClick={handleSampleImport}
              className="px-3 py-2 bg-bg-elevated text-text-primary border border-border-muted rounded font-semibold text-xs hover:bg-bg-hover transition-colors"
            >
              Load Example Data
            </button>
            {sourceLabel && (
              <span className="text-2xs text-text-muted">Loaded: {sourceLabel}</span>
            )}
          </div>
        </div>
      </div>

      {displayError && (
        <div className="p-3 bg-red/10 border border-red/30 rounded-md text-sm text-red">
          {displayError}
        </div>
      )}

      {lastParseDuration !== null && (
        <div className="text-2xs text-text-muted">
          Parse time: {lastParseDuration.toFixed(1)} ms
        </div>
      )}

      {preview && (
        <ColumnMapper
          mappings={mappings}
          headers={preview.headers}
          onMappingChange={handleMappingChange}
          onImport={validateAndImport}
          isLoading={isWorkerLoading}
          canApply={!!lastImportSummary}
          onApply={applyToCalculator}
        />
      )}

      {preview && (
        <DataPreview 
          headers={preview.headers} 
          rows={preview.rows} 
          rowCount={preview.rowCount} 
        />
      )}

      {lastImportSummary && (
        <ImportSummary 
          summary={lastImportSummary} 
          onApply={applyToCalculator} 
        />
      )}
    </div>
  );
}
