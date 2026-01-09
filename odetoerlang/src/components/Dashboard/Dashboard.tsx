import { useCalculatorStore } from '../../store/calculatorStore';
import { useDatabaseStore } from '../../store/databaseStore';
import { MetricCard } from '../ui/MetricCard';

export default function Dashboard() {
  const { campaigns, selectedCampaignId, selectCampaign } = useDatabaseStore();
  const { inputs, results } = useCalculatorStore();

  const currentCampaign = campaigns.find(c => c.id === selectedCampaignId);

  // Helper to trigger tab change would require context, but for now we just show status
  // In a real app, we'd pass a navigation handler

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-bg-surface border border-border-subtle rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Command Centre</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {currentCampaign 
              ? `${currentCampaign.campaign_name}` 
              : 'Global Overview'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
            title="Download Report"
          >
            📥
          </button>
          <select 
            value={selectedCampaignId ?? ''}
            onChange={(e) => selectCampaign(e.target.value ? Number(e.target.value) : null)}
            className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary focus:ring-1 focus:ring-cyan/30 outline-none min-w-[150px]"
          >
            <option value="">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.campaign_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Grid - Real Data Only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Staffing"
          value={results?.requiredAgents ?? 0}
          unit="agents"
          status={results?.canAchieveTarget ? 'neutral' : 'warning'}
        />
        <MetricCard
          label="Forecast"
          value={inputs.volume}
          unit="calls"
          status="info"
        />
        <MetricCard
          label="Service Level"
          value={results?.serviceLevel ? results.serviceLevel * 100 : 0}
          unit="%"
          decimals={1}
          status={results && results.serviceLevel >= inputs.targetSLPercent / 100 ? 'success' : 'error'}
        />
        <MetricCard
          label="Occupancy"
          value={results?.occupancy ? results.occupancy * 100 : 0}
          unit="%"
          decimals={1}
          status={results && results.occupancy > inputs.maxOccupancy / 100 ? 'warning' : 'neutral'}
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 hover:border-cyan/30 transition-colors group">
          <div className="w-10 h-10 bg-cyan/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-cyan/20 transition-colors">
            <span className="text-xl">🧮</span>
          </div>
          <h3 className="font-bold text-text-primary">Calculator</h3>
          <p className="text-xs text-text-muted mt-1">Run Erlang C/A models and optimize staffing.</p>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 hover:border-purple/30 transition-colors group">
          <div className="w-10 h-10 bg-purple/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple/20 transition-colors">
            <span className="text-xl">📜</span>
          </div>
          <h3 className="font-bold text-text-primary">Historical Analysis</h3>
          <p className="text-xs text-text-muted mt-1">View trends and generate volume forecasts.</p>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 hover:border-green/30 transition-colors group">
          <div className="w-10 h-10 bg-green/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green/20 transition-colors">
            <span className="text-xl">⏰</span>
          </div>
          <h3 className="font-bold text-text-primary">Scheduling</h3>
          <p className="text-xs text-text-muted mt-1">Build rosters and manage staff availability.</p>
        </div>
      </div>
    </div>
  );
}