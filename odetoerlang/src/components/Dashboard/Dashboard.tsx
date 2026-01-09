import { useMemo } from 'react';
import { useCalculatorStore } from '../../store/calculatorStore';
import { useDatabaseStore } from '../../store/databaseStore';
import { MetricCard } from '../ui/MetricCard';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard() {
  const { campaigns, selectedCampaignId, selectCampaign } = useDatabaseStore();
  const { inputs, results } = useCalculatorStore();

  // Mock data for the "Health Trend" - in real app, fetch from HistoricalData
  const trendData = [
    { day: 'Mon', sl: 82 },
    { day: 'Tue', sl: 78 },
    { day: 'Wed', sl: 85 },
    { day: 'Thu', sl: 88 },
    { day: 'Fri', sl: 75 },
    { day: 'Sat', sl: 90 },
    { day: 'Sun', sl: 92 },
  ];

  const currentCampaign = campaigns.find(c => c.id === selectedCampaignId);

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

      {/* Primary KPI Grid */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-sm min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-text-primary">7-Day SL Trend</h3>
            <span className="text-xs text-text-muted bg-bg-elevated px-2 py-1 rounded">Last Week</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Area type="monotone" dataKey="sl" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action / Alerts Feed */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-text-primary mb-3">Alerts</h3>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px]">
            <div className="p-3 bg-bg-elevated border-l-2 border-red rounded-r-md flex gap-3 items-start">
              <div>
                <p className="text-xs font-semibold text-text-primary">Understaffed</p>
                <p className="text-[10px] text-text-secondary">Mon Morning: -15% capacity</p>
              </div>
            </div>
            <div className="p-3 bg-bg-elevated border-l-2 border-amber rounded-r-md flex gap-3 items-start">
              <div>
                <p className="text-xs font-semibold text-text-primary">High Occupancy</p>
                <p className="text-[10px] text-text-secondary">Risk of burnout (>92%)</p>
              </div>
            </div>
            <div className="p-3 bg-bg-elevated border-l-2 border-cyan rounded-r-md flex gap-3 items-start">
              <div>
                <p className="text-xs font-semibold text-text-primary">Schedule Gap</p>
                <p className="text-[10px] text-text-secondary">3 shifts unassigned</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
