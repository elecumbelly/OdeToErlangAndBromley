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
    <div className="space-y-6 animate-fade-in">
      {/* Welcome / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-bg-surface to-bg-base border border-border-subtle rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Command Centre</h1>
          <p className="text-text-secondary mt-1">
            {currentCampaign 
              ? `Overview for ${currentCampaign.campaign_name}` 
              : 'System Overview - Select a campaign to drill down'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedCampaignId ?? ''}
            onChange={(e) => selectCampaign(e.target.value ? Number(e.target.value) : null)}
            className="bg-bg-elevated border border-border-subtle rounded-lg px-4 py-2 text-sm text-text-primary focus:ring-2 focus:ring-cyan/20 outline-none"
          >
            <option value="">Global View</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.campaign_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Current Staffing"
          value={results?.requiredAgents ?? 0}
          unit="agents"
          status={results?.canAchieveTarget ? 'success' : 'warning'}
          description="Required for current volume"
          glow
        />
        <MetricCard
          label="Forecast Volume"
          value={inputs.volume}
          unit="calls"
          status="info"
          description={`@ ${inputs.aht}s AHT`}
        />
        <MetricCard
          label="Service Level"
          value={results?.serviceLevel ? results.serviceLevel * 100 : 0}
          unit="%"
          decimals={1}
          status={results && results.serviceLevel >= inputs.targetSLPercent / 100 ? 'success' : 'error'}
          description={`Target: ${inputs.targetSLPercent}%`}
        />
        <MetricCard
          label="Efficiency (Occ)"
          value={results?.occupancy ? results.occupancy * 100 : 0}
          unit="%"
          decimals={1}
          trend="up"
          status={results && results.occupancy > inputs.maxOccupancy / 100 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-bg-surface border border-border-subtle rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-4">Service Level Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Area type="monotone" dataKey="sl" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorSl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action / Alerts Feed */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-text-primary mb-4">Action Required</h3>
          <div className="space-y-3 flex-1">
            <div className="p-3 bg-red/10 border border-red/20 rounded-lg flex gap-3 items-start">
              <span className="text-red">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">Understaffed: Monday Morning</p>
                <p className="text-xs text-text-secondary mt-1">Forecast exceeds staff capacity by 15%.</p>
              </div>
            </div>
            <div className="p-3 bg-amber/10 border border-amber/20 rounded-lg flex gap-3 items-start">
              <span className="text-amber">⚡</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">High Occupancy Risk</p>
                <p className="text-xs text-text-secondary mt-1">Agents predicted to hit 92% occupancy.</p>
              </div>
            </div>
            <div className="p-3 bg-bg-elevated border border-border-subtle rounded-lg flex gap-3 items-start">
              <span className="text-cyan">📅</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">Schedule Gap</p>
                <p className="text-xs text-text-secondary mt-1">3 shifts unassigned for next week.</p>
              </div>
            </div>
          </div>
          <button className="mt-4 w-full py-2 bg-bg-elevated hover:bg-bg-hover border border-border-subtle rounded-lg text-sm text-text-primary font-medium transition-colors">
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  );
}
