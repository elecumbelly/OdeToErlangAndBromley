import { useState } from 'react';
import Papa from 'papaparse';
import { useCalculatorStore } from '../store/calculatorStore';

interface ACDRow {
  Index?: string;
  'Incoming Call'?: string;
  'Answered Call'?: string;
  'Answer Rate'?: string;
  'Abandoned C'?: string;
  'Answer Spec'?: string;
  'Talk Duration'?: string;
  'Waiting Time'?: string;
  'Service Level'?: string;
  [key: string]: string | undefined;
}

interface ParsedInterval {
  index: number;
  incomingCalls: number;
  answeredCalls: number;
  abandonedCalls: number;
  answerRate: number;
  ahtSeconds: number;
  waitTimeSeconds: number;
  serviceLevel: number;
  answerSpecSeconds: number;
}

interface ImportSummary {
  intervalCount: number;
  totalIncoming: number;
  totalAnswered: number;
  totalAbandoned: number;
  abandonRate: number;
  avgAHT: number;
  avgSL: number;
  avgAnswerSpec: number;
  avgVolume: number;
  answerRate: number;
}

export default function ACDImport() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedInterval[] | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const setInput = useCalculatorStore((state) => state.setInput);

  // Parse HH:MM:SS format to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr || timeStr.trim() === '') return 0;

    const parts = timeStr.split(':');
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  };

  // Parse percentage string to decimal
  const parsePercentage = (pctStr: string): number => {
    if (!pctStr || pctStr.trim() === '') return 0;
    const cleaned = pctStr.replace('%', '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setParsedData(null);
    setSummary(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as ACDRow[];

          // Parse each row
          const intervals: ParsedInterval[] = data.map((row, idx) => {
            const incomingCalls = parseInt(row['Incoming Call'] || '0', 10);
            const answeredCalls = parseInt(row['Answered Call'] || '0', 10);
            const abandonedCalls = parseInt(row['Abandoned C'] || '0', 10);
            const answerRate = parsePercentage(row['Answer Rate'] || '0');
            const ahtSeconds = parseTimeToSeconds(row['Talk Duration'] || '00:00:00');
            const waitTimeSeconds = parseTimeToSeconds(row['Waiting Time'] || '00:00:00');
            const serviceLevel = parsePercentage(row['Service Level'] || '0');
            const answerSpecSeconds = parseTimeToSeconds(row['Answer Spec'] || '00:00:00');

            return {
              index: parseInt(row.Index || String(idx + 1), 10),
              incomingCalls,
              answeredCalls,
              abandonedCalls,
              answerRate,
              ahtSeconds,
              waitTimeSeconds,
              serviceLevel,
              answerSpecSeconds
            };
          }).filter(interval => interval.incomingCalls > 0); // Filter out empty intervals

          if (intervals.length === 0) {
            throw new Error('No valid data found in file');
          }

          setParsedData(intervals);

          // Calculate summary statistics
          const totalIncoming = intervals.reduce((sum, i) => sum + i.incomingCalls, 0);
          const totalAnswered = intervals.reduce((sum, i) => sum + i.answeredCalls, 0);
          const totalAbandoned = intervals.reduce((sum, i) => sum + i.abandonedCalls, 0);

          // Weighted average AHT (weighted by answered calls)
          const totalTalkTime = intervals.reduce((sum, i) => sum + (i.ahtSeconds * i.answeredCalls), 0);
          const avgAHT = totalAnswered > 0 ? Math.round(totalTalkTime / totalAnswered) : 0;

          // Average service level
          const avgSL = intervals.reduce((sum, i) => sum + i.serviceLevel, 0) / intervals.length;

          // Average answer spec (threshold)
          const avgAnswerSpec = Math.round(
            intervals.reduce((sum, i) => sum + i.answerSpecSeconds, 0) / intervals.length
          );

          // Abandonment rate
          const abandonRate = totalIncoming > 0 ? (totalAbandoned / totalIncoming) * 100 : 0;

          // Average volume per interval
          const avgVolume = Math.round(totalIncoming / intervals.length);

          const summaryData = {
            intervalCount: intervals.length,
            totalIncoming,
            totalAnswered,
            totalAbandoned,
            abandonRate,
            avgAHT,
            avgSL,
            avgAnswerSpec,
            avgVolume,
            answerRate: totalIncoming > 0 ? (totalAnswered / totalIncoming) * 100 : 0
          };

          setSummary(summaryData);
          setImporting(false);

        } catch (err) {
          setError('Error parsing ACD data: ' + (err as Error).message);
          setImporting(false);
        }
      },
      error: (err) => {
        setError('Error reading file: ' + err.message);
        setImporting(false);
      }
    });
  };

  const applyToCalculator = () => {
    if (!summary) return;

    // Pre-fill calculator with average values from imported data
    setInput('volume', summary.avgVolume);
    setInput('aht', summary.avgAHT);
    setInput('thresholdSeconds', summary.avgAnswerSpec);
    setInput('targetSLPercent', Math.round(summary.avgSL));

    alert('✅ Calculator updated with your ACD data!\n\n' +
          `Volume: ${summary.avgVolume} calls/interval\n` +
          `AHT: ${summary.avgAHT} seconds (${Math.floor(summary.avgAHT / 60)}:${String(summary.avgAHT % 60).padStart(2, '0')})\n` +
          `Target SL: ${Math.round(summary.avgSL)}%\n` +
          `Threshold: ${summary.avgAnswerSpec} seconds`);
  };

  const downloadTemplate = () => {
    const template = `Index,Incoming Call,Answered Call,Answer Rate,Abandoned C,Answer Spec,Talk Duration,Waiting Time,Service Level
1,127,120,94.49%,7,00:00:17,00:02:14,00:00:45,76.98%
2,200,182,91.00%,18,00:00:20,00:02:22,00:06:55,72.73%
3,216,198,91.67%,18,00:00:18,00:02:38,00:03:50,74.30%
4,255,145,93.55%,10,00:00:15,00:02:29,00:03:12,79.61%
5,37,37,100.00%,0,00:00:03,00:02:06,00:00:35,97.30%
6,315,304,96.51%,11,00:00:18,00:01:35,00:02:37,77.17%
7,252,244,96.83%,8,00:00:13,00:01:50,00:02:02,82.00%`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'acd-data-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-purple-100 p-3 rounded-lg">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">ACD Historical Data Import</h3>
          <p className="text-sm text-gray-600">Import your contact centre ACD reports</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="space-y-4">
        <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors bg-purple-50">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="acd-upload"
          />
          <label htmlFor="acd-upload" className="cursor-pointer flex flex-col items-center space-y-2">
            <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-medium text-purple-700">
              {importing ? 'Importing...' : 'Click to upload your ACD CSV file'}
            </span>
            <span className="text-xs text-purple-600">
              Supports standard ACD export formats (Incoming Call, Answered Call, Talk Duration, etc.)
            </span>
          </label>
        </div>

        {/* Download Template Button */}
        <button
          onClick={downloadTemplate}
          className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
        >
          📥 Download ACD Template (Sample Format)
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Display */}
      {summary && parsedData && (
        <div className="mt-6 space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Import Summary</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-600">Intervals</div>
                <div className="text-2xl font-bold text-purple-600">{summary.intervalCount}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-600">Total Calls</div>
                <div className="text-2xl font-bold text-blue-600">{summary.totalIncoming.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-600">Avg Volume</div>
                <div className="text-2xl font-bold text-green-600">{summary.avgVolume}</div>
                <div className="text-xs text-gray-500">per interval</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-600">Answer Rate</div>
                <div className="text-2xl font-bold text-indigo-600">{summary.answerRate.toFixed(1)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-600">Avg AHT</div>
                <div className="text-lg font-bold text-gray-900">
                  {Math.floor(summary.avgAHT / 60)}:{String(summary.avgAHT % 60).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500">{summary.avgAHT} seconds</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-600">Avg Service Level</div>
                <div className="text-lg font-bold text-gray-900">{summary.avgSL.toFixed(1)}%</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-600">Abandon Rate</div>
                <div className="text-lg font-bold text-gray-900">{summary.abandonRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">{summary.totalAbandoned} calls</div>
              </div>
            </div>

            <button
              onClick={applyToCalculator}
              className="w-full mt-4 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              ✨ Apply to Calculator
            </button>
          </div>

          {/* Interval Details */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h5 className="font-semibold text-gray-900">Interval Details (first 10)</h5>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Interval</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Incoming</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Answered</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Abandoned</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">AHT</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SL %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedData.slice(0, 10).map((interval, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-900">{interval.index}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-900">{interval.incomingCalls}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-green-600">{interval.answeredCalls}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-red-600">{interval.abandonedCalls}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                        {Math.floor(interval.ahtSeconds / 60)}:{String(interval.ahtSeconds % 60).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                        {interval.serviceLevel.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Supported Format</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p><strong>Required Columns:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li><strong>Incoming Call</strong> - Total offered volume</li>
            <li><strong>Answered Call</strong> - Calls answered by agents</li>
            <li><strong>Talk Duration</strong> - AHT in HH:MM:SS format</li>
            <li><strong>Service Level</strong> - Achieved SL percentage</li>
          </ul>
          <p className="mt-2"><strong>Optional Columns:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>Abandoned C - Abandoned call count</li>
            <li>Answer Spec - SL threshold (HH:MM:SS)</li>
            <li>Waiting Time - Queue time</li>
            <li>Answer Rate - % answered</li>
          </ul>
          <p className="mt-2 text-blue-700">
            <strong>💡 Tip:</strong> This importer automatically converts time formats and percentages!
          </p>
        </div>
      </div>
    </div>
  );
}
