interface ImportSummaryProps {
  summary: {
    intervals: number;
    totalVolume: number;
    avgAHT: number;
    avgSL: number;
  };
  onApply: () => void;
}

export default function ImportSummary({ summary, onApply }: ImportSummaryProps) {
  return (
    <div className="bg-green/10 border border-green/30 rounded-lg p-6">
      <h3 className="text-lg font-bold text-green mb-3">Data Saved to Database!</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-green/80 font-medium uppercase tracking-wide text-xs">Intervals Saved</p>
          <p className="text-2xl font-bold text-green tabular-nums">{summary.intervals}</p>
        </div>
        <div>
          <p className="text-green/80 font-medium uppercase tracking-wide text-xs">Total Volume</p>
          <p className="text-2xl font-bold text-green tabular-nums">{summary.totalVolume}</p>
        </div>
        <div>
          <p className="text-green/80 font-medium uppercase tracking-wide text-xs">Avg AHT</p>
          <p className="text-2xl font-bold text-green tabular-nums">{summary.avgAHT}s</p>
        </div>
        <div>
          <p className="text-green/80 font-medium uppercase tracking-wide text-xs">Avg SL</p>
          <p className="text-2xl font-bold text-green tabular-nums">{summary.avgSL}%</p>
        </div>
      </div>
      <button
        onClick={onApply}
        className="mt-4 w-full px-6 py-3 bg-green/20 text-green border border-green/50 rounded-lg hover:bg-green/30 transition-colors font-medium uppercase tracking-wide text-sm"
      >
        Apply This Data to Calculator
      </button>
    </div>
  );
}
