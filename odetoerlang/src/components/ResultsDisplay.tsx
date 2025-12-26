import { memo, useEffect, useMemo, useState, useRef } from 'react';
import { useCalculatorStore, calculateProductiveAgents } from '../store/calculatorStore';
import { useToast } from './ui/Toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calculateAchievableMetrics } from '../lib/calculations/erlangEngine';

const ResultsDisplay = memo(() => {
  const { results, inputs, abandonmentMetrics, staffingModel, activeProductivityModifier, achievableMetrics } = useCalculatorStore();
  const { addToast } = useToast();
  const [showDebug, setShowDebug] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(true);
  const [stickyHiddenForScroll, setStickyHiddenForScroll] = useState(false);
  const lastScrollY = useRef(0);

  const sensitivityData = useMemo(() => {
    const data: Array<{ agents: number; sl: number }> = [];
    if (!results) return data;
    const start = Math.max(1, results.requiredAgents - 5);
    const end = results.requiredAgents + 5;
    for (let agents = start; agents <= end; agents++) {
      const achievable = calculateAchievableMetrics({
        model: inputs.model,
        fixedAgents: agents,
        workload: {
          volume: inputs.volume,
          aht: inputs.aht,
          intervalMinutes: inputs.intervalMinutes,
        },
        constraints: {
          thresholdSeconds: inputs.thresholdSeconds,
          maxOccupancy: inputs.maxOccupancy,
        },
        behavior: {
          shrinkagePercent: inputs.shrinkagePercent,
          averagePatience: inputs.averagePatience,
          concurrency: inputs.concurrency,
        },
      });
      if (achievable?.serviceLevel !== undefined) {
        data.push({ agents, sl: parseFloat(achievable.serviceLevel.toFixed(1)) });
      }
    }
    return data;
  }, [results, inputs]);

  useEffect(() => {
    const stored = localStorage.getItem('ode_sticky_kpi_hidden');
    if (stored === 'true') {
      setShowStickyBar(false);
    }

    const handler = () => {
      const start = performance.now();
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) > 10) {
        if (delta > 0) {
          setStickyHiddenForScroll(true);
        } else {
          setStickyHiddenForScroll(false);
        }
        lastScrollY.current = currentY;
      }
      const duration = performance.now() - start;
      if (duration > 10) {
        console.debug('[perf] sticky scroll handler', duration.toFixed(2), 'ms');
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!results) {
    return (
      <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">Results</h2>
        <p className="text-text-muted text-xs">Enter parameters to see results...</p>
      </div>
    );
  }

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num === Infinity) return '∞';
    if (isNaN(num)) return '-';
    return num.toFixed(decimals);
  };

  const formatTime = (seconds: number): string => {
    if (seconds === Infinity) return '∞';
    if (isNaN(seconds)) return '-';
    if (seconds < 60) return `${formatNumber(seconds, 0)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const getStatusColor = (value: number, target: number): string => {
    if (value >= target) return 'text-green';
    if (value >= target * 0.9) return 'text-amber';
    return 'text-red';
  };

  const getOccupancyColor = (occupancy: number): string => {
    if (occupancy > inputs.maxOccupancy) return 'text-red';
    if (occupancy > inputs.maxOccupancy * 0.95) return 'text-amber';
    return 'text-green';
  };

  // Calculate productive agents from staffing model
  const { staffPerShift, productiveAgents } = calculateProductiveAgents(staffingModel, inputs.shrinkagePercent);

  // Calculate staffing gap
  const hasStaffingModel = staffingModel.totalHeadcount > 0;
  const staffingGap = hasStaffingModel ? productiveAgents - results.requiredAgents : 0;
  const isOverstaffed = staffingGap > 0;
  const isUnderstaffed = staffingGap < 0;
  const occupancyShortfall = achievableMetrics?.requiredAgentsForMaxOccupancy !== undefined
    ? Math.max(0, achievableMetrics.requiredAgentsForMaxOccupancy - (achievableMetrics.actualAgents ?? productiveAgents))
    : 0;
  const stickyMetrics = [
    { label: 'Agents', value: results.requiredAgents, color: 'text-cyan' },
    { label: 'SL', value: `${formatNumber(results.serviceLevel, 1)}%`, color: getStatusColor(results.serviceLevel, inputs.targetSLPercent) },
    { label: 'ASA', value: formatTime(results.asa), color: 'text-text-primary' },
    { label: 'Occ', value: `${formatNumber(results.occupancy, 1)}%`, color: getOccupancyColor(results.occupancy) },
  ];

  const copyResultsForExcel = async () => {
    const headers = [
      'Model',
      'Volume',
      'AHT (s)',
      'Interval (min)',
      'Target SL (%)',
      'Threshold (s)',
      'Max Occupancy (%)',
      'Required Agents',
      'FTE',
      'Service Level (%)',
      'ASA (s)',
      'Occupancy (%)',
    ];

    const row = [
      inputs.model,
      inputs.volume,
      inputs.aht,
      inputs.intervalMinutes,
      inputs.targetSLPercent,
      inputs.thresholdSeconds,
      inputs.maxOccupancy,
      results.requiredAgents,
      formatNumber(results.totalFTE, 1),
      formatNumber(results.serviceLevel, 1),
      formatNumber(results.asa, 1),
      formatNumber(results.occupancy, 1),
    ];

    const csv = `${headers.join(',')}\n${row.join(',')}`;

    try {
      await navigator.clipboard.writeText(csv);
      addToast('Copied results for Excel', 'success');
    } catch (err) {
      console.error('Clipboard write failed, falling back:', err);
      const textarea = document.createElement('textarea');
      textarea.value = csv;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      addToast('Copied results (fallback) for Excel', 'success');
    }
  };

  const toggleSticky = () => {
    const next = !showStickyBar;
    setShowStickyBar(next);
    localStorage.setItem('ode_sticky_kpi_hidden', next ? 'false' : 'true');
  };

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-muted">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Results
        </h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleSticky}
            className="text-2xs text-text-muted hover:text-text-secondary underline"
          >
            {showStickyBar ? 'Hide' : 'Show'} Sticky KPIs
          </button>
          <button
            type="button"
            onClick={copyResultsForExcel}
            className="text-2xs font-semibold text-cyan uppercase tracking-widest bg-bg-elevated border border-cyan/30 rounded px-3 py-1 hover:bg-cyan/10 transition-colors"
          >
            Copy for Excel
          </button>
        </div>
      </div>

      {/* Required vs Actual Comparison */}
      {hasStaffingModel && (
        <div className="mb-4 p-3 bg-bg-elevated border border-border-muted rounded-lg">
          <h3 className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
            Required vs Your Staff
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-surface border border-cyan/20 rounded p-2">
              <p className="text-2xs text-text-muted uppercase">Required</p>
              <p className="text-xl font-bold text-cyan tabular-nums">{results.requiredAgents}</p>
              <p className="text-2xs text-text-muted">{formatNumber(results.totalFTE, 1)} FTE</p>
            </div>
            <div className="bg-bg-surface border border-green/20 rounded p-2">
              <p className="text-2xs text-text-muted uppercase">Your Staff</p>
              <p className="text-xl font-bold text-green tabular-nums">{productiveAgents}</p>
              <p className="text-2xs text-text-muted">{staffPerShift} per shift</p>
            </div>
          </div>

          {/* Gap */}
          <div className={`mt-2 p-2 rounded ${isOverstaffed ? 'bg-green/5 border border-green/20' : isUnderstaffed ? 'bg-red/5 border border-red/20' : 'bg-bg-hover border border-border-muted'}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xs text-text-secondary uppercase">Gap</span>
              <span className={`text-sm font-bold tabular-nums ${isOverstaffed ? 'text-green' : isUnderstaffed ? 'text-red' : 'text-text-secondary'}`}>
                {staffingGap > 0 ? '+' : ''}{staffingGap}
              </span>
            </div>
            {isUnderstaffed && (
              <p className="text-2xs text-red mt-1">Need {Math.abs(staffingGap)} more for SL target</p>
            )}
          </div>

          {/* Achievable Metrics - What you can actually achieve with your staff */}
          {achievableMetrics && staffingModel.useAsConstraint && (
            <div className="mt-3 pt-3 border-t border-border-muted">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-2xs font-semibold text-amber uppercase tracking-widest">
                  With Your {achievableMetrics.actualAgents ?? productiveAgents} Agents
                </h4>
                {achievableMetrics.occupancyCapApplied && (
                  <span className="text-3xs font-semibold text-amber uppercase bg-amber/10 border border-amber/30 rounded px-2 py-0.5 flex items-center space-x-1">
                    <span>Cap Applied</span>
                    {achievableMetrics.occupancyPenalty !== undefined && (
                      <span className="text-[10px] font-normal text-amber/80">
                        ({Math.round((achievableMetrics.occupancyPenalty ?? 1) * 100)}% effective)
                      </span>
                    )}
                  </span>
                )}
              </div>
              <p className="text-3xs text-text-muted mb-2">
                Effective agents available: <span className="font-semibold text-text-primary">{achievableMetrics.effectiveAgents ?? productiveAgents}</span>
              </p>
              {achievableMetrics.occupancyCapApplied && achievableMetrics.requiredAgentsForMaxOccupancy && (
                <div className="mb-2 p-2 bg-amber/10 border border-amber/30 rounded flex items-start space-x-2">
                  <svg className="w-4 h-4 text-amber mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-3xs text-amber">
                    <p className="font-semibold uppercase tracking-wide">Occupancy Cap Hit</p>
                    <p>
                      Need <span className="font-semibold">{achievableMetrics.requiredAgentsForMaxOccupancy - (achievableMetrics.actualAgents ?? productiveAgents)}</span> more productive agents to stay at {inputs.maxOccupancy}% occupancy. Service level shown below includes this penalty.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-bg-surface border border-amber/20 rounded p-2 text-center">
                  <p className="text-2xs text-text-muted">SL</p>
                  <p className={`text-lg font-bold tabular-nums ${getStatusColor(achievableMetrics.serviceLevel, inputs.targetSLPercent)}`}>
                    {formatNumber(achievableMetrics.serviceLevel, 1)}%
                  </p>
                </div>
                <div className="bg-bg-surface border border-amber/20 rounded p-2 text-center">
                  <p className="text-2xs text-text-muted">ASA</p>
                  <p className="text-lg font-bold text-text-primary tabular-nums">
                    {formatTime(achievableMetrics.asa)}
                  </p>
                </div>
                <div className="bg-bg-surface border border-amber/20 rounded p-2 text-center">
                  <p className="text-2xs text-text-muted">Occ</p>
                  <p className={`text-lg font-bold tabular-nums ${getOccupancyColor(achievableMetrics.occupancy)}`}>
                    {formatNumber(achievableMetrics.occupancy, 1)}%
                  </p>
                </div>
              </div>
              {achievableMetrics.actualOccupancy !== undefined && (
                <div className="mt-2 p-2 bg-bg-surface border border-border-muted rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xs text-text-muted uppercase tracking-wide">Actual Occupancy</p>
                      <p className="text-3xs text-text-muted">If all {achievableMetrics.actualAgents ?? productiveAgents} agents are scheduled</p>
                    </div>
                    <p className={`text-sm font-bold tabular-nums ${getOccupancyColor(achievableMetrics.actualOccupancy)}`}>
                      {formatNumber(achievableMetrics.actualOccupancy, 1)}%
                    </p>
                  </div>
                  {achievableMetrics.occupancyCapApplied && (
                    <p className="text-3xs text-amber mt-1">
                      Max occupancy {inputs.maxOccupancy}% limits usable agents to {achievableMetrics.effectiveAgents ?? productiveAgents}.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!results.canAchieveTarget && (
        <div className="mb-4 p-3 bg-red/10 border border-red/30 rounded-lg">
          <p className="text-xs text-red">
            Target {inputs.targetSLPercent}/{inputs.thresholdSeconds} unachievable. Review parameters.
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Required Agents */}
        <div className="bg-cyan/5 border border-cyan/20 rounded-lg p-3">
          <p className="text-2xs text-text-muted uppercase tracking-widest">Agents</p>
          <p className="text-3xl font-bold text-cyan tabular-nums text-glow-cyan">
            {results.requiredAgents}
          </p>
          <p className="text-2xs text-text-muted">productive</p>
        </div>

        {/* Total FTE */}
        <div className="bg-magenta/5 border border-magenta/20 rounded-lg p-3">
          <p className="text-2xs text-text-muted uppercase tracking-widest">FTE</p>
          <p className="text-3xl font-bold text-magenta tabular-nums">
            {formatNumber(results.totalFTE, 1)}
          </p>
          <p className="text-2xs text-text-muted">+{inputs.shrinkagePercent}% shrinkage</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-2">
        {/* Service Level */}
        <div className="flex justify-between items-center p-2 bg-bg-elevated border border-border-muted rounded">
          <div>
            <p className="text-xs text-text-primary">Service Level</p>
            <p className="text-2xs text-text-muted">Target: {inputs.targetSLPercent}%</p>
          </div>
          <div className="text-right min-w-[120px]">
            <p className={`text-lg font-bold tabular-nums ${getStatusColor(results.serviceLevel, inputs.targetSLPercent)}`}>
              {formatNumber(results.serviceLevel, 1)}%
            </p>
            <div className="w-full bg-bg-surface border border-border-subtle rounded h-2 mt-1 overflow-hidden">
              <div
                className="h-full bg-cyan transition-all"
                style={{ width: `${Math.min(100, (results.serviceLevel / inputs.targetSLPercent) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* ASA */}
        <div className="flex justify-between items-center p-2 bg-bg-elevated border border-border-muted rounded">
          <div>
            <p className="text-xs text-text-primary">ASA</p>
            <p className="text-2xs text-text-muted">Avg wait time</p>
          </div>
          <div className="text-right min-w-[120px]">
            <p className="text-lg font-bold text-text-primary tabular-nums">
              {formatTime(results.asa)}
            </p>
            <div className="w-full bg-bg-surface border border-border-subtle rounded h-2 mt-1 overflow-hidden">
              <div
                className="h-full bg-green transition-all"
                style={{ width: `${Math.min(100, (inputs.thresholdSeconds / Math.max(inputs.thresholdSeconds, results.asa)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Occupancy */}
        <div className="flex justify-between items-center p-2 bg-bg-elevated border border-border-muted rounded">
          <div>
            <p className="text-xs text-text-primary">Occupancy</p>
            <p className="text-2xs text-text-muted">Max: {inputs.maxOccupancy}%</p>
          </div>
          <div className="text-right min-w-[120px]">
            <p className={`text-lg font-bold tabular-nums ${getOccupancyColor(results.occupancy)}`}>
              {formatNumber(results.occupancy, 1)}%
            </p>
            <div className="w-full bg-bg-surface border border-border-subtle rounded h-2 mt-1 overflow-hidden">
              <div
                className="h-full bg-amber transition-all"
                style={{ width: `${Math.min(100, (results.occupancy / inputs.maxOccupancy) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        {achievableMetrics?.occupancyCapApplied && (
          <div className="flex items-center justify-between mt-1 px-2 py-1 bg-amber/10 border border-amber/30 rounded">
            <span className="text-3xs font-semibold text-amber uppercase tracking-wide">Occupancy Cap Hit</span>
            {occupancyShortfall > 0 && (
              <span className="text-3xs text-amber">+{occupancyShortfall} agents needed to stay at {inputs.maxOccupancy}%</span>
            )}
          </div>
        )}

        {/* Traffic */}
        <div className="flex justify-between items-center p-2 bg-bg-elevated border border-border-muted rounded">
          <div>
            <p className="text-xs text-text-primary">Traffic</p>
            <p className="text-2xs text-text-muted">Erlangs</p>
          </div>
          <p className="text-lg font-bold text-text-primary tabular-nums">
            {formatNumber(results.trafficIntensity, 2)}
          </p>
        </div>
      </div>

      {/* Abandonment Metrics */}
      {abandonmentMetrics && (inputs.model === 'A') && (
        <div className="mt-4 pt-3 border-t border-border-muted">
          <h3 className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
            Abandonment
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-amber/5 border border-amber/20 rounded">
              <div>
                <p className="text-xs text-text-primary">Abandon Rate</p>
                <p className="text-2xs text-text-muted">{formatNumber(abandonmentMetrics.expectedAbandonments, 0)} contacts</p>
              </div>
              <p className="text-lg font-bold text-amber tabular-nums">
                {formatNumber(abandonmentMetrics.abandonmentRate * 100, 1)}%
              </p>
            </div>

            <div className="flex justify-between items-center p-2 bg-green/5 border border-green/20 rounded">
              <div>
                <p className="text-xs text-text-primary">Answered</p>
                <p className="text-2xs text-text-muted">{formatNumber((abandonmentMetrics.answeredContacts / inputs.volume) * 100, 1)}% of total</p>
              </div>
              <p className="text-lg font-bold text-green tabular-nums">
                {formatNumber(abandonmentMetrics.answeredContacts, 0)}
              </p>
            </div>

            {inputs.model === 'A' && abandonmentMetrics.retrialProbability !== undefined && (
              <>
                <div className="flex justify-between items-center p-2 bg-magenta/5 border border-magenta/20 rounded">
                  <div>
                    <p className="text-xs text-text-primary">Retrial Prob</p>
                    <p className="text-2xs text-text-muted">Callbacks</p>
                  </div>
                  <p className="text-lg font-bold text-magenta tabular-nums">
                    {formatNumber(abandonmentMetrics.retrialProbability * 100, 1)}%
                  </p>
                </div>

                {abandonmentMetrics.virtualTraffic !== undefined && (
                  <div className="flex justify-between items-center p-2 bg-blue/5 border border-blue/20 rounded">
                    <div>
                      <p className="text-xs text-text-primary">Virtual Traffic</p>
                      <p className="text-2xs text-text-muted">+retrials</p>
                    </div>
                    <p className="text-lg font-bold text-blue tabular-nums">
                      {formatNumber(abandonmentMetrics.virtualTraffic, 2)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Productivity Modifier Warning */}
      {activeProductivityModifier !== undefined && activeProductivityModifier < 1.0 && (
        <div className="mb-4 p-3 bg-amber/10 border border-amber/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber font-bold uppercase tracking-wide">Reduced Productivity</p>
              <p className="text-2xs text-amber/80">Calendar events affecting staff efficiency</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-amber tabular-nums">{(activeProductivityModifier * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Formula Breakdown */}
      <div className="mt-4 p-3 bg-bg-elevated border border-border-muted rounded-lg">
        <h4 className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Formula</h4>
        <div className="text-2xs text-text-muted space-y-1 font-mono">
          <p>A = ({inputs.volume} x {inputs.aht}) / {inputs.intervalMinutes * 60} = <span className="text-cyan">{formatNumber(results.trafficIntensity, 2)}</span> Erlangs</p>
          <p>{inputs.model.toUpperCase()}({formatNumber(results.trafficIntensity, 2)}, {inputs.targetSLPercent}/{inputs.thresholdSeconds}) = <span className="text-cyan">{results.requiredAgents}</span> agents</p>
          <p>FTE = {results.requiredAgents} / (1 - {inputs.shrinkagePercent/100}) = <span className="text-magenta">{formatNumber(results.totalFTE, 1)}</span></p>
        </div>
      </div>

      {/* Insights */}
      {results.canAchieveTarget && (
        <div className="mt-4 p-3 bg-cyan/5 border border-cyan/20 rounded-lg">
          <h4 className="text-2xs font-semibold text-cyan uppercase tracking-widest mb-1">Insights</h4>
          <ul className="text-2xs text-text-secondary space-y-1">
            {results.occupancy < inputs.maxOccupancy * 0.7 && (
              <li>+ Low occupancy ({formatNumber(results.occupancy, 1)}%) - idle time likely</li>
            )}
            {results.occupancy > inputs.maxOccupancy * 0.95 && (
              <li>+ Near max occupancy - high agent load</li>
            )}
            {results.serviceLevel > inputs.targetSLPercent * 1.1 && (
              <li>+ SL exceeds target by {formatNumber(results.serviceLevel - inputs.targetSLPercent, 1)}%</li>
            )}
            {results.asa < inputs.thresholdSeconds / 2 && (
              <li>+ Excellent ASA ({formatTime(results.asa)})</li>
            )}
          </ul>
        </div>
      )}

      {/* Debug Toggle */}
      <div className="mt-4 p-3 bg-bg-elevated border border-border-muted rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="text-2xs font-semibold text-text-secondary uppercase tracking-widest">Debug</h4>
          <button
            type="button"
            onClick={() => setShowDebug((v) => !v)}
            className="text-2xs text-cyan hover:text-cyan-dim transition-colors"
          >
            {showDebug ? 'Hide' : 'Show'}
          </button>
        </div>
        {showDebug && (
          <pre className="mt-2 text-2xs text-text-muted bg-bg-surface border border-border-subtle rounded p-2 overflow-auto max-h-60">
{JSON.stringify({
  inputs,
  results,
  staffingModel,
  achievableMetrics,
  activeProductivityModifier,
}, null, 2)}
          </pre>
        )}
      </div>

      {/* Sensitivity Chart */}
      {sensitivityData.length > 0 && (
        <div className="mt-4 p-3 bg-bg-surface border border-border-subtle rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-2xs font-semibold text-text-secondary uppercase tracking-widest">Sensitivity: Agents vs SL</h4>
            <p className="text-3xs text-text-muted">Centered on required agents</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={sensitivityData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <XAxis dataKey="agents" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ fontSize: '10px', background: '#0b1322', border: '1px solid #1f2937' }}
                  labelFormatter={(label) => `Agents: ${label}`}
                  formatter={(value: number) => [`${value}%`, 'SL']}
                />
                <ReferenceLine x={results.requiredAgents} stroke="#06b6d4" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="sl" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sticky KPI bar for mobile */}
      {showStickyBar && (
      <div className={`sm:hidden fixed bottom-4 left-4 right-4 z-30 transition-transform duration-200 ${stickyHiddenForScroll ? 'translate-y-24' : 'translate-y-0'}`}>
        <div className="bg-bg-surface border border-border-subtle shadow-lg rounded-lg px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-thin">
          {stickyMetrics.map((metric) => (
            <div key={metric.label} className="text-center min-w-[60px]">
              <p className="text-3xs text-text-muted uppercase tracking-wide">{metric.label}</p>
              <p className={`text-sm font-bold tabular-nums ${metric.color}`}>{metric.value}</p>
            </div>
          ))}
          {achievableMetrics?.occupancyCapApplied && (
            <span className="text-3xs text-amber uppercase tracking-wide bg-amber/10 border border-amber/30 rounded px-2 py-1">
              Cap
            </span>
          )}
        </div>
      </div>
      )}
    </div>
  );
});

export default ResultsDisplay;
